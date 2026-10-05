import { getTableErpFields } from './dynamicTableErp'

// Layout blocks expose child controls. Form.List blocks hold one array value.
export const collectWorkflowValueFields = (fields = []) => (
  (Array.isArray(fields) ? fields : []).flatMap((field) => {
    if (!field || typeof field !== 'object') return []
    if (field.config?.widget === 'dynamic_table' || field.inputType === 'dynamic_table') {
      return [field, ...getTableErpFields(field)]
    }
    const type = String(field.inputType ?? field.input_type ?? field.type ?? '').toLowerCase()
    const children = collectWorkflowValueFields(field.children)
    const structuredBlock = field.config?.valueType === 'array'
      || (type === 'block' && Array.isArray(field.children) && field.children.length === 0)
    // Older parsed Form.List schemas have empty children and no valueType marker.
    return type === 'block' && !structuredBlock ? children : [field, ...children]
  })
)
