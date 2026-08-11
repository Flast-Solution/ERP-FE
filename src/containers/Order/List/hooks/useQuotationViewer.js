import { useCallback, useState } from 'react'
import { message } from 'antd'
import DocumentTemplateService from '@/services/DocumentTemplateService'
import { SUCCESS_CODE } from '@/configs'

const useQuotationViewer = () => {
  const [quoteViewerOpen, setQuoteViewerOpen] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteTemplate, setQuoteTemplate] = useState(null)
  const [quoteData, setQuoteData] = useState({})
  const [quoteOrder, setQuoteOrder] = useState(null)

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
    openQuotationViewer,
    closeQuotationViewer,
  }
}

export default useQuotationViewer
