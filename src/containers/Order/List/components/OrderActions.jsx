import React from 'react'
import { Button, Dropdown, Space, Tooltip } from 'antd'
import { ApartmentOutlined, EditFilled, EyeOutlined } from '@ant-design/icons'
import { clonePlainData } from '../utils/orderMappers'

const OrderActions = ({
  record,
  isOpportunityList,
  hideQuoteButton,
  disableWorkflowAttach,
  extraActions,
  onClickViewDetail,
  openQuotationViewer,
  openWorkflowModal,
  openWorkflowProgressDrawer,
  navigate,
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
      ...workflowDetails.map(detail => ({
        key: `progress:${detail.id}`,
        icon: <EyeOutlined />,
        label: (
          <span>
            <strong>Mã&nbsp;</strong> {detail.code}
          </span>
        ),
      })),
      hasParentWorkflowInstance && workflowDetails.length === 0 && {
        key: 'progress',
        icon: <EyeOutlined />,
        label: 'Xem tiến trình',
      },
      !disableWorkflowAttach && {
        key: 'attach',
        icon: <ApartmentOutlined />,
        label: hasWorkflowInstance ? 'Gắn thêm workflow' : 'Gắn workflow',
      },
    ].filter(Boolean)
    : [
      !disableWorkflowAttach && {
        key: 'attach',
        icon: <ApartmentOutlined />,
        label: hasParentWorkflowInstance ? 'Gắn thêm workflow' : 'Gắn workflow',
      },
      hasParentWorkflowInstance && {
        key: 'progress',
        icon: <EyeOutlined />,
        label: 'Xem tiến trình',
      },
    ].filter(Boolean)

  return (
    <Space gap={8}>
      <Button
        type="primary"
        size="small"
        onClick={() => onClickViewDetail(record)}
      >
        Chi tiết
      </Button>
      {!hideQuoteButton && (
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
      {workflowMenuItems.length > 0 ? (
        <Dropdown
          trigger={['click']}
          menu={{
            items: workflowMenuItems,
            onClick: ({ key, domEvent }) => {
              domEvent?.stopPropagation()
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
            },
          }}
        >
          <Tooltip title={hasWorkflowInstance ? 'Xem tiến trình' : 'Workflow'}>
            <Button
              size="small"
              icon={hasWorkflowInstance ? <EyeOutlined /> : <ApartmentOutlined />}
              onClick={(event) => event.stopPropagation()}
            />
          </Tooltip>
        </Dropdown>
      ) : null}
      {record.type === 'cohoi' && (
        <Button
          size="small"
          style={{ color: '#16c5faff' }}
          onClick={() => navigate(String('/sale/ban-hang/').concat(record.id))}
        >
          <EditFilled />
        </Button>
      )}
      {extraActions?.map((action, index) => (
        <Button
          key={index}
          size="small"
          {...action}
          onClick={() => action.onClick(record)}
        >
          {action.children}
        </Button>
      ))}
    </Space>
  )
}

export default OrderActions
