import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, Select } from 'antd';
import ProductAttrService from '@/services/ProductAttrService';
import { syncSelectedProductProperties } from './productProperties';

const ProductAttributeSelector = () => {
  const form = Form.useFormInstance();
  const properties = Form.useWatch('listProperties', form);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleChange = values => {
    form.setFieldValue(
      'listProperties',
      syncSelectedProductProperties(properties, values),
    );
  };

  return (
    <Form.Item label="Chọn thuộc tính mặc định nhận diện tồn kho">
      <Select
        allowClear
        showSearch
        mode="multiple"
        loading={loading}
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
