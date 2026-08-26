import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import GeneratedDocumentViewer from './index'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { createHtmlDocumentTemplate } from '../DocumentTemplateEditor/html/model'

jest.mock('antd', () => {
  const React = require('react')
  const Children = ({ children }) => React.createElement('div', null, children)
  return {
    Button: ({ children, disabled, onClick, 'aria-label': ariaLabel }) => React.createElement('button', { disabled, onClick, 'aria-label': ariaLabel }, children),
    Drawer: ({ open, children }) => open ? React.createElement('div', null, children) : null,
    Spin: Children,
    Tooltip: Children,
    Segmented: () => null,
    Empty: () => null,
    Input: { TextArea: () => null },
    message: { error: jest.fn(), success: jest.fn() },
  }
})
jest.mock('@ant-design/icons', () => Object.fromEntries([
  'CheckOutlined', 'CloseCircleOutlined', 'CloseOutlined', 'DownloadOutlined',
  'MinusOutlined', 'PlusOutlined', 'PrinterOutlined', 'SaveOutlined', 'SendOutlined',
].map(name => [name, () => null])))
jest.mock('html2canvas', () => jest.fn())
jest.mock('jspdf', () => ({ jsPDF: jest.fn() }))
jest.mock('react-to-print', () => ({ useReactToPrint: () => jest.fn() }))
jest.mock('@/components/DocumentTemplateEditor/DocumentTemplateContent', () => jest.requireActual('../DocumentTemplateEditor/DocumentTemplateContent'), { virtual: true })
jest.mock('@/containers/PreviewModal/uploadUtils', () => ({ resolveRuntimeAssetUrl: value => value }), { virtual: true })
jest.mock('@/components/DocumentTemplateEditor/utils', () => ({
  getValueByPath: require('lodash/get'),
}), { virtual: true })

const template = { nodes: [{ id: 'note', type: 'richText', content: '{{ input:customerOrder.customerNote }}' }] }
const data = { customerOrder: { id: 34019, customerNote: 'Quote value' } }

describe('quotation viewer controls', () => {
  let container
  let root

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => { root.unmount() })
    jest.restoreAllMocks()
    delete global.IS_REACT_ACT_ENVIRONMENT
  })

  const mount = async props => {
    // eslint-disable-next-line testing-library/no-unnecessary-act -- React DOM root.render requires act.
    await act(async () => { root.render(<GeneratedDocumentViewer open template={template} data={data} {...props} />) })
  }
  const findButton = label => [...container.querySelectorAll('button')].find(button => button.textContent === label)

  it('preserves imported PDF pages and positions, allows manual edits, and exports pages separately', async () => {
    const pdfTemplate = { name: 'PDF quote', layout: { mode: 'absolute' }, pages: [
      { pageNumber: 1, width: 794, height: 1123 }, { pageNumber: 2, width: 794, height: 1123 },
    ], nodes: [
      { id: 'title', type: 'text', content: 'PAGE ONE', layout: { absolute: { page: 1, x: 20, y: 50, width: 100, height: 24 } } },
      { ...template.nodes[0], layout: { absolute: { page: 2, x: 30, y: 80, width: 150, height: 28 } } },
    ] }
    const onSubmitDocument = jest.fn()
    await mount({ template: pdfTemplate, onSubmitDocument })
    const pages = container.querySelectorAll('.generated-document-page')
    expect(pages).toHaveLength(2)
    expect(pages[0].textContent).toBe('PAGE ONE')
    expect(pages[0].firstChild.style.position).toBe('absolute')
    expect(pages[0].firstChild.style.top).toBe('50px')
    expect(pages[1].firstChild.style.left).toBe('30px')
    await act(async () => {
      const input = pages[1].querySelector('input')
      input.value = 'Edited PDF quote'
      input.dispatchEvent(new Event('focusout', { bubbles: true }))
    })
    await act(async () => findButton('Lưu báo giá').click())
    expect(onSubmitDocument).toHaveBeenCalledWith(expect.objectContaining({ customerOrder: expect.objectContaining({ customerNote: 'Edited PDF quote' }) }))

    html2canvas.mockResolvedValue({ width: 1588, height: 2246 })
    const pdf = { addPage: jest.fn(), addImage: jest.fn(), save: jest.fn() }
    jsPDF.mockImplementation(() => pdf)
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: jest.fn(), drawImage: jest.fn() })
    jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,test')
    await act(async () => container.querySelector('[aria-label="Tải xuống PDF"]').click())
    expect(html2canvas.mock.calls.map(call => call[0])).toEqual([...pages])
    expect(pdf.addImage).toHaveBeenCalledTimes(2)
    expect(pdf.addPage).toHaveBeenCalledTimes(1)
    expect(pdf.save).toHaveBeenCalledWith('PDF-quote.pdf')
  })

  it('shows Save and editable fields for draft submitters', async () => {
    await mount({ onSubmitDocument: jest.fn() })
    expect(findButton('Lưu báo giá')).toBeDefined()
    expect(findButton('Duyệt')).toBeUndefined()
    expect(container.querySelector('input').value).toBe('Quote value')
  })

  it('edits HTML manual fields, submits their values and honors read-only access', async () => {
    const htmlTemplate = createHtmlDocumentTemplate('<div><span data-field="my-note"></span></div>', {
      version: 1, fields: { 'my-note': { mode: 'manual', label: 'Ghi chú HTML' } },
    })
    const onSubmitDocument = jest.fn()
    await mount({ template: htmlTemplate, onSubmitDocument })
    const input = container.querySelector('input')
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Ghi chú mới')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => findButton('Lưu báo giá').click())
    expect(onSubmitDocument).toHaveBeenCalledWith(expect.objectContaining({
      customerOrder: expect.objectContaining({ htmlFields: { 'my-note': 'Ghi chú mới' } }),
    }))
    await mount({ template: htmlTemplate, onSubmitDocument, readOnly: true })
    expect(container.querySelector('input')).toBeNull()
    expect(findButton('Lưu báo giá')).toBeUndefined()
  })

  it.each([false, true])('shows review actions instead of Save and honors readOnly=%s', async readOnly => {
    const onApproveDocument = jest.fn()
    const onRejectDocument = jest.fn()
    await mount({ readOnly, onApproveDocument, onRejectDocument, toolbarContent: <span>Trạng thái duyệt</span> })
    expect(findButton('Lưu báo giá')).toBeUndefined()
    expect(container.textContent).not.toContain('Trang 1')
    expect(Boolean(container.querySelector('input'))).toBe(!readOnly)
    await act(async () => { findButton('Duyệt').click() })
    await act(async () => { findButton('Từ chối').click() })
    expect(onApproveDocument).toHaveBeenCalledWith(data)
    expect(onRejectDocument).toHaveBeenCalledWith(data)
  })

  it('cannot show Save or editable fields when the document is read-only', async () => {
    await mount({ readOnly: true, onSubmitDocument: jest.fn(), allowDocumentSubmit: true })
    expect(findButton('Lưu báo giá')).toBeUndefined()
    expect(container.querySelector('input')).toBeNull()
  })

  it('disables both review actions and editing during an in-flight decision', async () => {
    await mount({ onApproveDocument: jest.fn(), onRejectDocument: jest.fn(), documentSubmitting: true })
    expect(findButton('Duyệt').disabled).toBe(true)
    expect(findButton('Từ chối').disabled).toBe(true)
    expect(container.querySelector('input')).toBeNull()
  })

  it('keeps both decision buttons visible but disabled after review, and enables them on resubmission', async () => {
    const onApproveDocument = jest.fn()
    const onRejectDocument = jest.fn()
    await mount({ onApproveDocument, onRejectDocument, reviewDisabled: true })
    expect(findButton('Duyệt').disabled).toBe(true)
    expect(findButton('Từ chối').disabled).toBe(true)
    await act(async () => {
      findButton('Duyệt').click()
      findButton('Từ chối').click()
    })
    expect(onApproveDocument).not.toHaveBeenCalled()
    expect(onRejectDocument).not.toHaveBeenCalled()
    await mount({ onApproveDocument, onRejectDocument, reviewDisabled: false })
    expect(findButton('Duyệt').disabled).toBe(false)
    expect(findButton('Từ chối').disabled).toBe(false)
  })
})
