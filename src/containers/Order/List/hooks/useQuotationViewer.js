import { useCallback, useState } from 'react'
import { message } from 'antd'
import DocumentTemplateService from '@/services/DocumentTemplateService'
import { SUCCESS_CODE } from '@/configs'

const useQuotationViewer = () => {
  const [quoteViewerOpen, setQuoteViewerOpen] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteDocuments, setQuoteDocuments] = useState([])
  const [quoteOrder, setQuoteOrder] = useState(null)

  const openQuotationViewer = useCallback(async (order) => {
    setQuoteOrder(order)
    setQuoteDocuments([])
    setQuoteViewerOpen(true)
    setQuoteLoading(true)
    try {
      const response = await DocumentTemplateService.fetchGeneratedDocuments({
        categoryCode: 'ORDER_QUOTATION',
        sourceType: 'ORDER',
        sourceId: order.id,
      })
      if (Number(response?.errorCode) !== SUCCESS_CODE) {
        throw new Error(response?.message || 'Không tải được báo giá')
      }
      setQuoteDocuments(Array.isArray(response?.data) ? response.data : [])
    } catch (error) {
      message.error(error?.message || 'Không tải được file báo giá PDF')
    } finally {
      setQuoteLoading(false)
    }
  }, [])

  const closeQuotationViewer = useCallback(() => {
    setQuoteViewerOpen(false)
    setQuoteDocuments([])
    setQuoteOrder(null)
  }, [])

  return {
    quoteViewerOpen,
    quoteLoading,
    quoteDocuments,
    quoteOrder,
    openQuotationViewer,
    closeQuotationViewer,
  }
}

export default useQuotationViewer
