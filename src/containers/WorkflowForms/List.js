import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Row,
  Select,
  Tag,
  Table,
  Col,
} from 'antd'
import {
  EditOutlined,
  FormOutlined,
  MoreOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { FormSelectAPI, RestList } from '@flast-erp/core/components'
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import { getBusinessIdLocal } from '@/utils/dataUtils'
import { parseJsxToSchema } from '@/containers/PreviewModal/parseJSXSchema'
import useGetMe from '@/hooks/useGetMe'
import dayjs from 'dayjs'
import Filter from './Filter'
import '@/pages/form-list/style.css'

const REST_LIST_API_PATH = 'workflow/forms/template/filter'
const REQUEST_API_PATH = '/workflow/forms/template/filter'
const DATA_SAVE_API = '/workflow/forms/storage/submit'
const DATA_FILTER_API = '/workflow/forms/storage/template/filter-data'
const DATA_LIST_RELOAD_DELAY_MS = 1500

const formatDate = value => {
  if (!value) return ''
  const parsed = dayjs(value, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm', dayjs.ISO_8601], true)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : String(value)
}

const resolveStatus = (item = {}) => {
  if (item.status != null && item.status !== '') {
    if (Number(item.status) === 0) {
      return { label: 'Chưa gắn bước', kind: 'unassigned' }
    }
    if (Number(item.status) === 1) {
      return { label: 'Đã gắn bước', kind: 'published' }
    }
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

  const displayName = (item.name ?? '').trim() || item.description || ''
  const formTitle = (item.description ?? '').trim()
  const formKey = item.name ?? ''
  const domain = (item.domain ?? '').trim()
  const { label: statusLabel, kind: statusKind } = resolveStatus(item)

  return {
    id: item.id,
    name: displayName,
    title: formTitle,
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
  const offset = Number.isFinite(page) && Number.isFinite(limit)
    ? (page - 1) * limit
    : Number(queryParams.offset ?? 0)
  const rest = { ...queryParams }
  delete rest.limit
  delete rest.offset
  delete rest.page

  return {
    limit: String(limit),
    offset: String(Math.max(offset, 0)),
    page: String(page),
    ...rest,
  }
}

const useWorkflowFormsListQuery = ({ queryParams, onData }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({ embedded: [], page: {} })
  const queryParamsKey = JSON.stringify(queryParams ?? {})
  const nextQueryParams = useMemo(() => withOffset(JSON.parse(queryParamsKey)), [queryParamsKey])

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

const getValueByDataExpression = (item, expression = '') => {
  const path = String(expression)
    .trim()
    .replace(/^data\??\.?/, '')
    .split(/\??\./)
    .map(part => part.trim())
    .filter(Boolean)

  if (path.length === 0) return undefined

  return path.reduce((value, key) => value?.[key], item)
}

const createSelectApiOnData = (dataLabel, dataValue) => {
  if (!dataLabel || !dataValue) return undefined

  return (response) => (Array.isArray(response) ? response : (response?.data ?? [])).map(data => ({
    label: getValueByDataExpression(data, dataLabel),
    value: getValueByDataExpression(data, dataValue),
  }))
}

const renderSelectApiMenuOnly = (menu) => menu

const getTemplateCode = (template = {}) => (
  template.jsx_code
  ?? template.jsxCode
  ?? template.code
  ?? template.sourceComponent?.jsx_code
  ?? template.sourceComponent?.jsxCode
  ?? template.sourceComponent?.code
  ?? ''
)

const collectOptionsByFieldKey = (fields = [], map = new Map()) => {
  fields.forEach(field => {
    if (field?.fieldKey && Array.isArray(field?.config?.options) && field.config.options.length > 0) {
      map.set(field.fieldKey, field.config.options)
    }
    if (Array.isArray(field?.children)) {
      collectOptionsByFieldKey(field.children, map)
    }
  })
  return map
}

const mergeMissingOptions = (fields = [], optionsByKey = new Map()) => fields.map(field => {
  const children = Array.isArray(field.children)
    ? mergeMissingOptions(field.children, optionsByKey)
    : field.children
  const currentOptions = field?.config?.options
  const parsedOptions = field?.fieldKey ? optionsByKey.get(field.fieldKey) : null

  if (!parsedOptions?.length || currentOptions?.length) {
    return { ...field, children }
  }

  return {
    ...field,
    children,
    config: {
      ...(field.config ?? {}),
      options: parsedOptions,
    },
  }
})

const enrichTemplateOptionsFromCode = (template = {}) => {
  const fields = Array.isArray(template.fields) ? template.fields : []
  const code = getTemplateCode(template)
  if (!code) {
    return template
  }

  try {
    const parsed = parseJsxToSchema(code, { name: template.name ?? '' })
    const optionsByKey = collectOptionsByFieldKey(parsed.fields ?? [])
    return {
      ...template,
      fields: mergeMissingOptions(fields, optionsByKey),
    }
  } catch (_) {
    return template
  }
}

const collectFieldTypeByKey = (fields = [], map = new Map()) => {
  fields.forEach(field => {
    if (field?.fieldKey) {
      map.set(field.fieldKey, field.inputType)
    }
    if (Array.isArray(field?.children)) {
      collectFieldTypeByKey(field.children, map)
    }
  })
  return map
}

const normalizeSubmissionValue = (value, inputType) => {
  if (dayjs.isDayjs(value)) {
    if (inputType === 'datetime') {
      return value.format('YYYY-MM-DD HH:mm:ss')
    }
    return value.format('YYYY-MM-DD')
  }
  if (Array.isArray(value)) {
    return value.map(item => normalizeSubmissionValue(item, inputType))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeSubmissionValue(item)]),
    )
  }
  return value
}

const normalizeSubmissionValues = (values = {}, fields = []) => {
  const fieldTypeByKey = collectFieldTypeByKey(fields)
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      normalizeSubmissionValue(value, fieldTypeByKey.get(key)),
    ]),
  )
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
      return (
        <FormSelectAPI
          name={field.fieldKey}
          label={field.label}
          required={field.isRequired}
          placeholder={placeholder || 'Chọn dữ liệu từ API'}
          apiPath={config.api ?? undefined}
          entity={config.entity ?? ''}
          valueProp={config.dataLabel && config.dataValue ? 'value' : (config.valueProp ?? 'id')}
          titleProp={config.dataLabel && config.dataValue ? 'label' : (config.titleProp ?? config.labelField ?? 'name')}
          searchKey={config.labelField ?? config.titleProp ?? 'name'}
          onData={createSelectApiOnData(config.dataLabel, config.dataValue)}
          dropdownRender={renderSelectApiMenuOnly}
        />
      )
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
          {field.inputType === 'select_api' ? (
            renderInputField(field)
          ) : (
            <Form.Item
              name={field.fieldKey}
              label={field.label}
              rules={[
                { required: field.isRequired, message: `${field.label || field.fieldKey} là bắt buộc.` },
              ]}
            >
              {renderInputField(field)}
            </Form.Item>
          )}
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
        values: normalizeSubmissionValues(values, fields),
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

const getStorageValues = (item = {}) => {
  const rawValues = item.valuesJson ?? item.values ?? item.value ?? item.data ?? item.formData ?? {}
  if (typeof rawValues === 'string') {
    try {
      return JSON.parse(rawValues)
    } catch (_) {
      return { value: rawValues }
    }
  }
  return rawValues && typeof rawValues === 'object' ? rawValues : {}
}

const formatEntryValue = (value, field) => {
  if (value == null || value === '') {
    return '—'
  }

  const options = normalizeFieldOptions(field?.config?.options ?? [])
  if (options.length > 0) {
    if (Array.isArray(value)) {
      return value.map(item => formatEntryValue(item, field)).join(', ')
    }
    const matchedOption = options.find(option => String(option.value) === String(value))
    if (matchedOption) {
      return matchedOption.label
    }
  }

  if (dayjs.isDayjs(value) || field?.inputType === 'date' || field?.inputType === 'datetime') {
    const parsed = dayjs.isDayjs(value) ? value : dayjs(value)
    if (parsed.isValid()) {
      return parsed.format(field?.inputType === 'date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm')
    }
  }

  if (Array.isArray(value)) {
    return value.map(item => formatEntryValue(item, field)).join(', ')
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

const normalizeStorageListResponse = (res = {}) => {
  const payload = Array.isArray(res?.embedded)
    ? res
    : Array.isArray(res?.data?.embedded)
      ? res.data
      : Array.isArray(res?.data)
        ? { embedded: res.data, totalElements: res.data.length }
        : Array.isArray(res)
          ? { embedded: res, totalElements: res.length }
          : null

  const ok = res?.success === true || Number(res?.errorCode) === SUCCESS_CODE || res?.errorCode == null
  const embedded = payload?.embedded ?? []
  const total = payload?.totalElements
    ?? payload?.page?.totalElements
    ?? res?.data?.totalElements
    ?? embedded.length

  return {
    ok,
    embedded,
    total,
    message: res?.message,
  }
}

const buildFilterConditions = (filters = {}, fieldByKey = new Map()) => (
  Object.fromEntries(
    Object.entries(filters)
      .map(([key, value]) => {
        const nextValue = Array.isArray(value)
          ? value.filter(item => String(item ?? '').trim())
          : String(value ?? '').trim()
        return [key, nextValue]
      })
      .filter(([, value]) => Array.isArray(value) ? value.length > 0 : value)
      .map(([key, value]) => {
        const inputType = fieldByKey.get(key)?.inputType
        if (['select', 'multi_select', 'radio', 'checkbox'].includes(inputType)) {
          return [key, value]
        }
        return [key, { $contains: value }]
      }),
  )
)

const FormDataListModal = ({ template, open, reloadKey, bizId, onCancel, onAddData }) => {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [draftFilters, setDraftFilters] = useState({})
  const [columnFilters, setColumnFilters] = useState({})
  const fields = useMemo(
    () => Array.isArray(template?.fields) ? template.fields.filter(field => field.inputType !== 'block') : [],
    [template?.fields],
  )
  const fieldByKey = useMemo(
    () => new Map(fields.map(field => [field.fieldKey, field])),
    [fields],
  )
  const title = (template?.description ?? '').trim() || template?.name || 'Form'

  const fetchData = useCallback(async () => {
    if (!open || !template?.id) {
      return
    }

    setLoading(true)
    try {
      const conditions = buildFilterConditions(columnFilters, fieldByKey)
      const response = await RequestUtils.Post(DATA_FILTER_API, {
        ...(bizId ? { bizId } : {}),
        templateId: Number(template.id),
        ...(Object.keys(conditions).length ? { conditions } : {}),
        limit,
        offset: (page - 1) * limit,
      })
      const result = normalizeStorageListResponse(response)
      if (!result.ok) {
        message.error(result.message || 'Không tải được danh sách dữ liệu form.')
        setRows([])
        setTotal(0)
        return
      }
      setRows(result.embedded)
      setTotal(result.total)
    } catch (error) {
      message.error(error?.message || 'Không tải được danh sách dữ liệu form.')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [bizId, columnFilters, fieldByKey, limit, open, page, template?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData, reloadKey])

  useEffect(() => {
    if (open) {
      setPage(1)
      setDraftFilters({})
      setColumnFilters({})
    }
  }, [open, template?.id])

  const fieldLabelByKey = useMemo(
    () => new Map(fields.map(field => [field.fieldKey, field.label || field.fieldKey])),
    [fields],
  )

  const valueKeys = useMemo(() => [
    ...new Set(rows.flatMap(row => Object.keys(getStorageValues(row)))),
  ], [rows])

  const displayKeys = useMemo(() => (
    valueKeys.length > 0
      ? valueKeys
      : fields.map(field => field.fieldKey).filter(Boolean)
  ), [fields, valueKeys])

  const columns = useMemo(() => {
    return [
      {
        title: '#',
        key: 'index',
        width: 64,
        render: (_, __, index) => ((page - 1) * limit) + index + 1,
      },
      ...displayKeys.map(key => ({
        title: fieldLabelByKey.get(key) ?? key,
        key,
        dataIndex: ['valuesJson', key],
        ellipsis: true,
        render: (_, record) => formatEntryValue(getStorageValues(record)[key], fieldByKey.get(key)),
      })),
    ]
  }, [displayKeys, fieldByKey, fieldLabelByKey, limit, page])

  const applyFilter = useCallback(() => {
    setPage(1)
    setColumnFilters(draftFilters)
  }, [draftFilters])

  const clearFilter = useCallback(() => {
    setPage(1)
    setDraftFilters({})
    setColumnFilters({})
  }, [])

  return (
    <Modal
      open={open}
      title={`Dữ liệu · ${title}`}
      width={1280}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>Đóng</Button>,
        <Button key="add" type="primary" icon={<PlusOutlined />} onClick={onAddData}>
          Thêm dữ liệu
        </Button>,
      ]}
      destroyOnHidden
    >
      <div className="form-data-filter">
        <Row gutter={[12, 12]} align="middle">
          {displayKeys.map(key => (
            <Col key={key} xs={24} md={12} xl={8}>
              {['select', 'multi_select', 'radio', 'checkbox'].includes(fieldByKey.get(key)?.inputType) ? (
                <Select
                  allowClear
                  className="form-data-filter-input"
                  mode={['multi_select', 'checkbox'].includes(fieldByKey.get(key)?.inputType) ? 'multiple' : undefined}
                  placeholder={fieldLabelByKey.get(key) ?? key}
                  options={normalizeFieldOptions(fieldByKey.get(key)?.config?.options ?? [])}
                  value={draftFilters[key] || undefined}
                  onChange={value => {
                    setDraftFilters(current => ({
                      ...current,
                      [key]: value,
                    }))
                  }}
                />
              ) : (
                <Input
                  allowClear
                  className="form-data-filter-input"
                  placeholder={fieldLabelByKey.get(key) ?? key}
                  value={draftFilters[key] ?? ''}
                  onChange={event => {
                    const value = event.target.value
                    setDraftFilters(current => ({
                      ...current,
                      [key]: value,
                    }))
                  }}
                  onPressEnter={applyFilter}
                />
              )}
            </Col>
          ))}
          <Col xs={24} md={12} xl={4}>
            <Button type="primary" className="form-data-filter-button" block onClick={applyFilter}>
              Lọc
            </Button>
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Button className="form-data-filter-clear" block onClick={clearFilter}>
              Xóa lọc
            </Button>
          </Col>
        </Row>
      </div>
      <Table
        rowKey={record => record.id ?? record.storageId ?? record.createdAt ?? JSON.stringify(record)}
        size="small"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
          onChange: (nextPage, nextLimit) => {
            setPage(nextLimit !== limit ? 1 : nextPage)
            setLimit(nextLimit)
          },
        }}
      />
    </Modal>
  )
}

const WorkflowFormsList = ({ onCreate }) => {
  const { user: profile } = useGetMe()
  const bizId = useMemo(() => resolveBizId(profile), [profile])
  const reloadDataTimerRef = useRef(null)
  const [dataListTemplate, setDataListTemplate] = useState(null)
  const [dataListReloadKey, setDataListReloadKey] = useState(0)
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
        return enrichTemplateOptionsFromCode(record.source)
      }
      throw new Error(apiMessage || 'Không tải được dữ liệu form.')
    }

    return enrichTemplateOptionsFromCode(template)
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
      setDataListTemplate(template)
    } catch (error) {
      message.error(error?.message || 'Không tải được cấu hình form để xem dữ liệu.')
      console.error('[WorkflowFormsList] handleAddData', error)
    } finally {
      setEntryLoadingId(null)
    }
  }, [fetchTemplateDetail])

  const columns = useMemo(() => [
    {
      title: 'Tên form',
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      width: 240,
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
    // {
    //   title: 'Tiêu chuẩn',
    //   dataIndex: 'standard',
    //   width: 220,
    //   ellipsis: true,
    // },
    // {
    //   title: 'Đang gắn vào bước',
    //   dataIndex: 'step',
    //   width: 180,
    //   render: value => value ? <Tag className="form-list-code">{value}</Tag> : null,
    // },
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
    const nextValues = Object.fromEntries(
      Object.entries(values)
        .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
        .filter(([, value]) => value !== undefined && value !== null && value !== ''),
    )

    delete nextValues.isFull
    if (nextValues.status === 'all') {
      delete nextValues.status
    }
    if (nextValues.page && nextValues.limit) {
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

  useEffect(() => () => {
    if (reloadDataTimerRef.current) {
      clearTimeout(reloadDataTimerRef.current)
    }
  }, [])

  const closeEntryModalAndReloadData = useCallback(() => {
    setEntryTemplate(null)
    if (reloadDataTimerRef.current) {
      clearTimeout(reloadDataTimerRef.current)
    }
    reloadDataTimerRef.current = setTimeout(() => {
      setDataListReloadKey(key => key + 1)
      reloadDataTimerRef.current = null
    }, DATA_LIST_RELOAD_DELAY_MS)
  }, [])

  return (
    <>
      <RestList
        key={reloadKey}
        rowKey="id"
        bordered
        xScroll={1060}
        initialFilter={{ limit: 10, offset: '0', page: 1 }}
        filter={<Filter />}
        customClickCreate={() => onCreate()}
        beforeSubmitFilter={beforeSubmitFilter}
        onData={onData}
        useGetAllQuery={useWorkflowFormsListQuery}
        apiPath={REST_LIST_API_PATH}
        columns={columns}
      />

      <FormDataListModal
        open={Boolean(dataListTemplate)}
        template={dataListTemplate}
        reloadKey={dataListReloadKey}
        bizId={bizId}
        onCancel={() => setDataListTemplate(null)}
        onAddData={() => setEntryTemplate(dataListTemplate)}
      />

      <FormEntryModal
        open={Boolean(entryTemplate)}
        template={entryTemplate}
        bizId={bizId}
        onCancel={closeEntryModalAndReloadData}
        onSaved={() => {
          closeEntryModalAndReloadData()
          setReloadKey(key => key + 1)
        }}
      />
    </>
  )
}

export default WorkflowFormsList
