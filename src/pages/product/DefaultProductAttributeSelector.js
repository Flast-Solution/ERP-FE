import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, message, Select, Space, Typography } from 'antd';
import ProductAttrService from '@/services/ProductAttrService';
import { SUCCESS_CODE } from '@/configs';

const isDefaultAttribute = attribute => (
  attribute?.initial === true || Number(attribute?.initial) === 1
);

const DefaultProductAttributeSelector = () => {
  const [attributes, setAttributes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    ProductAttrService.loadAll({ limit: 1000, page: 1 })
      .then(items => {
        if (!mounted) return;
        const nextAttributes = Array.isArray(items) ? items : [];
        setAttributes(nextAttributes);
        setSelectedIds(nextAttributes.filter(isDefaultAttribute).map(item => item.id));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const options = useMemo(() => attributes
    .filter(item => item?.id !== undefined && item?.id !== null)
    .map(item => ({
      value: item.id,
      label: item.name || `Thuộc tính #${item.id}`,
    })), [attributes]);

  const handleChange = async nextIds => {
    const previousIds = selectedIds;
    setSelectedIds(nextIds);
    setSaving(true);
    try {
      const selectedIdSet = new Set(nextIds.map(String));
      const response = await ProductAttrService.updateDefault(attributes, nextIds);
      const succeeded = response?.success === true
        || Number(response?.errorCode) === SUCCESS_CODE;
      if (!succeeded) throw new Error(response?.message || 'Cập nhật thuộc tính mặc định không thành công');

      setAttributes(current => current.map(item => ({
        ...item,
        initial: selectedIdSet.has(String(item.id)),
      })));
      message.success(response?.message || 'Đã cập nhật thuộc tính mặc định');
    } catch (error) {
      setSelectedIds(previousIds);
      message.error(error?.message || 'Không thể cập nhật thuộc tính mặc định');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Space direction="vertical" size={4} style={{ width: 380 }}>
      <Typography.Text strong>Chọn thuộc tính mặc định nhận diện tồn kho</Typography.Text>
      <Select
        allowClear
        showSearch
        mode="multiple"
        maxTagCount="responsive"
        loading={loading || saving}
        disabled={saving}
        value={selectedIds}
        options={options}
        optionFilterProp="label"
        placeholder="Chọn thuộc tính mặc định"
        optionRender={option => (
          <Checkbox
            checked={selectedIds.some(id => String(id) === String(option.value))}
            style={{ pointerEvents: 'none' }}
          >
            {option.label}
          </Checkbox>
        )}
        onChange={handleChange}
      />
    </Space>
  );
};

export default DefaultProductAttributeSelector;
