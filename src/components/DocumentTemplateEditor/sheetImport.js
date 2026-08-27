import * as XLSX from 'xlsx'

const MARKER = /^@column:([a-zA-Z][a-zA-Z0-9_-]*)(?:\|([^|]+))?(?:\|([^|]+))?$/i
const END_MARKER = '@end'
const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const isBlank = value => value === undefined || value === null || String(value).trim() === ''

export const parseColumnMarker = value => {
  const match = String(value ?? '').trim().match(MARKER)
  if (!match || BLOCKED_KEYS.has(match[1])) return null
  const type = String(match[2] || 'text').trim().toLowerCase()
  const aggregate = String(match[3] || '').trim().toLowerCase()
  if (!['text', 'number', 'decimal', 'date'].includes(type)) throw new Error(`Kiểu cột không hỗ trợ: ${type}`)
  if (aggregate && aggregate !== 'sum') throw new Error(`Phép tổng hợp không hỗ trợ: ${aggregate}`)
  return { key: match[1], type, aggregate: aggregate || null }
}

const normalizeCell = (value, type) => {
  if (isBlank(value)) return null
  if (type === 'number' || type === 'decimal') {
    const number = typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim())
    return Number.isFinite(number) ? number : value
  }
  if (type === 'date' && value instanceof Date) return value.toISOString().slice(0, 10)
  return value
}

export const parseMarkedSheetRows = (matrix, sheetName = 'Sheet1') => {
  if (!Array.isArray(matrix)) throw new Error('Dữ liệu sheet không hợp lệ')
  let markerRowIndex = -1
  let columns = []
  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    const found = (matrix[rowIndex] || []).map((cell, columnIndex) => {
      const marker = parseColumnMarker(cell)
      return marker ? { ...marker, columnIndex } : null
    }).filter(Boolean)
    if (found.length) {
      markerRowIndex = rowIndex
      const labelRow = matrix[rowIndex - 1] || []
      columns = found.map(column => ({
        ...column,
        label: isBlank(labelRow[column.columnIndex]) ? column.key : String(labelRow[column.columnIndex]).trim(),
      }))
      break
    }
  }
  if (markerRowIndex < 0) throw new Error(`Sheet ${sheetName} không có marker @column:*`)
  if (new Set(columns.map(column => column.key)).size !== columns.length) throw new Error(`Sheet ${sheetName} có key cột bị trùng`)

  const rows = []
  let consecutiveBlankRows = 0
  for (let rowIndex = markerRowIndex + 1; rowIndex < matrix.length; rowIndex += 1) {
    const sourceRow = matrix[rowIndex] || []
    if (sourceRow.some(cell => String(cell ?? '').trim().toLowerCase() === END_MARKER)) break
    const row = Object.fromEntries(columns.map(column => [column.key, normalizeCell(sourceRow[column.columnIndex], column.type)]))
    const blank = Object.values(row).every(isBlank)
    if (blank) {
      consecutiveBlankRows += 1
      if (consecutiveBlankRows >= 2) break
      continue
    }
    consecutiveBlankRows = 0
    rows.push(row)
  }
  if (!rows.length) throw new Error(`Sheet ${sheetName} chưa có dòng dữ liệu dưới marker`)

  const totals = Object.fromEntries(columns.filter(column => column.aggregate === 'sum').map(column => [
    column.key,
    Number(rows.reduce((total, row) => total + (Number(row[column.key]) || 0), 0).toFixed(12)),
  ]))
  return {
    sheetName,
    columns: columns.map(({ columnIndex, ...column }) => column),
    rows,
    totals,
  }
}

export const parseMarkedWorkbook = workbook => {
  const errors = []
  for (const sheetName of workbook?.SheetNames || []) {
    try {
      const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: true, defval: null })
      return parseMarkedSheetRows(matrix, sheetName)
    } catch (error) {
      errors.push(error.message)
    }
  }
  throw new Error(errors.join('. ') || 'Workbook không có sheet chứa marker @column:*')
}

export const importMarkedSpreadsheet = async file => {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
  return { ...parseMarkedWorkbook(workbook), fileName: file.name }
}

export const getSheetTableIds = template => Object.keys(template?.htmlTemplate?.sheetTables || {})

export const setSheetTableData = (data, tableId, table) => ({
  ...data,
  sheetTables: { ...(data?.sheetTables || {}), [tableId]: table },
})
