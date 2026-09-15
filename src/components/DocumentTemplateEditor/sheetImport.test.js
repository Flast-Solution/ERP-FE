import { parseColumnMarker, parseMarkedSheetRows, setSheetTableData } from './sheetImport'

describe('marked spreadsheet import', () => {
  it('reads every marked column, ignores unmarked columns and calculates sums', () => {
    const table = parseMarkedSheetRows([
      ['No.', 'Internal note', 'Roll No.', 'NET Quantity', 'N.Weight'],
      ['@column:no|number', null, '@column:rollNo', '@column:netQuantity|number|sum', '@column:netWeight|decimal|sum'],
      [1, 'ignore', '260609-235-109799-2', 136, 17.95],
      [2, 'ignore', '260609-235-109799-3', 60, 7.92],
      ['@end'],
      [3, 'not imported', 'later', 999, 999],
    ], 'PKL')
    expect(table.columns.map(column => column.key)).toEqual(['no', 'rollNo', 'netQuantity', 'netWeight'])
    expect(table.rows).toEqual([
      { no: 1, rollNo: '260609-235-109799-2', netQuantity: 136, netWeight: 17.95 },
      { no: 2, rollNo: '260609-235-109799-3', netQuantity: 60, netWeight: 7.92 },
    ])
    expect(table.totals).toEqual({ netQuantity: 196, netWeight: 25.87 })
  })

  it('validates marker keys, types and duplicate columns', () => {
    expect(parseColumnMarker('@column:rollNo|text')).toMatchObject({ key: 'rollNo', type: 'text' })
    expect(parseColumnMarker('@column:__proto__')).toBeNull()
    expect(() => parseColumnMarker('@column:value|money')).toThrow(/không hỗ trợ/)
    expect(() => parseMarkedSheetRows([
      ['A', 'B'], ['@column:value', '@column:value'], [1, 2],
    ])).toThrow(/bị trùng/)
  })

  it('attaches imported data without mutating the existing document', () => {
    const source = { customerOrder: { id: 1 }, sheetTables: { old: { rows: [] } } }
    const next = setSheetTableData(source, 'packingList', { rows: [{ no: 1 }] })
    expect(next).not.toBe(source)
    expect(next.sheetTables).toMatchObject({ old: { rows: [] }, packingList: { rows: [{ no: 1 }] } })
  })
})
