import { RequestUtils } from '@flast-erp/core/utils'

const TEMPLATE_PATH = '/erp/template'

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

  fetchInvoice: id => RequestUtils.Get(`${TEMPLATE_PATH}/invoice`, { id }),

  checkInvoice: orderId => RequestUtils.Get('/erp/order/invoice-check', { orderId, type: 'quote' }),
}

export default DocumentTemplateService
