import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { RequestUtils } from '@flast-erp/core/utils'
import { useReactToPrint } from 'react-to-print'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import Invoice from './Invoice'
import { createInvoiceOrder, getInvoiceTemplates, parseInvoiceTemplate } from './invoiceTemplateUtils'
import { normalizeDocumentType } from '../../services/DocumentTemplateService'

jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Get: jest.fn(), Post: jest.fn() } }), { virtual: true })
jest.mock('@/configs', () => ({ SUCCESS_CODE: 200 }), { virtual: true })
jest.mock('@/services/DocumentTemplateService', () => jest.requireActual('../../services/DocumentTemplateService'), { virtual: true })
jest.mock('@/components/DocumentTemplateEditor/DocumentTemplateContent', () => jest.requireActual('../../components/DocumentTemplateEditor/DocumentTemplateContent'), { virtual: true })
jest.mock('@/containers/PreviewModal/uploadUtils', () => ({ resolveRuntimeAssetUrl: value => value }), { virtual: true })
jest.mock('../../hooks/useGetMe', () => () => ({ user: { id: 2 } }))
jest.mock('./List/components/QuotationApproverSelect', () => ({ value, onChange, disabled }) => {
  const React = require('react')
  return React.createElement('button', {
    'aria-label': 'Chọn người phê duyệt', disabled, onClick: () => onChange(value == null ? 1649 : undefined),
  }, value == null ? 'Chọn người phê duyệt' : `Người phê duyệt #${value}`)
})
jest.mock('html2canvas', () => jest.fn())
jest.mock('jspdf', () => ({ jsPDF: jest.fn() }))
jest.mock('react-to-print', () => ({ useReactToPrint: jest.fn() }))
jest.mock('antd', () => {
  const React = require('react')
  return {
    Button: ({ children, disabled, onClick, 'aria-label': ariaLabel }) => React.createElement('button', { disabled, onClick, 'aria-label': ariaLabel }, children),
    Space: ({ children }) => React.createElement('div', null, children),
    Tag: ({ children }) => React.createElement('span', null, children),
    Tooltip: ({ children }) => React.createElement(React.Fragment, null, children),
    message: { success: jest.fn(), error: jest.fn() },
    Alert: ({ message }) => React.createElement('div', { role: 'alert' }, message),
    Empty: ({ description }) => React.createElement('div', null, description),
    Spin: () => React.createElement('div', null, 'Loading'),
    Input: props => React.createElement('input', props),
    Select: ({ value, options, onChange }) => React.createElement('select', {
      value, onChange: event => onChange(event.target.value),
    }, options.map(option => React.createElement('option', { key: option.value, value: option.value }, option.label))),
  }
})

const template = { nodes: [
  { id: 'title', type: 'text', content: 'HOÁ ĐƠN TỪ TEMPLATE' },
  { id: 'customer', type: 'dataField', binding: 'customer.name' },
  { id: 'order', type: 'dataField', binding: 'customerOrder.code' },
  { id: 'product', type: 'dataField', binding: 'customerOrder.details.0.productName' },
  { id: 'sku', type: 'dataField', binding: 'customerOrder.details.0.skuDetails.values.text' },
] }
const record = { templateId: 2, name: 'Mẫu hoá đơn', documentType: 'invoice', status: 1, data: JSON.stringify(template) }
const data = {
  customerOrder: {
    id: 34014, code: 'ORDER-34014', customerReceiverName: 'Tên người nhận',
    details: [{ id: 34079, productName: 'Tên cũ', skuDetails: [{ text: 'BỒI VỎ', values: [{ text: 'Giấy kraft' }] }] }],
  },
  customer: { name: 'Khách hàng hiện tại' },
  details: [{ id: 34079, productName: 'Hộp carton lạnh' }],
}

describe('invoice templates', () => {
  it('accepts only active INVOICE templates and prefers Mẫu hoá đơn without mutating records', () => {
    const records = [
      { ...record, templateId: 1, name: 'Mẫu khác' }, record,
      { ...record, templateId: 3, status: 0 },
      { ...record, templateId: 4, name: 'Mẫu Báo giá', documentType: 'QUOTATION' },
      { ...record, templateId: 5, documentType: 'INVOICE' },
      { ...record, templateId: 6, documentType: 'GOODS_ISSUE' },
      { ...record, templateId: 7, status: 'DRAFT' },
    ]
    expect(getInvoiceTemplates(records).map(item => item.templateId)).toEqual([2, 5, 1])
    expect(records[0].templateId).toBe(1)
    expect(parseInvoiceTemplate(record)).toMatchObject({ ...template, documentType: 'invoice' })
    expect(parseInvoiceTemplate({ ...record, data: template }).nodes).toEqual(template.nodes)
  })

  it.each(['INVOICE', 'QUOTATION', 'GOODS_ISSUE', 'invoice', 'quotation', 'goods_issue'])('normalizes %s to lowercase when saving a template', type => {
    expect(normalizeDocumentType(type)).toBe(type.toLowerCase())
  })

  it('preserves the canonical lowercase invoice type', () => {
    expect(normalizeDocumentType('invoice')).toBe('invoice')
  })

  it('maps view-on-edit detailId and totalPrice back to the canonical invoice detail fields', () => {
    const order = createInvoiceOrder({
      customerOrder: {
        details: [{ id: 34066, code: 'OPJV2625QTK-2', total: 1900000, priceOff: 100000, quoteConfig: { manualValues: { mark: 'A' } } }],
      },
      details: [{
        detailId: 34066,
        key: 'OPJV2625QTK-2',
        quantity: 10,
        price: 200000,
        totalPrice: 2000000,
        discountAmount: 100000,
        quoteConfig: null,
      }],
    })
    expect(order.details[0]).toMatchObject({
      id: 34066,
      code: 'OPJV2625QTK-2',
      quantity: 10,
      price: 200000,
      total: 1900000,
      priceOff: 100000,
      quoteConfig: { manualValues: { mark: 'A' } },
    })
  })

  it('calculates total from view-on-edit when the list detail is unavailable', () => {
    const order = createInvoiceOrder({
      customerOrder: {},
      details: [{ detailId: 34064, totalPrice: 900000, discountAmount: 0 }],
    })
    expect(order.details[0]).toMatchObject({ id: 34064, total: 900000 })
  })
})

describe('order information invoice tab', () => {
  let root
  let container
  let print
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    root = createRoot(container)
    print = jest.fn()
    useReactToPrint.mockReturnValue(print)
    RequestUtils.Get.mockReset()
    RequestUtils.Post.mockReset()
    RequestUtils.Get.mockResolvedValue({ errorCode: 200, data: [record] })
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    delete global.IS_REACT_ACT_ENVIRONMENT
  })
  const mount = async nextData => {
    // eslint-disable-next-line testing-library/no-unnecessary-act -- React DOM root.render requires act.
    await act(async () => root.render(<Invoice data={nextData || data} />))
  }
  const button = name => [...container.querySelectorAll('button')]
    .find(item => item.textContent === name || item.getAttribute('aria-label') === name)

  it('starts at 85%, zooms the screen without scaling the printable content, and resets for another order', async () => {
    await mount()
    const zoomLevel = () => container.querySelector('[aria-label="Mức zoom PDF"]').textContent
    const zoomIn = () => container.querySelector('[aria-label="Phóng to PDF"]')
    const zoomOut = () => container.querySelector('[aria-label="Thu nhỏ PDF"]')
    expect(zoomLevel()).toBe('85%')
    expect(Number(container.querySelector('[data-invoice-zoom]').style.zoom)).toBe(0.85)
    await act(async () => zoomIn().click())
    expect(zoomLevel()).toBe('90%')
    await act(async () => zoomOut().click())
    expect(zoomLevel()).toBe('85%')
    await act(async () => {
      for (let i = 0; i < 30; i += 1) zoomOut().click()
    })
    expect(zoomLevel()).toBe('50%')
    expect(zoomOut().disabled).toBe(true)
    await act(async () => {
      for (let i = 0; i < 30; i += 1) zoomIn().click()
    })
    expect(zoomLevel()).toBe('150%')
    expect(zoomIn().disabled).toBe(true)
    const printedContent = useReactToPrint.mock.calls.at(-1)[0].contentRef.current.cloneNode(true)
    expect(printedContent.querySelector('[data-invoice-zoom]')).toBeNull()
    expect(printedContent.textContent).toContain('HOÁ ĐƠN TỪ TEMPLATE')
    await act(async () => button('In PDF').click())
    expect(print).toHaveBeenCalledTimes(1)
    await mount({ ...data, customerOrder: { ...data.customerOrder, id: 34015 } })
    expect(zoomLevel()).toBe('85%')
  })

  it('loads the invoice template and renders current customer/order/details with printing', async () => {
    await mount()
    expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/template/fetch', undefined)
    expect(container.textContent).toContain('HOÁ ĐƠN TỪ TEMPLATE')
    expect(container.textContent).toContain('Khách hàng hiện tại')
    expect(container.textContent).toContain('ORDER-34014')
    expect(container.textContent).toContain('Hộp carton lạnh')
    expect(container.textContent).toContain('Giấy kraft')
    expect(button('In PDF').disabled).toBe(false)
    await act(async () => button('In PDF').click())
    expect(print).toHaveBeenCalledTimes(1)
    expect(useReactToPrint.mock.calls.at(-1)[0].contentRef.current.textContent).toContain('HOÁ ĐƠN TỪ TEMPLATE')
    const pdf = { addPage: jest.fn(), addImage: jest.fn(), save: jest.fn() }
    html2canvas.mockResolvedValue({ toDataURL: jest.fn(() => 'data:image/jpeg;base64,test') })
    jsPDF.mockImplementation(() => pdf)
    await act(async () => button('Tải xuống PDF').click())
    expect(pdf.addImage).toHaveBeenCalledTimes(1)
    expect(pdf.save).toHaveBeenCalledWith('Mẫu hoá đơn-ORDER-34014.pdf')
    await mount({ customerOrder: { id: 34015, code: 'ORDER-34015', customerReceiverName: 'Khách tiếp theo' } })
    expect(container.textContent).toContain('Khách tiếp theo')
    expect(container.textContent).not.toContain('ORDER-34014')
  })

  it('edits manual PDF fields and submits invoice approval data at order level', async () => {
    const manualTemplate = { nodes: [
      { id: 'note', type: 'richText', content: '{{ input:customerOrder.customerNote }}' },
    ] }
    RequestUtils.Get.mockImplementation(path => Promise.resolve(path === '/erp/template/fetch'
      ? { errorCode: 200, data: [{ ...record, data: manualTemplate }] }
      : { errorCode: 200, data: null }))
    RequestUtils.Post.mockResolvedValue({ errorCode: 200, message: 'Đã lưu', data: {} })
    await mount({ ...data, customerOrder: { ...data.customerOrder, customerNote: 'Ghi chú cũ' } })
    expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/order/invoice-check', { orderId: 34014, type: 'invoice' })

    const input = container.querySelector('input')
    await act(async () => {
      input.value = 'Ghi chú nhập trên PDF'
      input.dispatchEvent(new Event('focusout', { bubbles: true }))
      button('Chọn người phê duyệt').click()
    })
    await act(async () => button('Lưu hoá đơn').click())

    expect(RequestUtils.Post).toHaveBeenCalledWith('/order/save', expect.objectContaining({
      id: 34014,
      aproval: { status: 1, type: 'invoice', userApproval: 1649 },
      quoteConfig: { manualValues: { 'customerOrder.customerNote': 'Ghi chú nhập trên PDF' } },
    }))
    expect(container.textContent).toContain('Chờ duyệt')
    expect(container.querySelector('input')).toBeNull()
  })

  it('shows decision actions to the invoice approver and submits the decision', async () => {
    RequestUtils.Get.mockImplementation(path => Promise.resolve(path === '/erp/template/fetch'
      ? { errorCode: 200, data: [record] }
      : { errorCode: 200, data: { status: 1, type: 'invoice', userApproval: 2 } }))
    RequestUtils.Post.mockResolvedValue({ errorCode: 200, data: {} })
    await mount()
    expect(button('Lưu hoá đơn')).toBeUndefined()
    expect(button('Duyệt').disabled).toBe(false)
    expect(button('Từ chối').disabled).toBe(false)

    await act(async () => button('Duyệt').click())
    expect(RequestUtils.Post).toHaveBeenCalledWith('/order/save', expect.objectContaining({
      aproval: { status: 2, type: 'invoice', userApproval: 2 },
    }))
    expect(container.textContent).toContain('Đã duyệt')
    expect(button('Duyệt').disabled).toBe(true)
    expect(button('Từ chối').disabled).toBe(true)
  })

  it('allows switching active invoice templates and preserves imported PDF page positions', async () => {
    const pdf = { layout: { mode: 'absolute' }, pages: [{ pageNumber: 1, width: 794, height: 1123 }, { pageNumber: 2, width: 794, height: 1123 }], nodes: [
      { id: 'first', type: 'text', content: 'Trang PDF 1', layout: { absolute: { page: 1, x: 50, y: 70, width: 130, height: 20 } } },
      { id: 'second', type: 'dataField', binding: 'customer.name', layout: { absolute: { page: 2, x: 80, y: 120 } } },
    ] }
    RequestUtils.Get.mockResolvedValue({ errorCode: 200, data: [{ ...record, templateId: 3, name: 'Hoá đơn PDF', data: pdf }, record] })
    await mount()
    const select = container.querySelector('select')
    expect(select.value).toBe('2')
    await act(async () => {
      select.value = '3'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const pages = container.querySelectorAll('.document-pdf-page')
    expect(pages).toHaveLength(2)
    expect(pages[0].textContent).toBe('Trang PDF 1')
    expect(pages[0].firstChild.style.left).toBe('50px')
    expect(pages[1].textContent).toBe('Khách hàng hiện tại')
    expect(pages[1].firstChild.style.top).toBe('120px')
  })

  it('loads the legacy Mẫu hoá đơn without confusing it with the legacy quotation', async () => {
    const invoice = { ...record, templateId: '1f1a1297-a849-6585-9ad6-3b5d622b1f2f', documentType: 'QUOTATION' }
    RequestUtils.Get.mockResolvedValue({ errorCode: 200, data: [
      { ...record, templateId: '1f1953ea-1e8a-6b99-a292-5f6e1511eff5', name: 'Mẫu Báo giá', documentType: 'invoice' },
      invoice,
    ] })
    await mount()
    expect(container.textContent).toContain('HOÁ ĐƠN TỪ TEMPLATE')
    expect(container.textContent).not.toContain('Chưa có mẫu hoá đơn')
    expect(button('In PDF').disabled).toBe(false)
    expect(parseInvoiceTemplate(invoice).documentType).toBe('invoice')
  })

  it('does not select inactive templates or unrelated document types', async () => {
    RequestUtils.Get.mockResolvedValue({ errorCode: 200, data: [
      { ...record, documentType: 'QUOTATION', status: 0 },
      { ...record, documentType: 'GOODS_ISSUE' },
    ] })
    await mount()
    expect(container.textContent).toContain('Chưa có mẫu hoá đơn đang sử dụng')
    expect(button('In PDF').disabled).toBe(true)
    expect(container.querySelector('[aria-label="Phóng to PDF"]').disabled).toBe(true)
    expect(container.querySelector('[aria-label="Thu nhỏ PDF"]').disabled).toBe(true)
    expect(container.querySelector('.document-pdf-page')).toBeNull()
  })

  it('shows load errors and supports retry', async () => {
    RequestUtils.Get.mockRejectedValueOnce(new Error('Mất kết nối'))
    await mount()
    expect(container.querySelector('[role="alert"]').textContent).toBe('Mất kết nối')
    expect(button('In PDF').disabled).toBe(true)
    await act(async () => button('Tải lại mẫu').click())
    expect(container.textContent).toContain('HOÁ ĐƠN TỪ TEMPLATE')
    expect(button('In PDF').disabled).toBe(false)
  })

  it('rejects malformed template data without showing the old hardcoded invoice', async () => {
    RequestUtils.Get.mockResolvedValue({ errorCode: 200, data: [{ ...record, data: '{invalid' }] })
    await mount()
    expect(container.querySelector('[role="alert"]').textContent).toContain('Mẫu hoá đơn không hợp lệ')
    expect(button('In PDF').disabled).toBe(true)
    expect(container.querySelector('.document-pdf-page')).toBeNull()
  })
})
