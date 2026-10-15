import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import HtmlTemplateContent from '@erp/shared-ui/components/DocumentTemplateEditor/html/HtmlTemplateContent'
import { createHtmlDocumentTemplate } from '@erp/shared-ui/components/DocumentTemplateEditor/html/model'
import fs from 'fs'
import path from 'path'

const template = {
  layout: { mode: 'html' },
  htmlTemplate: {
    html: '<div class="document"><div class="document-hide-when-empty">CONSIGNEE<span data-field="consignee"></span><p class="document-hide-when-empty">Tax code: <span data-field="tax"></span></p></div><table data-sheet-table="rolls"></table></div>',
    css: '',
    fields: {
      consignee: { label: 'Consignee', mode: 'manual', value: '' },
      tax: { label: 'Tax code', mode: 'manual', value: '' },
    },
    repeats: {},
    sheetTables: { rolls: { label: 'Rolls' } },
  },
}

test('Packing List source passes the actual HTML and CSS importer', () => {
  const directory = path.join(process.cwd(), 'docs/hatenko/templates/HTK-Packing-List-20261015')
  const html = fs.readFileSync(path.join(directory, 'template.html'), 'utf8')
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'fields.json'), 'utf8'))
  const logo = fs.readFileSync(path.join(directory, 'assets/htk-logo.png')).toString('base64')
  expect(() => createHtmlDocumentTemplate(html.replace('assets/htk-logo.png', `data:image/png;base64,${logo}`), manifest)).not.toThrow()
})

test('output omits empty consignee and an Excel table that was never imported', () => {
  const html = renderToStaticMarkup(<HtmlTemplateContent template={template} />)
  expect(html).not.toContain('CONSIGNEE')
  expect(html).not.toContain('<table')
  expect(html).not.toContain('Import Excel')
  expect(html).not.toContain('Tax code:')
})

test('editable document retains empty consignee inputs', () => {
  const html = renderToStaticMarkup(<HtmlTemplateContent template={template} editable />)
  expect(html).toContain('CONSIGNEE')
  expect(html).toContain('data-document-manual-input')
})

test('output retains populated consignee and imported Excel data', () => {
  const data = {
    customerOrder: { htmlFields: { consignee: 'Factory' } },
    sheetTables: { rolls: { columns: [{ key: 'roll', label: 'Roll' }], rows: [{ roll: 'R01' }] } },
  }
  const html = renderToStaticMarkup(<HtmlTemplateContent template={template} data={data} />)
  expect(html).toContain('CONSIGNEE')
  expect(html).toContain('Factory')
  expect(html).not.toContain('Tax code:')
  expect(html).toContain('R01')
})

test('output shows Tax code only when populated', () => {
  const data = { customerOrder: { htmlFields: { consignee: 'Factory', tax: '012345' } } }
  const html = renderToStaticMarkup(<HtmlTemplateContent template={template} data={data} />)
  expect(html).toContain('Tax code:')
  expect(html).toContain('012345')
})

test('whitespace values do not leave consignee or tax labels in output', () => {
  const data = { customerOrder: { htmlFields: { consignee: '  ', tax: '\t' } } }
  const html = renderToStaticMarkup(<HtmlTemplateContent template={template} data={data} />)
  expect(html).not.toContain('CONSIGNEE')
  expect(html).not.toContain('Tax code:')
})
