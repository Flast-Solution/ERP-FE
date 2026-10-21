import BannerImage from './BannerImage';
import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Upload,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Helmet } from 'react-helmet';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useNavigateSearch, useQueryParams } from '@flast-erp/core/hooks';
import { getBanner, saveBanner, uploadBannerImages } from './service';
import { BANNER_POSITIONS, bannerImages } from './config';

export default function BannerEdit() {
  const { get } = useQueryParams();
  const id = get('id');
  const navigate = useNavigateSearch();
  const [form] = Form.useForm();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [ready, setReady] = useState(!id);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = loading || uploading || saving;
  useEffect(() => {
    let active = true;
    form.resetFields();
    setImages([]);
    setReady(!id);
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getBanner(id)
      .then((data) => {
        if (!active) return;
        if (!data || String(data.id) !== String(id)) throw new Error('Không tìm thấy banner');
        form.setFieldsValue(data);
        setImages(
          bannerImages(data.imageUrls).map((url, index) => ({ key: `${data.id}-${index}`, url })),
        );
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
  }, [id, form]);
  const upload = async (files) => {
    if (files.some((file) => !file.type.startsWith('image/'))) {
      message.error('Vui lòng chỉ chọn tệp ảnh');
      return;
    }
    setUploading(true);
    try {
      const paths = await uploadBannerImages(files);
      const added = paths.map((url, index) => ({ key: `${Date.now()}-${index}`, url }));
      setImages((current) => [...current, ...added]);
      message.success(`Đã tải ${paths.length} ảnh`);
    } catch (error) {
      message.error(error.message);
    } finally {
      setUploading(false);
    }
  };
  const move = (index, offset) =>
    setImages((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  const submit = async (values) => {
    if (!images.length) {
      message.error('Vui lòng tải ảnh banner');
      return;
    }
    setSaving(true);
    try {
      await saveBanner({ ...values, id: id || null, imageUrls: images.map((image) => image.url) });
      message.success('Đã lưu banner');
      navigate('/banner');
    } catch (error) {
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  };
  const title = id ? 'Sửa banner' : 'Thêm banner';
  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title: 'Quản lý banner' }, { title }]} />
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ position: 'TOP', sortOrder: 0, active: true }}
          onFinish={submit}
          disabled={busy || !ready}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <Card title="Thông tin banner">
                <Form.Item
                  name="name"
                  label="Tên banner"
                  rules={[{ required: true, whitespace: true, message: 'Nhập tên banner' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="targetUrl"
                  label="Liên kết khi bấm ảnh"
                  rules={[
                    {
                      validator: (_, value) =>
                        !value || /^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value)
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error('Nhập URL http/https hoặc đường dẫn bắt đầu bằng /'),
                            ),
                    },
                  ]}
                >
                  <Input placeholder="/products" />
                </Form.Item>
                <Form.Item
                  name="position"
                  label="Vị trí"
                  rules={[{ required: true, message: 'Chọn vị trí' }]}
                >
                  <Select options={BANNER_POSITIONS} />
                </Form.Item>
                <Form.Item
                  name="sortOrder"
                  label="Thứ tự banner"
                  extra="Số nhỏ hiển thị trước. Thứ tự ảnh trong banner được sắp xếp ở bên phải."
                  rules={[
                    { required: true, message: 'Nhập thứ tự' },
                    { type: 'integer', min: 0, message: 'Nhập số nguyên từ 0' },
                  ]}
                >
                  <InputNumber min={0} precision={0} />
                </Form.Item>
                <Form.Item name="active" label="Trạng thái" valuePropName="checked">
                  <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
                </Form.Item>
                <Space wrap>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    disabled={busy || !ready || !images.length}
                  >
                    Lưu banner
                  </Button>
                  <Button onClick={() => navigate('/banner')}>Quay lại</Button>
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={16}>
              <Card title={id ? 'Ảnh banner' : 'Ảnh và thứ tự hiển thị'}>
                <Upload.Dragger
                  accept="image/*"
                  multiple
                  showUploadList={false}
                  disabled={busy || !ready}
                  beforeUpload={(file, files) => {
                    if (file === files[0]) upload(files);
                    return Upload.LIST_IGNORE;
                  }}
                >
                  <UploadOutlined style={{ fontSize: 32 }} />
                  <p>{uploading ? 'Đang tải ảnh…' : 'Bấm hoặc kéo ảnh vào đây để tải lên'}</p>
                  <p>
                    Chọn nhiều ảnh để thêm vào banner. Dùng nút lên/xuống để đổi thứ tự hoặc nút xóa
                    để bỏ ảnh.
                  </p>
                </Upload.Dragger>
                <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 20 }}>
                  {images.map((image, index) => (
                    <Card
                      key={image.key}
                      size="small"
                      title={`Ảnh ${index + 1}`}
                      extra={
                        <Space>
                          <>
                            <Button
                              aria-label={`Đưa ảnh ${index + 1} lên`}
                              icon={<ArrowUpOutlined />}
                              disabled={busy || index === 0}
                              onClick={() => move(index, -1)}
                            />
                            <Button
                              aria-label={`Đưa ảnh ${index + 1} xuống`}
                              icon={<ArrowDownOutlined />}
                              disabled={busy || index === images.length - 1}
                              onClick={() => move(index, 1)}
                            />
                          </>
                          <Button
                            danger
                            aria-label={`Bỏ ảnh ${index + 1}`}
                            icon={<DeleteOutlined />}
                            disabled={busy}
                            onClick={() =>
                              setImages((current) =>
                                current.filter((item) => item.key !== image.key),
                              )
                            }
                          />
                        </Space>
                      }
                    >
                      <BannerImage
                        value={image.url}
                        width="100%"
                        style={{ maxHeight: 420, objectFit: 'contain' }}
                      />
                      <Input
                        value={image.url}
                        readOnly
                        aria-label={`URL ảnh ${index + 1} từ máy chủ`}
                        style={{ marginTop: 12 }}
                      />
                    </Card>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>
        </Form>
      </Spin>
    </>
  );
}
