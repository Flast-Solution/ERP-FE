import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import { Helmet } from 'react-helmet';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import useGetMe from '@/hooks/useGetMe';
import { deleteMenu, getMenuTree, listMenus, saveMenu } from './service';
import { descendantIds, filterMenuTree, suggestMenuUrls } from './model';

const urlRule = {
  validator: (_, value) =>
    !value || /^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value) || /^#[\w-]*$/.test(value)
      ? Promise.resolve()
      : Promise.reject(new Error('Nhập URL http/https, đường dẫn / hoặc #')),
};
export default function MenuPage() {
  const { hasPermission } = useGetMe();
  const [tree, setTree] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const manualUrls = useRef({});
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextTree, nextItems] = await Promise.all([getMenuTree(), listMenus()]);
      setTree(nextTree);
      setItems(nextItems);
      setExpandedKeys(nextItems.map((item) => item.id));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const open = (item = {}, parentId = null) => {
    form.resetFields();
    manualUrls.current = { urlVi: Boolean(item.urlVi?.trim()), urlEn: Boolean(item.urlEn?.trim()) };
    form.setFieldsValue({ parentId, sortOrder: 0, active: true, ...item });
    setEditing(item);
  };
  const submit = async (values) => {
    const excluded = descendantIds(items, editing.id);
    if (values.parentId != null && excluded.has(String(values.parentId))) {
      message.error('Không thể chọn menu hiện tại hoặc menu con làm menu cha');
      return;
    }
    setSaving(true);
    try {
      await saveMenu({ ...values, id: editing.id ?? null, parentId: values.parentId ?? null });
      message.success('Đã lưu menu');
      setEditing(null);
      await load();
    } catch (failure) {
      message.error(failure.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => {
    try {
      await deleteMenu(id);
      message.success('Đã xóa menu');
      await load();
    } catch (failure) {
      message.error(failure.message);
    }
  };
  const excluded = descendantIds(items, editing?.id);
  const parentOptions = items
    .filter((item) => !excluded.has(String(item.id)))
    .map((item) => ({
      value: item.id,
      label: `${item.nameVi || item.nameEn || 'Menu'} (#${item.id})`,
    }));
  const columns = [
    { title: 'Tên tiếng Việt', dataIndex: 'nameVi', width: 240 },
    { title: 'Tên tiếng Anh', dataIndex: 'nameEn', width: 180 },
    { title: 'URL tiếng Việt', dataIndex: 'urlVi', width: 180, ellipsis: true },
    { title: 'URL tiếng Anh', dataIndex: 'urlEn', width: 180, ellipsis: true },
    { title: 'Thứ tự', dataIndex: 'sortOrder', width: 90 },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      width: 130,
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Hiển thị' : 'Ẩn'}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 260,
      render: (_, item) => {
        const hasChildren =
          Boolean(item.children?.length) ||
          items.some((child) => String(child.parentId) === String(item.id));
        return (
          <Space wrap>
            {hasPermission('web.menu.create') && (
              <Button disabled={loading || !!error} size="small" onClick={() => open({}, item.id)}>
                Thêm con
              </Button>
            )}
            {hasPermission('web.menu.update') && (
              <Button
                disabled={loading || !!error}
                size="small"
                onClick={() =>
                  open(items.find((menu) => String(menu.id) === String(item.id)) || item)
                }
              >
                Sửa
              </Button>
            )}
            {hasPermission('web.menu.delete') &&
              (hasChildren ? (
                <Tooltip title="Chỉ xóa được menu không có menu con">
                  <Button size="small" disabled>
                    Xóa
                  </Button>
                </Tooltip>
              ) : (
                <Popconfirm
                  title="Xóa menu này?"
                  okText="Xóa"
                  cancelText="Hủy"
                  onConfirm={() => remove(item.id)}
                >
                  <Button disabled={loading || !!error} size="small" danger>
                    Xóa
                  </Button>
                </Popconfirm>
              ))}
          </Space>
        );
      },
    },
  ];
  return (
    <>
      <Helmet>
        <title>Quản lý Menu</title>
      </Helmet>
      <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title: 'Quản lý Menu' }]} />
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm tên hoặc URL menu"
          aria-label="Tìm menu"
          allowClear
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button loading={loading} onClick={load}>
          Làm mới
        </Button>
        {hasPermission('web.menu.create') && (
          <Button type="primary" disabled={loading || !!error} onClick={() => open()}>
            Thêm menu gốc
          </Button>
        )}
      </Space>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        dataSource={filterMenuTree(tree, query)}
        columns={columns}
        loading={loading}
        pagination={false}
        scroll={{ x: 1260 }}
        expandable={{
          expandedRowKeys: expandedKeys,
          onExpandedRowsChange: (keys) => setExpandedKeys([...keys]),
        }}
      />
      <Modal
        title={editing?.id != null ? 'Sửa menu' : 'Thêm menu'}
        open={editing !== null}
        width={760}
        onCancel={() => {
          if (!saving) setEditing(null);
        }}
        footer={null}
        maskClosable={!saving}
        closable={!saving}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          onValuesChange={(changed, values) =>
            form.setFieldsValue(suggestMenuUrls(changed, values, manualUrls.current))
          }
          disabled={saving}
        >
          <Form.Item name="parentId" label="Menu cha" extra="Để trống để tạo menu gốc.">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={parentOptions}
              placeholder="Menu gốc"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="nameVi"
                label="Tên tiếng Việt"
                rules={[{ required: true, whitespace: true, message: 'Nhập tên menu tiếng Việt' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="nameEn" label="Tên tiếng Anh">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="urlVi" label="URL tiếng Việt" rules={[urlRule]}>
                <Input placeholder="/gioi-thieu" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="urlEn" label="URL tiếng Anh" rules={[urlRule]}>
                <Input placeholder="/about-us" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="sortOrder"
                label="Thứ tự hiển thị"
                rules={[
                  { required: true, message: 'Nhập thứ tự' },
                  { type: 'integer', min: 0, message: 'Nhập số nguyên từ 0' },
                ]}
              >
                <InputNumber min={0} precision={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="active" label="Trạng thái" valuePropName="checked">
                <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              Lưu menu
            </Button>
            <Button onClick={() => setEditing(null)}>Hủy</Button>
          </Space>
        </Form>
      </Modal>
    </>
  );
}
