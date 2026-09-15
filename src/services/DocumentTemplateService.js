import { RequestUtils } from '@flast-erp/core/utils'
import { normalizeHtmlDefinition } from '../components/DocumentTemplateEditor/html/model'

const TEMPLATE_PATH = '/erp/template'

const DOCUMENT_TYPES = ['quotation', 'invoice', 'goods_issue']

// Saved responses may wrap the document in a single-element array.
// Reject ambiguous arrays instead of silently opening an empty designer.
export const parseDocumentTemplateData = (value, errorMessage = 'Template không hợp lệ') => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    const template = Array.isArray(parsed) && parsed.length === 1 ? parsed[0] : parsed
    if (!template || typeof template !== 'object' || Array.isArray(template) || !Array.isArray(template.nodes)) {
      throw new Error(errorMessage)
    }
    return template.layout?.mode === 'html' ? { ...template, htmlTemplate: normalizeHtmlDefinition(template.htmlTemplate) } : template
  } catch {
    throw new Error(errorMessage)
  }
}

export const normalizeDocumentType = value => {
  const type = String(value || '').trim().toLowerCase()
  return DOCUMENT_TYPES.includes(type) ? type : 'quotation'
}

const normalizedTemplateName = value => String(value || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim().replace(/\s+/g, ' ')

// Limit legacy compatibility to the known old names/types. A normal lowercase
// invoice record is now an invoice, not a quotation.
export const resolveDocumentTemplateType = record => {
  const type = String(record?.documentType || '').trim()
  const name = normalizedTemplateName(record?.name)
  if (type === 'invoice' && name === 'mau bao gia') return 'quotation'
  if (type === 'QUOTATION' && name === 'mau hoa don') return 'invoice'
  return type.toLowerCase()
}

export const getActiveDocumentTemplates = (records, documentType, preferredName) => (Array.isArray(records) ? records : [])
  .filter(record => resolveDocumentTemplateType(record) === String(documentType || '').toLowerCase() && [1, '1', 'ACTIVE'].includes(record.status))
  .sort((a, b) => Number(normalizedTemplateName(b.name) === normalizedTemplateName(preferredName))
    - Number(normalizedTemplateName(a.name) === normalizedTemplateName(preferredName)))

const normalizeDataType = value => {
  const normalizedValue = String(value || '').toLowerCase()
  if (['long', 'integer', 'decimal', 'double', 'float', 'bigdecimal', 'number'].includes(normalizedValue)) {
    return 'number'
  }
  if (['date', 'datetime', 'timestamp', 'localdate', 'localdatetime'].includes(normalizedValue)) {
    return 'date'
  }
  return ['string', 'boolean'].includes(normalizedValue) ? normalizedValue : 'string'
}

export const buildDocumentSchemaFromEntityFields = (fields = [], category = {}) => {
  const scalarFieldsByPath = new Map()
  const collectionsByPath = new Map()

  fields.forEach(field => {
    const rawPath = String(field?.path || '').trim()
    if (!rawPath) return

    const path = rawPath === 'details' || rawPath.startsWith('details.')
      ? `customerOrder.${rawPath}`
      : rawPath.includes('.')
        ? rawPath
        : `customerOrder.${rawPath}`
    const detailsMarker = '.details.'
    const markerIndex = path.indexOf(detailsMarker)

    if (markerIndex < 0) {
      if (!scalarFieldsByPath.has(path)) {
        scalarFieldsByPath.set(path, { ...field, path })
      }
      return
    }

    const collectionPath = `${path.slice(0, markerIndex)}.details`
    const relativePath = path.slice(markerIndex + detailsMarker.length)
    if (!collectionsByPath.has(collectionPath)) {
      collectionsByPath.set(collectionPath, {
        path: collectionPath,
        label: field.group || collectionPath,
        fields: [],
      })
    }
    const collection = collectionsByPath.get(collectionPath)
    if (!collection.fields.some(item => item.path === relativePath)) {
      collection.fields.push({
        label: field.label,
        path: relativePath,
        dataType: field.dataType,
      })
    }
  })

  return {
    category,
    fields: Array.from(scalarFieldsByPath.values()),
    collections: Array.from(collectionsByPath.values()),
  }
}

export const normalizeDocumentSchema = (schema = {}) => {
  const scalarFields = Array.isArray(schema.fields)
    ? schema.fields.map(field => ({
      group: field.group || schema.category?.name || 'Dữ liệu',
      label: field.label,
      path: field.path,
      dataType: normalizeDataType(field.dataType),
    }))
    : []

  const collectionFields = Array.isArray(schema.collections)
    ? schema.collections.flatMap(collection => (
      Array.isArray(collection.fields) ? collection.fields.map(field => ({
        group: collection.label,
        collectionLabel: collection.label,
        label: field.label,
        path: `${collection.path}.${field.path}`,
        relativePath: field.path,
        scope: collection.path,
        dataType: normalizeDataType(field.dataType),
      })) : []
    ))
    : []

  return [...scalarFields, ...collectionFields]
}

const DocumentTemplateService = {
  fetchTemplates: params => RequestUtils.Get(`${TEMPLATE_PATH}/fetch`, params),

  fetchAllEntities: () => RequestUtils.Get(`${TEMPLATE_PATH}/all-entities`, {}),

  deleteTemplate: id => RequestUtils.Post(`${TEMPLATE_PATH}/delete`, {}, { id }),

  saveTemplate: payload => RequestUtils.Post(`${TEMPLATE_PATH}/save-data`, payload),

  fetchInvoice: (id, name) => RequestUtils.Get(`${TEMPLATE_PATH}/invoice`, {
    id,
    ...(name ? { name } : {}),
  }),

  checkInvoice: (orderId, type = 'quote') => RequestUtils.Get('/erp/order/invoice-check', { orderId, type }),
}

export default DocumentTemplateService
