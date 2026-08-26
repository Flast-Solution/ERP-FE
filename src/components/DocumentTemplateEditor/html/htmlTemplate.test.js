import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { strToU8, zipSync } from 'fflate'
import HtmlTemplateContent from './HtmlTemplateContent'
import { createHtmlDocumentTemplate, normalizeHtmlDefinition } from './model'
import { importHtmlTemplateBytes, exportHtmlTemplateZip } from './package'
import { getScopedTemplateFonts, sanitizeTemplateCss } from './sanitize'

jest.mock('@/containers/PreviewModal/uploadUtils', () => ({ resolveRuntimeAssetUrl: value => value }), { virtual: true })
const manifest = { version: 1, fields: { name: { label: 'Tên', mode: 'manual' } } }
const html = '<div class="document"><span data-field="name"></span></div>'
const make = () => createHtmlDocumentTemplate(html, manifest)

describe('HTML package validation and security', () => {
  it('removes scripts, handlers and embedded browsing contexts', () => {
    const template = createHtmlDocumentTemplate(`<script>alert(1)</script><iframe src="https://example.com"></iframe><div onclick="alert(1)"><span data-field="name"></span></div>`, manifest)
    expect(template.htmlTemplate.html).not.toMatch(/script|iframe|onclick/)
  })
  it.each([
    '<img src="https://example.com/a.png">',
    '<style>.document{background:url(https://example.com/a)}</style>',
    '<style>@import "https://example.com/a.css";</style>',
    '<style>.document{position:fixed}</style>',
    '<style>.document{background:var(--external-url)}</style>',
    '<style>.document{background:url("data:image/svg+xml;base64,PHN2Zz4=")}</style>',
  ])('rejects external resources or unsupported active CSS: %s', extra => {
    expect(() => createHtmlDocumentTemplate(extra + html, manifest)).toThrow()
  })
  it('scopes every selector, including print rules, to the document', () => {
    const css = sanitizeTemplateCss('p,td{color:red}@media print{td{padding:2px}}', {}, '[data-html-scope="test"]')
    expect(css).toBe('[data-html-scope="test"] p,[data-html-scope="test"] td{color:red}@media print{[data-html-scope="test"] td{padding:2px}}')
  })
  it('namespaces embedded fonts and their references for each document instance', () => {
    const css = '@font-face{font-family:InvoiceFont;src:url("data:font/woff2;base64,AAAA")}p{font-family:InvoiceFont}'
    const names = getScopedTemplateFonts(css, 'document-a')
    const result = sanitizeTemplateCss(css, {}, '.document-a', false, names)
    expect(result).toContain('@font-face{font-family:document-a-InvoiceFont;')
    expect(result).toContain('.document-a p{font-family:document-a-InvoiceFont}')
    expect(sanitizeTemplateCss('font-family:InvoiceFont', {}, '', true, names)).toBe('font-family:document-a-InvoiceFont')
  })
  it('rejects missing fields, duplicates, unsafe paths, nested repeats and unsupported versions', () => {
    expect(() => createHtmlDocumentTemplate(html, { ...manifest, version: 2 })).toThrow()
    expect(() => createHtmlDocumentTemplate(html + html, manifest)).toThrow()
    expect(() => createHtmlDocumentTemplate(html, { ...manifest, fields: {} })).toThrow()
    expect(() => createHtmlDocumentTemplate(html, { ...manifest, fields: { name: { mode: 'binding', path: 'customerOrder.__proto__.x' } } })).toThrow()
    expect(() => createHtmlDocumentTemplate(`<div data-repeat="a"><div data-repeat="b">${html}</div></div>`, { ...manifest, repeats: { a: { source: 'items' }, b: { source: 'items' } } })).toThrow()
  })
  it('rejects incomplete ZIPs and traversal entries', () => {
    expect(() => importHtmlTemplateBytes(zipSync({ 'template.html': strToU8(html) }))).toThrow(/fields.json/)
    expect(() => importHtmlTemplateBytes(zipSync({ '../template.html': strToU8(html) }))).toThrow(/Đường dẫn/)
  })
  it('rejects decompression beyond the size limit before mounting any document', () => {
    const bytes = zipSync({ 'large.txt': new Uint8Array(21 * 1024 * 1024) })
    expect(() => importHtmlTemplateBytes(bytes)).toThrow(/20 MB/)
  })
  it('embeds packaged assets and round-trips configurations without external URLs', () => {
    const pixel = 'data:image/png;base64,iVBORw0KGgo='
    const template = createHtmlDocumentTemplate(`<img src="assets/logo.png">${html}`, manifest, { 'assets/logo.png': pixel })
    expect(template.htmlTemplate.html).toContain(pixel)
    expect(importHtmlTemplateBytes(exportHtmlTemplateZip(template))).toEqual(template)
  })
  it('revalidates stored HTML instead of trusting a previously imported definition', () => {
    expect(() => normalizeHtmlDefinition({ ...make().htmlTemplate, css: '@import "https://example.com";' })).toThrow()
  })
})

describe('HTML field interaction', () => {
  let host
  let root
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })
  afterEach(() => { act(() => root.unmount()); host.remove(); delete global.IS_REACT_ACT_ENVIRONMENT })
  const render = props => {
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => root.render(<HtmlTemplateContent template={make()} {...props} />))
  }
  it('emits the correct manual path and keeps input focus across updates', () => {
    const onChange = jest.fn()
    render({ editable: true, data: { customerOrder: { htmlFields: { name: 'Old' } } }, onManualFieldChange: onChange })
    const input = host.querySelector('input')
    input.focus()
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'New')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledWith('customerOrder.htmlFields.name', 'New')
    render({ editable: true, data: { customerOrder: { htmlFields: { name: 'New' } } }, onManualFieldChange: onChange })
    expect(document.activeElement).toBe(input)
    expect(input.value).toBe('New')
  })
  it('renders read-only content as text, preserves clearing and selects configuration by field ID', () => {
    const template = make()
    template.htmlTemplate.fields.name.value = 'Default'
    const select = jest.fn()
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => root.render(<HtmlTemplateContent template={template} data={{ customerOrder: { htmlFields: { name: '' } } }} onSelectField={select} />))
    expect(host.textContent).not.toContain('Default')
    expect(host.querySelector('input')).toBeNull()
    act(() => host.querySelector('[data-field="name"]').click())
    expect(select).toHaveBeenCalledWith('name')
    render({ data: { customerOrder: { htmlFields: { name: '<img src=x onerror=alert(1)>' } } } })
    expect(host.querySelector('img')).toBeNull()
    expect(host.textContent).toContain('<img src=x onerror=alert(1)>')
  })
})
