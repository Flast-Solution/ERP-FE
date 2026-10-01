import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Form, message, Select } from 'antd';
import { RequestUtils } from '@flast-erp/core/utils';
import ProductAttrService from '@/services/ProductAttrService';
import { syncSelectedProductProperties, isDefaultProductAttribute, updateAttributeDefaults } from './productProperties';

const ProductAttributeSelector = () => {
  const form = Form.useFormInstance();
  const properties = Form.useWatch('listProperties', form);
  const productTypeId = Form.useWatch('productTypeId', form);
  const previousTypeRef = useRef(productTypeId);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    ProductAttrService.loadAll({ limit: 1000, page: 1 })
      .then(items => {
        if (mounted) setAttributes(Array.isArray(items) ? items : []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading || saving || previousTypeRef.current === productTypeId) return;
    previousTypeRef.current = productTypeId;
    const ids = productTypeId == null || productTypeId === '' ? [] : attributes
      .filter(item => isDefaultProductAttribute(item, productTypeId)).map(item => item.id);
    form.setFieldValue('listProperties', syncSelectedProductProperties(form.getFieldValue('listProperties'), ids));
  }, [attributes, form, loading, saving, productTypeId]);

  const selectedAttributeIds = useMemo(() => Array.from(new Set(
    (Array.isArray(properties) ? properties : [])
      .map(item => item?.attributedId)
      .filter(id => id !== undefined && id !== null && id !== '')
      .map(String),
  )), [properties]);

  const options = useMemo(() => attributes
    .filter(item => item?.id !== undefined && item?.id !== null)
    .map(item => ({
      value: String(item.id),
      label: item.name || `Thuộc tính #${item.id}`,
    })), [attributes]);

  const handleChange = async values => {
    if (savingRef.current) return;
    const selectedType = form.getFieldValue('productTypeId');
    const previousProperties = form.getFieldValue('listProperties') ?? [];
    savingRef.current = true;
    setSaving(true);
    form.setFieldValue('listProperties', syncSelectedProductProperties(previousProperties, values));
    try {
      const result = await RequestUtils.Get('/attributed/fetch', { limit: 1000, page: 1 });
      if (Number(result?.errorCode) !== 200 || !Array.isArray(result?.data?.embedded)) {
        throw new Error('Không tải được danh sách thuộc tính');
      }
      const currentAttributes = result.data.embedded;
      const response = await ProductAttrService.updateDefault(currentAttributes, values, selectedType);
      if (response?.success !== true && Number(response?.errorCode) !== 200) {
        throw new Error(response?.message || 'Không thể cập nhật thuộc tính mặc định');
      }
      setAttributes(updateAttributeDefaults(currentAttributes, values, selectedType));
      message.success('Đã cập nhật thuộc tính mặc định');
    } catch (error) {
      if (form.getFieldValue('productTypeId') === selectedType) {
        form.setFieldValue('listProperties', previousProperties);
      }
      message.error(error?.message || 'Không thể cập nhật thuộc tính mặc định');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Form.Item label="Chọn thuộc tính mặc định nhận diện tồn kho">
      <Select
        allowClear
        showSearch
        mode="multiple"
        loading={loading || saving}
        disabled={loading || saving}
        value={selectedAttributeIds}
        options={options}
        optionFilterProp="label"
        placeholder="Chọn một hoặc nhiều thuộc tính"
        maxTagCount="responsive"
        optionRender={option => (
          <Checkbox
            checked={selectedAttributeIds.includes(String(option.value))}
            style={{ pointerEvents: 'none' }}
          >
            {option.label}
          </Checkbox>
        )}
        onChange={handleChange}
      />
    </Form.Item>
  );
};

export default ProductAttributeSelector;
