import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { buildLandingPage } from '@/containers/Landing/landingBuildService'
import { clonePageSchema, DEFAULT_PAGE_SCHEMA } from '@/containers/Landing/pageSchema'
import useChatStore from '@/containers/AIChatbot/useChatStore'
import WebPageService, { buildWebPagePayload } from '@/services/WebPageService'
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

const inferContentType = item => {
  const configs = item?.configs ?? []
  if (configs.some(cfg => cfg.tag === 'landing-page')) {
    return WEB_CONTENT_TYPES.LANDING
  }
  if (configs.length > 0) {
    return WEB_CONTENT_TYPES.MICRO_FRONTEND
  }
  return null
}

const normalizeApiPage = item => {
  const landingConfig = (item.configs ?? []).find(cfg => cfg.tag === 'landing-page')
  const buildUrl = landingConfig?.urlBuild
    || (item.configs ?? []).find(cfg => cfg.urlBuild)?.urlBuild
    || null

  return {
    ...item,
    __source: 'api',
    contentType: inferContentType(item),
    remoteId: item.id,
    build: buildUrl ? { url: buildUrl } : undefined,
    status: buildUrl ? 'PUBLISHED' : 'DRAFT',
  }
}

const getPreviewPath = record => {
  const slug = String(record.slug ?? '').trim()
  if (slug && slug !== '/') {
    return slug.startsWith('/') ? slug : `/${slug}`
  }
  return `/m/${record.id}`
}

const openEditor = (record, navigate) => {
  saveWebPage({
    id: record.id,
    name: record.name,
    slug: record.slug,
    remoteId: record.id,
    contentType: record.contentType || inferContentType(record),
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
      setPages(result.items.map(normalizeApiPage))
      setPagination(current => ({
        ...current,
        current: page,
        pageSize: Number(result.page?.pageSize || limit),
        total: Number(result.page?.totalElements ?? result.page?.total ?? result.items.length),
      }))
    } catch (error) {
      const localPages = listLandingPages()
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

  const createPage = async values => {
    const temporaryPageId = createLandingPageId()
    const generatedSlug = slugify(values.name) || `page-${temporaryPageId}`
    const contentType = values.contentType
    const schema = contentType === WEB_CONTENT_TYPES.LANDING
      ? { ...clonePageSchema(DEFAULT_PAGE_SCHEMA), name: values.name }
      : undefined
    setCreateSubmitting(true)
    try {
      let build = null

      // Landing: giống form saveAfterBuild — build xong có url mới create
      if (contentType === WEB_CONTENT_TYPES.LANDING) {
        build = await buildLandingPage({
          pageId: temporaryPageId,
          schema,
          sessionId: useChatStore.getState().getSessionId('form_builder'),
          allowHtmlFallback: true,
        })
        if (!build?.url) {
          message.error('Build thành công nhưng server chưa trả URL micro-frontend.')
          return
        }
      }

      const createdPage = contentType === WEB_CONTENT_TYPES.LANDING
        ? await WebPageService.create(buildWebPagePayload({
          name: values.name,
          slug: generatedSlug,
          title: values.name,
          schema,
          build,
          authenticationRequired: values.authenticationRequired,
        }))
        : await WebPageService.create({
          name: values.name,
          slug: generatedSlug,
          title: values.name,
          authenticationRequired: Boolean(values.authenticationRequired),
          configs: [],
          seos: [],
          breadcrumds: [],
        })

      const id = createdPage.id
      saveWebPage({
        ...createdPage,
        id,
        name: createdPage.name || values.name,
        slug: createdPage.slug || generatedSlug,
        status: 'DRAFT',
        authenticationRequired: values.authenticationRequired,
        contentType,
        remoteId: id,
        schema: schema
          ? { ...schema, name: createdPage.name || values.name }
          : undefined,
        build,
        mfeConfig: contentType === WEB_CONTENT_TYPES.MICRO_FRONTEND
          ? { components: [], drawers: [] }
          : undefined,
      })
      setCreateOpen(false)
      form.resetFields()
      message.success('Đã tạo trang mới.')
      navigate(`/landing/edit?mode=edit&id=${encodeURIComponent(id)}`)
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
      title: 'Loại nội dung',
      key: 'contentType',
      width: 160,
      render: (_, record) => record.contentType === WEB_CONTENT_TYPES.MICRO_FRONTEND
        ? <Tag color="blue">Micro Frontend</Tag>
        : record.contentType === WEB_CONTENT_TYPES.LANDING
          ? <Tag>Landing Editor</Tag>
          : <Tag>Chưa xác định</Tag>,
    },
    {
      title: 'Thành phần',
      key: 'componentCount',
      width: 110,
      align: 'center',
      render: (_, record) => Array.isArray(record.configs)
        ? record.configs.length
        : record.contentType === WEB_CONTENT_TYPES.MICRO_FRONTEND
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
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: false,
            onChange: (page, pageSize) => loadPages(page, pageSize),
          }}
        />
      </TableCard>
      <Drawer
        title="Thêm trang WEB"
        width={560}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnClose
        extra={<Button type="primary" loading={createSubmitting} disabled={createSubmitting} onClick={() => form.submit()}>Tiếp tục</Button>}
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
