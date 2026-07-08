import React, { useCallback, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Button,
  Col,
  Form,
  Input,
  message,
  Row,
  Space,
} from 'antd';
import {
  BreadcrumbCustom,
  DrawerCustom,
  FormInput,
  RestList,
} from '@flast-erp/core/components';
import { useGetList } from '@flast-erp/core/hooks';
import { RequestUtils, f5List } from '@flast-erp/core/utils';
import {
  AddRowButton,
  ConfigDrawerBody,
  ConfigDrawerFooter,
  ConfigFormItem,
  PageShell,
} from './styles';

const CONFIG_FETCH_API = 'erp/config/fetch';
const CONFIG_SAVE_API = '/erp/config/save';

const DEFAULT_CONFIG = {
  name: '',
  value: '',
  key: '',
  description: '',
};

const trimValue = (value) => (
  typeof value === 'string' ? value.trim() : value
);

const normalizeConfigItem = (item = {}) => ({
  id: item.id,
  bizId: item.bizId,
  createdDate: item.createdDate,
  createdBy: item.createdBy,
  updatedDate: item.updatedDate,
  updatedBy: item.updatedBy,
  key: trimValue(item.key),
  value: trimValue(item.value),
  name: trimValue(item.name),
  description: trimValue(item.description),
});

const buildSavePayloadItem = (item = {}) => {
  const payload = {
    key: trimValue(item.key),
    value: trimValue(item.value),
    name: trimValue(item.name),
    description: trimValue(item.description),
  };

  if (item.id !== undefined && item.id !== null) {
    payload.id = item.id;
  }
  if (item.bizId !== undefined && item.bizId !== null) {
    payload.bizId = item.bizId;
  }

  return payload;
};

const removeEmptyValue = (values = {}) => Object.fromEntries(
  Object.entries(values)
    .map(([key, value]) => [key, trimValue(value)])
    .filter(([, value]) => value !== undefined && value !== null && value !== ''),
);

const withOffset = (values = {}) => {
  const nextValues = removeEmptyValue(values);
  const page = Number(nextValues.page ?? 1);
  const limit = Number(nextValues.limit ?? 10);

  return {
    ...nextValues,
    limit: String(limit),
    offset: String(Math.max(((Number.isFinite(page) ? page : 1) - 1) * limit, 0)),
    page: String(Number.isFinite(page) ? page : 1),
  };
};

const getResponseItems = (values) => {
  if (Array.isArray(values)) return values;
  if (Array.isArray(values?.data)) return values.data;
  if (Array.isArray(values?.embedded)) return values.embedded;
  if (Array.isArray(values?.items)) return values.items;
  if (Array.isArray(values?.content)) return values.content;
  if (Array.isArray(values?.records)) return values.records;
  if (Array.isArray(values?.data?.embedded)) return values.data.embedded;
  if (Array.isArray(values?.data?.items)) return values.data.items;
  if (Array.isArray(values?.data?.content)) return values.data.content;
  if (Array.isArray(values?.data?.records)) return values.data.records;
  return [];
};

const getResponsePage = (values, total) => (
  values?.page
  ?? values?.data?.page
  ?? {
    totalElements: values?.totalElements
      ?? values?.total
      ?? values?.data?.totalElements
      ?? values?.data?.total
      ?? total,
  }
);

const GeneralConfigFilter = () => (
  <Row gutter={16}>
    <Col xl={6} lg={6} md={12} xs={24}>
      <FormInput
        name="name"
        placeholder="Tên hiển thị"
      />
    </Col>
    <Col xl={6} lg={6} md={12} xs={24}>
      <FormInput
        name="value"
        placeholder="Giá trị"
      />
    </Col>
    <Col xl={6} lg={6} md={12} xs={24}>
      <FormInput
        name="key"
        placeholder="Key"
      />
    </Col>
    <Col xl={6} lg={6} md={12} xs={24}>
      <FormInput
        name="description"
        placeholder="Ghi chú"
      />
    </Col>
  </Row>
);

const GeneralConfigPage = () => {
  const [form] = Form.useForm();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const openCreateForm = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ configs: [DEFAULT_CONFIG] });
    setFormOpen(true);
  }, [form]);

  const openEditForm = useCallback((record) => {
    const nextRecord = normalizeConfigItem(record);
    setEditingRecord(nextRecord);
    form.resetFields();
    form.setFieldsValue({ configs: [nextRecord] });
    setFormOpen(true);
  }, [form]);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingRecord(null);
    form.resetFields();
  }, [form]);

  const beforeSubmitFilter = useCallback((values = {}) => withOffset(values), []);

  const onData = useCallback((values) => {
    const items = getResponseItems(values).map(normalizeConfigItem);
    return {
      embedded: items,
      page: getResponsePage(values, items.length),
    };
  }, []);

  const handleSave = useCallback(async () => {
    const values = await form.validateFields();
    const payload = (values.configs ?? [])
      .map(normalizeConfigItem)
      .map(buildSavePayloadItem)
      .filter(item => item.key || item.value || item.name || item.description);

    console.log('[GeneralConfig] submit payload', payload);

    const response = await RequestUtils.Post(CONFIG_SAVE_API, payload);
    const isSuccess = response?.success || response?.errorCode === 200;

    if (isSuccess) {
      message.success(response?.message || 'Đã lưu cấu hình.');
      f5List(CONFIG_FETCH_API);
      closeForm();
      return;
    }

    message.error(response?.message || 'Lưu cấu hình thất bại.');
  }, [closeForm, form]);

  const columns = [
    {
      title: 'Tên hiển thị',
      dataIndex: 'name',
      width: 220,
      ellipsis: true,
      render: (value, record) => value || record.key || '-',
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      width: 180,
      ellipsis: true,
      render: value => value || '-',
    },
    {
      title: 'Key',
      dataIndex: 'key',
      width: 180,
      ellipsis: true,
      render: value => value || '-',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'description',
      ellipsis: true,
      render: value => value || '-',
    },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'updatedDate',
      width: 170,
      ellipsis: true,
      render: value => value || '-',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: record => (
        <Button
          color="primary"
          variant="dashed"
          size="small"
          onClick={() => openEditForm(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <PageShell>
      <Helmet>
        <title>Cấu hình chung</title>
      </Helmet>

      <BreadcrumbCustom
        data={[{ title: 'Trang chủ' }, { title: 'Cấu hình chung' }]}
      />

      <RestList
        rowKey={record => record.id ?? `${record.key}-${record.name}-${record.value}`}
        xScroll={980}
        initialFilter={{ limit: 10, offset: '0', page: 1 }}
        filter={<GeneralConfigFilter />}
        beforeSubmitFilter={beforeSubmitFilter}
        onData={onData}
        useGetAllQuery={useGetList}
        apiPath={CONFIG_FETCH_API}
        customClickCreate={openCreateForm}
        columns={columns}
      />

      <DrawerCustom
        width={750}
        open={formOpen}
        onClose={closeForm}
        title={editingRecord ? 'Cập nhật cấu hình' : 'Thêm cấu hình'}
      >
        <ConfigDrawerBody>
          <Form
            form={form}
            layout="vertical"
            initialValues={{ configs: [DEFAULT_CONFIG] }}
          >
            <Form.List name="configs">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  {fields.map((field, index) => (
                    <ConfigFormItem key={field.key}>
                      <div className="config-form-item__header">
                        <strong>Cấu hình {index + 1}</strong>
                        <Button
                          danger
                          size="small"
                          disabled={fields.length === 1}
                          onClick={() => remove(field.name)}
                        >
                          Xoá
                        </Button>
                      </div>

                      <Row gutter={16}>
                        <Col md={12} xs={24}>
                          <Form.Item
                            name={[field.name, 'name']}
                            label="Tên hiển thị"
                            rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị' }]}
                          >
                            <Input placeholder="Nhập tên hiển thị" />
                          </Form.Item>
                        </Col>
                        <Col md={12} xs={24}>
                          <Form.Item
                            name={[field.name, 'value']}
                            label="Giá trị"
                            rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
                          >
                            <Input placeholder="Nhập giá trị" />
                          </Form.Item>
                        </Col>
                        <Col md={24} xs={24}>
                          <Form.Item
                            name={[field.name, 'key']}
                            label="Key"
                            rules={[{ required: true, message: 'Vui lòng nhập key' }]}
                          >
                            <Input placeholder="Nhập key" />
                          </Form.Item>
                        </Col>
                        <Col md={24} xs={24}>
                          <Form.Item
                            name={[field.name, 'description']}
                            label="Ghi chú"
                          >
                            <Input.TextArea rows={3} placeholder="Nhập ghi chú" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </ConfigFormItem>
                  ))}

                  {!editingRecord && (
                    <AddRowButton type="button" onClick={() => add(DEFAULT_CONFIG)}>
                      + Thêm
                    </AddRowButton>
                  )}
                </Space>
              )}
            </Form.List>
          </Form>
        </ConfigDrawerBody>

        <ConfigDrawerFooter>
          <Button onClick={closeForm}>Huỷ</Button>
          <Button type="primary" onClick={handleSave}>Lưu</Button>
        </ConfigDrawerFooter>
      </DrawerCustom>
    </PageShell>
  );
};

export default GeneralConfigPage;
