const MAX_COLUMNS = 200
export const PAGE_SIZE = 100

const cellStyle = cell => {
  const style = cell?.s || {}
  const font = style.font || {}
  const color = value => /^[0-9a-f]{6}$/i.test(String(value || '').slice(-6)) ? `#${String(value).slice(-6)}` : undefined
  return {
    fontWeight: font.bold ? 'bold' : undefined, fontStyle: font.italic ? 'italic' : undefined,
    color: color(font.color?.rgb), backgroundColor: color(style.fill?.fgColor?.rgb || style.fgColor?.rgb),
    textAlign: style.alignment?.horizontal || (cell?.t === 'n' ? 'right' : 'left'),
    verticalAlign: style.alignment?.vertical === 'center' ? 'middle' : style.alignment?.vertical,
    whiteSpace: style.alignment?.wrapText ? 'pre-wrap' : 'pre',
  }
}

export const buildSheetPage = (XLSX, sheet, page = 1) => {
  if (!sheet['!ref']) return { columns: [], rows: [], total: 0 }
  const range = XLSX.utils.decode_range(sheet['!ref'])
  const endColumn = Math.min(range.e.c, range.s.c + MAX_COLUMNS - 1)
  const columns = []
  for (let column = range.s.c; column <= endColumn; column++) {
    const meta = sheet['!cols']?.[column]
    if (meta?.hidden) continue
    columns.push({ index: column, name: XLSX.utils.encode_col(column), width: meta?.wpx || (meta?.wch ? meta.wch * 7 + 5 : 110) })
  }
  const total = range.e.r - range.s.r + 1
  const startRow = range.s.r + (page - 1) * PAGE_SIZE
  const endRow = Math.min(startRow + PAGE_SIZE - 1, range.e.r)
  const merges = sheet['!merges'] || []
  const rows = []
  for (let row = startRow; row <= endRow; row++) {
    const meta = sheet['!rows']?.[row]
    if (meta?.hidden) continue
    const cells = []
    for (const column of columns) {
      const merge = merges.find(item => row >= item.s.r && row <= item.e.r && column.index >= item.s.c && column.index <= item.e.c)
      let sourceRow = row
      let sourceColumn = column.index
      let rowSpan = 1
      let colSpan = 1
      if (merge) {
        const visibleColumns = columns.filter(item => item.index >= merge.s.c && item.index <= merge.e.c)
        const visibleRows = []
        for (let mergedRow = Math.max(merge.s.r, startRow); mergedRow <= Math.min(merge.e.r, endRow); mergedRow++) {
          if (!sheet['!rows']?.[mergedRow]?.hidden) visibleRows.push(mergedRow)
        }
        if (row !== visibleRows[0] || column.index !== visibleColumns[0]?.index) continue
        sourceRow = merge.s.r
        sourceColumn = merge.s.c
        rowSpan = visibleRows.length
        colSpan = visibleColumns.length
      }
      const cell = sheet[XLSX.utils.encode_cell({ r: sourceRow, c: sourceColumn })]
      cells.push({ column: column.index, text: cell ? String(cell.w ?? XLSX.utils.format_cell(cell)) : '',
        rowSpan, colSpan, style: cellStyle(cell) })
    }
    rows.push({ index: row, height: meta?.hpx || (meta?.hpt ? meta.hpt * 4 / 3 : undefined), cells })
  }
  return { columns, rows, total, truncatedColumns: range.e.c > endColumn }
}
