import { formatBindingValue, getValueByPath, resolveBindingValue } from '../utils'
import { sanitizeTemplateHtml, sanitizeTemplateCss } from './sanitize'
import get from 'lodash/get'

export const HTML_MODES = [
  { value: 'manual', label: 'Nhập tay' }, { value: 'binding', label: 'Dữ liệu đơn hàng' },
  { value: 'sku', label: 'Thuộc tính SKU' }, { value: 'static', label: 'Nội dung cố định' },
  { value: 'sum', label: 'Tổng một trường số' },
]
const MANUAL_FORMAT_HINTS = {
  date: 'DD/MM/YYYY',
  number: 'chỉ nhập số',
  number_en: 'ví dụ 4,867',
  decimal_en: 'ví dụ 8,906.61',
  currency: 'nhập số tiền',
}

export const getHtmlManualPlaceholder = field => {
  const configured = String(field?.placeholder || '').trim()
  if (configured) return configured
  const label = String(field?.label || 'nội dung').trim()
  const hint = MANUAL_FORMAT_HINTS[field?.format]
  return `Nhập ${label}${hint ? ` (${hint})` : ''}`
}
const SAFE_ID = /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/
const safeId = id => SAFE_ID.test(id) && !['constructor', 'prototype', '__proto__'].includes(id)
export const isSafeBindingPath = path => typeof path === 'string' && /^[a-zA-Z_][\w-]*(?:\.(?:[a-zA-Z_][\w-]*|\d+))*$/.test(path)
  && !path.split('.').some(key => ['__proto__', 'prototype', 'constructor'].includes(key))
const object = value => value && typeof value === 'object' && !Array.isArray(value)
const validatePath = path => { if (path && !isSafeBindingPath(path)) throw new Error(`Đường dẫn dữ liệu không hợp lệ: ${path}`) }
const toEntityPath = path => String(path || '').replace(/^customerOrder\./, '')

export const getHtmlRepeatRows = (data, source) => {
  const runtimeRows = getValueByPath(data, source, null)
  if (Array.isArray(runtimeRows)) return runtimeRows
  const entityRows = getValueByPath(data, toEntityPath(source), [])
  return Array.isArray(entityRows) ? entityRows : []
}

export const normalizeHtmlDefinition = (definition, assets = {}) => {
  if (!object(definition) || typeof definition.html !== 'string' || !object(definition.fields)) throw new Error('Thiếu HTML hoặc cấu hình fields')
  const clean = sanitizeTemplateHtml(definition.html, assets)
  const css = [clean.css, sanitizeTemplateCss(definition.css || '', assets)].filter(Boolean).join('\n')
  const doc = new DOMParser().parseFromString(clean.html, 'text/html')
  const repeats = definition.repeats || {}
  const sheetTables = definition.sheetTables || {}
  if (!object(repeats)) throw new Error('repeats phải là object')
  if (!object(sheetTables)) throw new Error('sheetTables phải là object')
  const repeatElements = Array.from(doc.querySelectorAll('[data-repeat]'))
  const repeatIds = new Set()
  repeatElements.forEach(element => {
    const id = element.dataset.repeat
    if (!safeId(id) || repeatIds.has(id) || !object(repeats[id])) throw new Error(`Vùng lặp không hợp lệ hoặc thiếu cấu hình: ${id}`)
    if (element.parentElement.closest('[data-repeat]')) throw new Error('Chưa hỗ trợ vùng lặp lồng nhau')
    if (!isSafeBindingPath(repeats[id].source)) throw new Error(`Thiếu source hợp lệ cho vùng lặp ${id}`)
    repeatIds.add(id)
  })
  if (Object.keys(repeats).some(id => !repeatIds.has(id))) throw new Error('Cấu hình vùng lặp không có trong HTML')
  const sheetTableIds = new Set()
  Array.from(doc.querySelectorAll('[data-sheet-table]')).forEach(element => {
    const id = element.dataset.sheetTable
    if (element.tagName !== 'TABLE' || !safeId(id) || sheetTableIds.has(id) || !object(sheetTables[id])) {
      throw new Error(`Bảng Excel không hợp lệ hoặc thiếu cấu hình: ${id}`)
    }
    sheetTableIds.add(id)
  })
  if (Object.keys(sheetTables).some(id => !sheetTableIds.has(id))) throw new Error('Cấu hình bảng Excel không có trong HTML')
  const fields = {}
  const elements = Array.from(doc.querySelectorAll('[data-field]'))
  if (!elements.length || elements.length > 300) throw new Error('Mẫu cần có từ 1 đến 300 trường data-field')
  elements.forEach(element => {
    const id = element.dataset.field
    const field = definition.fields[id]
    if (!safeId(id) || Object.prototype.hasOwnProperty.call(fields, id) || !object(field)) throw new Error(`Trường trùng mã hoặc thiếu cấu hình: ${id}`)
    if (element.querySelector('[data-field], [data-repeat]') || element.hasAttribute('data-repeat')) throw new Error(`Trường ${id} không được chứa trường hoặc vùng lặp khác`)
    const mode = field.mode || 'binding'
    const allowedModes = field.allowedModes || HTML_MODES.map(item => item.value)
    if (!Array.isArray(allowedModes) || !allowedModes.includes(mode) || allowedModes.some(value => !HTML_MODES.some(item => item.value === value))) throw new Error(`Chế độ trường không hợp lệ: ${id}`)
    const repeatId = element.closest('[data-repeat]')?.dataset.repeat || null
    const repeatSource = repeatId ? repeats[repeatId]?.source : ''
    const entityRepeatSource = toEntityPath(repeatSource)
    const rawPath = field.path || ''
    // Older templates stored paths inside a repeat relatively (for example
    // `total`). Normalize them to the complete entity path displayed by the
    // editor while resolveHtmlField still reads against the current row.
    const repeatRelativePath = repeatSource && rawPath.startsWith(`${repeatSource}.`)
      ? rawPath.slice(repeatSource.length + 1)
      : rawPath.startsWith(`${entityRepeatSource}.`)
        ? rawPath.slice(entityRepeatSource.length + 1)
        : rawPath
    const path = mode === 'binding' && entityRepeatSource && repeatRelativePath
      ? `${entityRepeatSource}.${repeatRelativePath}`
      : toEntityPath(rawPath)
    validatePath(path)
    validatePath(field.source)
    const rowIndex = Number(field.rowIndex ?? 0)
    if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex > 10000) throw new Error(`Dòng SKU không hợp lệ: ${id}`)
    fields[id] = {
      label: String(field.label || id), mode, allowedModes, path,
      source: field.source || 'customerOrder.details', attribute: String(field.attribute || ''), rowIndex,
      value: field.value ?? '', placeholder: String(field.placeholder || ''), format: field.format || 'text', repeatId,
    }
  })
  if (Object.keys(definition.fields).some(id => !Object.prototype.hasOwnProperty.call(fields, id))) throw new Error('Có cấu hình field không tồn tại trong HTML')
  return { version: 1, html: clean.html, css, fields, repeats, sheetTables, sampleData: object(definition.sampleData) ? definition.sampleData : {} }
}

export const createHtmlDocumentTemplate = (html, manifest, assets = {}, sampleData = {}) => {
  if (!object(manifest) || manifest.version !== 1) throw new Error('fields.json cần version: 1')
  const type = String(manifest.documentType || 'quotation').toLowerCase()
  if (!['quotation', 'invoice', 'goods_issue'].includes(type)) throw new Error('documentType không hợp lệ')
  return {
    schemaVersion: 3, name: String(manifest.name || 'Mẫu HTML'), documentType: type,
    page: { size: 'A4', orientation: manifest.orientation === 'landscape' ? 'landscape' : 'portrait', margin: { top: 0, right: 0, bottom: 0, left: 0 } },
    layout: { mode: 'html' }, nodes: [],
    htmlTemplate: normalizeHtmlDefinition({ html, fields: manifest.fields, repeats: manifest.repeats || {}, sheetTables: manifest.sheetTables || {}, sampleData }, assets),
  }
}

export const getHtmlManualPath = (id, field, definition, rowIndex) => {
  const source = field.repeatId && definition.repeats?.[field.repeatId]?.source
  return source === 'customerOrder.details' && rowIndex != null
    ? `${source}.${rowIndex}.htmlFields.${id}`
    : `customerOrder.htmlFields.${id}${source && rowIndex != null ? `.${rowIndex}` : ''}`
}
export const getHtmlManualDefaults = (template, data) => {
  if (template?.layout?.mode !== 'html') return {}
  const definition = template.htmlTemplate
  return Object.fromEntries(Object.entries(definition?.fields || {}).flatMap(([id, field]) => {
    if (!safeId(id) || field.mode !== 'manual') return []
    const source = field.repeatId && definition.repeats?.[field.repeatId]?.source
    const rows = source ? getHtmlRepeatRows(data, source) : null
    const paths = source ? (Array.isArray(rows) ? rows.map((_, index) => getHtmlManualPath(id, field, definition, index)) : []) : [getHtmlManualPath(id, field, definition)]
    return paths.filter(isSafeBindingPath).map(path => [path, field.value ?? ''])
  }))
}
export const getHtmlManualPaths = (template, data) => Object.keys(getHtmlManualDefaults(template, data))
export const hasHtmlManualFields = template => template?.layout?.mode === 'html'
  && Object.values(template.htmlTemplate?.fields || {}).some(field => field.mode === 'manual')

export const resolveHtmlField = (id, field, definition, data, row, rowIndex) => {
  let value = ''
  const context = field.repeatId ? row : data
  if (field.mode === 'manual') value = get(data, getHtmlManualPath(id, field, definition, rowIndex), field.value)
  if (field.mode === 'static') value = field.value
  if (field.mode === 'binding') {
    const repeatSource = field.repeatId ? definition.repeats?.[field.repeatId]?.source : ''
    const entityRepeatSource = toEntityPath(repeatSource)
    // The editor stores the path returned by all-entities (for example
    // details.total). Runtime data wraps order fields in customerOrder.
    const bindingPath = repeatSource && field.path.startsWith(`${repeatSource}.`)
      ? field.path.slice(repeatSource.length + 1)
      : entityRepeatSource && field.path.startsWith(`${entityRepeatSource}.`)
        ? field.path.slice(entityRepeatSource.length + 1)
        : field.path
    const missingValue = {}
    const directValue = getValueByPath(context, bindingPath, missingValue)
    value = directValue === missingValue && !field.repeatId
      ? getValueByPath(context, `customerOrder.${bindingPath}`, '')
      : directValue === missingValue ? '' : directValue
  }
  if (field.mode === 'sku') {
    const owner = field.repeatId ? row : getValueByPath(data, `${field.source}.${field.rowIndex}`,
      getValueByPath(data, `${toEntityPath(field.source)}.${field.rowIndex}`, {}))
    value = field.attribute.trim() ? resolveBindingValue(owner, 'skuDetails.values.text', field.attribute, '') : ''
  }
  if (field.mode === 'sum') {
    const rows = getValueByPath(data, field.source, [])
    value = (Array.isArray(rows) ? rows : []).reduce((sum, item) => sum + (Number(getValueByPath(item, field.path, 0)) || 0), 0)
  }
  return formatBindingValue(value, field.format)
}
