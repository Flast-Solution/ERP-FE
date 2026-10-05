export const getTableErpFieldKey = (tableKey, columnKey) => `${tableKey}__${columnKey}`

export const getTableErpFields = field => {
  if (field?.config?.widget !== 'dynamic_table' && field?.inputType !== 'dynamic_table') return []
  return (field.config?.columns ?? []).filter(column => column.erpExport === true).map(column => ({
    fieldKey: getTableErpFieldKey(field.fieldKey, column.key),
    label: `${field.label || field.fieldKey} → ${column.label || column.key}`,
    inputType: column.type === 'boolean' ? 'checkbox' : column.type,
    tableFieldKey: field.fieldKey,
    columnKey: column.key,
  }))
}

// Materialize selected-row values as normal, flat fields for existing ERP actions.
export const projectTableErpValues = (values, fields = []) => {
  const result = { ...values }
  const visit = items => items.forEach(field => {
    const exports = getTableErpFields(field)
    if (exports.length) {
      const table = values?.[field.fieldKey]
      const index = table?.selectedRowIndex
      const selected = Number.isInteger(index) && index >= 0 ? table?.rows?.[index] : null
      exports.forEach(item => { result[item.fieldKey] = selected?.[item.columnKey] ?? null })
    }
    if (Array.isArray(field.children)) visit(field.children)
  })
  visit(fields)
  return result
}
