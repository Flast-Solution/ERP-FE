import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet'
import { useNavigate } from 'react-router-dom'
import { Button, Checkbox, Drawer, Form, Input, Popconfirm, Select, Space, Table, Tag, message } from 'antd'
import { CopyOutlined, DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { BreadcrumbCustom } from '@flast-erp/core/components'
import {
  createLandingPageId,
  deleteWebPage,
  listLandingPages,
  saveWebPage,
  WEB_CONTENT_TYPES,
} from '@/containers/Landing/landingRepository'
import { clonePageSchema, DEFAULT_PAGE_SCHEMA } from '@/containers/Landing/pageSchema'
import { Header, PageName, PageShell, TableCard, Toolbar } from './List.style'

const formatDate = value => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN')
}

const LandingList = () => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [pages, setPages] = useState(() => listLandingPages())
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm()

  const dataSource = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return pages
    return pages.filter(page => (
      String(page.name ?? '').toLowerCase().includes(normalized)
      || String(page.slug ?? '').toLowerCase().includes(normalized)
    ))
  }, [keyword, pages])

  const createPage = values => {
    const id = createLandingPageId()
    const contentType = values.contentType
    saveWebPage({
      id,
      name: values.name,
      slug: `/m/${id}`,
      status: 'DRAFT',
      authenticationRequired: values.authenticationRequired,
      contentType,
      schema: contentType === WEB_CONTENT_TYPES.LANDING
        ? { ...clonePageSchema(DEFAULT_PAGE_SCHEMA), name: values.name }
        : undefined,
      mfeConfig: contentType === WEB_CONTENT_TYPES.MICRO_FRONTEND
        ? { components: [], drawers: [] }
        : undefined,
    })
    setCreateOpen(false)
    form.resetFields()
    navigate(`/landing/edit?mode=create&id=${encodeURIComponent(id)}`)
  }

  const refresh = () => setPages(listLandingPages())

  const removePage = id => {
    deleteWebPage(id)
    refresh()
    message.success('Đã xóa trang.')
  }

  const duplicatePage = record => {
    const id = createLandingPageId()
    saveWebPage({
      ...JSON.parse(JSON.stringify(record)),
      id,
      name: `${record.name} - Bản sao`,
      slug: `/m/${id}`,
      status: 'DRAFT',
      publishedAt: null,
    })
    refresh()
    message.success('Đã sao chép trang.')
  }

  const columns = [
    {
      title: 'Tên trang',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <PageName>
          <strong>{value || 'Trang chưa đặt tên'}</strong>
          <span>ID: {record.id}</span>
        </PageName>
      ),
    },
    {
      title: 'Đường dẫn',
      dataIndex: 'slug',
      key: 'slug',
      width: 180,
      render: value => <code>{value || '/'}</code>,
    },
    {
      title: 'Loại nội dung',
      key: 'contentType',
      width: 160,
      render: (_, record) => record.contentType === WEB_CONTENT_TYPES.MICRO_FRONTEND
        ? <Tag color="blue">Micro Frontend</Tag>
        : <Tag>Landing Editor</Tag>,
    },
    {
      title: 'Thành phần',
      key: 'componentCount',
      width: 110,
      align: 'center',
      render: (_, record) => record.contentType === WEB_CONTENT_TYPES.MICRO_FRONTEND
        ? (record.mfeConfig?.components?.length ?? 0)
        : (record.schema?.sections?.length ?? 0),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: status => (
        status === 'PUBLISHED'
          ? <Tag color="green">Đã xuất bản</Tag>
          : <Tag color="gold">Bản nháp</Tag>
      ),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: formatDate,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 190,
      align: 'center',
      render: (_, record) => (
        <Space size={2}>
          <Button type="text" title="Xem trước" icon={<EyeOutlined />} onClick={() => window.open(`/m/${record.id}`, '_blank')} />
          <Button type="text" title="Chỉnh sửa" icon={<EditOutlined />} onClick={() => navigate(`/landing/edit?id=${encodeURIComponent(record.id)}`)} />
          <Button type="text" title="Sao chép" icon={<CopyOutlined />} onClick={() => duplicatePage(record)} />
          <Popconfirm title="Xóa trang này?" onConfirm={() => removePage(record.id)}>
            <Button danger type="text" title="Xóa" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <PageShell>
      <Helmet><title>Quản lý trang</title></Helmet>
      <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title: 'Quản lý trang' }]} />
      <Header>
        <div>
          <h1>Quản lý trang</h1>
          <p>Tạo Landing Page hoặc lắp ghép trang từ các Micro Frontend.</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Thêm trang mới
        </Button>
      </Header>
      <Toolbar>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo tên trang hoặc đường dẫn..."
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          style={{ width: 340 }}
        />
        <Space />
      </Toolbar>
      <TableCard>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </TableCard>
      <Drawer
        title="Thêm trang WEB"
        width={560}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnClose
        extra={<Button type="primary" onClick={() => form.submit()}>Tiếp tục</Button>}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ contentType: WEB_CONTENT_TYPES.LANDING, authenticationRequired: false }}
          onFinish={createPage}
        >
          <Form.Item name="name" label="Tên trang" rules={[{ required: true, message: 'Vui lòng nhập tên trang.' }]}>
            <Input placeholder="Ví dụ: Trang giới thiệu sản phẩm" />
          </Form.Item>
          <Form.Item name="contentType" label="Loại nội dung" rules={[{ required: true }]}>
            <Select options={[
              { value: WEB_CONTENT_TYPES.LANDING, label: 'Landing Editor — thiết kế bằng block' },
              { value: WEB_CONTENT_TYPES.MICRO_FRONTEND, label: 'Micro Frontend — lắp ghép component động' },
            ]} />
          </Form.Item>
          <Form.Item name="authenticationRequired" valuePropName="checked">
            <Checkbox>Yêu cầu người dùng đăng nhập</Checkbox>
          </Form.Item>
        </Form>
      </Drawer>
    </PageShell>
  )
}

export default LandingList
