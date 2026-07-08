import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Button,
  Empty,
  Form,
  Input,
  message,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import {
  PlusOutlined,
} from '@ant-design/icons';
import { BreadcrumbCustom, DrawerCustom } from '@flast-erp/core/components';
import {
  AddRowButton,
  ConfigCard,
  FilterBar,
  ConfigDrawerBody,
  ConfigDrawerFooter,
  OptionRow,
  ListControls,
  PageShell,
} from './styles';

const DEFAULT_OPTION = { label: '', value: '' };

const GeneralConfigPage = () => {
  const [form] = Form.useForm();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [items, setItems] = useState([]);
  const [filterDraft, setFilterDraft] = useState({ code: '', name: '' });
  const [filter, setFilter] = useState({ code: '', name: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const editingItem = useMemo(
    () => items.find(item => item.id === editingId),
    [editingId, items],
  );

  const filteredItems = useMemo(() => {
    const codeKeyword = String(filter.code ?? '').trim().toLowerCase();
    const nameKeyword = String(filter.name ?? '').trim().toLowerCase();
    return items.filter((item) => {
      const matchedCode = !codeKeyword || String(item.code ?? '').toLowerCase().includes(codeKeyword);
      const matchedName = !nameKeyword || String(item.name ?? '').toLowerCase().includes(nameKeyword);
      return matchedCode && matchedName;
    });
  }, [filter, items]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const rangeStart = filteredItems.length ? ((page - 1) * pageSize) + 1 : 0;
  const rangeEnd = Math.min(page * pageSize, filteredItems.length);

  const applyFilter = () => {
    setPage(1);
    setFilter(filterDraft);
  };

  const resetFilter = () => {
    const nextFilter = { code: '', name: '' };
    setPage(1);
    setFilterDraft(nextFilter);
    setFilter(nextFilter);
  };

  const openCreateForm = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ options: [DEFAULT_OPTION] });
    setFormOpen(true);
  };

  const openEditForm = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      note: record.note,
      options: record.options?.length ? record.options : [DEFAULT_OPTION],
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const normalizedOptions = (values.options ?? [])
      .filter(item => item?.label || item?.value)
      .map(item => ({
        label: item.label ?? '',
        value: item.value ?? '',
      }));
    const payload = {
      ...(editingItem?.id ? { id: editingItem.id } : {}),
      code: values.code,
      name: values.name,
      note: values.note,
      status: editingItem?.status ?? 'ACTIVE',
      options: normalizedOptions,
    };

    console.log('[GeneralConfig] submit payload', payload);

    if (editingItem) {
      setItems(prevItems => prevItems.map(item => (
        item.id === editingItem.id
          ? { ...item, ...payload }
          : item
      )));
      message.success('Đã cập nhật danh mục.');
    } else {
      setItems(prevItems => [
        {
          id: Date.now(),
          ...payload,
        },
        ...prevItems,
      ]);
      message.success('Đã thêm danh mục.');
    }

    closeForm();
  };

  const handleDelete = (id) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    message.success('Đã xoá danh mục.');
  };

  const renderListControls = (placement = 'top') => (
    <ListControls $placement={placement}>
      <div className="pagination-group">
        <span className="range-text">{rangeStart}-{rangeEnd}/{filteredItems.length}</span>
        <Pagination
          size="small"
          current={page}
          pageSize={pageSize}
          total={filteredItems.length}
          showSizeChanger={false}
          onChange={(nextPage) => setPage(nextPage)}
        />
        <Select
          value={pageSize}
          onChange={(value) => {
            setPage(1);
            setPageSize(value);
          }}
          options={[
            { value: 10, label: '10 / page' },
            { value: 20, label: '20 / page' },
            { value: 50, label: '50 / page' },
          ]}
          style={{ width: 118 }}
        />
      </div>

      {placement === 'top' && (
        <Button
          danger
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateForm}
        >
          Tạo mới
        </Button>
      )}
    </ListControls>
  );

  const columns = [
    {
      title: 'Mã danh mục',
      dataIndex: 'code',
      width: 180,
      render: value => <Tag color="blue">{value}</Tag>,
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      render: value => <strong>{value}</strong>,
    },
    {
      title: 'Số dòng',
      dataIndex: 'options',
      width: 120,
      align: 'center',
      render: options => options?.length ?? 0,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      ellipsis: true,
      render: value => value || '-',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button
            color="danger"
            variant="dashed"
            size="small"
            onClick={() => openEditForm(record)}
          >
            Detail
          </Button>
          <Popconfirm
            title="Xoá danh mục này?"
            okText="Xoá"
            cancelText="Huỷ"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small">Xóa</Button>
          </Popconfirm>
        </Space>
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

      <FilterBar>
        <Input
          value={filterDraft.code}
          placeholder="Mã danh mục"
          onChange={(event) => setFilterDraft(values => ({
            ...values,
            code: event.target.value,
          }))}
          onPressEnter={applyFilter}
        />
        <Input
          value={filterDraft.name}
          placeholder="Tên danh mục"
          onChange={(event) => setFilterDraft(values => ({
            ...values,
            name: event.target.value,
          }))}
          onPressEnter={applyFilter}
        />
        <Button type="primary" onClick={applyFilter}>
          Lọc
        </Button>
        <Button
          className="clear-filter-button"
          onClick={resetFilter}
        >
          Xoá lọc
        </Button>
      </FilterBar>

      {renderListControls('top')}

      <ConfigCard>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={pagedItems}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có danh mục cấu hình"
              />
            ),
          }}
        />
      </ConfigCard>

      {renderListControls('bottom')}

      <DrawerCustom
        width={750}
        open={formOpen}
        onClose={closeForm}
        title={editingItem ? 'Cập nhật danh mục' : 'Thêm danh mục'}
      >
        <ConfigDrawerBody>
          <Form
            form={form}
            layout="vertical"
            initialValues={{ options: [DEFAULT_OPTION] }}
          >
            <Form.Item
              name="code"
              label="Mã danh mục"
              rules={[{ required: true, message: 'Vui lòng nhập mã danh mục' }]}
            >
              <Input placeholder="Nhập mã danh mục" />
            </Form.Item>

            <Form.Item
              name="name"
              label="Tên danh mục"
              rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
            >
              <Input placeholder="Nhập tên danh mục" />
            </Form.Item>

            <Form.Item name="note" label="Ghi chú">
              <Input.TextArea placeholder="Nhập ghi chú" rows={4} />
            </Form.Item>

            <Form.List name="options">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {fields.map((field) => {
                    return (
                      <OptionRow key={field.key}>
                        <Form.Item
                          name={[field.name, 'label']}
                          label="Tên hiển thị"
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="Nhập tên hiển thị" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'value']}
                          label="Key"
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="Nhập key" />
                        </Form.Item>
                        <Button
                          block
                          danger
                          disabled={fields.length === 1}
                          onClick={() => remove(field.name)}
                        >
                          Xoá
                        </Button>
                      </OptionRow>
                    );
                  })}
                  <AddRowButton type="button" onClick={() => add(DEFAULT_OPTION)}>
                    + Thêm dòng
                  </AddRowButton>
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
