import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button, Col, Form, message, Row, Space, Tag } from 'antd';
import {
  BreadcrumbCustom,
  CustomButton,
  DrawerCustom,
  FormHidden,
  FormInput,
  FormSelect,
  FormTextArea,
  RestList,
} from '@flast-erp/core/components';
import { useGetList } from '@flast-erp/core/hooks';
import { RequestUtils, f5List } from '@flast-erp/core/utils';
import ProviderFilter from './Filter';

const STATUS_OPTIONS = [
  { id: 1, name: 'Kích hoạt' },
  { id: 0, name: 'Ngưng' },
];

const emptyToNull = (value) => {
  if (value === undefined || value === '') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
};

const buildProviderPayload = (values = {}) => ({
  id: values.id,
  geolocation: emptyToNull(values.geolocation),
  code: emptyToNull(values.code),
  name: emptyToNull(values.name),
  representative: emptyToNull(values.representative),
  phoneContact: emptyToNull(values.phoneContact),
  email: emptyToNull(values.email),
  emailManufacture: emptyToNull(values.emailManufacture),
  address: emptyToNull(values.address),
  bankCode: emptyToNull(values.bankCode),
  bankName: emptyToNull(values.bankName),
  bankOwner: emptyToNull(values.bankOwner),
  strengths: emptyToNull(values.strengths),
  note: emptyToNull(values.note),
  status: values.status ?? 1,
});

const ProviderForm = ({ record, onCancel, onSaved }) => {
  const [form] = Form.useForm();

  const initialValues = useMemo(() => ({
    status: 1,
    ...record,
  }), [record]);

  const onSubmit = async (values) => {
    const payload = buildProviderPayload(values);
    console.log('[Provider] submit payload', payload);

    const response = await RequestUtils.Post('/provider/save', payload);
    const isSuccess = response?.errorCode === 200 || response?.success;

    if (isSuccess) {
      message.success(response?.message || 'Đã lưu nhà cung cấp.');
      onSaved?.();
      return;
    }

    message.error(response?.message || 'Lưu nhà cung cấp thất bại.');
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      style={{ marginTop: 20 }}
    >
      <FormHidden name="id" />
      <Row gutter={16}>
        <Col md={12} xs={24}>
          <FormInput
            name="code"
            label="Mã nhà cung cấp"
            placeholder="Nhập mã nhà cung cấp"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            required
            name="name"
            label="Tên nhà cung cấp"
            placeholder="Nhập tên nhà cung cấp"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            name="representative"
            label="Người đại diện"
            placeholder="Nhập người đại diện"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            name="phoneContact"
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            name="email"
            label="Email"
            placeholder="Nhập email"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            name="emailManufacture"
            label="Email sản xuất"
            placeholder="Nhập email sản xuất"
          />
        </Col>
        <Col md={24} xs={24}>
          <FormInput
            name="address"
            label="Địa chỉ"
            placeholder="Nhập địa chỉ"
          />
        </Col>
        <Col md={8} xs={24}>
          <FormInput
            name="bankCode"
            label="Số tài khoản"
            placeholder="Nhập số tài khoản"
          />
        </Col>
        <Col md={8} xs={24}>
          <FormInput
            name="bankName"
            label="Ngân hàng"
            placeholder="Nhập ngân hàng"
          />
        </Col>
        <Col md={8} xs={24}>
          <FormInput
            name="bankOwner"
            label="Chủ tài khoản"
            placeholder="Nhập chủ tài khoản"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelect
            required
            name="status"
            label="Trạng thái"
            placeholder="Chọn trạng thái"
            resourceData={STATUS_OPTIONS}
            valueProp="id"
            titleProp="name"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            name="geolocation"
            label="Geolocation"
            placeholder="Nhập geolocation"
          />
        </Col>
        <Col md={24} xs={24}>
          <FormTextArea
            name="strengths"
            label="Thế mạnh"
            placeholder="Nhập thế mạnh"
            rows={3}
          />
        </Col>
        <Col md={24} xs={24}>
          <FormTextArea
            name="note"
            label="Ghi chú"
            placeholder="Nhập ghi chú"
            rows={3}
          />
        </Col>
        <Col md={24} xs={24}>
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Huỷ</Button>
            <CustomButton
              htmlType="submit"
              title="Lưu"
              color="primary"
              variant="solid"
            />
          </Space>
        </Col>
      </Row>
    </Form>
  );
};

const ProviderPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState({});
  const title = 'Nhà cung cấp';

  const openForm = (record = {}) => {
    setEditingRecord(record || {});
    setDrawerOpen(true);
  };

  const closeForm = () => {
    setDrawerOpen(false);
    setEditingRecord({});
  };

  const onSaved = () => {
    closeForm();
    f5List('provider/fetch');
  };

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 140,
      ellipsis: true,
      render: value => value || '-',
    },
    {
      title: 'Tên nhà cung cấp',
      dataIndex: 'name',
      width: 220,
      ellipsis: true,
    },
    {
      title: 'Người đại diện',
      dataIndex: 'representative',
      width: 160,
      ellipsis: true,
      render: value => value || '-',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phoneContact',
      width: 150,
      ellipsis: true,
      render: value => value || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      width: 200,
      ellipsis: true,
      render: value => value || '-',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      width: 260,
      ellipsis: true,
      render: value => value || '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      render: status => (
        <Tag color={(status ?? 1) === 1 ? 'green' : 'red'}>
          {(status ?? 1) === 1 ? 'Kích hoạt' : 'Ngưng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      fixed: 'right',
      width: 110,
      render: record => (
        <Button
          type="primary"
          size="small"
          onClick={() => openForm(record)}
        >
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <BreadcrumbCustom
        data={[{ title: 'Trang chủ' }, { title }]}
      />
      <RestList
        xScroll={1400}
        initialFilter={{ limit: 10, page: 1 }}
        filter={<ProviderFilter />}
        useGetAllQuery={useGetList}
        hasCreate
        customClickCreate={() => openForm({})}
        apiPath="provider/fetch"
        columns={columns}
      />

      <DrawerCustom
        width={750}
        open={drawerOpen}
        onClose={closeForm}
        title={editingRecord?.id ? `Cập nhật nhà cung cấp #${editingRecord.id}` : 'Tạo mới nhà cung cấp'}
      >
        <ProviderForm
          key={editingRecord?.id || 'create'}
          record={editingRecord}
          onCancel={closeForm}
          onSaved={onSaved}
        />
      </DrawerCustom>
    </div>
  );
};

export default ProviderPage;
