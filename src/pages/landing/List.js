import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Space, Table, Tag } from 'antd'
import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { BreadcrumbCustom } from '@flast-erp/core/components'
import {
  createLandingPageId,
  listLandingPages,
} from '@/containers/Landing/landingRepository'
import { Header, PageName, PageShell, TableCard, Toolbar } from './List.style'

const formatDate = value => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN')
}

const LandingList = () => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [pages] = useState(() => listLandingPages())

  const dataSource = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return pages
    return pages.filter(page => (
      String(page.name ?? '').toLowerCase().includes(normalized)
      || String(page.slug ?? '').toLowerCase().includes(normalized)
    ))
  }, [keyword, pages])

  const createPage = () => {
    const id = createLandingPageId()
    navigate(`/landing/edit?mode=create&id=${encodeURIComponent(id)}`)
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
      key: 'blockCount',
      width: 110,
      align: 'center',
      render: (_, record) => record.schema?.sections?.length ?? 0,
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
      width: 130,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => navigate(`/landing/edit?id=${encodeURIComponent(record.id)}`)}
        >
          Chỉnh sửa
        </Button>
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
          <p>Tạo và quản lý các landing page của doanh nghiệp.</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={createPage}>
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
    </PageShell>
  )
}

export default LandingList

