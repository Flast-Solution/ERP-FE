import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, message, Select } from 'antd';
import ProductAttrService from '@/services/ProductAttrService';
import { SUCCESS_CODE } from '@/configs';
import { syncSelectedProductProperties } from './productProperties';

const ProductAttributeSelector = () => {
  const form = Form.useFormInstance();
  const properties = Form.useWatch('listProperties', form);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
    const previousAttributeIds = selectedAttributeIds;
    form.setFieldValue('listProperties', syncSelectedProductProperties(properties, values));
    setSaving(true);
    try {
      const response = await ProductAttrService.updateDefault(attributes, values);
      const succeeded = response?.success === true
        || Number(response?.errorCode) === SUCCESS_CODE;
      if (!succeeded) throw new Error(response?.message || 'Cập nhật thuộc tính mặc định không thành công');
      message.success(response?.message || 'Đã cập nhật thuộc tính mặc định nhận diện tồn kho');
    } catch (error) {
      form.setFieldValue(
        'listProperties',
        syncSelectedProductProperties(properties, previousAttributeIds),
      );
      message.error(error?.message || 'Không thể cập nhật thuộc tính mặc định');
    } finally {
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
