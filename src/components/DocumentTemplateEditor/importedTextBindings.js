import { COMPONENT_TYPES } from './constants'

export const getImportedTextMode = node => node.pdfContentMode
  || (node.type === COMPONENT_TYPES.DATA_FIELD
    ? String(node.binding || '').includes('skuDetails.') ? 'sku' : 'binding'
    : 'static')

export const getImportedManualPath = node => node.pdfManualPath ?? `customerOrder.quoteFields.${node.id}`

export const getImportedSkuSettings = node => {
  const match = String(node.binding || '').match(/^(.*)\.(\d+)\.skuDetails\./)
  return {
    source: node.pdfSkuSource || match?.[1] || 'customerOrder.details',
    rowIndex: node.pdfSkuRowIndex ?? (match ? Number(match[2]) : 0),
  }
}

export const createImportedManualContent = path => path.trim() ? `{{ input:${path.trim()} }}` : ''

export const getImportedSkuContent = node => node.pdfSkuContent
  ?? (getImportedTextMode(node) === 'sku' && node.type === COMPONENT_TYPES.RICH_TEXT
    ? node.content
    : undefined)
  ?? '{{ skuDetails.values.text }}'

// Change only content configuration. PDF coordinates, page, font and node ID
// remain intact; switching back to static restores the imported text/HTML.
export const configureImportedText = (node, mode, fields = []) => {
  const originalContent = node.pdfStaticContent ?? node.content ?? ''
  const common = { ...node, pdfContentMode: mode, pdfStaticContent: originalContent }
  if (mode === 'manual') {
    const path = getImportedManualPath(node)
    return { ...common, type: COMPONENT_TYPES.RICH_TEXT, pdfManualPath: path, content: createImportedManualContent(path) }
  }
  if (mode === 'sku') {
    const { source, rowIndex } = getImportedSkuSettings(node)
    const content = getImportedSkuContent(node)
    return {
      ...common,
      type: COMPONENT_TYPES.RICH_TEXT,
      content,
      pdfSkuContent: content,
      label: '',
      fallback: '',
      format: 'text',
      mockValue: '',
      pdfSkuSource: source,
      pdfSkuRowIndex: rowIndex,
      binding: `${source}.${rowIndex}.skuDetails.values.text`,
    }
  }
  if (mode === 'binding') {
    const binding = node.pdfFieldBinding
      || (getImportedTextMode(node) === 'binding' ? node.binding : '')
      || fields.find(field => !field.scope)?.path || ''
    return { ...common, type: COMPONENT_TYPES.DATA_FIELD, label: '', fallback: '', binding, pdfFieldBinding: binding, format: node.format || 'text' }
  }
  return { ...common, type: COMPONENT_TYPES.RICH_TEXT, content: originalContent }
}
