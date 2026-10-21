import { useEffect, useState } from 'react';
import { Button, Form, Input, message, Select, Space, Spin } from 'antd';
import { Helmet } from 'react-helmet';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useNavigateSearch, useQueryParams } from '@flast-erp/core/hooks';
import { listTags, saveTag } from './service';

export default function TagEdit() {
  const { get } = useQueryParams();
  const id = get('id');
  const type = get('type') === 'pages' ? 'pages' : 'product';
  const navigate = useNavigateSearch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(!id);
  useEffect(() => {
    let active = true;
    form.resetFields();
    form.setFieldsValue({ type });
    setReady(!id);
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    listTags(type)
      .then((tags) => {
        if (!active) return;
        const tag = tags.find((item) => String(item.id) === String(id));
        if (!tag) throw new Error('Không tìm thấy tag');
        form.setFieldsValue(tag);
        setReady(true);
      })
      .catch((error) => {
        if (active) message.error(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, type, form]);
  const submit = async (values) => {
    setSaving(true);
    try {
      await saveTag({ ...values, id: id || null });
      message.success('Đã lưu tag');
      navigate('/tag');
    } catch (error) {
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  };
  const title = id ? 'Sửa tag' : 'Thêm mới tag';
  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title: 'Tag' }, { title }]} />
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          style={{ maxWidth: 640 }}
          disabled={!ready || saving}
        >
          <Form.Item
            name="name"
            label="Tên tag"
            rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên tag' }]}
          >
            <Input placeholder="Nhập tên tag" />
          </Form.Item>
          <Form.Item
            name="type"
            label="Loại tag"
            rules={[{ required: true, message: 'Vui lòng chọn loại tag' }]}
          >
            <Select
              placeholder="Chọn loại tag"
              options={[
                { value: 'product', label: 'Sản phẩm (product)' },
                { value: 'pages', label: 'Trang (pages)' },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={4} placeholder="Mô tả tùy chọn" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              Lưu tag
            </Button>
            <Button onClick={() => navigate('/tag')}>Quay lại</Button>
          </Space>
        </Form>
      </Spin>
    </>
  );
}
