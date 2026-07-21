import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, Modal, Popconfirm, Select, Space, Table, Tag, Tooltip, message } from 'antd'
import { DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons'
import { Helmet } from 'react-helmet'
import { useNavigate } from 'react-router-dom'
import { BreadcrumbCustom } from '@flast-erp/core/components'
import { formatTime } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import DocumentTemplateService from '@/services/DocumentTemplateService'

const STATUS_META = {
  DRAFT: { color: 'gold', label: 'Bản nháp' },
  ACTIVE: { color: 'green', label: 'Đang sử dụng' },
  INACTIVE: { color: 'default', label: 'Không sử dụng' },
}

const DocumentTemplateListPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState([])
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)

  const filteredTemplates = useMemo(() => {
    const normalizedKeyword = appliedKeyword.trim().toLowerCase()
    if (!normalizedKeyword) return templates
    return templates.filter(item => [item.code, item.name, item.version]
      .some(value => String(value ?? '').toLowerCase().includes(normalizedKeyword)))
  }, [appliedKeyword, templates])

  const tableData = useMemo(
    () => filteredTemplates.slice((page - 1) * 10, page * 10),
    [filteredTemplates, page]
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const templateResponse = await DocumentTemplateService.fetchTemplates()
      if (Number(templateResponse?.errorCode) !== SUCCESS_CODE) {
        throw new Error(templateResponse?.message || 'Không tải được danh sách chứng từ')
      }

      setTemplates(Array.isArray(templateResponse?.data) ? templateResponse.data : [])
    } catch (error) {
      message.error(error?.message || 'Không tải được dữ liệu chứng từ')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const columns = [
    { title: 'Tên chứng từ', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: 'Phiên bản', dataIndex: 'version', key: 'version', width: 110, render: value => value || '-' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: value => {
        const meta = value === 1
          ? { color: 'green', label: 'Đang sử dụng' }
          : value === 0
            ? { color: 'default', label: 'Không sử dụng' }
            : STATUS_META[value] || { color: 'default', label: value || '-' }
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    { title: 'Cập nhật', dataIndex: 'updatedDate', key: 'updatedDate', width: 150, render: value => formatTime(value) },
    {
      title: 'Thao tác',
      key: 'action',
      width: 90,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Chỉnh sửa chứng từ">
            <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/system/document-templates/${record.templateId}/edit`)} />
          </Tooltip>
          <Popconfirm
            title="Xóa template"
            description={`Bạn có chắc muốn xóa “${record.name || 'template này'}”?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteTemplate(record)}
          >
            <Tooltip title="Xóa template">
              <Button danger type="text" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const createDocument = () => {
    if (!selectedTemplateId) {
      message.warning('Vui lòng chọn hạng mục chứng từ')
      return
    }
    setCreateOpen(false)
    navigate(`/system/document-templates/create?sourceTemplateId=${encodeURIComponent(selectedTemplateId)}`)
  }

  const deleteTemplate = async (record) => {
    try {
      const response = await DocumentTemplateService.deleteTemplate(record.templateId)
      if (Number(response?.errorCode) !== SUCCESS_CODE) {
        throw new Error(response?.message || 'Xóa template thất bại')
      }
      message.success(response?.message || 'Đã xóa template')
      if (tableData.length === 1 && page > 1) {
        setPage(currentPage => currentPage - 1)
      }
      loadData()
    } catch (error) {
      message.error(error?.message || 'Xóa template thất bại')
    }
  }

  return (
    <div>
      <Helmet><title>Tạo chứng từ</title></Helmet>
      <BreadcrumbCustom data={[{ title: 'Trang chủ', path: '/' }, { title: 'Tạo chứng từ' }]} />

      <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space.Compact>
          <Input
            allowClear
            value={keyword}
            placeholder="Tìm theo tên chứng từ"
            onChange={event => setKeyword(event.target.value)}
            onPressEnter={() => { setPage(1); setAppliedKeyword(keyword.trim()) }}
            style={{ width: 280 }}
          />
          <Button onClick={() => { setPage(1); setAppliedKeyword(keyword.trim()) }}>Tìm kiếm</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setAppliedKeyword(''); setPage(1) }} />
        </Space.Compact>
      </Space>

      <Table
        rowKey="templateId"
        loading={loading}
        columns={columns}
        dataSource={tableData}
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize: 10,
          total: filteredTemplates.length,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />

      <Modal
        open={createOpen}
        title="Chọn hạng mục chứng từ"
        okText="Mở trình thiết kế"
        cancelText="Hủy"
        onOk={createDocument}
        onCancel={() => setCreateOpen(false)}
      >
        <Select
          showSearch
          optionFilterProp="label"
          value={selectedTemplateId}
          placeholder="Chọn hạng mục"
          options={templates.map(template => ({
            value: template.templateId,
            label: `${template.code ? `${template.code} - ` : ''}${template.name}${template.version ? ` (${template.version})` : ''}`,
          }))}
          onChange={setSelectedTemplateId}
          style={{ width: '100%' }}
        />
      </Modal>
    </div>
  )
}

export default DocumentTemplateListPage
