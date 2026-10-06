import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Pagination, Spin, Tabs } from 'antd'
import { buildSheetPage, PAGE_SIZE } from './spreadsheetModel'

const SpreadsheetPreview = ({ buffer }) => {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [sheetName, setSheetName] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => {
    let active = true
    setResult(null)
    setError('')
    const read = async () => {
      try {
        const XLSX = await import('xlsx')
        if (!active) return
        const workbook = XLSX.read(buffer, { type: 'array', cellStyles: true, cellNF: true })
        if (!workbook.SheetNames.length) throw new Error('Tệp không có sheet.')
        if (active) { setResult({ XLSX, workbook }); setSheetName(workbook.SheetNames[0]); setPage(1) }
      } catch {
        if (active) setError('Không đọc được nội dung Excel.')
      }
    }
    read()
    return () => { active = false }
  }, [buffer])
  const sheet = result?.workbook.Sheets[sheetName]
  const model = useMemo(() => sheet ? buildSheetPage(result.XLSX, sheet, page) : null, [sheet, result, page])
  if (error) return <Alert type="error" showIcon message={error} />
  if (!model) return <div style={{ padding: 48, textAlign: 'center' }}><Spin /></div>
  return <div>
    <Tabs activeKey={sheetName} onChange={name => { setSheetName(name); setPage(1) }}
      items={result.workbook.SheetNames.map(name => ({ key: name, label: name }))} />
    {model.truncatedColumns && <Alert type="info" message="Hiển thị 200 cột đầu tiên của sheet." />}
    <div style={{ overflow: 'auto', maxHeight: '75vh' }}>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
        <colgroup><col style={{ width: 48 }} />{model.columns.map(column => <col key={column.index} style={{ width: column.width }} />)}</colgroup>
        <thead><tr><th style={{ border: '1px solid #ddd' }} />{model.columns.map(column => (
          <th key={column.index} style={{ border: '1px solid #ddd', padding: 6, background: '#f3f4f6' }}>{column.name}</th>
        ))}</tr></thead>
        <tbody>{model.rows.map(row => <tr key={row.index} style={{ height: row.height }}>
          <th style={{ border: '1px solid #ddd', padding: 6, background: '#f3f4f6' }}>{row.index + 1}</th>
          {row.cells.map(cell => <td key={cell.column} rowSpan={cell.rowSpan} colSpan={cell.colSpan}
            style={{ border: '1px solid #ddd', padding: '6px 10px', ...cell.style }}>{cell.text}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <Pagination current={page} pageSize={PAGE_SIZE} total={model.total} showSizeChanger={false}
      onChange={setPage} style={{ marginTop: 12 }} />
  </div>
}
export default SpreadsheetPreview
