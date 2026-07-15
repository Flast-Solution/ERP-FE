/**************************************************************************/
/*  Bom.js                                                                */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/
import { useState, useContext } from 'react';
import {
  FormInput,
  FormInputNumber,
  RestEditModal,
  FormSelect,
  FormListAddtion,
  FormSelectInfiniteMaterial,
  FormHidden,
  FormContextCustom,
  CustomButton
} from "@flast-erp/core/components";

import { Col, Row, Typography, Form, message, Switch, Button, Tag, Popconfirm } from 'antd';
import { DeleteOutlined, HistoryOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import { RequestUtils, arrayEmpty, formatMoney } from '@flast-erp/core/utils';
import { useEffectAsync } from '@flast-erp/core/hooks';

const BomStyles = styled.div`
  .bom-eyebrow { color: #8c8c8c; font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; }
  .bom-title { margin: 3px 0 2px; color: #1f2937; font-size: 22px; font-weight: 700; }
  .bom-subtitle { margin-bottom: 18px; color: #6b7280; font-size: 13px; }
  .bom-version-panel { margin-bottom: 20px; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
  .bom-version-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; background: #fafafa; }
  .bom-version-head__title { display: flex; align-items: center; gap: 7px; font-weight: 600; }
  .bom-version-list { display: flex; flex-direction: column; }
  .bom-version-row { display: grid; grid-template-columns: minmax(170px, 1fr) auto auto 32px; align-items: center; gap: 14px; width: 100%; padding: 8px 12px; border-bottom: 1px solid #f0f0f0; background: #fff; color: inherit; text-align: left; }
  .bom-version-row:last-child { border-bottom: 0; }
  .bom-version-row:hover { background: #fafcff; }
  .bom-version-row.is-active { background: #eef2ff; }
  .bom-version-select { display: grid; grid-template-columns: minmax(170px, 1fr) auto auto; grid-column: 1 / 4; align-items: center; gap: 14px; padding: 3px 0; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
  .bom-version-main { display: flex; align-items: center; gap: 9px; min-width: 0; }
  .bom-version-radio { width: 16px; height: 16px; flex: 0 0 auto; border: 1px solid #cbd5e1; border-radius: 50%; background: #fff; }
  .bom-version-row.is-active .bom-version-radio { border: 5px solid #6366f1; }
  .bom-version-name { font-weight: 700; }
  .bom-version-count, .bom-version-date { color: #8c8c8c; font-size: 12px; white-space: nowrap; }
  .bom-version-delete { color: #ef4444; }
  .bom-editor-title { display: flex; align-items: center; gap: 8px; margin: 4px 0 14px; font-size: 15px; font-weight: 700; }
  .bom-editor-title .ant-tag { margin-left: 2px; }
  .bom-general { padding: 14px 14px 2px; margin-bottom: 14px; border: 1px dashed #d9d9d9; border-radius: 8px; background: #fcfcfc; }
`

const isActiveStatus = (status) => (
  status === true || status === 1 || status === '1' || String(status).toUpperCase() === 'ACTIVE'
)

const normalizeVersion = (value) => String(value ?? '').trim() || 'v1.0'

const toNumber = (value) => {
  if (value == null || value === '') return value
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : value
}

const serializeProductMaterials = (models = [], bomProductId = null) => models.map(model => ({
  productMaterialId: model.productMaterialId ?? null,
  bomProductId: model.bomProductId ?? bomProductId ?? null,
  materialId: toNumber(model.materialId),
  materialUnit: model.materialUnit,
  price: toNumber(model.price),
  quantity: toNumber(model.quantity),
  skuId: toNumber(model.skuId),
  ...(model.width != null && model.width !== '' ? { width: toNumber(model.width) } : {}),
  ...(model.height != null && model.height !== '' ? { height: toNumber(model.height) } : {}),
}))

const groupBomVersions = (models = []) => {
  const nestedVersions = models.filter(item => Array.isArray(item?.productMaterials))
  if (nestedVersions.length > 0) {
    return nestedVersions
      .map((bom, index) => ({
        key: bom.bomProductId ?? `${normalizeVersion(bom.version)}_${index}`,
        bomProductId: bom.bomProductId,
        version: normalizeVersion(bom.version),
        status: isActiveStatus(bom.status) ? 1 : 0,
        description: bom.description ?? '',
        updatedAt: bom.updatedDate ?? bom.createdDate,
        models: bom.productMaterials ?? [],
      }))
      .sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }))
  }

  // Tương thích response cũ: mỗi phần tử data là một product-material.
  const groups = new Map()
  models.forEach((model) => {
    const version = normalizeVersion(model.version)
    if (!groups.has(version)) {
      groups.set(version, {
        key: version,
        version,
        status: isActiveStatus(model.status) ? 1 : 0,
        updatedAt: model.updatedAt ?? model.updatedDate ?? model.createdAt ?? model.material?.createdAt,
        models: [],
      })
    }
    groups.get(version).models.push(model)
  })
  return Array.from(groups.values()).sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }))
}

const createNextVersion = (versions = []) => {
  const usedVersions = new Set(versions.map(item => normalizeVersion(item.version)))
  let index = versions.length + 1
  let version = `v${index}.0`
  while (usedVersions.has(version)) {
    index += 1
    version = `v${index}.0`
  }
  return version
}

const formatUpdatedAt = (value) => {
  if (!value) return 'Chưa cập nhật'
  const normalizedValue = typeof value === 'string'
    ? value.replace(' ', 'T').replace(/(\.\d{3})\d+$/, '$1')
    : value
  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return String(value)
  return `Cập nhật ${date.toLocaleDateString('vi-VN')}`
}

const StatusTag = ({ active }) => (
  <Tag color={active ? 'success' : 'default'}>{active ? 'Sử dụng' : 'Không sử dụng'}</Tag>
)

const ProductBomContainer = ({ closeModal, data }) => {

  const [form] = Form.useForm();
  const [record, setRecord] = useState({ product: data, models: [] });
  const [versions, setVersions] = useState([]);
  const [selectedVersionKey, setSelectedVersionKey] = useState(null);
  const watchedVersion = Form.useWatch('version', form);
  const watchedStatus = Form.useWatch('status', form);
  const watchedModels = Form.useWatch('models', form) ?? [];

  useEffectAsync(async () => {
    const mPData = await RequestUtils.GetAsList("/product-material/find-by-product/" + data.id);
    const groupedVersions = groupBomVersions(mPData);
    const initialVersions = groupedVersions.length > 0
      ? groupedVersions
      : [{ key: 'v1.0', version: 'v1.0', status: 1, updatedAt: null, models: [] }];
    const selectedVersion = initialVersions.find(item => item.status === 1) ?? initialVersions[0];
    setVersions(initialVersions);
    setSelectedVersionKey(selectedVersion.key);
    const nextRecord = {
      product: data,
      models: selectedVersion.models,
      version: selectedVersion.version,
      status: selectedVersion.status === 1,
    };
    setRecord(nextRecord);
    form.setFieldsValue(nextRecord);
  }, [data, form]);

  const selectVersion = (versionKey) => {
    if (versionKey === selectedVersionKey) return;
    const nextVersion = versions.find(item => item.key === versionKey);
    if (!nextVersion) return;

    setSelectedVersionKey(versionKey);
    const nextRecord = {
      product: data,
      models: nextVersion.models,
      version: nextVersion.version,
      status: nextVersion.status === 1,
    };
    setRecord(nextRecord);
    form.setFieldsValue(nextRecord);
  };

  const createVersion = () => {
    const version = createNextVersion(versions);
    const newVersion = {
      key: `new_${Date.now()}`,
      version,
      status: 0,
      updatedAt: null,
      models: [],
    };
    const nextVersions = [...versions, newVersion];
    setVersions(nextVersions);
    setSelectedVersionKey(newVersion.key);
    const nextRecord = { product: data, models: [], version, status: false };
    setRecord(nextRecord);
    form.setFieldsValue(nextRecord);
  };

  const removeVersion = (versionKey) => {
    if (versions.length <= 1) {
      message.warning('BOM phải có ít nhất một version.');
      return;
    }

    const nextVersions = versions.filter(item => item.key !== versionKey);
    setVersions(nextVersions);

    if (versionKey === selectedVersionKey) {
      const nextVersion = nextVersions[0];
      setSelectedVersionKey(nextVersion.key);
      const nextRecord = {
        product: data,
        models: nextVersion.models,
        version: nextVersion.version,
        status: nextVersion.status === 1,
      };
      setRecord(nextRecord);
      form.setFieldsValue(nextRecord);
    }

    message.info('Đã xoá version khỏi danh sách. Bấm lưu để cập nhật.');
  };

  const onSubmit = async (values) => {
    const { models, version, status = true } = values;
    const { id: productId } = data;
    if(arrayEmpty(models)) {
      return;
    }
    const normalizedVersion = normalizeVersion(version);
    const hasDuplicateVersion = versions.some(item => (
      item.key !== selectedVersionKey && normalizeVersion(item.version) === normalizedVersion
    ));
    if (hasDuplicateVersion) {
      message.error(`Version ${normalizedVersion} đã tồn tại.`);
      return;
    }

    const nextVersions = versions.map(item => item.key === selectedVersionKey
      ? {
          ...item,
          version: normalizedVersion,
          status: status ? 1 : 0,
          models,
          updatedAt: new Date().toISOString(),
        }
      : item);
    const payload = nextVersions
      .filter(bomVersion => (bomVersion.models ?? []).some(model => model?.materialId != null))
      .map(bomVersion => ({
        bomProductId: bomVersion.bomProductId ?? null,
        version: normalizeVersion(bomVersion.version),
        status: bomVersion.status,
        productId: toNumber(productId),
        productMaterials: serializeProductMaterials(bomVersion.models, bomVersion.bomProductId),
      }));
    const response = await RequestUtils.Post("/product-material/save/" + productId, payload);
    const savedVersions = groupBomVersions(Array.isArray(response?.data) ? response.data : []);
    const mergedVersions = savedVersions.length > 0
      ? [
          ...nextVersions.map(localVersion => (
            savedVersions.find(savedVersion => savedVersion.version === localVersion.version) ?? localVersion
          )),
          ...savedVersions.filter(savedVersion => (
            !nextVersions.some(localVersion => localVersion.version === savedVersion.version)
          )),
        ]
      : nextVersions;
    const savedSelectedVersion = mergedVersions.find(item => item.version === normalizedVersion);

    setVersions(mergedVersions);
    if (savedSelectedVersion) {
      setSelectedVersionKey(savedSelectedVersion.key);
      const nextRecord = {
        product: data,
        models: savedSelectedVersion.models,
        version: savedSelectedVersion.version,
        status: savedSelectedVersion.status === 1,
      };
      setRecord(nextRecord);
      form.setFieldsValue(nextRecord);
    }
    message.success(response?.message || `Đã lưu BOM ${normalizedVersion}`);
  }

  const selectedVersion = versions.find(item => item.key === selectedVersionKey);

  return <BomStyles>
    <RestEditModal
      form={form}
      isMergeRecordOnSubmit={false}
      updateRecord={(values) => setRecord(curvals => ({ ...curvals, ...values }))}
      onSubmit={onSubmit}
      record={record}
      closeModal={closeModal}
    >
      <div className="bom-eyebrow">Bill of Materials</div>
      <div className="bom-title">Cấu hình BOM — {data.name}</div>
      <div className="bom-subtitle">SKU cha: <code>{data.code || `#${data.id}`}</code></div>

      <div className="bom-version-panel">
        <div className="bom-version-head">
          <div className="bom-version-head__title"><HistoryOutlined /> Phiên bản BOM</div>
          <Button size="small" icon={<PlusOutlined />} onClick={createVersion}>Tạo version mới</Button>
        </div>
        <div className="bom-version-list">
          {versions.map((versionItem) => {
            const isSelected = versionItem.key === selectedVersionKey
            const displayVersion = isSelected ? (watchedVersion ?? versionItem.version) : versionItem.version
            const isActive = isSelected ? Boolean(watchedStatus) : versionItem.status === 1
            const materialCount = isSelected
              ? watchedModels.filter(model => model?.materialId != null).length
              : versionItem.models.length
            return (
              <div
                className={`bom-version-row${isSelected ? ' is-active' : ''}`}
                key={versionItem.key}
              >
                <button
                  className="bom-version-select"
                  type="button"
                  onClick={() => selectVersion(versionItem.key)}
                >
                  <span className="bom-version-main">
                    <span className="bom-version-radio" />
                    <span className="bom-version-name">{displayVersion}</span>
                    <StatusTag active={isActive} />
                  </span>
                  <span className="bom-version-count">{materialCount} vật liệu</span>
                  <span className="bom-version-date">{formatUpdatedAt(versionItem.updatedAt)}</span>
                </button>
                <Popconfirm
                  title={`Xoá version ${displayVersion}?`}
                  description="Version sẽ bị loại khỏi payload khi lưu BOM."
                  okText="Xoá"
                  cancelText="Huỷ"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => removeVersion(versionItem.key)}
                >
                  <Button
                    className="bom-version-delete"
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    aria-label={`Xoá version ${displayVersion}`}
                  />
                </Popconfirm>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bom-editor-title">
        <UnorderedListOutlined /> Vật liệu trong {watchedVersion ?? selectedVersion?.version ?? ''}
        <StatusTag active={Boolean(watchedStatus)} />
      </div>
      <div className="bom-general">
        <Row gutter={16}>
          <Col md={12} xs={24}>
            <FormInput
              required
              name="version"
              label="Version"
              placeholder="Nhập phiên bản BOM"
            />
          </Col>
          <Col md={12} xs={24}>
            <Form.Item name="status" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Sử dụng" unCheckedChildren="Không sử dụng" />
            </Form.Item>
          </Col>
        </Row>
      </div>
      <FormListAddtion
        key={selectedVersionKey}
        name="models"
        textAddNew="Thêm vật liệu mới"
      >
        <FormOpenBom />
      </FormListAddtion>
      <div style={{width: '100%'}}>
        <CustomButton htmlType="submit" />
      </div>
    </RestEditModal>
  </BomStyles>
}

const FormOpenBom = ({ field }) => {

  const [ material, setMaterial ] = useState({})
  const { form, record } = useContext(FormContextCustom);

  const { name } = field || { name: 0 };
  const onChangeSelectMaterial = (value, item) => {
    let price = undefined;
    if(item.unitType !== 'DIMENSION') {
      price = item.pricePerUnit
    }
    form.setFieldsValue({
      models: {[name]: { materialUnit: item.unitType, price }}
    });
    setMaterial(item);
  }

  const materialId = Form.useWatch(["models", name, "materialId"], form);
  useEffectAsync(async () => {
    if(materialId) {
      const { data } = await RequestUtils.Get("/material/find-id", {id: materialId});
      setMaterial(data);
    }
  }, [materialId]);

  return (
    <Row gutter={16}>
      <Col md={24} xs={24}>
        <FormHidden name="materialUnit" />
      </Col>
      <Col md={12} xs={24}>
        <FormSelectInfiniteMaterial 
          required
          name={[name, 'materialId']}
          placeholder="Chọn vật liệu"
          label="Vật liệu"
          onChangeGetSelectedItem={onChangeSelectMaterial}
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput 
          required
          name={[name, 'quantity']}
          placeholder="Số lượng"
          label="Số lượng"
        />
      </Col>
      <Col md={24} xs={24}>
        <FormSelect 
          required
          name={[name, 'skuId']}
          label='Sku'
          placeholder='Chọn loại SKu'
          resourceData={record?.product?.skus ?? []}
        />
      </Col>
      <Col md={24} xs={24}>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, curValues) =>
            prevValues.models[name]?.materialUnit !== curValues.models[name]?.materialUnit
          }
        >
          {({ getFieldValue }) => {
            let models = getFieldValue('models');
            const materialUnit = models[name]?.materialUnit ?? '';
            return <FormDimension 
              name={name} 
              materialUnit={materialUnit}
              material={material}
            />
          }}
        </Form.Item>
      </Col>
      <Col md={12} xs={24}>
        <FormInputNumber 
          step={0.01}
          required
          name={[name, 'price']}
          placeholder="Đơn giá định mức"
        />
      </Col>
      <Col md={12} xs={24}>
        { material?.pricePerUnit &&
          <Typography.Title level={5}>
            Đơn giá cấu hình: {formatMoney(material.pricePerUnit)} / {material.unit}
          </Typography.Title>
        }
      </Col>
    </Row>
  )
};

const FormDimension = ({ name, materialUnit, material }) => {

  const { form } = useContext(FormContextCustom);
  const getDimensions = () => {
    const width = form.getFieldValue(['models', name, 'width']);
    const height = form.getFieldValue(['models', name, 'height']);
    return { width, height };
  };

  const handleInputChange = () => {
    const { width, height } = getDimensions();
    if(width && height && material.pricePerUnit) {
      const price = ((width / 100) * (height / 100) * material.pricePerUnit).toFixed(2);
      form.setFieldsValue({ models: {[name]: { price }}});
    }
  };

  return materialUnit === "DIMENSION" ? (
    <Row gutter={16}>
      <Col md={12} xs={24}>
        <FormInputNumber
          onChange={handleInputChange}
          name={[name, 'width']}
          placeholder="Chiều rộng (nếu có)"
          label="Chiều rộng (cm)"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInputNumber
          onChange={handleInputChange}
          name={[name, 'height']}
          placeholder="Chiều dài (nếu có)"
          label="Chiều dài (cm)"
        />
      </Col>
    </Row>
  ) : ("")
};

export default ProductBomContainer;
