import {
  COMPONENT_TYPES,
  DEFAULT_NODE_LAYOUT,
  DEFAULT_STYLE,
  DOCUMENT_SCHEMA_VERSION,
} from './constants'

export const createNodeId = () => `document-node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createDefaultColumns = (schema = []) => {
  const firstCollection = schema.find(field => field.scope)?.scope
  const itemFields = schema.filter(field => field.scope === firstCollection).slice(0, 4)
  return itemFields.map(field => ({
    id: createNodeId(),
    title: field.label,
    binding: field.relativePath ?? String(field.path || '').replace(`${firstCollection}.`, ''),
    format: field.dataType === 'number' ? 'number' : 'text',
    align: field.dataType === 'number' ? 'right' : 'left',
  }))
}

export const createDocumentNode = (type, dataSchema = []) => {
  const firstField = dataSchema.find(field => !field.scope)
  const firstCollection = dataSchema.find(field => field.scope)?.scope ?? ''
  const common = {
    id: createNodeId(),
    type,
    visible: true,
    layout: { ...DEFAULT_NODE_LAYOUT },
    style: { ...DEFAULT_STYLE },
  }

  switch (type) {
    case COMPONENT_TYPES.TEXT:
      return { ...common, content: 'Nhập nội dung văn bản', style: { ...common.style, fontSize: 16 } }
    case COMPONENT_TYPES.DATA_FIELD:
      return {
        ...common,
        label: firstField?.label ?? 'Trường dữ liệu',
        binding: firstField?.path ?? '',
        format: 'text',
        mockValue: '',
        fallback: '-',
      }
    case COMPONENT_TYPES.MANUAL_FIELD:
      return { ...common, label: 'Trường nhập tay', placeholder: 'Nhập nội dung', required: false }
    case COMPONENT_TYPES.TABLE:
      return {
        ...common,
        source: firstCollection,
        columns: createDefaultColumns(dataSchema),
        repeatHeader: true,
        style: { ...common.style, padding: 0 },
      }
    case COMPONENT_TYPES.IMAGE:
      return { ...common, src: '', alt: 'Hình ảnh', height: 120 }
    case COMPONENT_TYPES.LOGO:
      return { ...common, src: '', alt: 'Logo', height: 72, style: { ...common.style, textAlign: 'center' } }
    case COMPONENT_TYPES.QR_CODE:
      return { ...common, label: 'QR Code', binding: firstField?.path ?? '', size: 96 }
    case COMPONENT_TYPES.BARCODE:
      return { ...common, label: 'Barcode', binding: firstField?.path ?? '', height: 64 }
    case COMPONENT_TYPES.DATE:
      return {
        ...common,
        label: dataSchema.find(field => !field.scope && field.dataType === 'date')?.label ?? firstField?.label ?? 'Ngày lập',
        binding: dataSchema.find(field => !field.scope && field.dataType === 'date')?.path ?? firstField?.path ?? '',
        format: 'date',
        fallback: '-',
      }
    case COMPONENT_TYPES.RECTANGLE:
      return { ...common, height: 80, style: { ...common.style, borderWidth: 1 } }
    case COMPONENT_TYPES.LINE:
    case COMPONENT_TYPES.DIVIDER:
      return { ...common, style: { ...common.style, padding: 0, borderWidth: 0, marginBottom: 12 } }
    case COMPONENT_TYPES.SIGNATURE:
      return { ...common, title: 'Người ký', subtitle: '(Ký và ghi rõ họ tên)', height: 120, style: { ...common.style, textAlign: 'center' } }
    default:
      return common
  }
}

export const createEmptyTemplate = ({ name = 'Mẫu chứng từ', documentType = 'invoice' } = {}) => ({
  schemaVersion: DOCUMENT_SCHEMA_VERSION,
  name,
  documentType,
  page: {
    size: 'A4',
    orientation: 'portrait',
    margin: { top: 24, right: 24, bottom: 24, left: 24 },
  },
  layout: {
    columns: 12,
    columnGap: 12,
    rowGap: 8,
  },
  nodes: [],
})

export const getValueByPath = (source, path, fallback = '') => {
  if (!path) return fallback
  const value = String(path).split('.').reduce((current, key) => current?.[key], source)
  return value === undefined || value === null || value === '' ? fallback : value
}

export const formatBindingValue = (value, format = 'text') => {
  if (value === undefined || value === null || value === '') return ''
  if (format === 'number') {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue.toLocaleString('vi-VN') : value
  }
  if (format === 'currency') {
    const numericValue = Number(value)
    return Number.isFinite(numericValue)
      ? numericValue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
      : value
  }
  if (format === 'date') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN')
  }
  return String(value)
}

export const resolveNodeValue = (node, data) => formatBindingValue(
  getValueByPath(
    data,
    node?.binding,
    node?.mockValue !== undefined && node?.mockValue !== '' ? node.mockValue : (node?.fallback ?? ''),
  ),
  node?.format,
)

export const serializeTemplate = (template) => ({
  ...template,
  schemaVersion: DOCUMENT_SCHEMA_VERSION,
  updatedAt: new Date().toISOString(),
})
