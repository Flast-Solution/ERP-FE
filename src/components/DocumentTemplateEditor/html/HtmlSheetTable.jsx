import React from 'react'
import { formatBindingValue, getValueByPath } from '../utils'

const displayValue = (value, type) => formatBindingValue(value, type === 'number'
  ? 'number_en'
  : type === 'decimal'
    ? 'decimal_en'
    : type === 'date' ? 'date' : 'text')

const getColumnWidths = (columns, rows) => {
  const weights = columns.map(column => Math.min(28, Math.max(6,
    String(column.label || column.key).length,
    ...rows.slice(0, 100).map(row => String(row[column.key] ?? '').length))))
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1
  return weights.map(weight => `${(weight * 100 / total).toFixed(2)}%`)
}

const HtmlSheetTable = ({ id, data, tableProps }) => {
  const table = getValueByPath(data, `sheetTables.${id}`,
    getValueByPath(data, `customerOrder.quoteConfig.sheetTables.${id}`, {}))
  const columns = Array.isArray(table?.columns) ? table.columns : []
  const rows = Array.isArray(table?.rows) ? table.rows : []
  if (!columns.length) {
    return <table {...tableProps}><tbody><tr><td className="sheet-table-empty">Import Excel để hiển thị bảng dữ liệu</td></tr></tbody></table>
  }
  const firstAggregateIndex = columns.findIndex(column => column.aggregate === 'sum')
  const widths = getColumnWidths(columns, rows)
  return (
    <table {...tableProps}>
      <colgroup>{columns.map((column, index) => <col key={column.key} style={{ width: widths[index] }} />)}</colgroup>
      <thead><tr>{columns.map(column => <th key={column.key}>{column.label}</th>)}</tr></thead>
      <tbody>{rows.map((row, rowIndex) => (
        <tr key={`${rowIndex}-${columns.map(column => row[column.key]).join('-')}`} data-pdf-avoid-break="true">
          {columns.map(column => <td key={column.key}>{displayValue(row[column.key], column.type)}</td>)}
        </tr>
      ))}</tbody>
      {firstAggregateIndex >= 0 ? (
        <tfoot><tr className="sheet-table-total">{columns.map((column, columnIndex) => (
          <td key={column.key}>{column.aggregate === 'sum'
            ? displayValue(table.totals?.[column.key], column.type)
            : columnIndex === 0 ? 'TOTAL' : ''}</td>
        ))}</tr></tfoot>
      ) : null}
    </table>
  )
}

export default HtmlSheetTable
