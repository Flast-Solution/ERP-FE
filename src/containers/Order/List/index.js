import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Space, Tag } from 'antd'
import useGetMe from '@/hooks/useGetMe'
import { RestList } from '@flast-erp/core/components'
import { useGetList } from '@flast-erp/core/hooks'
import { dateFormatOnSubmit, f5List, InAppEvent, RequestUtils } from '@flast-erp/core/utils'
import GeneratedDocumentViewer from '@/components/GeneratedDocumentViewer'
import QuotationApproverSelect from './components/QuotationApproverSelect'
import { HASH_MODAL } from '@/configs'
import Filter from '../Filter'
import createOrderColumns from './columns/createOrderColumns'
import createOrderTrackingColumns from './columns/createOrderTrackingColumns'
import OrderLotExpandable from './components/OrderLotExpandable'
import OrderTrackingExpandedRow from './components/OrderTrackingExpandedRow'
import WorkflowAttachModal from './components/WorkflowAttachModal'
import WorkflowProgressDrawer from './components/WorkflowProgressDrawer'
import useOrderLots from './hooks/useOrderLots'
import useOrderWorkflowData from './hooks/useOrderWorkflowData'
import useOrderTrackingList from './hooks/useOrderTrackingList'
import useQuotationViewer from './hooks/useQuotationViewer'
import useWorkflowModal from './hooks/useWorkflowModal'
import useWorkflowProgressDrawer from './hooks/useWorkflowProgressDrawer'
import OrderInboundDrawer from './components/OrderInboundDrawer'
import {
  getOrderDetails,
  getShippingHistory,
  getWarehouseHistory,
  getWarehouseParcels,
} from './utils/orderTracking'
import './List.less'

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

const QUOTATION_STATUS_META = {
  0: { label: 'Chưa duyệt', color: 'default' },
  1: { label: 'Chờ duyệt', color: 'processing' },
  2: { label: 'Đã duyệt', color: 'success' },
}

const ORDER_TRACKING_API = 'erp/order-tracking/search'

const useOpportunityOrderList = ({ queryParams, ...options }) => {
  const opportunityQueryParams = useMemo(() => ({
    ...queryParams,
    type: 'cohoi',
  }), [queryParams])

  return useGetList({
    ...options,
    queryParams: opportunityQueryParams,
  })
}

const ListOrder = ({
  filter = {},
  hideQuoteButton,
  extraActions,
  enableLotTree = false,
  disableWorkflowAttach = false,
  showWorkflowProgressAction = false,
  apiPath = 'erp/order/fetch',
  orderMode = false,
  trackingOverview = false,
  detailDrawerHash = '#order.tabs',
  detailDrawerTitle,
}) => {
  const navigate = useNavigate()
  const { user, hasPermission } = useGetMe()
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [activeTrackingRowKey, setActiveTrackingRowKey] = useState(null)
  const isOrderList = orderMode || filter.type === 'order'
  const isOpportunityList = filter.type === 'cohoi'
  const useTrackingOverview = trackingOverview && isOrderList
  const listApiPath = useTrackingOverview ? ORDER_TRACKING_API : apiPath
  const canViewDetail = hasPermission(isOpportunityList
    ? 'sales.opportunity.detail.view'
    : 'sales.order.detail.view')
  const canUpdateOpportunity = isOpportunityList && hasPermission('sales.opportunity.update')
  const canUpdateOrder = isOrderList && hasPermission('sales.order.update')
  const canViewQuotation = isOpportunityList && hasPermission('sales.quotation.view')
  const canAttachWorkflow = hasPermission(isOpportunityList
    ? 'sales.opportunity.workflow.attach'
    : 'sales.order.workflow.attach')
  const canViewWorkflow = hasPermission(isOpportunityList
    ? 'sales.opportunity.workflow.view'
    : 'sales.order.workflow.view')
  const canCreateReceipt = isOrderList && hasPermission('inventory.receipt.create')
  const [opportunityStatusOptions, setOpportunityStatusOptions] = useState([])
  const [shippingStatusOptions, setShippingStatusOptions] = useState([])
  const [inboundOrder, setInboundOrder] = useState(null)

  useEffect(() => {
    let mounted = true

    if (!isOpportunityList) {
      setOpportunityStatusOptions([])
      return () => {
        mounted = false
      }
    }

    RequestUtils.GetAsList('/erp/order-status/fetch')
      .then((statuses) => {
        if (mounted) setOpportunityStatusOptions(Array.isArray(statuses) ? statuses : [])
      })
      .catch(() => {
        if (mounted) setOpportunityStatusOptions([])
      })

    return () => {
      mounted = false
    }
  }, [isOpportunityList])

  useEffect(() => {
    let mounted = true

    if (!useTrackingOverview) {
      setShippingStatusOptions([])
      return () => {
        mounted = false
      }
    }

    RequestUtils.GetAsList('/shipping/fetch-status')
      .then((statuses) => {
        if (mounted) setShippingStatusOptions(Array.isArray(statuses) ? statuses : [])
      })
      .catch(() => {
        if (mounted) setShippingStatusOptions([])
      })

    return () => {
      mounted = false
    }
  }, [useTrackingOverview])

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
  } = useWorkflowModal({
    setLotsByOrderId,
    onAttached: () => f5List(listApiPath),
  })

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
  } = useQuotationViewer({ approvalEnabled: isOpportunityList && !isOrderList, currentUserId: user?.id })

  const { onData } = useOrderWorkflowData(
    isOrderList || isOpportunityList
  )

  const handleOpenWorkflowModal = useCallback((record, entityType) => {
    openWorkflowModal(record, entityType, {
      splitOrderDetails: isOpportunityList,
    })
  }, [isOpportunityList, openWorkflowModal])

  const onClickViewDetail = useCallback((customerOrder) => InAppEvent.emit(HASH_MODAL, {
    hash: detailDrawerHash,
    title: detailDrawerTitle ?? ('Thông tin đơn hàng ' + customerOrder.code),
    data: { customerOrder, hideInvoiceTab: isOpportunityList },
  }), [detailDrawerHash, detailDrawerTitle, isOpportunityList])

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to'])
    return { ...values, ...filter }
  }, [filter])

  const actionWidth = (
    filter.type === 'cohoi' ? 260 : 220
  ) + ((extraActions?.length ?? 0) * 44) + (canCreateReceipt ? 44 : 0)

  const columnOptions = {
    isOpportunityList,
    showOrderDetailTooltip: isOpportunityList || isOrderList,
    opportunityStatusOptions,
    copiedIndex,
    setCopiedIndex,
    actionWidth,
    hideQuoteButton,
    disableWorkflowAttach,
    showWorkflowProgressAction,
    extraActions,
    onClickViewDetail,
    openQuotationViewer,
    openWorkflowModal: handleOpenWorkflowModal,
    openWorkflowProgressDrawer,
    navigate,
    canViewDetail,
    canUpdateOpportunity,
    canUpdateOrder,
    canViewQuotation,
    canAttachWorkflow,
    canViewWorkflow,
    canCreateReceipt,
    openOrderInboundDrawer: setInboundOrder,
  }

  const shippingStatusById = useMemo(() => shippingStatusOptions.reduce(
    (result, status) => ({ ...result, [String(status?.id)]: status }),
    {}
  ), [shippingStatusOptions])

  const columns = useTrackingOverview
    ? createOrderTrackingColumns({ ...columnOptions, shippingStatusById })
    : createOrderColumns(columnOptions)

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

  const trackingExpandable = useTrackingOverview
    ? {
      expandedRowRender: record => (
        <OrderTrackingExpandedRow
          record={record}
          shippingStatusById={shippingStatusById}
        />
      ),
      // Expand khi có dữ liệu cho 1 trong 3 tab của OrderTrackingExpandedRow
      rowExpandable: record => (
        getOrderDetails(record).length > 0
        || getWarehouseParcels(record).length > 0
        || getWarehouseHistory(record).length > 0
        || getShippingHistory(record).length > 0
      ),
    }
    : undefined

  return (
    <>
      <RestList
        rowKey={useTrackingOverview ? '_trackingRowKey' : 'id'}
        bordered
        size={useTrackingOverview ? 'small' : undefined}
        xScroll={isOpportunityList ? 1200 : (useTrackingOverview ? 3275 : 1800)}
        expandable={trackingExpandable ?? orderLotExpandable}
        onData={onData}
        initialFilter={{ limit: 10, page: 1, ...filter }}
        filter={<Filter />}
        hasCreate={false}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={isOpportunityList
          ? useOpportunityOrderList
          : (useTrackingOverview ? useOrderTrackingList : useGetList)}
        apiPath={listApiPath}
        columns={columns}
        rowClassName={record => (
          useTrackingOverview && record?._trackingRowKey === activeTrackingRowKey
            ? 'order-tracking-row order-tracking-row--active'
            : (useTrackingOverview ? 'order-tracking-row' : '')
        )}
        onRow={record => useTrackingOverview ? ({
          tabIndex: 0,
          onClick: () => setActiveTrackingRowKey(record?._trackingRowKey),
          onKeyDown: event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setActiveTrackingRowKey(record?._trackingRowKey)
            }
          },
        }) : {}}
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
        singleBlock={isOpportunityList}
        onClose={closeWorkflowProgressDrawer}
      />

      <OrderInboundDrawer
        key={inboundOrder?.id ?? 'order-inbound-closed'}
        open={Boolean(inboundOrder)}
        initialOrder={inboundOrder}
        onClose={() => setInboundOrder(null)}
      />

      <GeneratedDocumentViewer
        open={quoteViewerOpen}
        loading={quoteLoading}
        template={quoteTemplate}
        data={quoteData}
        comments={QUOTATION_COMMENT_MOCKS}
        title={`Báo giá${quoteOrder?.code ? ` - ${quoteOrder.code}` : ''}`}
        documentSubmitting={quoteSaving}
        readOnly={isOrderList || quoteReadOnly}
        onSubmitDocument={isOrderList || isQuoteApprover || quoteReadOnly || quoteLoading || !quoteTemplate ? undefined : saveQuotation}
        onApproveDocument={isQuoteApprover ? approveQuotation : undefined}
        onRejectDocument={isQuoteApprover ? rejectQuotation : undefined}
        reviewDisabled={quoteReviewDisabled}
        allowDocumentSubmit={isOpportunityList && !isOrderList}
        toolbarContent={isOpportunityList && !isOrderList ? (
          <Space wrap>
            <Tag color={QUOTATION_STATUS_META[quoteApprovalStatus]?.color}>
              {quoteLoading ? 'Đang kiểm tra...' : QUOTATION_STATUS_META[quoteApprovalStatus]?.label ?? 'Không xác định trạng thái'}
            </Tag>
            {!isQuoteApprover && !quoteLoading && quoteTemplate ? (
              <QuotationApproverSelect
                key={quoteOrder?.id}
                value={quoteApproverId}
                onChange={setQuoteApproverId}
                disabled={quoteLoading || quoteSaving || !quoteTemplate || quoteReadOnly}
              />
            ) : null}
          </Space>
        ) : undefined}
        onClose={closeQuotationViewer}
      />
    </>
  )
}

export default ListOrder
