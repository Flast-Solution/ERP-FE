import React from 'react'
import { Button, Dropdown, Popconfirm, Space, Tooltip } from 'antd'
import { ApartmentOutlined, DeleteOutlined, EditFilled, EyeOutlined, InboxOutlined, TruckOutlined } from '@ant-design/icons'
import { clonePlainData } from '../utils/orderMappers'

const OrderActions = ({
  record,
  isOpportunityList,
  hideQuoteButton,
  disableWorkflowAttach,
  showWorkflowProgressAction,
  extraActions,
  onClickViewDetail,
  openQuotationViewer,
  openWorkflowModal,
  openWorkflowProgressDrawer,
  navigate,
  canViewDetail,
  canUpdateOpportunity,
  cancelOpportunity,
  cancellingOpportunityId,
  canUpdateOrder,
  canViewQuotation,
  canAttachWorkflow,
  canViewWorkflow,
  canCreateReceipt,
  openOrderInboundDrawer,
  canCreateDelivery,
  openOrderDeliveryDrawer,
}) => {
  const workflowDetails = (record?.details ?? []).filter(detail => (
    Array.isArray(detail?.workflowInstances) && detail.workflowInstances.length > 0
  ))
  const parentWorkflowInstances = Array.isArray(record?.workflowInstances)
    ? record.workflowInstances
    : (record?.workflowInstance ? [record.workflowInstance] : [])
  const hasParentWorkflowInstance = parentWorkflowInstances.length > 0
  const hasWorkflowInstance = isOpportunityList
    ? hasParentWorkflowInstance || workflowDetails.length > 0
    : hasParentWorkflowInstance
  const workflowMenuItems = isOpportunityList
    ? [
      ...(canViewWorkflow ? workflowDetails.map(detail => ({
        key: `progress:${detail.id}`,
        icon: <EyeOutlined />,
        label: (
          <span>
            <strong>Mã&nbsp;</strong> {detail.code}
          </span>
        ),
      })) : []),
      canViewWorkflow && hasParentWorkflowInstance && workflowDetails.length === 0 && {
        key: 'progress',
        icon: <EyeOutlined />,
        label: 'Xem tiến trình',
      },
      canAttachWorkflow && !disableWorkflowAttach && {
        key: 'attach',
        icon: <ApartmentOutlined />,
        label: hasWorkflowInstance ? 'Gắn thêm workflow' : 'Gắn workflow',
      },
    ].filter(Boolean)
    : [
      canAttachWorkflow && !disableWorkflowAttach && {
        key: 'attach',
        icon: <ApartmentOutlined />,
        label: hasParentWorkflowInstance ? 'Gắn thêm workflow' : 'Gắn workflow',
      },
      canViewWorkflow && (hasParentWorkflowInstance || showWorkflowProgressAction) && {
        key: 'progress',
        icon: <EyeOutlined />,
        label: 'Xem tiến trình',
        disabled: !hasParentWorkflowInstance,
      },
    ].filter(Boolean)

  const handleWorkflowAction = (key, event) => {
    event?.stopPropagation?.()
    if (key === 'attach') {
      openWorkflowModal(record)
      return
    }
    if (key.startsWith('progress:')) {
      const detailId = key.slice('progress:'.length)
      const detail = workflowDetails.find(item => String(item?.id) === detailId)
      if (detail) {
        openWorkflowProgressDrawer(record, detail)
      }
      return
    }
    if (key === 'progress') {
      navigate(`/sale/order/progress/${record.id}`, {
        state: {
          order: clonePlainData(record),
        },
      })
    }
  }

  const singleWorkflowAction = workflowMenuItems.length === 1
    ? workflowMenuItems[0]
    : null
  const isDirectProgressAction = singleWorkflowAction?.key === 'progress'
    || singleWorkflowAction?.key?.startsWith('progress:')

  return (
    <Space gap={8}>
      {canViewDetail ? <Button
        type="primary"
        size="small"
        onClick={() => onClickViewDetail(record)}
      >
        Chi tiết
      </Button> : null}
      {canViewQuotation && !hideQuoteButton && (
        <Button
          size="small"
          style={{ color: '#fa8c16' }}
          onClick={(event) => {
            event.stopPropagation()
            openQuotationViewer(record)
          }}
        >
          Báo giá
        </Button>
      )}
      {isDirectProgressAction ? (
        <Tooltip title={singleWorkflowAction.disabled ? 'Chưa có workflow' : 'Xem tiến trình'}>
          <span>
            <Button
              size="small"
              icon={<EyeOutlined />}
              disabled={singleWorkflowAction.disabled}
              onClick={(event) => handleWorkflowAction(singleWorkflowAction.key, event)}
            />
          </span>
        </Tooltip>
      ) : workflowMenuItems.length > 0 ? (
        <Dropdown
          trigger={['click']}
          menu={{
            items: workflowMenuItems,
            onClick: ({ key, domEvent }) => handleWorkflowAction(key, domEvent),
          }}
        >
          <Tooltip title={hasWorkflowInstance ? 'Xem tiến trình' : 'Chưa có workflow'}>
            <Button
              size="small"
              icon={(hasWorkflowInstance || showWorkflowProgressAction)
                ? <EyeOutlined />
                : <ApartmentOutlined />}
              disabled={showWorkflowProgressAction && !hasWorkflowInstance}
              onClick={(event) => event.stopPropagation()}
            />
          </Tooltip>
        </Dropdown>
      ) : null}
      {canUpdateOpportunity && record.type === 'cohoi' && (
        <Button
          size="small"
          style={{ color: '#16c5faff' }}
          onClick={() => navigate(String('/sale/ban-hang/').concat(record.id))}
        >
          <EditFilled />
        </Button>
      )}
      {isOpportunityList && canUpdateOpportunity && (
        <span onClick={event => event.stopPropagation()}>
          <Popconfirm
            title="Xóa cơ hội bán hàng?"
            description="Bạn có chắc muốn hủy cơ hội bán hàng này?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            disabled={cancellingOpportunityId != null}
            onConfirm={() => cancelOpportunity(record)}
          >
            <Tooltip title="Xóa cơ hội bán hàng">
              <Button danger size="small" icon={<DeleteOutlined />}
                aria-label="Xóa cơ hội bán hàng"
                loading={cancellingOpportunityId === record.id}
                disabled={cancellingOpportunityId != null && cancellingOpportunityId !== record.id}
              />
            </Tooltip>
          </Popconfirm>
        </span>
      )}
      {canUpdateOrder && record.type === 'order' && (
        <Button
          size="small"
          style={{ color: '#16c5faff' }}
          onClick={() => navigate(`/sale/ban-hang/${record.id}?type=order`)}
        >
          <EditFilled />
        </Button>
      )}
      {canCreateReceipt && record.type === 'order' && (
        <Tooltip title="Nhập kho theo đơn">
          <Button
            size="small"
            icon={<InboxOutlined />}
            aria-label="Nhập kho theo đơn"
            style={{ color: '#389e0d', borderColor: '#b7eb8f' }}
            onClick={(event) => {
              event.stopPropagation()
              openOrderInboundDrawer(record)
            }}
          />
        </Tooltip>
      )}
      {canCreateDelivery && record.type === 'order' && (
        <Tooltip title="Giao hàng">
          <Button type="primary" size="small" icon={<TruckOutlined />} aria-label="Giao hàng"
            onClick={event => { event.stopPropagation(); openOrderDeliveryDrawer(record) }} />
        </Tooltip>
      )}
      {extraActions?.filter(action => action.visible?.(record) !== false).map((action, index) => {
        const { visible, ...buttonAction } = action
        return (
        <Button
          key={action.key ?? action.children ?? index}
          size="small"
          {...buttonAction}
          onClick={() => action.onClick(record)}
        >
          {action.children}
        </Button>
        )
      })}
    </Space>
  )
}

export default OrderActions
