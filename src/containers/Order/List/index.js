import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Space, Tag } from 'antd';
import useGetMe from '@/hooks/useGetMe';
import { RestList } from '@flast-erp/core/components';
import { useGetList } from '@flast-erp/core/hooks';
import { dateFormatOnSubmit, f5List, InAppEvent, RequestUtils } from '@flast-erp/core/utils';
import GeneratedDocumentViewer from '@erp/shared-ui/components/GeneratedDocumentViewer/index';
import QuotationApproverSelect from './components/QuotationApproverSelect';
import { HASH_MODAL } from '@/configs';
import Filter from '../Filter';
import createOrderColumns from './columns/createOrderColumns';
import OrderLotExpandable from './components/OrderLotExpandable';
import WorkflowAttachModal from './components/WorkflowAttachModal';
import WorkflowProgressDrawer from './components/WorkflowProgressDrawer';
import useOrderLots from './hooks/useOrderLots';
import useOrderWorkflowData from './hooks/useOrderWorkflowData';
import useQuotationViewer from './hooks/useQuotationViewer';
import useWorkflowModal from './hooks/useWorkflowModal';
import useWorkflowProgressDrawer from './hooks/useWorkflowProgressDrawer';
import OrderInboundDrawer from './components/OrderInboundDrawer';
import './List.less';

const QUOTATION_COMMENT_MOCKS = [
  {
    id: 'quotation-comment-1',
    author: 'Lan Anh',
    role: 'Khách hàng',
    time: '10:24',
    content:
      'Bên em thấy mục giá phân hệ kho hơi cao so với ngân sách. Anh/chị có thể xem lại được không ạ?',
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
];

const QUOTATION_STATUS_META = {
  0: { label: 'Chưa duyệt', color: 'default' },
  1: { label: 'Chờ duyệt', color: 'processing' },
  2: { label: 'Đã duyệt', color: 'success' },
};

const useOpportunityOrderList = ({ queryParams, ...options }) => {
  const opportunityQueryParams = useMemo(
    () => ({
      ...queryParams,
      type: 'cohoi',
    }),
    [queryParams],
  );

  return useGetList({
    ...options,
    queryParams: opportunityQueryParams,
  });
};

const ListOrder = ({
  filter = {},
  hideQuoteButton,
  extraActions,
  enableLotTree = false,
  disableWorkflowAttach = false,
  showWorkflowProgressAction = false,
  apiPath = 'erp/order/fetch',
  orderMode = false,
  hideEditorEditColumn = false,
  detailDrawerHash = '#order.tabs',
  detailDrawerTitle,
}) => {
  const navigate = useNavigate();
  const { user, hasPermission } = useGetMe();
  const [cancellingOpportunityId, setCancellingOpportunityId] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const isOrderList = orderMode || filter.type === 'order';
  const isOpportunityList = filter.type === 'cohoi';
  const listApiPath = apiPath;
  const canViewDetail = hasPermission(
    isOpportunityList ? 'sales.opportunity.detail.view' : 'sales.order.detail.view',
  );
  const canUpdateOpportunity = isOpportunityList && hasPermission('sales.opportunity.update');
  const canUpdateOrder = isOrderList && hasPermission('sales.order.update');
  const canDeleteOrder = canUpdateOrder && !apiPath.includes('manufacture/');
  const canViewQuotation = isOpportunityList && hasPermission('sales.quotation.view');
  const canAttachWorkflow = hasPermission(
    isOpportunityList ? 'sales.opportunity.workflow.attach' : 'sales.order.workflow.attach',
  );
  const canViewWorkflow = hasPermission(
    isOpportunityList ? 'sales.opportunity.workflow.view' : 'sales.order.workflow.view',
  );
  const canCreateReceipt = isOrderList && hasPermission('inventory.receipt.create');
  const [opportunityStatusOptions, setOpportunityStatusOptions] = useState([]);
  const [inboundOrder, setInboundOrder] = useState(null);

  useEffect(() => {
    let mounted = true;

    if (!isOpportunityList) {
      setOpportunityStatusOptions([]);
      return () => {
        mounted = false;
      };
    }

    RequestUtils.GetAsList('/erp/order-status/fetch')
      .then((statuses) => {
        if (mounted) setOpportunityStatusOptions(Array.isArray(statuses) ? statuses : []);
      })
      .catch(() => {
        if (mounted) setOpportunityStatusOptions([]);
      });

    return () => {
      mounted = false;
    };
  }, [isOpportunityList]);

  const { expandedRowKeys, lotsByOrderId, loadingLotsByOrderId, setLotsByOrderId, handleExpand } =
    useOrderLots();

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
  });

  const {
    workflowProgressDrawerOpen,
    workflowProgressDrawerLoading,
    workflowProgressOrder,
    workflowProgressOrderDetail,
    workflowProgressInstances,
    openWorkflowProgressDrawer,
    closeWorkflowProgressDrawer,
  } = useWorkflowProgressDrawer();

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
  } = useQuotationViewer({
    approvalEnabled: isOpportunityList && !isOrderList,
    currentUserId: user?.id,
  });

  const { onData } = useOrderWorkflowData(isOrderList || isOpportunityList);

  const handleOpenWorkflowModal = useCallback(
    (record, entityType) => {
      openWorkflowModal(record, entityType, {
        splitOrderDetails: isOpportunityList,
      });
    },
    [isOpportunityList, openWorkflowModal],
  );

  const onClickViewDetail = useCallback(
    (customerOrder) =>
      InAppEvent.emit(HASH_MODAL, {
        hash: detailDrawerHash,
        title: detailDrawerTitle ?? 'Thông tin đơn hàng ' + customerOrder.code,
        data: {
          customerOrder,
          hideInvoiceTab: isOpportunityList,
          simplifiedPayment: isOpportunityList,
        },
      }),
    [detailDrawerHash, detailDrawerTitle, isOpportunityList],
  );

  const beforeSubmitFilter = useCallback(
    (values) => {
      dateFormatOnSubmit(values, ['from', 'to']);
      return { ...values, ...filter };
    },
    [filter],
  );

  const cancelOpportunity = async (record) => {
    const entityLabel = isOpportunityList ? 'cơ hội bán hàng' : 'đơn hàng';
    setCancellingOpportunityId(record.id);
    try {
      const response = await RequestUtils.Post(
        `/order/cancel-co-hoi?orderId=${encodeURIComponent(record.id)}`,
        {},
      );
      if (
        response?.success === false ||
        (response?.success !== true && Number(response?.errorCode) !== 200)
      ) {
        throw new Error(response?.message || `Không thể xóa ${entityLabel}.`);
      }
      message.success(`Đã xóa ${entityLabel}.`);
      f5List(listApiPath);
    } catch (error) {
      message.error(
        error?.response?.data?.message || error?.message || `Không thể xóa ${entityLabel}.`,
      );
    } finally {
      setCancellingOpportunityId(null);
    }
  };

  const actionWidth =
    (filter.type === 'cohoi' ? 260 : 220) +
    (extraActions?.length ?? 0) * 44 +
    (canCreateReceipt ? 44 : 0) +
    (canUpdateOpportunity ? 44 : 0) +
    (canDeleteOrder ? 44 : 0);

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
    navigate: (to, options) =>
      navigate(
        to,
        String(to).startsWith('/sale/ban-hang/')
          ? {
              ...options,
              state: {
                ...options?.state,
                hideEditColumn: hideEditorEditColumn || options?.state?.hideEditColumn,
                restrictOrderFields: options?.state?.restrictOrderFields,
              },
            }
          : options,
      ),
    canViewDetail,
    canUpdateOpportunity,
    cancelOpportunity,
    cancellingOpportunityId,
    canUpdateOrder,
    canDeleteOrder,
    canViewQuotation,
    canAttachWorkflow,
    canViewWorkflow,
    canCreateReceipt,
    openOrderInboundDrawer: setInboundOrder,
  };

  const columns = createOrderColumns(columnOptions);

  const orderLotExpandable = enableLotTree
    ? OrderLotExpandable({
        expandedRowKeys,
        onExpand: handleExpand,
        lotsByOrderId,
        loadingLotsByOrderId,
        navigate,
        openWorkflowModal: handleOpenWorkflowModal,
      })
    : undefined;

  return (
    <>
      <RestList
        rowKey="id"
        bordered
        xScroll={isOpportunityList ? 1200 : 1800}
        expandable={orderLotExpandable}
        onData={onData}
        initialFilter={{ limit: isOrderList ? 20 : 10, page: 1, ...filter }}
        filter={<Filter />}
        hasCreate={false}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={isOpportunityList ? useOpportunityOrderList : useGetList}
        apiPath={listApiPath}
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
        onSubmitDocument={
          isOrderList || isQuoteApprover || quoteReadOnly || quoteLoading || !quoteTemplate
            ? undefined
            : saveQuotation
        }
        onApproveDocument={isQuoteApprover ? approveQuotation : undefined}
        onRejectDocument={isQuoteApprover ? rejectQuotation : undefined}
        reviewDisabled={quoteReviewDisabled}
        allowDocumentSubmit={isOpportunityList && !isOrderList}
        toolbarContent={
          isOpportunityList && !isOrderList ? (
            <Space wrap>
              <Tag color={QUOTATION_STATUS_META[quoteApprovalStatus]?.color}>
                {quoteLoading
                  ? 'Đang kiểm tra...'
                  : (QUOTATION_STATUS_META[quoteApprovalStatus]?.label ??
                    'Không xác định trạng thái')}
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
          ) : undefined
        }
        onClose={closeQuotationViewer}
      />
    </>
  );
};

export default ListOrder;
