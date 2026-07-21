import React from 'react'
import { Button, Dropdown, Space, Tooltip } from 'antd'
import { ApartmentOutlined, EditFilled, EyeOutlined } from '@ant-design/icons'
import { clonePlainData } from '../utils/orderMappers'

const OrderActions = ({
  record,
  hideQuoteButton,
  disableWorkflowAttach,
  extraActions,
  onClickViewDetail,
  openQuotationViewer,
  openWorkflowModal,
  navigate,
}) => {
  const hasWorkflowInstance = Boolean(record?.workflowInstance)
  const workflowMenuItems = [
    !disableWorkflowAttach && !hasWorkflowInstance && {
      key: 'attach',
      icon: <ApartmentOutlined />,
      label: 'Gắn workflow',
    },
    hasWorkflowInstance && {
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
              if (key === 'progress') {
                const instanceId = record.workflowInstance?.id
                navigate(`/sale/order/progress/${record.id}${instanceId ? `?instanceId=${instanceId}` : ''}`, {
                  state: {
                    order: clonePlainData(record),
                    workflowInstance: clonePlainData(record.workflowInstance),
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
