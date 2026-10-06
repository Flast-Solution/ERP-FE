import * as XLSX from 'xlsx'
import { buildSheetPage } from './spreadsheetModel'

test('preserves displayed number formats, merged cells and row/column dimensions', () => {
  const sheet = XLSX.utils.aoa_to_sheet([['Merged title', null], [1.48, 'Fabric']])
  sheet.A2.z = '0.00'
  delete sheet.A2.w
  sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]
  sheet['!cols'] = [{ wpx: 160 }, { wch: 20 }]
  sheet['!rows'] = [{ hpx: 40 }]
  const model = buildSheetPage(XLSX, sheet)
  expect(model.columns[0].width).toBe(160)
  expect(model.rows[0].height).toBe(40)
  expect(model.rows[0].cells).toHaveLength(1)
  expect(model.rows[0].cells[0]).toMatchObject({ text: 'Merged title', colSpan: 2 })
  expect(model.rows[1].cells[0].text).toBe('1.48')
})

test('paginates large sheets, clips merges across pages and ignores hidden rows and columns', () => {
  const sheet = XLSX.utils.aoa_to_sheet([['Title', 'Hidden']])
  sheet['!ref'] = 'A1:B205'
  sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 101, c: 0 } }]
  sheet['!cols'] = [{}, { hidden: true }]
  sheet['!rows'] = [{}, { hidden: true }]
  const first = buildSheetPage(XLSX, sheet)
  expect(first.columns).toHaveLength(1)
  expect(first.rows).toHaveLength(99)
  expect(first.rows[0].cells[0].rowSpan).toBe(99)
  const second = buildSheetPage(XLSX, sheet, 2)
  expect(second.rows[0].cells[0]).toMatchObject({ text: 'Title', rowSpan: 2 })
  expect(buildSheetPage(XLSX, sheet, 3).rows).toHaveLength(5)
})
