import React, { useMemo } from 'react'
import { Button, Table } from 'antd'
import { InboxOutlined } from '@ant-design/icons'

import { formatTime } from '@flast-erp/core/utils'

const OrderLotsSection = ({
  lots,
  selectedLot,
  loading,
  onSelect,
  onOpenNcr,
}) => {
  const columns = useMemo(() => [
    {
      title: 'STT',
      key: 'index',
      width: 56,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Mã lô hàng',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (value) => value || '-',
    },
    {
      title: 'Mã đơn con',
      key: 'orderDetailCode',
      width: 150,
      render: (_, record) => record?.orderDetailCode ?? '-',
    },
    {
      title: 'Tên lô hàng',
      dataIndex: 'name',
      key: 'name',
      render: (value) => value || '-',
    },
    {
      title: 'NCR',
      key: 'ncr',
      width: 180,
      render: (_, record) => {
        const processId = record?.quanlityProcessId
        if (!processId || !record?.ncrWorkflowInstance?.id) return '-'

        const process = record?.ncrWorkflow
        const workflowName = process?.name
          ?? process?.processName
          ?? `Workflow #${processId}`

        return (
          <Button
            type="link"
            size="small"
            style={{ padding: 0, height: 'auto' }}
            onClick={(event) => {
              event.stopPropagation()
              onOpenNcr(record)
            }}
          >
            {workflowName}
          </Button>
        )
      },
    },
    {
      title: 'Ngày nhập lô',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      width: 140,
      render: (value) => formatTime(value) || '-',
    },
    {
      title: 'Số lượng',
      dataIndex: 'total',
      key: 'total',
      width: 110,
      align: 'right',
      render: (value) => value ?? 0,
    },
  ], [onOpenNcr])

  return (
    <div className="workflow-progress-section">
      <div className="workflow-progress-section-title">
        <InboxOutlined className="workflow-progress-section-icon" />
        <span>Danh sách lô hàng đã tạo</span>
      </div>
      <div className="workflow-lot-hint">
        Chọn một lô hàng để chuyển sang xem các workflow được gắn riêng cho lô đó.
      </div>
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={lots}
        pagination={false}
        onRow={(record) => ({
          onClick: () => onSelect(record),
          style: {
            cursor: 'pointer',
            background: String(selectedLot?.id) === String(record?.id) ? '#eff6ff' : undefined,
          },
        })}
      />
    </div>
  )
}

export default OrderLotsSection
