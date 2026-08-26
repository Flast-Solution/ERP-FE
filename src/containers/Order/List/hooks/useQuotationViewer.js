import { useCallback, useState } from 'react'
import { message } from 'antd'
import DocumentTemplateService from '@/services/DocumentTemplateService'
import { SUCCESS_CODE } from '@/configs'
import { RequestUtils } from '@flast-erp/core/utils'
import {
  buildQuotationPayload,
  createQuotationData,
  mergeSavedQuotationOrder,
} from '../utils/quotationMappers'

const useQuotationViewer = () => {
  const [quoteViewerOpen, setQuoteViewerOpen] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteTemplate, setQuoteTemplate] = useState(null)
  const [quoteData, setQuoteData] = useState({})
  const [quoteOrder, setQuoteOrder] = useState(null)
  const [quoteSaving, setQuoteSaving] = useState(false)

  const openQuotationViewer = useCallback(async (order) => {
    setQuoteOrder(order)
    setQuoteTemplate(null)
    setQuoteData({})
    setQuoteViewerOpen(true)
    setQuoteLoading(true)
    try {
      const response = await DocumentTemplateService.fetchInvoice(order.id)
      if (Number(response?.errorCode) !== SUCCESS_CODE) {
        throw new Error(response?.message || 'Không tải được báo giá')
      }
      const templateData = JSON.parse(response?.data?.templateData || '')
      if (!templateData || !Array.isArray(templateData.nodes)) {
        throw new Error('Template báo giá không hợp lệ')
      }
      const customerOrder = response.data.customerOrder
      setQuoteOrder(customerOrder)
      setQuoteTemplate(templateData)
      setQuoteData(createQuotationData(customerOrder, templateData))
    } catch (error) {
      message.error(error?.message || 'Không tải được báo giá')
    } finally {
      setQuoteLoading(false)
    }
  }, [])

  const saveQuotation = useCallback(async (nextData) => {
    if (!quoteOrder?.id || !quoteTemplate) {
      message.error('Không xác định được cơ hội/đơn hàng cần lưu')
      return false
    }

    setQuoteSaving(true)
    try {
      const payload = buildQuotationPayload(nextData, quoteTemplate, quoteOrder)
      const response = await RequestUtils.Post('/order/save', payload)
      if (Number(response?.errorCode) !== SUCCESS_CODE) {
        throw new Error(response?.message || 'Lưu báo giá thất bại')
      }

      const savedOrder = mergeSavedQuotationOrder(quoteOrder, payload, response?.data)
      setQuoteData(createQuotationData(savedOrder, quoteTemplate))
      setQuoteOrder(savedOrder)
      message.success(response?.message || 'Lưu báo giá thành công')
      return true
    } catch (error) {
      message.error(error?.message || 'Lưu báo giá thất bại')
      return false
    } finally {
      setQuoteSaving(false)
    }
  }, [quoteOrder, quoteTemplate])

  const closeQuotationViewer = useCallback(() => {
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
    openQuotationViewer,
    saveQuotation,
    closeQuotationViewer,
  }
}

export default useQuotationViewer
