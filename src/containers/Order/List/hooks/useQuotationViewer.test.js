import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Dropdown, message } from 'antd'
import { RequestUtils } from '@flast-erp/core/utils'
import useQuotationViewer from './useQuotationViewer'
import QuotationApproverSelect from '../components/QuotationApproverSelect'

jest.mock('antd', () => {
  const React = require('react')
  return {
    message: { error: jest.fn(), success: jest.fn() },
    Button: ({ children, onClick, disabled }) => React.createElement('button', { onClick, disabled }, children),
    Dropdown: jest.fn(({ children, dropdownRender }) => React.createElement(React.Fragment, null, children, dropdownRender(null))),
  }
})
jest.mock('@ant-design/icons', () => ({ DownOutlined: () => null, UserOutlined: () => null }))
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Get: jest.fn(), Post: jest.fn() } }), { virtual: true })
jest.mock('@/configs', () => ({ SUCCESS_CODE: 200 }), { virtual: true })
jest.mock('@/services/DocumentTemplateService', () => (
  jest.requireActual('../../../../services/DocumentTemplateService')
), { virtual: true })

const template = { nodes: [{ type: 'richText', content: '{{ input:customerOrder.customerNote }}' }] }
const order = { id: 34019, customerNote: null, details: [{ id: 1, skuId: 11, quantity: 5 }] }

describe('quotation approval flow', () => {
  let root
  let container
  let viewer

  const Harness = ({ approvalEnabled, currentUserId }) => {
    viewer = useQuotationViewer({ approvalEnabled, currentUserId })
    return null
  }

  const mount = async (approvalEnabled = true, currentUserId = 2) => {
    // eslint-disable-next-line testing-library/no-unnecessary-act -- React DOM root.render does not wrap updates in act.
    await act(async () => { root.render(<Harness approvalEnabled={approvalEnabled} currentUserId={currentUserId} />) })
  }

  const setApprovalResponse = approval => RequestUtils.Get.mockImplementation((path, params) => Promise.resolve({
    errorCode: 200,
    data: path === '/erp/template/invoice'
      ? { templateData: JSON.stringify(template), customerOrder: { ...order, id: params.id } }
      : approval,
  }))

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    Dropdown.mockImplementation(({ children, dropdownRender: popupContent }) => <>{children}{popupContent(null)}</>)
    container = document.createElement('div')
    root = createRoot(container)
    setApprovalResponse({ customerOrderId: order.id, status: 0, type: 'quote', userApproval: 1649 })
    RequestUtils.Post.mockResolvedValue({ errorCode: 200, data: { id: order.id } })
  })

  afterEach(async () => {
    await act(async () => { root.unmount() })
    delete global.IS_REACT_ACT_ENVIRONMENT
  })

  it('checks the opened order, restores the approver, and saves approval alongside manual values', async () => {
    await mount()
    await act(async () => { await viewer.openQuotationViewer(order) })
    expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/order/invoice-check', { orderId: 34019, type: 'quote' })
    expect(viewer.quoteApproverId).toBe(1649)

    const editedData = { ...viewer.quoteData, customerOrder: { ...viewer.quoteData.customerOrder, customerNote: 'New quote note' } }
    await act(async () => { viewer.setQuoteApproverId(1650) })
    await act(async () => { expect(await viewer.saveQuotation(editedData)).toBe(true) })
    expect(RequestUtils.Post).toHaveBeenCalledWith('/order/save', expect.objectContaining({
      id: 34019,
      details: order.details,
      aproval: { status: 1, type: 'quote', userApproval: 1650 },
      quoteConfig: { manualValues: { 'customerOrder.customerNote': 'New quote note' } },
    }))
    expect(viewer.quoteData.customerOrder.customerNote).toBe('New quote note')
    expect(viewer.quoteApprovalStatus).toBe(1)
    expect(viewer.quoteReadOnly).toBe(true)
    await act(async () => { expect(await viewer.saveQuotation(editedData)).toBe(false) })
    expect(RequestUtils.Post).toHaveBeenCalledTimes(1)
  })

  it('allows saving without an approver and resets selection on close/reopen', async () => {
    await mount()
    await act(async () => { await viewer.openQuotationViewer(order) })
    await act(async () => { viewer.closeQuotationViewer() })
    expect(viewer.quoteApproverId).toBeUndefined()
    expect(viewer.quoteApprovalStatus).toBe(0)
    RequestUtils.Get.mockImplementation((path, params) => Promise.resolve({
      errorCode: 200,
      data: path === '/erp/template/invoice'
        ? { templateData: JSON.stringify(template), customerOrder: { ...order, id: params.id } }
        : null,
    }))
    await act(async () => { await viewer.openQuotationViewer({ id: 34020 }) })
    expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/order/invoice-check', { orderId: 34020, type: 'quote' })
    await act(async () => { expect(await viewer.saveQuotation(viewer.quoteData)).toBe(true) })
    expect(RequestUtils.Post).toHaveBeenCalledWith('/order/save', expect.objectContaining({ id: 34020 }))
    expect(RequestUtils.Post.mock.calls[0][1]).not.toHaveProperty('aproval')
    expect(viewer.quoteApprovalStatus).toBe(0)
    expect(viewer.quoteReadOnly).toBe(false)
    expect(message.error).not.toHaveBeenCalled()
  })

  it('omits approval after clearing a previously selected approver', async () => {
    await mount()
    await act(async () => { await viewer.openQuotationViewer(order) })
    expect(viewer.quoteApproverId).toBe(1649)
    await act(async () => { viewer.setQuoteApproverId(undefined) })
    await act(async () => { expect(await viewer.saveQuotation(viewer.quoteData)).toBe(true) })
    expect(RequestUtils.Post.mock.calls[0][1]).not.toHaveProperty('aproval')
  })

  it('does not enable the approval flow outside opportunities', async () => {
    await mount(false)
    await act(async () => { await viewer.openQuotationViewer(order) })
    expect(RequestUtils.Get).toHaveBeenCalledTimes(1)
    expect(viewer.quoteApproverId).toBeUndefined()
    expect(viewer.isQuoteApprover).toBe(false)
  })

  it.each([0, 1, 2])('derives edit/review permissions from status %i and the server-assigned approver', async status => {
    setApprovalResponse({ status, type: 'quote', userApproval: 1649 })
    await mount(true, '1649')
    await act(async () => { await viewer.openQuotationViewer(order) })
    expect(viewer.isQuoteApprover).toBe(true)
    expect(viewer.quoteReadOnly).toBe(status !== 0)
    expect(viewer.quoteReviewDisabled).toBe(status !== 1)
    await act(async () => { expect(await viewer.saveQuotation(viewer.quoteData)).toBe(false) })
    expect(RequestUtils.Post).not.toHaveBeenCalled()
  })

  it.each([1, 2])('prevents ordinary users from editing or reviewing status %i', async status => {
    setApprovalResponse({ status, type: 'quote', userApproval: 1649 })
    await mount()
    await act(async () => { await viewer.openQuotationViewer(order) })
    expect(viewer.quoteReadOnly).toBe(true)
    await act(async () => {
      expect(await viewer.saveQuotation(viewer.quoteData)).toBe(false)
      expect(await viewer.approveQuotation(viewer.quoteData)).toBe(false)
      expect(await viewer.rejectQuotation(viewer.quoteData)).toBe(false)
    })
    expect(RequestUtils.Post).not.toHaveBeenCalled()
  })

  it('does not grant review permission by selecting yourself before saving', async () => {
    await mount()
    await act(async () => { await viewer.openQuotationViewer(order) })
    await act(async () => { viewer.setQuoteApproverId(2) })
    expect(viewer.isQuoteApprover).toBe(false)
    await act(async () => { expect(await viewer.approveQuotation(viewer.quoteData)).toBe(false) })
    expect(RequestUtils.Post).not.toHaveBeenCalled()
  })

  it('approves a pending quotation with status 2 without allowing content or approver changes', async () => {
    setApprovalResponse({ status: 1, type: 'quote', userApproval: 1649 })
    await mount(true, 1649)
    await act(async () => { await viewer.openQuotationViewer(order) })
    await act(async () => { viewer.setQuoteApproverId(9999) })
    const tamperedData = { ...viewer.quoteData, customerOrder: { ...viewer.quoteData.customerOrder, customerNote: 'Should not be saved' } }
    await act(async () => { expect(await viewer.approveQuotation(tamperedData)).toBe(true) })
    const payload = RequestUtils.Post.mock.calls[0][1]
    expect(payload.aproval).toEqual({ status: 2, type: 'quote', userApproval: 1649 })
    expect(payload.quoteConfig.manualValues['customerOrder.customerNote']).toBeNull()
    expect(viewer.quoteApprovalStatus).toBe(2)
    expect(viewer.quoteReadOnly).toBe(true)
    expect(viewer.quoteApproverId).toBe(1649)
    expect(viewer.quoteReviewDisabled).toBe(true)
    await act(async () => {
      expect(await viewer.approveQuotation(viewer.quoteData)).toBe(false)
      expect(await viewer.rejectQuotation(viewer.quoteData)).toBe(false)
    })
    expect(RequestUtils.Post).toHaveBeenCalledTimes(1)
  })

  it('rejects a pending quote to 0, locks review, and re-enables review after resubmission', async () => {
    setApprovalResponse({ status: 1, type: 'quote', userApproval: 1649 })
    await mount(true, 1649)
    await act(async () => { await viewer.openQuotationViewer(order) })
    await act(async () => { expect(await viewer.rejectQuotation(viewer.quoteData)).toBe(true) })
    expect(RequestUtils.Post.mock.calls[0][1].aproval).toEqual({ status: 0, type: 'quote', userApproval: 1649 })
    expect(viewer.quoteApprovalStatus).toBe(0)
    expect(viewer.quoteReadOnly).toBe(false)
    expect(viewer.quoteReviewDisabled).toBe(true)
    await act(async () => {
      expect(await viewer.approveQuotation(viewer.quoteData)).toBe(false)
      expect(await viewer.rejectQuotation(viewer.quoteData)).toBe(false)
    })
    expect(RequestUtils.Post).toHaveBeenCalledTimes(1)
    await mount(true, 2)
    expect(viewer.isQuoteApprover).toBe(false)
    await act(async () => { expect(await viewer.saveQuotation(viewer.quoteData)).toBe(true) })
    expect(RequestUtils.Post.mock.calls[1][1].aproval.status).toBe(1)
    expect(viewer.quoteReadOnly).toBe(true)
    expect(viewer.quoteReviewDisabled).toBe(false)
  })

  it.each([0, 2])('blocks both decisions when reopening a quote with status %i', async status => {
    setApprovalResponse({ status, type: 'quote', userApproval: 1649 })
    await mount(true, 1649)
    await act(async () => { await viewer.openQuotationViewer(order) })
    expect(viewer.quoteReviewDisabled).toBe(true)
    await act(async () => {
      expect(await viewer.approveQuotation(viewer.quoteData)).toBe(false)
      expect(await viewer.rejectQuotation(viewer.quoteData)).toBe(false)
    })
    expect(RequestUtils.Post).not.toHaveBeenCalled()
  })

  it('keeps a failed decision pending and allows retrying', async () => {
    setApprovalResponse({ status: 1, type: 'quote', userApproval: 1649 })
    await mount(true, 1649)
    await act(async () => { await viewer.openQuotationViewer(order) })
    RequestUtils.Post.mockRejectedValueOnce(new Error('Approval failed'))
    const editedData = { ...viewer.quoteData, customerOrder: { ...viewer.quoteData.customerOrder, customerNote: 'Draft correction' } }
    await act(async () => { expect(await viewer.approveQuotation(editedData)).toBe(false) })
    expect(viewer.quoteApprovalStatus).toBe(1)
    expect(viewer.quoteReadOnly).toBe(true)
    expect(viewer.quoteReviewDisabled).toBe(false)
    expect(viewer.quoteSaving).toBe(false)
    await act(async () => { expect(await viewer.approveQuotation(editedData)).toBe(true) })
    expect(RequestUtils.Post.mock.calls[1][1].quoteConfig.manualValues['customerOrder.customerNote']).toBeNull()
    expect(viewer.quoteApprovalStatus).toBe(2)
    expect(viewer.quoteReviewDisabled).toBe(true)
  })

  it('prevents simultaneous approve/reject requests', async () => {
    setApprovalResponse({ status: 1, type: 'quote', userApproval: 1649 })
    await mount(true, 1649)
    await act(async () => { await viewer.openQuotationViewer(order) })
    let finishApproval
    RequestUtils.Post.mockImplementationOnce(() => new Promise(resolve => { finishApproval = resolve }))
    let firstSubmit
    await act(async () => {
      firstSubmit = viewer.approveQuotation(viewer.quoteData)
      expect(await viewer.rejectQuotation(viewer.quoteData)).toBe(false)
    })
    expect(RequestUtils.Post).toHaveBeenCalledTimes(1)
    expect(viewer.quoteSaving).toBe(true)
    await act(async () => {
      finishApproval({ errorCode: 200, data: { id: order.id } })
      await firstSubmit
    })
    expect(viewer.quoteApprovalStatus).toBe(2)
    expect(viewer.quoteSaving).toBe(false)
  })

  it('does not allow saving when invoice-check fails', async () => {
    await mount()
    RequestUtils.Get.mockImplementation((path) => Promise.resolve(path === '/erp/order/invoice-check'
      ? { errorCode: 500, message: 'Check failed' }
      : { errorCode: 200, data: { templateData: JSON.stringify(template), customerOrder: order } }))
    await act(async () => { await viewer.openQuotationViewer(order) })
    expect(viewer.quoteTemplate).toBeNull()
    expect(viewer.quoteLoading).toBe(false)
    expect(message.error).toHaveBeenCalledWith('Check failed')
    await act(async () => { expect(await viewer.saveQuotation({})).toBe(false) })
    expect(RequestUtils.Post).not.toHaveBeenCalled()
  })

  it('loads paginated approvers from /user/list and selects the user ID from the dropdown', async () => {
    const onChange = jest.fn()
    RequestUtils.Get.mockResolvedValueOnce({
      errorCode: 200,
      data: { embedded: [{ id: 1649, fullName: 'Nguyễn An' }], page: { totalElements: 2, pageSize: 1 } },
    }).mockResolvedValueOnce({
      errorCode: 200,
      data: { embedded: [{ id: 1650, fullName: 'Trần Bình' }], page: { totalElements: 2, pageSize: 1 } },
    })
    // eslint-disable-next-line testing-library/no-unnecessary-act -- Uses a React DOM root, not Testing Library.
    await act(async () => { root.render(<QuotationApproverSelect value={1649} onChange={onChange} />) })
    expect(RequestUtils.Get).toHaveBeenCalledWith('/user/list', { page: 1, limit: 50 })
    expect(container.textContent).toContain('Nguyễn An')
    await act(async () => { container.querySelectorAll('button')[1].click() })
    expect(RequestUtils.Get).toHaveBeenCalledWith('/user/list', { page: 2, limit: 50 })
    const dropdownProps = Dropdown.mock.calls[Dropdown.mock.calls.length - 1][0]
    expect(dropdownProps.menu.items).toEqual([
      { key: 'none', label: 'Không chọn người phê duyệt' },
      { type: 'divider' },
      { key: '1649', label: 'Nguyễn An' }, { key: '1650', label: 'Trần Bình' },
    ])
    dropdownProps.menu.onClick({ key: '1650' })
    expect(onChange).toHaveBeenCalledWith(1650)
    dropdownProps.menu.onClick({ key: 'none' })
    expect(onChange).toHaveBeenLastCalledWith(undefined)
    expect(container.textContent).not.toContain('Tải thêm người dùng')
  })

  it('allows retrying a failed user list request without advancing its page', async () => {
    RequestUtils.Get.mockRejectedValueOnce(new Error('User list failed')).mockResolvedValueOnce({
      errorCode: 200, data: { embedded: [], page: { totalElements: 0 } },
    })
    // eslint-disable-next-line testing-library/no-unnecessary-act -- Uses a React DOM root, not Testing Library.
    await act(async () => { root.render(<QuotationApproverSelect onChange={jest.fn()} />) })
    expect(container.textContent).toContain('User list failed')
    await act(async () => { container.querySelectorAll('button')[1].click() })
    expect(RequestUtils.Get.mock.calls.map(call => call[1].page)).toEqual([1, 1])
    expect(container.textContent).not.toContain('User list failed')
  })
})
