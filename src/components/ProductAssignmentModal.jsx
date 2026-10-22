import React, { useEffect, useState } from 'react';
import { Alert, Button, Input, message, Modal, Space, Table, Typography } from 'antd';

const productColumns = [
  { title: 'Mã sản phẩm', dataIndex: 'code', width: 170, render: (code) => code || '—' },
  { title: 'Tên sản phẩm', dataIndex: 'name' },
];

const ProductAssignmentModal = ({
  title,
  subjectLabel,
  subjectName,
  fetchProducts,
  onSave,
  onSaved,
  onClose,
  successMessage,
  columns = productColumns,
  itemLabel = 'sản phẩm',
  initialSelectedIds = [],
}) => {
  const [query, setQuery] = useState({ page: 1, limit: 10, name: '' });
  const [selectedIds, setSelectedIds] = useState(() =>
    Array.isArray(initialSelectedIds) ? [...new Set(initialSelectedIds)] : [],
  );
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchProducts(query)
      .then((result) => {
        if (active) {
          setProducts(result.items);
          setTotal(result.total);
        }
      })
      .catch((err) => {
        if (active) {
          setProducts([]);
          setError(err.message || `Không tải được danh sách ${itemLabel}.`);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, retry, fetchProducts, itemLabel]);

  const save = async () => {
    if (!selectedIds.length || saving) return;
    setSaving(true);
    try {
      await onSave(selectedIds);
      message.success(successMessage);
      onSaved?.();
      onClose();
    } catch (err) {
      message.error(err.message || `Không thể gắn ${itemLabel}. Vui lòng thử lại.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={title}
      width={860}
      onCancel={onClose}
      onOk={save}
      okText={`Gắn ${itemLabel}`}
      cancelText="Hủy"
      confirmLoading={saving}
      okButtonProps={{ disabled: !selectedIds.length }}
      cancelButtonProps={{ disabled: saving }}
      closable={!saving}
      maskClosable={!saving}
      keyboard={!saving}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Text>
          {subjectLabel}: <strong>{subjectName}</strong>
        </Typography.Text>
        <Input.Search
          placeholder={`Tìm theo tên ${itemLabel}`}
          allowClear
          enterButton="Tìm kiếm"
          disabled={saving}
          onSearch={(name) => setQuery((current) => ({ ...current, page: 1, name: name.trim() }))}
        />
        <Typography.Text type="secondary">
          Đã chọn {selectedIds.length} {itemLabel}. Lựa chọn được giữ khi chuyển trang hoặc tìm
          kiếm.
        </Typography.Text>
        {error ? (
          <Alert
            type="error"
            showIcon
            message={error}
            action={
              <Button type="link" onClick={() => setRetry((value) => value + 1)}>
                Thử lại
              </Button>
            }
          />
        ) : null}
        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={products}
          loading={loading}
          scroll={{ x: 580, y: 360 }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            preserveSelectedRowKeys: true,
            onChange: setSelectedIds,
            getCheckboxProps: () => ({ disabled: saving }),
          }}
          pagination={{
            current: query.page,
            pageSize: query.limit,
            total,
            showSizeChanger: true,
            showTotal: (count) => `${count} ${itemLabel}`,
            onChange: (page, limit) => setQuery((current) => ({ ...current, page, limit })),
          }}
        />
      </Space>
    </Modal>
  );
};

export default ProductAssignmentModal;
