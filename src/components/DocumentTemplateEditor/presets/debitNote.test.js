import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'fs'
import path from 'path'
import DocumentTemplateContent from '../DocumentTemplateContent'
import { importHtmlTemplateBytes, exportHtmlTemplateZip } from '../html/package'
import sampleData from '../../../../examples/document-templates/htk-debit-note/sample-data.json'

jest.mock('@/containers/PreviewModal/uploadUtils', () => ({ resolveRuntimeAssetUrl: value => value }), { virtual: true })

const loadTemplate = () => importHtmlTemplateBytes(new Uint8Array(fs.readFileSync(
  path.resolve(__dirname, '../../../../public/document-templates/htk-debit-note.zip'),
)))

describe('HTK Debit Note HTML package', () => {
  it('imports and renders the reference data and embedded assets', () => {
    const template = loadTemplate()
    const view = document.createElement('div')
    view.innerHTML = renderToStaticMarkup(<DocumentTemplateContent template={template} data={sampleData} />)
    expect(template.documentType).toBe('invoice')
    expect(view.textContent).toContain('DEBIT NOTE')
    expect(view.textContent).toContain('U-MODE CO.,LTD')
    expect(view.textContent).toContain('EF31650624YV20C')
    expect(view.textContent).toContain('8,906.61')
    expect(view.querySelectorAll('.details tbody tr')).toHaveLength(1)
    expect(view.querySelectorAll('img')).toHaveLength(1)
    expect(view.querySelector('img').src).toMatch(/^data:image\/png;base64,/)
    expect(view.querySelector('img[alt*="stamp"]')).toBeNull()
  })

  it('round-trips through ZIP export', () => {
    const template = loadTemplate()
    const exported = importHtmlTemplateBytes(exportHtmlTemplateZip(template))
    expect(exported.htmlTemplate.fields.amount.path).toBe('details.total')
    expect(exported.htmlTemplate.repeats.products.source).toBe('customerOrder.details')
  })
})
