import React, { useEffect, useMemo, useState } from 'react';
import { Form, message, Table } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import {
  CustomButton,
  CustomButtonIcon,
  FormInput,
  FormSelect,
} from '@flast-erp/core/components';
import { RequestUtils } from '@flast-erp/core/utils';
import ProductionPage from './styles';

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

const BomConfirmation = ({ productionOrder, onConfirm, onCancel, onBack }) => {
  const [form] = Form.useForm();
  const [rows, setRows] = useState([]);
  const [bomRows, setBomRows] = useState([]);
  const [bomLoading, setBomLoading] = useState(false);
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

  useEffect(() => {
    let mounted = true;

    const fetchBoms = async () => {
      if (products.length === 0) {
        setBomRows([]);
        setBomLoading(false);
        form.setFieldValue('bomId', []);
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
      const nextRows = results.flatMap(({ product, items }) => {
        const productionQuantity = product.productionEntries.reduce((total, entry) => (
          total + Number(
            productDetails?.[String(entry.orderDetailId)]?.quantity
            ?? entry.defaultQuantity
            ?? 1,
          )
        ), 0);

        return items.map((item, index) => {
          const requiredQuantity = Number(item.quantity ?? 0) * productionQuantity;
          const stockQuantity = getInventoryQuantity(item.material);
          return {
            ...item,
            id: `${product.id}-${item.productMaterialId ?? index}`,
            productName: product.name,
            name: item.material?.name ?? `Vật tư #${item.materialId}`,
            requiredQuantity,
            stockQuantity,
            status: stockQuantity >= requiredQuantity ? 'Đủ tồn kho' : 'Thiếu tồn kho',
          };
        });
      });

      setBomRows(nextRows);
      form.setFieldValue('bomId', products.map(product => product.id));
      setBomLoading(false);
    };

    fetchBoms().catch(() => {
      if (mounted) {
        setBomRows([]);
        setBomLoading(false);
        message.error('Không tải được danh sách BOM.');
      }
    });

    return () => {
      mounted = false;
    };
  }, [form, productionOrder?.productDetails, products]);

  const remove = id => setRows(value => value.filter(row => row.id !== id));
  const add = () => setRows(value => [...value,{id:Date.now(),name:'',lot:'',qty:''}]);
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
      render: (_, row) => <FormInput name={['allocations', row.id, 'name']} placeholder="Nhập tên vật tư" />,
    },
    {
      title: 'Mã lô xuất kho',
      render: (_, row) => <FormInput name={['allocations', row.id, 'lot']} placeholder="Nhập mã lô" />,
    },
    {
      title: 'SL xuất',
      align: 'right',
      render: (_, row) => <FormInput name={['allocations', row.id, 'quantity']} placeholder="Nhập số lượng" />,
    },
    {
      title: '',
      width: 54,
      align: 'center',
      render: (_, row) => <CustomButtonIcon title="Xóa dòng" icon={<DeleteOutlined />} handleClick={() => remove(row.id)} />,
    },
  ];
  const handleSubmit = (values) => {
    if (onConfirm) {
      onConfirm({ productionOrder, materialConfirmation: values })
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
      <div className="body">
        <section className="section">
          <div className="section-head"><span className="section-no">1</span><h2>Phiên bản BOM</h2></div>
          <div className="grid">
            <FormSelect
              required
              mode="multiple"
              name="bomId"
              label="Chọn BOM"
              placeholder="Chọn BOM theo sản phẩm"
              resourceData={bomOptions}
            />
            <FormInput name="version" label="Version" placeholder="Nhập phiên bản" />
            <FormSelect name="status" label="Trạng thái BOM" placeholder="Chọn trạng thái" resourceData={[]} />
          </div>
        </section>
        <section className="section">
          <div className="section-head"><span className="section-no">2</span><h2>Vật tư theo BOM</h2></div>
          <Table loading={bomLoading} columns={materialColumns} dataSource={bomRows} rowKey="id" pagination={false} locale={{ emptyText: 'Chưa có dữ liệu vật tư' }} scroll={{ x: 720 }} />
        </section>
        <section className="section">
          <div className="section-head"><span className="section-no">3</span><h2>Phân bổ lô xuất kho</h2></div>
          <Table columns={allocationColumns} dataSource={rows} rowKey="id" pagination={false} locale={{ emptyText: 'Chưa có dòng phân bổ' }} scroll={{ x: 720 }} />
          <div className="table-action"><CustomButton title="Thêm dòng" icon={<PlusOutlined />} variant="dashed" color="default" inRigth={false} onClick={add} /></div>
        </section>
        <section className="section"><div className="grid"><FormSelect required name="confirmedBy" label="Người xác nhận" placeholder="Chọn người xác nhận" resourceData={[]} /></div></section>
      </div>
      <footer className="foot"><span className="foot-note">Bước 2/2 · Hủy bước này sẽ hủy toàn bộ lệnh sản xuất vừa nhập.</span><div className="actions"><CustomButton title="Quay lại" variant="text" color="default" inRigth={false} onClick={onBack} /><CustomButton title="Hủy lệnh" danger variant="outlined" color="danger" inRigth={false} onClick={onCancel} /><CustomButton title="Xác nhận & tạo lệnh" type="primary" htmlType="submit" icon={<SaveOutlined />} inRigth={false} /></div></footer>
      </Form>
    </div>
  </ProductionPage>;
};

export default BomConfirmation;
