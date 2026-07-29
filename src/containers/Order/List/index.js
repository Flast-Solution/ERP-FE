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
import WorkflowProgressDrawer from './components/WorkflowProgressDrawer'
import useOrderLots from './hooks/useOrderLots'
import useOrderWorkflowData from './hooks/useOrderWorkflowData'
import useQuotationViewer from './hooks/useQuotationViewer'
import useWorkflowModal from './hooks/useWorkflowModal'
import useWorkflowProgressDrawer from './hooks/useWorkflowProgressDrawer'

const QUOTATION_COMMENT_MOCKS = [
  {
    id: 'quotation-comment-1',
    author: 'Lan Anh',
    role: 'Khách hàng',
    time: '10:24',
    content: 'Bên em thấy mục giá phân hệ kho hơi cao so với ngân sách. Anh/chị có thể xem lại được không ạ?',
  },
  {
    id: 'quotation-comment-2',
    author: 'Minh Tuấn',
    role: 'Kinh doanh',
    time: '10:41',
    content: 'Nếu ký hợp đồng trong tháng này, bên mình có thể miễn phí năm bảo trì đầu tiên.',
  },
  {
    id: 'quotation-comment-3',
    author: 'Lan Anh',
    role: 'Khách hàng',
    time: '11:05',
    content: 'Bên em đồng ý với phương án điều chỉnh. Nhờ anh/chị gửi lại bản báo giá cập nhật.',
  },
]

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
  const isOpportunityList = filter.type === 'cohoi'

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
    workflows,
    selectedOrder,
    selectedWorkflowEntityType,
    workflowTargets,
    selectedWorkflowIdsByTarget,
    initialWorkflowIdsByTarget,
    setWorkflowIdsForTarget,
    canSubmit,
    openWorkflowModal,
    closeWorkflowModal,
    handleAttachWorkflow,
  } = useWorkflowModal({ setLotsByOrderId })

  const {
    workflowProgressDrawerOpen,
    workflowProgressDrawerLoading,
    workflowProgressOrder,
    workflowProgressOrderDetail,
    workflowProgressInstances,
    openWorkflowProgressDrawer,
    closeWorkflowProgressDrawer,
  } = useWorkflowProgressDrawer()

  const {
    quoteViewerOpen,
    quoteLoading,
    quoteTemplate,
    quoteData,
    quoteOrder,
    openQuotationViewer,
    closeQuotationViewer,
  } = useQuotationViewer()

  const { onData } = useOrderWorkflowData(
    isOrderList || isOpportunityList
  )

  const handleOpenWorkflowModal = useCallback((record, entityType) => {
    openWorkflowModal(record, entityType, {
      splitOrderDetails: isOpportunityList,
    })
  }, [isOpportunityList, openWorkflowModal])

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
    isOpportunityList,
    copiedIndex,
    setCopiedIndex,
    actionWidth,
    hideQuoteButton,
    disableWorkflowAttach,
    extraActions,
    onClickViewDetail,
    openQuotationViewer,
    openWorkflowModal: handleOpenWorkflowModal,
    openWorkflowProgressDrawer,
    navigate,
  })

  const orderLotExpandable = enableLotTree
    ? OrderLotExpandable({
      expandedRowKeys,
      onExpand: handleExpand,
      lotsByOrderId,
      loadingLotsByOrderId,
      navigate,
      openWorkflowModal: handleOpenWorkflowModal,
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
        workflowTargets={workflowTargets}
        selectedWorkflowIdsByTarget={selectedWorkflowIdsByTarget}
        initialWorkflowIdsByTarget={initialWorkflowIdsByTarget}
        setWorkflowIdsForTarget={setWorkflowIdsForTarget}
        workflows={workflows}
        workflowLoading={workflowLoading}
        selectedOrder={selectedOrder}
        selectedWorkflowEntityType={selectedWorkflowEntityType}
        canSubmit={canSubmit}
      />

      <WorkflowProgressDrawer
        open={workflowProgressDrawerOpen}
        loading={workflowProgressDrawerLoading}
        order={workflowProgressOrder}
        orderDetail={workflowProgressOrderDetail}
        workflowInstances={workflowProgressInstances}
        onClose={closeWorkflowProgressDrawer}
      />

      <GeneratedDocumentViewer
        open={quoteViewerOpen}
        loading={quoteLoading}
        template={quoteTemplate}
        data={quoteData}
        comments={QUOTATION_COMMENT_MOCKS}
        title={`Báo giá${quoteOrder?.code ? ` - ${quoteOrder.code}` : ''}`}
        onClose={closeQuotationViewer}
      />
    </>
  )
}

export default ListOrder
