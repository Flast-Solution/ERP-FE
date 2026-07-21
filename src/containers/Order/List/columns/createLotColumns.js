import React from 'react'
import { Button, Space, Tag, Tooltip } from 'antd'
import { ApartmentOutlined, EditFilled, EyeOutlined } from '@ant-design/icons'
import { formatTime } from '@flast-erp/core/utils'
import { LOT_WORKFLOW_ENTITY_TYPE } from '../constants'
import { clonePlainData, mapOrderDetailsForLotPage } from '../utils/orderMappers'

const createLotColumns = ({ order, navigate, openWorkflowModal }) => [
  {
    title: 'Mã lô',
    dataIndex: 'code',
    key: 'code',
    width: 180,
    render: value => value || '-',
  },
  {
    title: 'Tên lô hàng',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
    render: value => value || '-',
  },
  {
    title: 'Loại',
    dataIndex: 'type',
    key: 'type',
    width: 150,
    render: value => value || '-',
  },
  {
    title: 'Số lượng',
    dataIndex: 'total',
    key: 'total',
    width: 120,
    align: 'right',
    render: value => value ?? 0,
  },
  {
    title: 'Ngày dự kiến',
    dataIndex: 'expectedDate',
    key: 'expectedDate',
    width: 180,
    render: value => formatTime(value) || '-',
  },
  {
    title: 'Ưu tiên',
    dataIndex: 'priorityLevel',
    key: 'priorityLevel',
    width: 130,
    render: value => {
      const priorityColor = {
        HIGH: 'red',
        NORMAL: 'blue',
        LOW: 'default',
      }[value] || 'default'
      return <Tag color={priorityColor}>{value || '-'}</Tag>
    },
  },
  {
    title: 'Thao tác',
    key: 'action',
    width: 110,
    fixed: 'right',
    render: (_, lot) => {
      const hasWorkflowInstance = Boolean(lot?.workflowInstance?.id)

      return (
        <Space size={8}>
          <Tooltip title="Chỉnh sửa lô hàng">
            <Button
              size="small"
              icon={<EditFilled />}
              onClick={(event) => {
                event.stopPropagation()
                navigate('/sale/production/lots/create', {
                  state: {
                    customerOrder: order,
                    orderDetails: mapOrderDetailsForLotPage(order),
                    editingLot: clonePlainData(lot),
                  },
                })
              }}
            />
          </Tooltip>
          {!hasWorkflowInstance ? (
            <Tooltip title="Gắn workflow">
              <Button
                size="small"
                icon={<ApartmentOutlined />}
                onClick={(event) => {
                  event.stopPropagation()
                  openWorkflowModal(lot, LOT_WORKFLOW_ENTITY_TYPE)
                }}
              />
            </Tooltip>
          ) : null}
          {hasWorkflowInstance ? (
            <Tooltip title="Xem tiến trình">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={(event) => {
                  event.stopPropagation()
                  navigate(`/sale/order/progress/${order.id}?instanceId=${lot.workflowInstance.id}`, {
                    state: {
                      order: clonePlainData(order),
                      lot: clonePlainData(lot),
                      workflowInstance: clonePlainData(lot.workflowInstance),
                    },
                  })
                }}
              />
            </Tooltip>
          ) : null}
        </Space>
      )
    },
  },
]

export default createLotColumns
