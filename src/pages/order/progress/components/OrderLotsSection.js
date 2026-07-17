import React, { useMemo } from 'react'
import { Table } from 'antd'
import { InboxOutlined } from '@ant-design/icons'

import { formatTime } from '@flast-erp/core/utils'

const OrderLotsSection = ({
  lots,
  selectedLot,
  loading,
  onSelect,
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
  ], [])

  return (
    <div className="workflow-progress-section">
      <div className="workflow-progress-section-title">
        <InboxOutlined className="workflow-progress-section-icon" />
        <span>Danh sách lô hàng đã tạo</span>
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
