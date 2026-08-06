import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet'
import { useNavigate } from 'react-router-dom'
import { Button, Checkbox, Drawer, Form, Input, Popconfirm, Space, Table, Tag, message } from 'antd'
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
import WebPageService from '@/services/WebPageService'
import { Header, PageName, PageShell, TableCard, Toolbar } from './List.style'

const formatDate = value => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN')
}

const slugify = value => String(value || '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const isLandingPage = item => (
  item?.contentType === WEB_CONTENT_TYPES.LANDING
  || Boolean(item?.schema)
  || (item?.configs ?? []).some(cfg => cfg.tag === 'landing-page')
)

const normalizeApiPage = item => {
  const landingConfig = (item.configs ?? []).find(cfg => cfg.tag === 'landing-page')
  const buildUrl = landingConfig?.urlBuild
    || (item.configs ?? []).find(cfg => cfg.urlBuild)?.urlBuild
    || null

  return {
    ...item,
    __source: 'api',
    contentType: WEB_CONTENT_TYPES.LANDING,
    remoteId: item.id,
    build: buildUrl ? { url: buildUrl } : undefined,
    status: buildUrl ? 'PUBLISHED' : 'DRAFT',
  }
}

const getPreviewPath = record => {
  return `/m/${record.id}`
}

const openEditor = (record, navigate) => {
  saveWebPage({
    id: record.id,
    name: record.name,
    slug: record.slug,
    remoteId: record.id,
    contentType: WEB_CONTENT_TYPES.LANDING,
    status: record.status,
    build: record.build,
    authenticationRequired: Boolean(record.authenticationRequired),
  })
  navigate(`/landing/edit?id=${encodeURIComponent(record.id)}`)
}

const LandingList = () => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [createOpen, setCreateOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [form] = Form.useForm()

  const loadPages = useCallback(async (page = 1, limit = 10) => {
    setLoading(true)
    try {
      const result = await WebPageService.fetch({ page, limit })
      const landingPages = result.items.filter(isLandingPage).map(normalizeApiPage)
      // Public runtime đọc trang theo id từ repository cục bộ. Đồng bộ metadata
      // API trước để tab demo mới có thể lấy schema cũ hoặc urlBuild fallback.
      landingPages.forEach(apiPage => saveWebPage(apiPage))
      setPages(landingPages)
      setPagination(current => ({
        ...current,
        current: page,
        pageSize: Number(result.page?.pageSize || limit),
        total: landingPages.length,
      }))
    } catch (error) {
      const localPages = listLandingPages().filter(isLandingPage)
      setPages(localPages)
      setPagination(current => ({ ...current, current: 1, total: localPages.length }))
      message.error(error?.message || 'Không tải được danh sách trang.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPages(1, 10)
  }, [loadPages])

  const dataSource = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return pages
    return pages.filter(page => (
      String(page.name ?? '').toLowerCase().includes(normalized)
      || String(page.slug ?? '').toLowerCase().includes(normalized)
    ))
  }, [keyword, pages])

  const createPage = values => {
    const temporaryPageId = createLandingPageId()
    const generatedSlug = slugify(values.name) || `page-${temporaryPageId}`
    const schema = {
      ...clonePageSchema(DEFAULT_PAGE_SCHEMA),
      name: values.name,
      seo: { meta: [] },
      breadcrumbs: [],
      dataSources: {},
      overlays: [],
      sections: [],
    }
    setCreateSubmitting(true)
    try {
      saveWebPage({
        id: temporaryPageId,
        name: values.name,
        slug: generatedSlug,
        status: 'DRAFT',
        authenticationRequired: Boolean(values.authenticationRequired),
        contentType: WEB_CONTENT_TYPES.LANDING,
        remoteId: null,
        schema,
      })
      setCreateOpen(false)
      form.resetFields()
      message.success('Đã tạo bản nháp trắng. Trang chỉ được build khi lưu hoặc xuất bản.')
      navigate(`/landing/edit?mode=create&id=${encodeURIComponent(temporaryPageId)}`)
    } catch (error) {
      message.error(error?.message || 'Không tạo được trang.')
    } finally {
      setCreateSubmitting(false)
    }
  }

  const refresh = () => loadPages(pagination.current, pagination.pageSize)

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
      title: 'Số block',
      key: 'componentCount',
      width: 110,
      align: 'center',
      render: (_, record) => record.schema?.sections?.length
        ?? (Array.isArray(record.configs) ? record.configs.length : 0),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: status => (
        status === 'PUBLISHED'
          ? <Tag color="green">Đã xuất bản</Tag>
          : status === 'DRAFT'
            ? <Tag color="gold">Bản nháp</Tag>
            : <Tag>Chưa có dữ liệu</Tag>
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
          <Button
            type="text"
            title="Xem trước"
            icon={<EyeOutlined />}
            onClick={() => window.open(getPreviewPath(record), '_blank')}
          />
          <Button
            type="text"
            title="Chỉnh sửa"
            icon={<EditOutlined />}
            onClick={() => openEditor(record, navigate)}
          />
          <Button
            type="text"
            title="Sao chép"
            icon={<CopyOutlined />}
            onClick={() => duplicatePage(record)}
          />
          <Popconfirm
            title="Xóa trang này?"
            disabled={record.__source === 'api'}
            onConfirm={() => removePage(record.id)}
          >
            <Button
              danger
              type="text"
              disabled={record.__source === 'api'}
              title={record.__source === 'api' ? 'Chưa có API xóa trang' : 'Xóa'}
              icon={<DeleteOutlined />}
            />
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
          <p>Tạo và chỉnh sửa Landing Page bằng các block nội dung.</p>
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
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: false,
            onChange: (page, pageSize) => loadPages(page, pageSize),
          }}
        />
      </TableCard>
      <Drawer
        title="Thêm Landing Page"
        width={560}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnClose
        extra={<Button type="primary" loading={createSubmitting} disabled={createSubmitting} onClick={() => form.submit()}>Tiếp tục</Button>}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ authenticationRequired: false }}
          onFinish={createPage}
        >
          <Form.Item name="name" label="Tên trang" rules={[{ required: true, message: 'Vui lòng nhập tên trang.' }]}>
            <Input placeholder="Ví dụ: Trang giới thiệu sản phẩm" />
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
