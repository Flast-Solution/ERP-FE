import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import DocumentTemplateContent from '../DocumentTemplateContent'
import fs from 'fs'
import path from 'path'
import { importHtmlTemplateBytes, exportHtmlTemplateZip } from '../html/package'
import { buildQuotationPayload, createQuotationData } from '../../../containers/Order/List/utils/quotationMappers'
import commercialInvoiceSampleData from '../../../../examples/document-templates/htk-commercial-invoice/sample-data.json'

import { parseDocumentTemplateData } from '../../../services/DocumentTemplateService'
import { serializeTemplate } from '../utils'

const createCommercialInvoiceTemplate = () => importHtmlTemplateBytes(new Uint8Array(fs.readFileSync(path.resolve(__dirname, '../../../../public/document-templates/htk-commercial-invoice.zip'))))


jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: {} }), { virtual: true })
jest.mock('@/containers/PreviewModal/uploadUtils', () => ({ resolveRuntimeAssetUrl: value => value }), { virtual: true })

const render = (template, data) => {
  const element = document.createElement('div')
  element.innerHTML = renderToStaticMarkup(<DocumentTemplateContent template={template} data={data} />)
  return element
}

describe('Commercial Invoice HTK HTML package', () => {
  it('renders HTML fields, SKU properties, USD totals and the reference logo', () => {
    const template = createCommercialInvoiceTemplate()
    const view = render(template, commercialInvoiceSampleData)
    expect(view.textContent).toContain('COMMERCIAL INVOICE')
    expect(view.textContent).toContain('Composition: 100% Polyester')
    expect(view.textContent).toContain('Width: 149 cm')
    expect(view.textContent).toContain('Weight: 88 GSM (+/- 5%)')
    expect(view.querySelector('.goods tbody').textContent).toContain('NAVY')
    expect(view.querySelector('tfoot').textContent).toContain('4,867')
    expect(view.querySelector('tfoot').textContent).toContain('8,906.61')
    expect(view.querySelector('img').getAttribute('src')).toMatch(/^data:image\/png;base64,/)
    expect(template.documentType).toBe('invoice')
    expect(template.layout.mode).not.toBe('absolute')
    expect(template.layout.mode).toBe('html')
  })

  it('repeats products and calculates totals from current order data, escaping SKU text', () => {
    const data = JSON.parse(JSON.stringify(commercialInvoiceSampleData))
    data.customerOrder.details.push({ id: 'second', productName: 'Second item', quantity: 100, price: 2, total: 200, skuDetails: [{ text: 'Thành phần', values: [{ text: '<b>Cotton</b>' }] }] })
    const view = render(createCommercialInvoiceTemplate(), data)
    expect(view.querySelectorAll('.goods tbody tr')).toHaveLength(2)
    expect(view.querySelectorAll('.goods tbody tr')[1].textContent).toContain('Composition: <b>Cotton</b>')
    expect(view.querySelectorAll('.goods tbody tr')[1].querySelector('b')).toBeNull()
    expect(view.querySelector('tfoot').textContent).toContain('4,967')
    expect(view.querySelector('tfoot').textContent).toContain('9,106.61')
  })

  it('does not embed demonstration buyer, dates or amounts into the saved layout or live output', () => {
    const template = createCommercialInvoiceTemplate()
    const saved = JSON.stringify({ ...template.htmlTemplate, sampleData: undefined })
    expect(saved).not.toContain('U-MODE')
    expect(saved).not.toContain('8906.61')
    expect(saved).not.toContain('26-Jun-2026')
    const view = render(template, { customerOrder: { details: [] } })
    expect(view.textContent).not.toContain('U-MODE')
    expect(view.textContent).not.toContain('100% Polyester')
    expect(view.querySelectorAll('.goods tbody tr')).toHaveLength(0)
  })

  it('saves manual header/detail values in quoteConfig and restores explicit clearing', () => {
    const template = createCommercialInvoiceTemplate()
    const order = { id: 34014, details: [{ id: 1 }, { id: 2 }] }
    const data = createQuotationData(order, template)
    data.customerOrder.htmlFields = { contract: 'CONTRACT-1', invoiceDate: '' }
    data.customerOrder.details[1].htmlFields = { shippingMarks: 'BOX-2' }
    const payload = buildQuotationPayload(data, template, order)
    expect(payload.quoteConfig.manualValues).toMatchObject({ 'customerOrder.htmlFields.contract': 'CONTRACT-1', 'customerOrder.htmlFields.invoiceDate': '' })
    expect(payload.quoteConfig.details['2'].manualValues).toEqual({ 'htmlFields.shippingMarks': 'BOX-2' })
    expect(payload.details[1]).not.toHaveProperty('quoteConfig')
    expect(payload.details[1]).not.toHaveProperty('htmlFields')
    const reopened = createQuotationData({ ...order, ...payload }, template)
    expect(reopened.customerOrder.htmlFields.invoiceDate).toBe('')
    expect(reopened.customerOrder.details[1].htmlFields.shippingMarks).toBe('BOX-2')
  })

  it('persists unedited manual defaults so a later template change cannot alter the saved quote', () => {
    const template = createCommercialInvoiceTemplate()
    template.htmlTemplate.fields.contract.value = 'Original contract'
    const order = { id: 34014, details: [] }
    const payload = buildQuotationPayload(createQuotationData(order, template), template, order)
    expect(payload.quoteConfig.manualValues['customerOrder.htmlFields.contract']).toBe('Original contract')
    template.htmlTemplate.fields.contract.value = 'New default'
    expect(createQuotationData({ ...order, ...payload }, template).customerOrder.htmlFields.contract).toBe('Original contract')
  })

  it.each([false, true])('preserves nested blocks, styles, SKU and summaries after saving/reopening (wrapped=%s)', wrapped => {
    const template = serializeTemplate(createCommercialInvoiceTemplate())
    const saved = JSON.stringify(wrapped ? [template] : template)
    expect(parseDocumentTemplateData(saved)).toEqual(template)
    expect(importHtmlTemplateBytes(exportHtmlTemplateZip(template))).toMatchObject({ htmlTemplate: template.htmlTemplate })
  })
})
