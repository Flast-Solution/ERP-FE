import { useCallback, useRef, useState } from 'react'
import { message } from 'antd'
import DocumentTemplateService, { getActiveDocumentTemplates, parseDocumentTemplateData } from '@/services/DocumentTemplateService'
import { SUCCESS_CODE } from '@/configs'
import { RequestUtils } from '@flast-erp/core/utils'
import { QUOTATION_APPROVAL_STATUS } from '../constants'
import {
  buildQuotationPayload,
  createQuotationData,
  mergeSavedQuotationOrder,
} from '../utils/quotationMappers'

const useQuotationViewer = ({ approvalEnabled = false, currentUserId } = {}) => {
  const loadRequestRef = useRef(0)
  const savingRef = useRef(false)
  const [quoteViewerOpen, setQuoteViewerOpen] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteTemplate, setQuoteTemplate] = useState(null)
  const [quoteData, setQuoteData] = useState({})
  const [quoteOrder, setQuoteOrder] = useState(null)
  const [quoteSaving, setQuoteSaving] = useState(false)
  const [quoteApproverId, setQuoteApproverId] = useState()
  const [quoteApproval, setQuoteApproval] = useState(null)
  const quoteApprovalStatus = Number(quoteApproval?.status ?? QUOTATION_APPROVAL_STATUS.DRAFT)
  const quoteReadOnly = approvalEnabled && quoteApprovalStatus !== QUOTATION_APPROVAL_STATUS.DRAFT
  const quoteReviewDisabled = quoteApprovalStatus !== QUOTATION_APPROVAL_STATUS.PENDING
  // Review permission comes from invoice-check, never from an unsaved dropdown choice.
  const isQuoteApprover = Boolean(approvalEnabled
    && Number(quoteApproval?.userApproval) > 0
    && Number(currentUserId) === Number(quoteApproval.userApproval))

  const openQuotationViewer = useCallback(async (order) => {
    const requestId = ++loadRequestRef.current
    setQuoteApproverId(undefined)
    setQuoteApproval(null)
    setQuoteOrder(order)
    setQuoteTemplate(null)
    setQuoteData({})
    setQuoteViewerOpen(true)
    setQuoteLoading(true)
    try {
      const [response, checkResponse, templatesResponse] = await Promise.all([
        DocumentTemplateService.fetchInvoice(order.id),
        approvalEnabled ? DocumentTemplateService.checkInvoice(order.id) : Promise.resolve(null),
        DocumentTemplateService.fetchTemplates(),
      ])
      if (requestId !== loadRequestRef.current) return
      if (Number(response?.errorCode) !== SUCCESS_CODE) {
        throw new Error(response?.message || 'Không tải được báo giá')
      }
      if (approvalEnabled && Number(checkResponse?.errorCode) !== SUCCESS_CODE) {
        throw new Error(checkResponse?.message || 'Không kiểm tra được thông tin phê duyệt báo giá')
      }
      if (Number(templatesResponse?.errorCode) !== SUCCESS_CODE || !Array.isArray(templatesResponse?.data)) {
        throw new Error(templatesResponse?.message || 'Không tải được danh sách mẫu báo giá')
      }
      // Use the invoice endpoint for order data, but choose the template by the
      // quotation action's explicit type instead of its implicit templateData.
      const [templateRecord] = getActiveDocumentTemplates(templatesResponse.data, 'quotation', 'Mẫu báo giá')
      if (!templateRecord) throw new Error('Chưa có mẫu báo giá loại quotation đang sử dụng')
      const templateData = parseDocumentTemplateData(templateRecord.data, 'Template báo giá không hợp lệ')
      const customerOrder = response.data.customerOrder
      if (approvalEnabled) {
        const approval = checkResponse?.data?.aproval ?? checkResponse?.data ?? customerOrder?.aproval ?? null
        setQuoteApproval(approval)
        const approverId = approval?.userApproval
        if (approverId != null) setQuoteApproverId(Number(approverId))
      }
      setQuoteOrder(customerOrder)
      setQuoteTemplate(templateData)
      setQuoteData(createQuotationData(customerOrder, templateData))
    } catch (error) {
      if (requestId !== loadRequestRef.current) return
      message.error(error?.message || 'Không tải được báo giá')
    } finally {
      if (requestId === loadRequestRef.current) setQuoteLoading(false)
    }
  }, [approvalEnabled])

  const submitQuotation = useCallback(async (nextData, action) => {
    if (savingRef.current) return false
    if (!quoteOrder?.id || !quoteTemplate) {
      message.error('Không xác định được cơ hội/đơn hàng cần lưu')
      return false
    }
    const reviewing = action === 'approve' || action === 'reject'
    if (reviewing && !isQuoteApprover) {
      message.error('Bạn không phải người phê duyệt báo giá này')
      return false
    }
    if (reviewing && quoteReviewDisabled) {
      message.error('Chỉ có thể duyệt hoặc từ chối báo giá đang chờ duyệt')
      return false
    }
    if (!reviewing && (quoteReadOnly || isQuoteApprover)) {
      message.error('Báo giá hiện tại không cho phép lưu chỉnh sửa')
      return false
    }
    const approverId = reviewing ? Number(quoteApproval.userApproval) : quoteApproverId
    if (approvalEnabled && approverId != null && (!Number.isInteger(approverId) || approverId <= 0)) {
      message.error('Người phê duyệt báo giá không hợp lệ')
      return false
    }

    const nextStatus = action === 'approve'
      ? QUOTATION_APPROVAL_STATUS.APPROVED
      : action === 'reject' || approverId == null
        ? QUOTATION_APPROVAL_STATUS.DRAFT
        : QUOTATION_APPROVAL_STATUS.PENDING
    const requestId = loadRequestRef.current
    savingRef.current = true
    setQuoteSaving(true)
    try {
      // A pending/approved quotation may only change approval status, not its content.
      const dataToSave = quoteReadOnly ? createQuotationData(quoteOrder, quoteTemplate) : nextData
      const payload = buildQuotationPayload(dataToSave, quoteTemplate, quoteOrder, approvalEnabled ? approverId : undefined, nextStatus)
      const response = await RequestUtils.Post('/order/save', payload)
      if (Number(response?.errorCode) !== SUCCESS_CODE) {
        throw new Error(response?.message || 'Lưu báo giá thất bại')
      }
      if (requestId !== loadRequestRef.current) return true

      const savedOrder = mergeSavedQuotationOrder(quoteOrder, payload, response?.data)
      if (payload.aproval) {
        const savedApproval = { ...quoteApproval, ...payload.aproval, ...response?.data?.aproval }
        setQuoteApproval(savedApproval)
        setQuoteApproverId(Number(savedApproval.userApproval))
      }
      setQuoteData(createQuotationData(savedOrder, quoteTemplate))
      setQuoteOrder(savedOrder)
      message.success(reviewing
        ? action === 'approve' ? 'Đã duyệt báo giá' : 'Đã từ chối báo giá'
        : response?.message || 'Lưu báo giá thành công')
      return true
    } catch (error) {
      if (requestId === loadRequestRef.current) message.error(error?.message || 'Lưu báo giá thất bại')
      return false
    } finally {
      savingRef.current = false
      setQuoteSaving(false)
    }
  }, [approvalEnabled, isQuoteApprover, quoteApproval, quoteApproverId, quoteOrder, quoteReadOnly, quoteReviewDisabled, quoteTemplate])

  const saveQuotation = useCallback(nextData => submitQuotation(nextData, 'save'), [submitQuotation])
  const approveQuotation = useCallback(nextData => submitQuotation(nextData, 'approve'), [submitQuotation])
  const rejectQuotation = useCallback(nextData => submitQuotation(nextData, 'reject'), [submitQuotation])

  const closeQuotationViewer = useCallback(() => {
    loadRequestRef.current += 1
    setQuoteApproverId(undefined)
    setQuoteApproval(null)
    setQuoteLoading(false)
    setQuoteViewerOpen(false)
    setQuoteTemplate(null)
    setQuoteData({})
    setQuoteOrder(null)
  }, [])

  return {
    quoteViewerOpen,
    quoteLoading,
    quoteTemplate,
    quoteData,
    quoteOrder,
    quoteSaving,
    quoteApproverId,
    quoteApprovalStatus,
    quoteReadOnly,
    quoteReviewDisabled,
    isQuoteApprover,
    setQuoteApproverId,
    openQuotationViewer,
    saveQuotation,
    approveQuotation,
    rejectQuotation,
    closeQuotationViewer,
  }
}

export default useQuotationViewer
