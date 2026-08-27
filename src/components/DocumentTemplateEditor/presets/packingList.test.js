import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import DocumentTemplateContent from '../DocumentTemplateContent'
import { importHtmlTemplateBytes, exportHtmlTemplateZip } from '../html/package'
import { parseMarkedWorkbook } from '../sheetImport'
import packingListSampleData from '../../../../examples/document-templates/htk-packing-list/sample-data.json'

jest.mock('@/containers/PreviewModal/uploadUtils', () => ({ resolveRuntimeAssetUrl: value => value }), { virtual: true })

const createPackingListTemplate = () => importHtmlTemplateBytes(new Uint8Array(fs.readFileSync(
  path.resolve(__dirname, '../../../../public/document-templates/htk-packing-list.zip'),
)))

const render = (template, data) => {
  const element = document.createElement('div')
  element.innerHTML = renderToStaticMarkup(<DocumentTemplateContent template={template} data={data} />)
  return element
}

describe('HTK Packing List marked-sheet HTML package', () => {
  it('imports the package and renders every spreadsheet row in marked column order', () => {
    const template = createPackingListTemplate()
    const view = render(template, packingListSampleData)
    expect(template.documentType).toBe('goods_issue')
    expect(view.textContent).toContain('PACKING LIST')
    expect(view.querySelectorAll('.packing thead th')).toHaveLength(9)
    expect(view.querySelectorAll('.packing tbody tr')).toHaveLength(56)
    expect(view.querySelector('.packing tbody tr').textContent).toContain('260609-235-109799-2')
    expect(view.textContent).toContain('U-MODE CO.,LTD')
    expect(view.querySelector('.packing tfoot').textContent).toContain('4,867')
    expect(view.querySelector('.packing tfoot').textContent).toContain('644.88')
    expect(view.querySelector('img').getAttribute('src')).toMatch(/^data:image\/png;base64,/)
  })

  it('round-trips the sheet table declaration in an exported package', () => {
    const template = createPackingListTemplate()
    expect(importHtmlTemplateBytes(exportHtmlTemplateZip(template)).htmlTemplate.sheetTables)
      .toEqual({ packingList: { marker: '@column:', stopMarker: '@end' } })
  })

  it('reads all marked columns and 56 rows from the delivered Excel example', () => {
    const workbook = XLSX.read(fs.readFileSync(path.resolve(
      __dirname,
      '../../../../examples/document-templates/htk-packing-list/marked-sheet-example.xlsx',
    )), { type: 'buffer', cellDates: true })
    const table = parseMarkedWorkbook(workbook)
    expect(table.columns.map(column => column.key)).toEqual([
      'no', 'rollNo', 'lotNo', 'netQuantity', 'rollCount',
      'netWeight', 'grossWeight', 'cbm', 'remark',
    ])
    expect(table.rows).toHaveLength(56)
    expect(table.totals).toEqual(expect.objectContaining({
      netQuantity: 4867,
      rollCount: 56,
      netWeight: 644.88,
      grossWeight: 656.08,
    }))
  })
})
