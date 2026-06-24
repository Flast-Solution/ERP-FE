import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AutoComplete,
  Button,
  Checkbox,
  DatePicker,
  Dropdown,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Tag,
} from 'antd'
import {
  EditOutlined,
  FormOutlined,
  MoreOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { RestList } from '@flast-erp/core/components'
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import { getBusinessIdLocal } from '@/utils/dataUtils'
import useGetMe from '@/hooks/useGetMe'
import dayjs from 'dayjs'
import Filter from './Filter'
import '@/pages/form-list/style.css'

const REST_LIST_API_PATH = 'workflow/forms/template/filter'
const REQUEST_API_PATH = '/workflow/forms/template/filter'
const DATA_SAVE_API = '/workflow/forms/storage/submit'

const formatDate = value => {
  if (!value) return ''
  const parsed = dayjs(value, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm', dayjs.ISO_8601], true)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : String(value)
}

const resolveStatus = (item = {}) => {
  if (item.status != null && item.status !== '') {
    return { label: String(item.status), kind: 'published' }
  }
  if (item.enabled === false) {
    return { label: 'Nháp', kind: 'draft' }
  }
  if (item.stepId == null || item.stepId === '') {
    return { label: 'Chưa gắn bước', kind: 'unassigned' }
  }
  return { label: 'Đã xuất bản', kind: 'published' }
}

const mapTemplateRow = (item = {}) => {
  const fields = Array.isArray(item.fields) ? item.fields : []
  const updatedAt = item.sourceComponent?.updatedDate
    ?? item.sourceComponent?.createdDate
    ?? item.updatedAt
    ?? item.createdAt

  const displayName = (item.description ?? '').trim() || item.name || ''
  const formKey = item.name ?? ''
  const domain = (item.domain ?? '').trim()
  const { label: statusLabel, kind: statusKind } = resolveStatus(item)

  return {
    id: item.id,
    name: displayName,
    formKey,
    fieldCount: fields.length,
    standard: domain || '—',
    step: item.stepId != null && item.stepId !== '' ? String(item.stepId) : '',
    status: statusLabel,
    statusKind,
    updatedAt: formatDate(updatedAt),
    source: item,
  }
}

const normalizeTemplateListResponse = (res = {}) => {
  const payload = Array.isArray(res?.embedded)
    ? res
    : Array.isArray(res?.data?.embedded)
      ? res.data
      : Array.isArray(res)
        ? { embedded: res, totalElements: res.length }
        : null

  if (!payload) {
    return {
      ok: res?.errorCode === SUCCESS_CODE,
      embedded: [],
      total: 0,
      message: res?.message,
    }
  }

  const embedded = payload.embedded ?? []
  const total = payload.totalElements
    ?? payload.page?.totalElements
    ?? embedded.length

  const ok = payload != null
    && (res?.errorCode == null || Number(res?.errorCode) === SUCCESS_CODE)

  return { ok, embedded, total, message: res?.message }
}

const replaceResponseItems = (response, embedded) => {
  if (Array.isArray(response?.embedded)) {
    return { ...response, embedded }
  }
  if (Array.isArray(response?.data?.embedded)) {
    return {
      ...response,
      data: {
        ...response.data,
        embedded,
      },
    }
  }
  return {
    embedded,
    page: response?.page ?? response?.data?.page,
  }
}

const withOffset = (queryParams = {}) => {
  const page = Number(queryParams.page ?? 1)
  const limit = Number(queryParams.limit ?? 10)
  const offset = queryParams.offset ?? ((page - 1) * limit)
  const rest = { ...queryParams }
  delete rest.limit
  delete rest.offset
  delete rest.page

  return {
    limit: String(limit),
    offset: String(offset),
    page: String(page),
    ...rest,
  }
}

const useWorkflowFormsListQuery = ({ queryParams, onData }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({ embedded: [], page: {} })
  const nextQueryParams = useMemo(() => withOffset(queryParams), [queryParams])

  useEffect(() => {
    let mounted = true
    const { apiPath, ...params } = nextQueryParams

    if (!apiPath) {
      return undefined
    }

    setLoading(true)
    RequestUtils.Get(`/${apiPath}`, params)
      .then(async (response) => {
        const ok = response?.success || response?.errorCode === SUCCESS_CODE || response?.errorCode == null
        if (!ok) {
          message.error(response?.message || 'Không tải được danh sách form.')
          return
        }
        const nextData = await onData(response?.data ?? response)
        if (mounted) {
          setData(nextData)
        }
      })
      .catch((error) => {
        if (mounted) {
          message.error(error?.message || 'Không tải được danh sách form.')
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [nextQueryParams, onData])

  return { data, loading }
}

const isSameId = (left, right) => String(left ?? '') === String(right ?? '')

const resolveTemplateDetail = (res = {}, targetId) => {
  const listResult = normalizeTemplateListResponse(res)
  if (listResult.embedded.length > 0) {
    const matchedTemplate = listResult.embedded.find(item => isSameId(item?.id, targetId))
    return {
      ok: listResult.ok,
      template: matchedTemplate ?? null,
      message: listResult.message,
    }
  }

  const template = res?.data?.id != null
    ? res.data
    : res?.id != null
      ? res
      : null

  return {
    ok: Boolean(template)
      && isSameId(template.id, targetId)
      && (res?.errorCode == null || Number(res.errorCode) === SUCCESS_CODE),
    template,
    message: res?.message,
  }
}

const normalizeFieldOptions = (options = []) => options.map(option => ({
  value: option.value ?? option.id,
  label: option.label ?? option.name ?? option.value ?? option.id,
}))

const normalizeSubmissionValue = (value) => {
  if (dayjs.isDayjs(value)) {
    return value.toISOString()
  }
  if (Array.isArray(value)) {
    return value.map(normalizeSubmissionValue)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeSubmissionValue(item)]),
    )
  }
  return value
}

const resolveBizId = (profile) => {
  const value = profile?.bizId
    ?? profile?.businessId
    ?? profile?.biz?.id
    ?? profile?.business?.id
    ?? getBusinessIdLocal()

  const bizId = value ? Number(value) : null
  return bizId && !Number.isNaN(bizId) ? bizId : null
}

const renderInputField = (field = {}) => {
  const config = field.config ?? {}
  const placeholder = config.placeholder || field.label
  const options = normalizeFieldOptions(config.options ?? [])

  switch (field.inputType) {
    case 'textarea':
      return <Input.TextArea rows={config.rows ?? 3} placeholder={placeholder} />
    case 'number':
      return <InputNumber min={config.min ?? undefined} max={config.max ?? undefined} precision={0} placeholder={placeholder} style={{ width: '100%' }} />
    case 'decimal':
      return <InputNumber min={config.min ?? undefined} max={config.max ?? undefined} precision={2} placeholder={placeholder} style={{ width: '100%' }} />
    case 'date':
      return <DatePicker format={config.format ?? 'DD/MM/YYYY'} placeholder={placeholder} style={{ width: '100%' }} />
    case 'datetime':
      return <DatePicker showTime format={config.format ?? 'DD/MM/YYYY HH:mm'} placeholder={placeholder} style={{ width: '100%' }} />
    case 'select':
      return <Select options={options} placeholder={placeholder || 'Chọn...'} />
    case 'multi_select':
      return <Select mode="multiple" options={options} placeholder={placeholder || 'Chọn nhiều...'} />
    case 'radio':
      return <Radio.Group options={options} />
    case 'checkbox':
      return <Checkbox.Group options={options} />
    case 'file':
    case 'image':
      return <Input placeholder={placeholder || `Nhập ${field.inputType === 'image' ? 'URL ảnh' : 'URL file'}`} />
    case 'lookup':
      return <Input placeholder={placeholder || 'Nhập hoặc tìm kiếm dữ liệu liên kết'} />
    case 'select_api':
      return <Select showSearch placeholder={placeholder || 'Chọn dữ liệu từ API'} options={[]} />
    case 'autocomplete':
      return <AutoComplete options={options} placeholder={placeholder || 'Nhập để tìm...'} />
    default:
      return <Input placeholder={placeholder} />
  }
}

const FormEntryFields = ({ fields = [] }) => (
  <div className="form-entry-grid">
    {fields.map(field => {
      if (field.inputType === 'block') {
        return (
          <div
            key={field.id ?? field.fieldKey}
            className="form-entry-block"
            style={{ gridColumn: `span ${field.colSpan ?? 24}` }}
          >
            <div className="form-entry-block-title">{field.label || 'Block'}</div>
            <FormEntryFields fields={field.children ?? []} />
          </div>
        )
      }

      return (
        <div
          key={field.id ?? field.fieldKey}
          className="form-entry-field"
          style={{ gridColumn: `span ${field.colSpan ?? 24}` }}
        >
          <Form.Item
            name={field.fieldKey}
            label={field.label}
            rules={[
              { required: field.isRequired, message: `${field.label || field.fieldKey} là bắt buộc.` },
            ]}
          >
            {renderInputField(field)}
          </Form.Item>
        </div>
      )
    })}
  </div>
)

const FormEntryModal = ({ template, open, bizId, onCancel, onSaved }) => {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const fields = Array.isArray(template?.fields) ? template.fields : []
  const title = (template?.description ?? '').trim() || template?.name || 'Form'

  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      if (!bizId) {
        message.error('Không tìm thấy bizId của tài khoản đăng nhập.')
        return
      }

      const templateId = template?.id != null ? Number(template.id) : null
      if (!templateId || Number.isNaN(templateId)) {
        message.error('Không tìm thấy templateId của form.')
        return
      }

      const payload = {
        bizId,
        templateId,
        values: normalizeSubmissionValue(values),
      }

      setSaving(true)
      const res = await RequestUtils.Post(DATA_SAVE_API, payload)
      const ok = res?.success || res?.errorCode === SUCCESS_CODE
      if (!ok) {
        message.error(res?.message || 'Không lưu được dữ liệu form.')
        return
      }

      message.success(res?.message || 'Đã lưu dữ liệu form.')
      onSaved?.()
    } catch (error) {
      if (!error?.errorFields) {
        message.error('Không lưu được dữ liệu form.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={`Thêm dữ liệu · ${title}`}
      width={820}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Hủy</Button>,
        <Button key="save" type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          Lưu
        </Button>,
      ]}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        {fields.length === 0 ? (
          <div className="form-entry-empty">Form chưa có field để nhập dữ liệu.</div>
        ) : (
          <FormEntryFields fields={fields} />
        )}
      </Form>
    </Modal>
  )
}

const WorkflowFormsList = ({ onCreate }) => {
  const { user: profile } = useGetMe()
  const bizId = useMemo(() => resolveBizId(profile), [profile])
  const [entryTemplate, setEntryTemplate] = useState(null)
  const [entryLoadingId, setEntryLoadingId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const fetchTemplateDetail = useCallback(async (record) => {
    if (!record?.id) {
      throw new Error('Không tìm thấy id form.')
    }

    const query = new URLSearchParams({
      limit: '10',
      offset: '0',
      id: String(record.id),
    })

    const res = await RequestUtils.Get(`${REQUEST_API_PATH}?${query.toString()}`, {})
    const { ok, template, message: apiMessage } = resolveTemplateDetail(res, record.id)

    if (!ok || !template) {
      if (record.source && isSameId(record.source.id, record.id)) {
        return record.source
      }
      throw new Error(apiMessage || 'Không tải được dữ liệu form.')
    }

    return template
  }, [])

  const handleEditForm = useCallback(async (record) => {
    if (!record?.id) {
      message.error('Không tìm thấy id form.')
      return
    }

    onCreate({ id: record.id })
  }, [onCreate])

  const handleAddData = useCallback(async (record) => {
    setEntryLoadingId(record?.id)
    try {
      const template = await fetchTemplateDetail(record)
      setEntryTemplate(template)
    } catch (error) {
      message.error(error?.message || 'Không tải được cấu hình form để nhập dữ liệu.')
      console.error('[WorkflowFormsList] handleAddData', error)
    } finally {
      setEntryLoadingId(null)
    }
  }, [fetchTemplateDetail])

  const columns = useMemo(() => [
    {
      title: 'Tên form',
      dataIndex: 'name',
      width: 220,
      ellipsis: true,
    },
    {
      title: 'Form key',
      dataIndex: 'formKey',
      width: 180,
      ellipsis: true,
      render: value => value ? <Tag className="form-list-code">{value}</Tag> : null,
    },
    {
      title: 'Field',
      dataIndex: 'fieldCount',
      width: 80,
      align: 'center',
    },
    {
      title: 'Tiêu chuẩn',
      dataIndex: 'standard',
      width: 220,
      ellipsis: true,
    },
    {
      title: 'Đang gắn vào bước',
      dataIndex: 'step',
      width: 180,
      render: value => value ? <Tag className="form-list-code">{value}</Tag> : null,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 150,
      render: (value, record) => value ? (
        <Tag className={`form-list-status form-list-status--${record.statusKind ?? 'published'}`}>
          <span className="form-list-status-dot" />
          {value}
        </Tag>
      ) : null,
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 170,
      ellipsis: true,
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 70,
      align: 'center',
      render: (_, record) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Chỉnh sửa form',
              },
              {
                key: 'add-data',
                icon: <FormOutlined />,
                label: 'Thêm dữ liệu',
              },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent?.stopPropagation()
              if (key === 'edit') {
                handleEditForm(record)
                return
              }
              if (key === 'add-data') {
                handleAddData(record)
              }
            },
          }}
        >
          <Button
            type="text"
            size="small"
            loading={entryLoadingId === record.id}
            icon={<MoreOutlined />}
            onClick={(event) => event.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ], [entryLoadingId, handleAddData, handleEditForm])

  const beforeSubmitFilter = useCallback((values = {}) => {
    const nextValues = {
      ...values,
      isFull: true,
    }
    if (nextValues.status === 'all') {
      delete nextValues.status
    }
    if (nextValues.page && nextValues.limit && nextValues.offset == null) {
      nextValues.offset = String((Number(nextValues.page) - 1) * Number(nextValues.limit))
    } else if (nextValues.offset != null) {
      nextValues.offset = String(nextValues.offset)
    }
    return nextValues
  }, [])

  const onData = useCallback(async (response) => {
    const { ok, embedded, message: apiMessage } = normalizeTemplateListResponse(response)
    if (!ok) {
      message.error(apiMessage || 'Không tải được danh sách form.')
      return replaceResponseItems(response, [])
    }
    return replaceResponseItems(response, embedded.map(mapTemplateRow))
  }, [])

  return (
    <>
      <RestList
        key={reloadKey}
        rowKey="id"
        bordered
        xScroll={1060}
        initialFilter={{ limit: 10, offset: '0', page: 1, isFull: true }}
        filter={<Filter />}
        customClickCreate={() => onCreate()}
        beforeSubmitFilter={beforeSubmitFilter}
        onData={onData}
        useGetAllQuery={useWorkflowFormsListQuery}
        apiPath={REST_LIST_API_PATH}
        columns={columns}
      />

      <FormEntryModal
        open={Boolean(entryTemplate)}
        template={entryTemplate}
        bizId={bizId}
        onCancel={() => setEntryTemplate(null)}
        onSaved={() => {
          setEntryTemplate(null)
          setReloadKey(key => key + 1)
        }}
      />
    </>
  )
}

export default WorkflowFormsList
