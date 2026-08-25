import { useCallback, useState } from 'react'
import { message } from 'antd'
import DocumentTemplateService from '@/services/DocumentTemplateService'
import { SUCCESS_CODE } from '@/configs'
import { RequestUtils } from '@flast-erp/core/utils'

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
      setQuoteData({
        customerOrder,
        customer: {
          name: customerOrder?.customerReceiverName,
          address: customerOrder?.customerAddress,
          mobile: customerOrder?.customerMobilePhone,
          email: customerOrder?.customerEmail,
        },
      })
    } catch (error) {
      message.error(error?.message || 'Không tải được báo giá')
    } finally {
      setQuoteLoading(false)
    }
  }, [])

  const saveQuotation = useCallback(async (nextData) => {
    const customerOrder = nextData?.customerOrder
    if (!customerOrder?.id) {
      message.error('Không xác định được cơ hội/đơn hàng cần lưu')
      return false
    }

    setQuoteSaving(true)
    try {
      const payload = {
        id: customerOrder.id,
        dataId: customerOrder.dataId ?? null,
        customer: {
          id: customerOrder.customerId ?? null,
          name: customerOrder.customerReceiverName ?? null,
          mobile: customerOrder.customerMobilePhone ?? null,
          email: customerOrder.customerEmail ?? null,
          address: customerOrder.customerAddress ?? null,
        },
        details: Array.isArray(customerOrder.details) ? customerOrder.details : [],
        shippingCost: customerOrder.shippingCost ?? null,
        customerNote: customerOrder.customerNote ?? null,
      }
      const response = await RequestUtils.Post('/order/save', payload)
      if (Number(response?.errorCode) !== SUCCESS_CODE) {
        throw new Error(response?.message || 'Lưu báo giá thất bại')
      }

      const savedOrder = response?.data && typeof response.data === 'object'
        ? response.data
        : customerOrder
      const savedData = {
        ...nextData,
        customerOrder: {
          ...customerOrder,
          ...savedOrder,
          details: savedOrder?.details ?? customerOrder.details,
        },
      }
      setQuoteData(savedData)
      setQuoteOrder(savedData.customerOrder)
      message.success(response?.message || 'Lưu báo giá thành công')
      return true
    } catch (error) {
      message.error(error?.message || 'Lưu báo giá thất bại')
      return false
    } finally {
      setQuoteSaving(false)
    }
  }, [])

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
