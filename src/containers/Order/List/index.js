import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RestList } from '@flast-erp/core/components'
import { useGetList } from '@flast-erp/core/hooks'
import { dateFormatOnSubmit, InAppEvent } from '@flast-erp/core/utils'
import GeneratedDocumentViewer from '@/components/GeneratedDocumentViewer'
import { HASH_MODAL } from '@/configs'
import Filter from '../Filter'
import createOrderColumns from './columns/createOrderColumns'
import OrderLotExpandable from './components/OrderLotExpandable'
import WorkflowAttachModal from './components/WorkflowAttachModal'
import useOrderLots from './hooks/useOrderLots'
import useOrderWorkflowData from './hooks/useOrderWorkflowData'
import useQuotationViewer from './hooks/useQuotationViewer'
import useWorkflowModal from './hooks/useWorkflowModal'

const ListOrder = ({
  filter = {},
  hideQuoteButton,
  extraActions,
  enableLotTree = false,
  disableWorkflowAttach = false,
  apiPath = 'erp/order/fetch',
  orderMode = false,
}) => {
  const navigate = useNavigate()
  const [copiedIndex, setCopiedIndex] = useState(null)
  const isOrderList = orderMode || filter.type === 'order'

  const {
    expandedRowKeys,
    lotsByOrderId,
    loadingLotsByOrderId,
    setLotsByOrderId,
    handleExpand,
  } = useOrderLots()

  const {
    workflowModalOpen,
    workflowLoading,
    workflowAttaching,
    workflowKeyword,
    setWorkflowKeyword,
    selectedOrder,
    selectedWorkflowEntityType,
    selectedWorkflowId,
    setSelectedWorkflowId,
    filteredWorkflows,
    openWorkflowModal,
    closeWorkflowModal,
    handleAttachWorkflow,
  } = useWorkflowModal({ setLotsByOrderId })

  const {
    quoteViewerOpen,
    quoteLoading,
    quoteDocuments,
    quoteOrder,
    openQuotationViewer,
    closeQuotationViewer,
  } = useQuotationViewer()

  const { onData } = useOrderWorkflowData(isOrderList)

  const onClickViewDetail = useCallback((customerOrder) => InAppEvent.emit(HASH_MODAL, {
    hash: '#order.tabs',
    title: 'Thông tin đơn hàng ' + customerOrder.code,
    data: { customerOrder },
  }), [])

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to'])
    return values
  }, [])

  const actionWidth = (
    filter.type === 'cohoi' ? 260 : 220
  ) + ((extraActions?.length ?? 0) * 44)

  const columns = createOrderColumns({
    isOrderList,
    copiedIndex,
    setCopiedIndex,
    actionWidth,
    hideQuoteButton,
    disableWorkflowAttach,
    extraActions,
    onClickViewDetail,
    openQuotationViewer,
    openWorkflowModal,
    navigate,
  })

  const orderLotExpandable = enableLotTree
    ? OrderLotExpandable({
      expandedRowKeys,
      onExpand: handleExpand,
      lotsByOrderId,
      loadingLotsByOrderId,
      navigate,
      openWorkflowModal,
    })
    : undefined

  return (
    <>
      <RestList
        rowKey="id"
        bordered
        xScroll={1800}
        expandable={orderLotExpandable}
        onData={onData}
        initialFilter={{ limit: 10, page: 1, ...filter }}
        filter={<Filter />}
        hasCreate={false}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={apiPath}
        columns={columns}
      />

      <WorkflowAttachModal
        open={workflowModalOpen}
        onCancel={closeWorkflowModal}
        onOk={handleAttachWorkflow}
        confirmLoading={workflowAttaching}
        selectedWorkflowId={selectedWorkflowId}
        setSelectedWorkflowId={setSelectedWorkflowId}
        workflowKeyword={workflowKeyword}
        setWorkflowKeyword={setWorkflowKeyword}
        filteredWorkflows={filteredWorkflows}
        workflowLoading={workflowLoading}
        selectedOrder={selectedOrder}
        selectedWorkflowEntityType={selectedWorkflowEntityType}
      />

      <GeneratedDocumentViewer
        open={quoteViewerOpen}
        loading={quoteLoading}
        documents={quoteDocuments}
        title={`Báo giá${quoteOrder?.code ? ` - ${quoteOrder.code}` : ''}`}
        onClose={closeQuotationViewer}
      />
    </>
  )
}

export default ListOrder
