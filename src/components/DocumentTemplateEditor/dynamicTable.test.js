import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import DocumentNodeContent from './DocumentNodeContent'
import { serializeTemplate } from './utils'

jest.mock('@/containers/PreviewModal/uploadUtils', () => ({ resolveRuntimeAssetUrl: value => value }), { virtual: true })

const node = {
  id: 'products', type: 'dynamicTable', source: 'details', style: { fontSize: 14 },
  columns: [
    { id: 'composition', title: 'COMPOSITION', binding: 'composition', width: 50 },
    { id: 'lead-time', title: 'LEAD\nTIME', binding: 'leadTime', width: 50 },
  ],
}
const headers = (value, preview) => {
  const host = document.createElement('div')
  host.innerHTML = renderToStaticMarkup(<DocumentNodeContent node={value} data={{ details: [{ composition: 'Cotton' }] }} preview={preview} />)
  return host.querySelectorAll('th')
}

describe('dynamic table header layout', () => {
  it.each([false, true])('wraps existing labels and preserves explicit newlines (preview=%s)', preview => {
    const cells = headers(node, preview)
    expect(cells[0].textContent).toBe('COMPOSITION')
    expect(cells[1].textContent).toBe('LEAD\nTIME')
    for (const cell of cells) {
      expect(cell.style.overflowWrap).toBe('anywhere')
      expect(cell.style.whiteSpace).toBe('pre-line')
      expect(cell.style.fontSize).toBe('14px')
      expect(cell.style.lineHeight).toBe('1.25')
    }
  })
  it('round-trips independent typography for merged headers without changing body font size', () => {
    const configured = { ...node, tableStyle: { headerFontSize: 11, headerLineHeight: 1.4 }, headerRows: [
      { id: 'group', cells: [{ id: 'group-cell', title: 'PRODUCT\nSPECIFICATION', colSpan: 2, rowSpan: 2 }] },
    ] }
    const restored = JSON.parse(JSON.stringify(serializeTemplate({ nodes: [configured] }))).nodes[0]
    const [cell] = headers(restored, true)
    expect(cell.colSpan).toBe(2)
    expect(cell.rowSpan).toBe(2)
    expect(cell.textContent).toBe('PRODUCT\nSPECIFICATION')
    expect(cell.style.overflowWrap).toBe('anywhere')
    expect(cell.style.fontSize).toBe('11px')
    expect(cell.style.lineHeight).toBe('1.4')
    expect(restored.style.fontSize).toBe(14)
  })
})
