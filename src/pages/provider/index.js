import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button, Checkbox, Col, Collapse, Form, message, Row, Space, Tag, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
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
import useGetMe from '@/hooks/useGetMe';
import useDrawerLeaveGuard from '@/hooks/useDrawerLeaveGuard';
import './styles.less';

const STATUS_OPTIONS = [
  { id: 1, name: 'Kích hoạt' },
  { id: 0, name: 'Ngưng' },
];

const emptyToNull = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return typeof value === 'string' ? value.trim() : value;
};

const EMPTY_FACTORY = { name: '', address: '' };
const EMPTY_CONTACT = {
  name: '',
  department: '',
  position: '',
  phone: '',
  email: '',
  primary: false,
};

/** API: factoryInfo = array | null */
const normalizeFactoryInfo = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    return [{ ...EMPTY_FACTORY }];
  }
  return value.map(item => ({
    name: item.name ?? '',
    address: item.address ?? '',
  }));
};

const buildFactoryInfo = (value) => (
  (Array.isArray(value) ? value : [])
    .map(item => ({
      name: emptyToNull(item.name),
      address: emptyToNull(item.address),
    }))
    .filter(item => item.name || item.address)
);

/** API: contactInfo = array | null; item.primary = boolean */
const normalizeContactInfo = (value) => {
  if (!Array.isArray(value)) return [];

  let primaryAssigned = false;
  return value.map(item => {
    const primary = item.primary === true && !primaryAssigned;
    if (primary) primaryAssigned = true;
    return {
      name: item.name ?? '',
      department: item.department ?? '',
      position: item.position ?? '',
      phone: item.phone ?? '',
      email: item.email ?? '',
      primary,
    };
  });
};

const buildContactInfo = (value) => {
  let primaryAssigned = false;

  return (Array.isArray(value) ? value : [])
    .map(item => {
      const primary = item.primary === true && !primaryAssigned;
      if (primary) primaryAssigned = true;
      return {
        name: emptyToNull(item.name),
        department: emptyToNull(item.department),
        position: emptyToNull(item.position),
        phone: emptyToNull(item.phone),
        email: emptyToNull(item.email),
        primary,
      };
    })
    .filter(item => item.name || item.department || item.position || item.phone || item.email);
};

const getPrimaryContact = (record) => {
  const contacts = Array.isArray(record?.contactInfo) ? record.contactInfo : [];
  return contacts.find(item => item.primary === true) ?? contacts[0] ?? null;
};

const buildProviderPayload = (values = {}) => {
  const contactInfo = buildContactInfo(values.contactInfo);
  const primaryContact = contactInfo.find(item => item.primary === true) ?? contactInfo[0];

  return {
    id: values.id ?? null,
    code: emptyToNull(values.code),
    name: emptyToNull(values.name),
    mst: emptyToNull(values.mst),
    representative: emptyToNull(values.representative),
    email: emptyToNull(values.email),
    address: emptyToNull(values.address),
    contactInfo,
    // BE vẫn lưu flat fields đồng bộ từ liên hệ chính
    position: emptyToNull(primaryContact?.position),
    phoneContact: emptyToNull(primaryContact?.phone),
    emailManufacture: emptyToNull(primaryContact?.email),
    bankCode: emptyToNull(values.bankCode),
    bankName: emptyToNull(values.bankName),
    bankOwner: emptyToNull(values.bankOwner),
    factoryInfo: buildFactoryInfo(values.factoryInfo),
    paymentTerms: emptyToNull(values.paymentTerms),
    strengths: emptyToNull(values.strengths),
    note: emptyToNull(values.note),
    status: values.status,
  };
};

const ProviderForm = ({ record, onCancel, onSaved, onValuesChange, disabled = false }) => {
  const [form] = Form.useForm();

  const initialValues = useMemo(() => ({
    id: record?.id,
    code: record?.code,
    mst: record?.mst,
    name: record?.name,
    address: record?.address,
    representative: record?.representative,
    email: record?.email,
    bankCode: record?.bankCode,
    bankName: record?.bankName,
    bankOwner: record?.bankOwner,
    paymentTerms: record?.paymentTerms,
    strengths: record?.strengths,
    note: record?.note,
    status: record?.status ?? 1,
    contactInfo: normalizeContactInfo(record?.contactInfo),
    factoryInfo: normalizeFactoryInfo(record?.factoryInfo),
  }), [record]);

  const onSubmit = async (values) => {
    const payload = buildProviderPayload(values);
    const incompleteContactIndex = payload.contactInfo.findIndex(item => !item.phone && !item.email);

    if (incompleteContactIndex >= 0) {
      message.error('Mỗi người liên hệ cần có số điện thoại hoặc email.');
      form.scrollToField(['contactInfo', incompleteContactIndex, 'phone'], {
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    const response = await RequestUtils.Post('/provider/save', payload);

    if (response?.errorCode === 200) {
      message.success(response.message);
      onSaved?.();
      return;
    }

    message.error(response?.message ?? 'Lưu nhà cung cấp thất bại.');
  };

  const setPrimaryContact = (selectedIndex, checked) => {
    const contacts = form.getFieldValue('contactInfo') ?? [];
    form.setFieldValue('contactInfo', contacts.map((item, index) => ({
      ...item,
      primary: checked && index === selectedIndex,
    })));
  };

  return (
    <Form
      form={form}
      layout="vertical"
      disabled={disabled}
      initialValues={initialValues}
      onFinish={onSubmit}
      onValuesChange={onValuesChange}
      className="provider-form"
    >
      <FormHidden name="id" />

      <section className="provider-form__section">
        <div className="provider-form__section-title">Thông tin nhà cung cấp</div>
        <Row gutter={16}>
          <Col md={8} xs={24}>
            <FormInput name="code" label="Mã nhà cung cấp" placeholder="Nhập mã nhà cung cấp" />
          </Col>
          <Col md={8} xs={24}>
            <FormInput name="mst" label="Mã số thuế" placeholder="Nhập mã số thuế" />
          </Col>
          <Col md={8} xs={24}>
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
          <Col span={24}>
            <FormInput required name="name" label="Tên nhà cung cấp" placeholder="Nhập tên nhà cung cấp" />
          </Col>
          <Col span={24}>
            <FormInput name="address" label="Địa chỉ" placeholder="Nhập địa chỉ" />
          </Col>
        </Row>
      </section>

      <section className="provider-form__section">
        <div className="provider-form__section-title">Người đại diện</div>
        <div className="provider-form__section-description">
          Thông tin đại diện pháp lý của nhà cung cấp.
        </div>
        <Row gutter={16}>
          <Col md={12} xs={24}>
            <FormInput name="representative" label="Người đại diện" placeholder="Nhập họ tên" />
          </Col>
          <Col md={12} xs={24}>
            <FormInput name="email" label="Email" placeholder="name@company.com" />
          </Col>
        </Row>
      </section>

      <section className="provider-form__section">
        <div className="provider-form__section-title">Thông tin người liên hệ</div>
        <div className="provider-form__section-description">
          Thêm các đầu mối làm việc theo từng phòng ban và chọn một liên hệ chính.
        </div>
        <Form.List name="contactInfo">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={12} className="provider-form__list">
              {fields.map((field, index) => (
                <div className="provider-form__list-item" key={field.key}>
                  <div className="provider-form__list-header">
                    <span>Người liên hệ {index + 1}</span>
                    {!disabled && (
                      <Tooltip title="Xóa người liên hệ">
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          aria-label={`Xóa người liên hệ ${index + 1}`}
                          onClick={() => remove(field.name)}
                        />
                      </Tooltip>
                    )}
                  </div>
                  <Row gutter={12}>
                    <Col md={12} xs={24}>
                      <FormInput
                        required
                        name={[field.name, 'name']}
                        label="Họ và tên"
                        placeholder="Nhập họ tên người liên hệ"
                      />
                    </Col>
                    <Col md={12} xs={24}>
                      <FormInput
                        name={[field.name, 'department']}
                        label="Phòng ban"
                        placeholder="Ví dụ: Phòng mua hàng"
                      />
                    </Col>
                    <Col md={8} xs={24}>
                      <FormInput
                        name={[field.name, 'position']}
                        label="Chức vụ"
                        placeholder="Nhập chức vụ"
                      />
                    </Col>
                    <Col md={8} xs={24}>
                      <FormInput
                        name={[field.name, 'phone']}
                        label="Số điện thoại"
                        placeholder="Nhập số điện thoại"
                      />
                    </Col>
                    <Col md={8} xs={24}>
                      <FormInput
                        name={[field.name, 'email']}
                        label="Email"
                        placeholder="name@company.com"
                      />
                    </Col>
                    <Col span={24}>
                      <Form.Item name={[field.name, 'primary']} valuePropName="checked">
                        <Checkbox
                          onChange={event => setPrimaryContact(field.name, event.target.checked)}
                        >
                          Liên hệ chính
                        </Checkbox>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))}
              {!disabled && (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({ ...EMPTY_CONTACT })}
                  block
                >
                  Thêm người liên hệ
                </Button>
              )}
            </Space>
          )}
        </Form.List>
      </section>

      <Collapse
        className="provider-form__additional"
        items={[{
          key: 'additional',
          label: 'Thông tin bổ sung',
          children: (
            <Row gutter={16}>
              <Col md={8} xs={24}>
                <FormInput name="bankCode" label="Số tài khoản" placeholder="Nhập số tài khoản" />
              </Col>
              <Col md={8} xs={24}>
                <FormInput name="bankName" label="Ngân hàng" placeholder="Nhập ngân hàng" />
              </Col>
              <Col md={8} xs={24}>
                <FormInput name="bankOwner" label="Chủ tài khoản" placeholder="Nhập chủ tài khoản" />
              </Col>
              <Col span={24}>
                <div className="provider-form__subsection-title">Thông tin nhà máy sản xuất</div>
                <Form.List name="factoryInfo">
                  {(fields, { add, remove }) => (
                    <Space direction="vertical" size={12} className="provider-form__list">
                      {fields.map((field, index) => (
                        <div key={field.key} className="provider-form__list-item">
                          <Row gutter={12} align="middle">
                            <Col md={10} xs={24}>
                              <FormInput
                                name={[field.name, 'name']}
                                label={`Tên nhà máy ${index + 1}`}
                                placeholder="Nhập tên nhà máy"
                              />
                            </Col>
                            <Col md={disabled ? 14 : 12} xs={24}>
                              <FormInput
                                name={[field.name, 'address']}
                                label="Địa chỉ"
                                placeholder="Nhập địa chỉ nhà máy"
                              />
                            </Col>
                            {!disabled && (
                              <Col md={2} xs={24}>
                                <Tooltip title="Xóa nhà máy">
                                  <Button
                                    danger
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    aria-label={`Xóa nhà máy ${index + 1}`}
                                    onClick={() => remove(field.name)}
                                  />
                                </Tooltip>
                              </Col>
                            )}
                          </Row>
                        </div>
                      ))}
                      {!disabled && (
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => add({ ...EMPTY_FACTORY })}
                          block
                        >
                          Thêm nhà máy
                        </Button>
                      )}
                    </Space>
                  )}
                </Form.List>
              </Col>
              <Col md={12} xs={24}>
                <FormTextArea
                  name="paymentTerms"
                  label="Điều khoản thanh toán"
                  placeholder="Nhập điều khoản thanh toán"
                  rows={3}
                />
              </Col>
              <Col md={12} xs={24}>
                <FormTextArea
                  name="strengths"
                  label="Thế mạnh"
                  placeholder="Nhập thế mạnh"
                  rows={3}
                />
              </Col>
              <Col md={12} xs={24}>
                <FormTextArea
                  name="note"
                  label="Ghi chú"
                  placeholder="Nhập ghi chú"
                  rows={3}
                />
              </Col>
            </Row>
          ),
        }]}
      />

      {!disabled && (
        <div className="provider-form__footer">
          <Space>
            <Button onClick={onCancel}>Huỷ</Button>
            <CustomButton htmlType="submit" title="Lưu" color="primary" variant="solid" />
          </Space>
        </div>
      )}
    </Form>
  );
};

const ProviderPage = () => {
  const { hasPermission } = useGetMe();
  const canCreate = hasPermission('supplier.create');
  const canViewDetail = hasPermission('supplier.detail.view');
  const canUpdate = hasPermission('supplier.update');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [editingRecord, setEditingRecord] = useState({});
  const title = 'Nhà cung cấp';

  const openForm = (record = {}) => {
    setEditingRecord(record);
    setDrawerMode(record?.id ? 'edit' : 'create');
    setDrawerOpen(true);
  };

  const openDetail = (record) => {
    setEditingRecord(record);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const closeForm = () => {
    setDrawerOpen(false);
    setDrawerMode('create');
    setEditingRecord({});
  };

  const {
    closeAfterSubmit,
    markDirty,
    requestClose,
  } = useDrawerLeaveGuard({
    open: drawerOpen,
    onClose: closeForm,
    enabled: drawerMode !== 'view',
    resetKey: `${drawerMode}-${editingRecord?.id ?? 'create'}`,
  });

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 140,
      ellipsis: true,
      render: value => value ?? '-',
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
      render: value => value ?? '-',
    },
    {
      title: 'Liên hệ chính',
      width: 230,
      ellipsis: true,
      render: (_, record) => {
        const contact = getPrimaryContact(record);
        if (!contact) {
          return record.phoneContact ?? '-';
        }

        return (
          <div className="provider-contact-cell">
            <strong>{contact.name ?? '-'}</strong>
            <span>{contact.phone ?? contact.email ?? '-'}</span>
          </div>
        );
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      width: 200,
      ellipsis: true,
      render: value => value ?? '-',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      width: 260,
      ellipsis: true,
      render: value => value ?? '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      render: status => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? 'Kích hoạt' : 'Ngưng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      fixed: 'right',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          {canViewDetail ? <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              aria-label="Xem chi tiết"
              onClick={() => openDetail(record)}
            />
          </Tooltip> : null}
          {canUpdate ? <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              aria-label="Chỉnh sửa"
              onClick={() => openForm(record)}
            />
          </Tooltip> : null}
        </Space>
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
        hasCreate={canCreate}
        customClickCreate={() => openForm({})}
        apiPath="provider/fetch"
        columns={columns}
      />

      <DrawerCustom
        width={900}
        open={drawerOpen}
        onClose={requestClose}
        title={drawerMode === 'view'
          ? `Chi tiết nhà cung cấp${editingRecord?.code ? ` - ${editingRecord.code}` : ''}`
          : editingRecord?.id
            ? `Cập nhật nhà cung cấp #${editingRecord.id}`
            : 'Tạo mới nhà cung cấp'}
      >
        <ProviderForm
          key={`${drawerMode}-${editingRecord?.id || 'create'}`}
          record={editingRecord}
          disabled={drawerMode === 'view'}
          onCancel={requestClose}
          onValuesChange={markDirty}
          onSaved={() => {
            closeAfterSubmit();
            f5List('provider/fetch');
          }}
        />
      </DrawerCustom>
    </div>
  );
};

export default ProviderPage;
