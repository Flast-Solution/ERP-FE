import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form, InputNumber, message, Modal, Select, Table } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import {
  CustomButton,
  CustomButtonIcon,
  FormHidden,
  FormInput,
  FormSelect,
} from '@flast-erp/core/components';
import { RequestUtils } from '@flast-erp/core/utils';
import ProductionPage from './styles';

const USER_LIST_API = '/user/list';
const USER_PAGE_SIZE = 10;
const INVENTORY_FETCH_API = '/erp/inventory/fetch';

const mergeUsers = (currentUsers, nextUsers) => {
  const usersById = new Map(currentUsers.map(user => [String(user.id), user]));
  nextUsers.forEach(user => usersById.set(String(user.id), user));
  return Array.from(usersById.values());
};

const getProductId = (product = {}) => (
  product.productId ?? product.product?.id ?? product.id
);

const getResponseItems = (response) => {
  const payload = response?.data ?? response;
  const candidates = [
    payload?.data,
    payload?.items,
    payload?.content,
    payload?.embedded,
    payload,
  ];
  return candidates.find(Array.isArray) ?? [];
};

const getInventoryQuantity = (material = {}) => (
  (material.inventory ?? []).reduce((total, inventory) => (
    total + Number(inventory?.quantity ?? 0)
  ), 0)
);

const getBomStatusLabel = (status) => Number(status) === 1 ? 'Sử dụng' : 'Không sử dụng';

const mapBomMaterialRows = (bom = {}) => (
  (bom.productMaterials ?? []).map((item, index) => {
    const requiredQuantity = Number(item.quantity ?? 0) * Number(bom.productionQuantity ?? 1);
    const stockQuantity = getInventoryQuantity(item.material);
    return {
      ...item,
      id: `${bom.bomProductId ?? bom.productId}-${item.productMaterialId ?? index}`,
      productName: bom.productName,
      name: item.material?.name ?? `Vật tư #${item.materialId}`,
      requiredQuantity,
      stockQuantity,
      status: stockQuantity >= requiredQuantity ? 'Đủ tồn kho' : 'Thiếu tồn kho',
    };
  })
);

const BomConfirmation = ({ productionOrder, mode = 'create', submitting = false, onConfirm, onCancel, onBack }) => {
  const [form] = Form.useForm();
  const [allocationForm] = Form.useForm();
  const [bomRows, setBomRows] = useState([]);
  const [bomVersions, setBomVersions] = useState([]);
  const [bomLoading, setBomLoading] = useState(false);
  const [inventoriesByMaterialId, setInventoriesByMaterialId] = useState(new Map());
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [allocations, setAllocations] = useState([]);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(0);
  const [userHasMore, setUserHasMore] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const userLoadingRef = useRef(false);
  const allocationSequenceRef = useRef(0);
  const restoredOutboundsRef = useRef(false);
  const selectedProductId = Form.useWatch('bomId', form);
  const selectedAllocationProductMaterialId = Form.useWatch('productMaterialId', allocationForm);
  const selectedAllocationInventoryId = Form.useWatch('inventoryId', allocationForm);

  const selectedAllocationBomRow = bomRows.find(row => (
    String(row.productMaterialId) === String(selectedAllocationProductMaterialId)
  ));
  const allocationInventoryOptions = selectedAllocationBomRow
    ? inventoriesByMaterialId.get(String(selectedAllocationBomRow.materialId)) ?? []
    : [];
  const selectedAllocationInventory = allocationInventoryOptions.find(inventory => (
    String(inventory.id) === String(selectedAllocationInventoryId)
  ));
  const selectedInventoryAllocatedQuantity = allocations
    .filter(allocation => String(allocation.inventoryId) === String(selectedAllocationInventoryId))
    .reduce((total, allocation) => total + allocation.quantity, 0);
  const selectedInventoryRemainingQuantity = Math.max(
    0,
    Number(selectedAllocationInventory?.quantity ?? 0) - selectedInventoryAllocatedQuantity,
  );

  const loadUsers = useCallback(async (nextPage, append) => {
    if (userLoadingRef.current) return;

    userLoadingRef.current = true;
    setUserLoading(true);
    try {
      const response = await RequestUtils.Get(USER_LIST_API, {
        limit: USER_PAGE_SIZE,
        page: nextPage,
      });
      const nextUsers = Array.isArray(response?.data?.embedded) ? response.data.embedded : [];
      setUsers(currentUsers => append ? mergeUsers(currentUsers, nextUsers) : nextUsers);
      setUserPage(nextPage);
      setUserHasMore(nextUsers.length >= USER_PAGE_SIZE);
    } catch (error) {
      message.error(error?.message || 'Không tải được danh sách người xác nhận.');
    } finally {
      userLoadingRef.current = false;
      setUserLoading(false);
    }
  }, []);

  const handleUserDropdownOpen = (open) => {
    if (open && userPage === 0) {
      loadUsers(1, false);
    }
  };

  const handleUserPopupScroll = (event) => {
    const target = event.currentTarget;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24;
    if (isAtBottom && userHasMore && !userLoadingRef.current) {
      loadUsers(userPage + 1, true);
    }
  };

  const products = useMemo(() => {
    const uniqueProducts = new Map();
    (productionOrder?.orderDetails ?? []).forEach((product, index) => {
      const productId = getProductId(product);
      if (productId == null || productId === '') return;
      const key = String(productId);
      if (!uniqueProducts.has(key)) {
        uniqueProducts.set(key, {
          id: productId,
          name: product.productName ?? product.product?.name ?? product.name ?? `Sản phẩm ${index + 1}`,
          code: product.productCode ?? product.product?.code ?? product.code ?? '',
          productionEntries: [],
        });
      }
      uniqueProducts.get(key).productionEntries.push({
        orderDetailId: product.id ?? index,
        defaultQuantity: Number(product.quantity ?? 1),
      });
    });
    return Array.from(uniqueProducts.values());
  }, [productionOrder?.orderDetails]);

  const bomOptions = useMemo(() => products.map(product => ({
    id: product.id,
    name: [product.name, product.code].filter(Boolean).join(' - '),
  })), [products]);

  const versionOptions = useMemo(() => bomVersions
    .filter(bom => String(bom.productId) === String(selectedProductId ?? ''))
    .map(bom => ({
      value: bom.version,
      name: bom.version,
    })), [bomVersions, selectedProductId]);

  const selectBomVersion = useCallback((bom) => {
    form.setFieldsValue({
      version: bom?.version,
      status: bom ? getBomStatusLabel(bom.status) : undefined,
      bomProductId: bom?.bomProductId,
    });
    setAllocations([]);
    setAllocationModalOpen(false);
    allocationForm.resetFields();
    setBomRows(bom ? mapBomMaterialRows(bom) : []);
  }, [allocationForm, form]);

  useEffect(() => {
    let mounted = true;
    const inventoryQueryMap = new Map();
    bomRows.forEach((row) => {
      if (row.materialId == null) return;

      const warehouseIds = Array.from(new Set(
        (row.material?.inventory ?? [])
          .map(inventory => inventory?.warehouseId)
          .filter(warehouseId => warehouseId != null),
      ));
      const queryWarehouseIds = warehouseIds.length > 0 ? warehouseIds : [''];
      queryWarehouseIds.forEach((warehouseId) => {
        inventoryQueryMap.set(`${row.materialId}:${warehouseId}`, {
          materialId: row.materialId,
          warehouseId,
        });
      });
    });
    const inventoryQueries = Array.from(inventoryQueryMap.values());

    if (inventoryQueries.length === 0) {
      setInventoriesByMaterialId(new Map());
      setInventoryLoading(false);
      return undefined;
    }

    setInventoryLoading(true);
    Promise.all(inventoryQueries.map(async ({ materialId, warehouseId }) => {
      const endpoint = `${INVENTORY_FETCH_API}?warehouseId=${encodeURIComponent(warehouseId)}&materialId=${encodeURIComponent(materialId)}`;
      const response = await RequestUtils.Get(endpoint, {});
      const inventories = Array.isArray(response?.data) ? response.data : [];
      return { materialId: String(materialId), inventories };
    }))
      .then((results) => {
        if (!mounted) return;

        const nextInventoriesByMaterialId = new Map();
        results.forEach(({ materialId, inventories }) => {
          const inventoriesById = nextInventoriesByMaterialId.get(materialId) ?? new Map();
          inventories.forEach(inventory => inventoriesById.set(String(inventory.id), inventory));
          nextInventoriesByMaterialId.set(materialId, inventoriesById);
        });
        setInventoriesByMaterialId(new Map(
          Array.from(nextInventoriesByMaterialId.entries())
            .map(([materialId, inventoriesById]) => [materialId, Array.from(inventoriesById.values())]),
        ));
      })
      .catch((error) => {
        if (!mounted) return;
        setInventoriesByMaterialId(new Map());
        message.error(error?.message || 'Không tải được tồn kho vật tư.');
      })
      .finally(() => {
        if (mounted) setInventoryLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [bomRows]);

  const handleProductChange = (productId) => {
    const productBoms = bomVersions.filter(bom => String(bom.productId) === String(productId));
    const savedBomProductId = (productionOrder?.manufactureDetails ?? [])
      .find(detail => String(detail.productId) === String(productId))
      ?.bomProductId;
    const defaultBom = productBoms.find(bom => String(bom.bomProductId) === String(savedBomProductId))
      ?? productBoms.find(bom => Number(bom.status) === 1)
      ?? productBoms[0];
    selectBomVersion(defaultBom);
  };

  const handleVersionChange = (version) => {
    const selectedBom = bomVersions.find(bom => (
      String(bom.productId) === String(selectedProductId)
      && String(bom.version) === String(version)
    ));
    selectBomVersion(selectedBom);
  };

  useEffect(() => {
    let mounted = true;

    const fetchBoms = async () => {
      if (products.length === 0) {
        setBomRows([]);
        setBomVersions([]);
        setBomLoading(false);
        form.resetFields(['bomId', 'version', 'status', 'bomProductId']);
        return;
      }

      setBomLoading(true);
      const results = await Promise.all(products.map(async (product) => {
        try {
          const response = await RequestUtils.Get(`/product-material/find-by-product/${product.id}`, {});
          return { product, items: getResponseItems(response), failed: false };
        } catch (error) {
          return { product, items: [], failed: true };
        }
      }));

      if (!mounted) return;

      const failedProducts = results.filter(result => result.failed);
      if (failedProducts.length > 0) {
        message.warning(`Không tải được BOM của ${failedProducts.length} sản phẩm.`);
      }

      const productDetails = productionOrder?.productDetails ?? {};
      const nextBomVersions = results.flatMap(({ product, items }) => {
        const productionQuantity = product.productionEntries.reduce((total, entry) => (
          total + Number(
            productDetails?.[String(entry.orderDetailId)]?.quantity
            ?? entry.defaultQuantity
            ?? 1,
          )
        ), 0);

        const versions = items.some(item => Array.isArray(item?.productMaterials))
          ? items
          : [{
              bomProductId: null,
              productId: product.id,
              version: 'v1.0',
              status: 1,
              productMaterials: items,
            }];

        return versions.map(bom => ({
          ...bom,
          productId: bom.productId ?? product.id,
          productName: product.name,
          productionQuantity,
        }));
      });

      setBomVersions(nextBomVersions);
      const firstProduct = products[0];
      const firstProductBoms = nextBomVersions.filter(bom => String(bom.productId) === String(firstProduct.id));
      const savedBomProductId = (productionOrder?.manufactureDetails ?? [])
        .find(detail => String(detail.productId) === String(firstProduct.id))
        ?.bomProductId;
      const defaultBom = firstProductBoms.find(bom => String(bom.bomProductId) === String(savedBomProductId))
        ?? firstProductBoms.find(bom => Number(bom.status) === 1)
        ?? firstProductBoms[0];
      form.setFieldValue('bomId', firstProduct.id);
      selectBomVersion(defaultBom);
      setBomLoading(false);
    };

    fetchBoms().catch(() => {
      if (mounted) {
        setBomRows([]);
        setBomVersions([]);
        setBomLoading(false);
        message.error('Không tải được danh sách BOM.');
      }
    });

    return () => {
      mounted = false;
    };
  }, [form, productionOrder?.manufactureDetails, productionOrder?.productDetails, products, selectBomVersion]);

  useEffect(() => {
    if (mode !== 'edit' || restoredOutboundsRef.current || bomRows.length === 0) return;

    const outbounds = productionOrder?.outbound ?? [];
    if (outbounds.length === 0) {
      restoredOutboundsRef.current = true;
      return;
    }
    const inventoryDataReady = outbounds.every(outbound => (
      inventoriesByMaterialId.has(String(outbound.materialId))
    ));
    if (!inventoryDataReady) return;

    const restoredAllocations = outbounds.map((outbound, index) => {
      const bomRow = bomRows.find(row => String(row.materialId) === String(outbound.materialId));
      const inventory = (inventoriesByMaterialId.get(String(outbound.materialId)) ?? []).find(item => (
        String(item.warehouseId) === String(outbound.warehouseId)
        && Number(item.width ?? 0) === Number(outbound.width ?? 0)
        && Number(item.height ?? 0) === Number(outbound.height ?? 0)
      ));

      return {
        id: `outbound-${outbound.id ?? index}`,
        outboundId: outbound.id,
        productMaterialId: bomRow?.productMaterialId ?? null,
        materialId: outbound.materialId,
        materialName: bomRow?.name ?? `Vật tư #${outbound.materialId}`,
        inventoryId: inventory?.id ?? null,
        warehouseId: outbound.warehouseId,
        availableQuantity: Number(inventory?.quantity ?? outbound.quantity ?? 0),
        width: Number(outbound.width ?? inventory?.width ?? 0),
        height: Number(outbound.height ?? inventory?.height ?? 0),
        quantity: Number(outbound.quantity ?? 0),
      };
    });

    setAllocations(restoredAllocations);
    restoredOutboundsRef.current = true;
  }, [bomRows, inventoriesByMaterialId, mode, productionOrder?.outbound]);

  const materialColumns = [
    { title: 'Sản phẩm', dataIndex: 'productName' },
    { title: 'Tên vật tư', dataIndex: 'name' },
    { title: 'SL cần', dataIndex: 'requiredQuantity', align: 'right' },
    { title: 'Tồn kho', dataIndex: 'stockQuantity', align: 'right' },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center' },
  ];
  const allocationColumns = [
    {
      title: 'Tên vật tư',
      dataIndex: 'materialName',
    },
    {
      title: 'Kho xuất',
      dataIndex: 'warehouseId',
      render: value => `Kho #${value}`,
    },
    {
      title: 'Mã tồn kho',
      dataIndex: 'inventoryId',
      render: value => value == null ? '-' : `#${value}`,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'availableQuantity',
      align: 'right',
    },
    {
      title: 'SL xuất',
      dataIndex: 'quantity',
      align: 'right',
    },
    {
      title: '',
      width: 54,
      align: 'center',
      render: (_, row) => (
        <CustomButtonIcon
          title="Xóa phân bổ"
          icon={<DeleteOutlined />}
          handleClick={() => setAllocations(current => current.filter(item => item.id !== row.id))}
        />
      ),
    },
  ];

  const openAllocationModal = () => {
    allocationForm.resetFields();
    setAllocationModalOpen(true);
  };

  const closeAllocationModal = () => {
    setAllocationModalOpen(false);
    allocationForm.resetFields();
  };

  const addAllocation = async () => {
    let values;
    try {
      values = await allocationForm.validateFields();
    } catch {
      return;
    }
    const bomRow = bomRows.find(row => String(row.productMaterialId) === String(values.productMaterialId));
    const inventory = inventoriesByMaterialId
      .get(String(bomRow?.materialId))
      ?.find(item => String(item.id) === String(values.inventoryId));

    if (!bomRow || !inventory) {
      message.error('Không tìm thấy vật tư hoặc kho đã chọn.');
      return;
    }

    const quantity = Number(values.quantity);
    const allocatedForMaterial = allocations
      .filter(item => item.productMaterialId === bomRow.productMaterialId)
      .reduce((total, item) => total + item.quantity, 0);
    const remainingRequiredQuantity = Number(bomRow.requiredQuantity) - allocatedForMaterial;
    if (quantity > remainingRequiredQuantity) {
      message.error(`Vật tư ${bomRow.name} chỉ còn cần phân bổ ${remainingRequiredQuantity}.`);
      return;
    }

    const allocatedFromInventory = allocations
      .filter(item => item.inventoryId === inventory.id)
      .reduce((total, item) => total + item.quantity, 0);
    const remainingInventoryQuantity = Number(inventory.quantity ?? 0) - allocatedFromInventory;
    if (quantity > remainingInventoryQuantity) {
      message.error(`Kho #${inventory.warehouseId} chỉ còn ${remainingInventoryQuantity}.`);
      return;
    }

    setAllocations((current) => {
      const existingAllocation = current.find(item => (
        item.productMaterialId === bomRow.productMaterialId
        && item.warehouseId === inventory.warehouseId
        && item.inventoryId === inventory.id
      ));

      if (existingAllocation) {
        return current.map(item => item.id === existingAllocation.id
          ? { ...item, quantity: item.quantity + quantity }
          : item);
      }

      allocationSequenceRef.current += 1;
      return [...current, {
        id: `${bomRow.productMaterialId}-${inventory.id}-${allocationSequenceRef.current}`,
        productMaterialId: bomRow.productMaterialId,
        materialId: bomRow.materialId,
        materialName: bomRow.name,
        inventoryId: inventory.id,
        warehouseId: inventory.warehouseId,
        availableQuantity: Number(inventory.quantity ?? 0),
        width: Number(inventory.width ?? 0),
        height: Number(inventory.height ?? 0),
        quantity,
      }];
    });
    closeAllocationModal();
  };

  const handleSubmit = (values) => {
    const invalidBomRow = bomRows.find((bomRow) => {
      const allocatedQuantity = allocations
        .filter(item => item.productMaterialId === bomRow.productMaterialId)
        .reduce((total, item) => total + item.quantity, 0);
      return Math.abs(allocatedQuantity - Number(bomRow.requiredQuantity)) > 0.000001;
    });
    if (invalidBomRow) {
      message.error(`Vật tư ${invalidBomRow.name} phải phân bổ đủ ${invalidBomRow.requiredQuantity}.`);
      return;
    }

    const exceededInventory = allocations.find((allocation) => {
      if (allocation.inventoryId == null) return false;
      const allocatedQuantity = allocations
        .filter(item => item.inventoryId === allocation.inventoryId)
        .reduce((total, item) => total + item.quantity, 0);
      return allocatedQuantity > allocation.availableQuantity;
    });
    if (exceededInventory) {
      message.error(`Số lượng xuất tại kho #${exceededInventory.warehouseId} vượt quá tồn kho.`);
      return;
    }

    const materialConfirmation = {
      ...values,
      allocations: allocations.map(allocation => ({
        inventoryId: allocation.inventoryId,
        warehouseId: allocation.warehouseId,
        materialId: allocation.materialId,
        productMaterialId: allocation.productMaterialId,
        quantity: allocation.quantity,
        width: allocation.width,
        height: allocation.height,
      })),
    };
    if (onConfirm) {
      onConfirm({ productionOrder, materialConfirmation })
      return
    }
    message.success('Đã xác nhận và phân bổ vật tư')
  }

  return <ProductionPage>
    <div className="production-card">
      <header className="page-head">
        <div className="head-row"><div><h1>Xác nhận BOM + phân bổ vật tư</h1><div className="subtitle">WF2 Sản xuất · ISO 9001:2015 §8.5</div></div></div>
      </header>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <FormHidden name="bomProductId" />
      <div className="body">
        <section className="section">
          <div className="section-head"><span className="section-no">1</span><h2>Phiên bản BOM</h2></div>
          <div className="grid">
            <FormSelect
              required
              name="bomId"
              label="Chọn BOM"
              placeholder="Chọn BOM theo sản phẩm"
              resourceData={bomOptions}
              onChange={handleProductChange}
            />
            <FormSelect
              required
              name="version"
              label="Version"
              placeholder="Chọn Version"
              resourceData={versionOptions}
              valueProp="value"
              titleProp="name"
              onChange={handleVersionChange}
            />
            <FormInput name="status" label="Trạng thái BOM" disabled />
          </div>
        </section>
        <section className="section">
          <div className="section-head"><span className="section-no">2</span><h2>Vật tư theo BOM</h2></div>
          <Table loading={bomLoading} columns={materialColumns} dataSource={bomRows} rowKey="id" pagination={false} locale={{ emptyText: 'Chưa có dữ liệu vật tư' }} scroll={{ x: 720 }} />
        </section>
        <section className="section">
          <div className="section-head">
            <span className="section-no">3</span>
            <h2>Phân bổ lô xuất kho</h2>
            <div style={{ marginLeft: 'auto' }}>
              <CustomButton
                title="Thêm vật tư"
                icon={<PlusOutlined />}
                type="primary"
                htmlType="button"
                inRigth={false}
                disabled={bomRows.length === 0 || inventoryLoading}
                onClick={openAllocationModal}
              />
            </div>
          </div>
          <Table
            loading={inventoryLoading}
            columns={allocationColumns}
            dataSource={allocations}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: 'Chưa có vật tư được phân bổ' }}
            scroll={{ x: 900 }}
          />
        </section>
        <section className="section">
          <div className="grid">
            <FormSelect
              required
              name="confirmedBy"
              label="Người xác nhận"
              placeholder="Chọn người xác nhận"
              resourceData={users}
              valueProp="id"
              titleProp="fullName"
              loading={userLoading}
              showSearch
              optionFilterProp="label"
              formatText={(fullName, user) => [fullName, user?.ssoId].filter(Boolean).join(' · ')}
              onDropdownVisibleChange={handleUserDropdownOpen}
              onPopupScroll={handleUserPopupScroll}
            />
          </div>
        </section>
      </div>
      <footer className="foot"><span className="foot-note">Bước 2/2 · Hủy bước này sẽ hủy toàn bộ lệnh sản xuất vừa nhập.</span><div className="actions"><CustomButton title="Quay lại" variant="text" color="default" inRigth={false} disabled={submitting} onClick={onBack} /><CustomButton title="Hủy lệnh" danger variant="outlined" color="danger" inRigth={false} disabled={submitting} onClick={onCancel} /><CustomButton title={mode === 'edit' ? 'Xác nhận & cập nhật' : 'Xác nhận & tạo lệnh'} type="primary" htmlType="submit" icon={<SaveOutlined />} inRigth={false} loading={submitting} disabled={submitting} /></div></footer>
      </Form>
    </div>
    <Modal
      title="Thêm vật tư phân bổ"
      open={allocationModalOpen}
      width={480}
      okText="Thêm vào danh sách"
      cancelText="Hủy"
      onOk={addAllocation}
      onCancel={closeAllocationModal}
      destroyOnHidden
    >
      <Form form={allocationForm} layout="vertical" preserve={false}>
        <Form.Item
          name="productMaterialId"
          label="Tên vật tư"
          rules={[{ required: true, message: 'Vui lòng chọn vật tư' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn vật tư theo BOM"
            options={bomRows.map(row => ({
              value: row.productMaterialId,
              label: `${row.name} · Cần ${row.requiredQuantity}`,
            }))}
            onChange={() => allocationForm.setFieldsValue({ inventoryId: undefined, quantity: undefined })}
          />
        </Form.Item>
        <Form.Item
          name="inventoryId"
          label="Kho"
          rules={[{ required: true, message: 'Vui lòng chọn kho' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            loading={inventoryLoading}
            disabled={!selectedAllocationBomRow || inventoryLoading}
            placeholder="Chọn kho xuất vật tư"
            options={allocationInventoryOptions.map((inventory) => {
              const allocatedQuantity = allocations
                .filter(allocation => allocation.inventoryId === inventory.id)
                .reduce((total, allocation) => total + allocation.quantity, 0);
              const remainingQuantity = Math.max(0, Number(inventory.quantity ?? 0) - allocatedQuantity);
              const dimension = Number(inventory.width) > 0 && Number(inventory.height) > 0
                ? ` · ${inventory.width}×${inventory.height} cm`
                : '';
              return {
                value: inventory.id,
                label: `Kho #${inventory.warehouseId} · Mã tồn #${inventory.id} · Còn ${remainingQuantity}${dimension}`,
                disabled: remainingQuantity <= 0,
              };
            })}
            onChange={() => allocationForm.setFieldValue('quantity', undefined)}
          />
        </Form.Item>
        <Form.Item
          name="quantity"
          label="Số lượng"
          rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
        >
          <InputNumber
            min={0.000001}
            max={selectedInventoryRemainingQuantity}
            disabled={!selectedAllocationInventory}
            placeholder="Nhập số lượng xuất"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  </ProductionPage>;
};

export default BomConfirmation;
