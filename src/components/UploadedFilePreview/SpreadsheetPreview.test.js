/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import * as XLSX from 'xlsx'
import SpreadsheetPreview from './SpreadsheetPreview'

jest.mock('antd', () => ({
  Alert: ({ message }) => <div>{message}</div>, Spin: () => null,
  Tabs: ({ items, onChange }) => <div>{items.map(item => <button key={item.key} onClick={() => onChange(item.key)}>{item.label}</button>)}</div>,
  Pagination: ({ onChange }) => <button onClick={() => onChange(2)}>Next sheet page</button>,
}))

test('switches sheets and displays formatted values and merges from a real XLSX file', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet([['Delivery', null], [1.48, '<script>not markup</script>']])
  sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]
  sheet.A2.z = '0.00'
  XLSX.utils.book_append_sheet(workbook, sheet, 'Lots')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Second sheet content']]), 'Summary')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  const container = document.createElement('div')
  const root = createRoot(container)
  try {
    await act(async () => root.render(<SpreadsheetPreview buffer={buffer} />))
    expect(container.textContent).toContain('1.48')
    expect(container.querySelector('td').colSpan).toBe(2)
    expect(container.textContent).toContain('<script>not markup</script>')
    expect(container.querySelector('script')).toBeNull()
    await act(async () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Summary').click())
    expect(container.querySelector('table').textContent).toContain('Second sheet content')
    expect(container.querySelector('table').textContent).not.toContain('Delivery')
  } finally {
    await act(async () => root.unmount())
    delete global.IS_REACT_ACT_ENVIRONMENT
  }
})
