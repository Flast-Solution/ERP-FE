import { hasHtmlManualFields, isSafeBindingPath } from '../DocumentTemplateEditor/html/model'

export const hasManualDocumentFields = (nodes = [], template) => (
  nodes.some(node => (
    (node?.type === 'dynamicTable' && node.columns?.some(column => column.inputMode === 'manual'))
    || (node?.type === 'richText' && /{{\s*input(?:-list)?:[^{}]+?\s*}}/.test(node.content || ''))
    || hasManualDocumentFields(node?.children ?? [])
  )) || hasHtmlManualFields(template)
)

export const setDocumentValueByPath = (source, path, value) => {
  if (!isSafeBindingPath(path)) return source
  const keys = String(path || '').split('.').filter(Boolean)
  if (!keys.length) return source

  const root = Array.isArray(source) ? [...source] : { ...(source ?? {}) }
  let cursor = root
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value
      return
    }
    const currentValue = cursor[key]
    cursor[key] = Array.isArray(currentValue) ? [...currentValue] : { ...(currentValue ?? {}) }
    cursor = cursor[key]
  })
  return root
}
