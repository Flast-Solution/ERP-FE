import React, { useMemo } from 'react'
import { Button, Space, Table, Tooltip } from 'antd'
import { EditOutlined, EyeOutlined } from '@ant-design/icons'
import {
  formatListDate,
  getBomVersions,
  getProductLabel,
  getProductionDeadline,
  getProductionQuantity,
} from '../utils'

const getProductionOrderColumns = ({ onView, onEdit }) => [
  {
    title: 'Mã lệnh SX',
    dataIndex: 'productionOrderCode',
    key: 'productionOrderCode',
    width: 155,
    render: (value, record) => (
      <>
        <span className="production-code">{value}</span>
        <span className="production-cell-secondary">{formatListDate(record.createdAt)}</span>
      </>
    ),
  },
  {
    title: 'Khách hàng · Đơn hàng',
    key: 'customerOrder',
    width: 185,
    render: (_, record) => (
      <>
        <span>{record.customerName || '-'}</span>
        <span className="production-cell-secondary">{record.salesOrderCode || `#${record.salesOrderId}`}</span>
      </>
    ),
  },
  {
    title: 'Sản phẩm',
    key: 'products',
    width: 265,
    render: (_, record) => getProductLabel(record),
  },
  {
    title: 'BOM',
    key: 'bomVersions',
    width: 145,
    render: (_, record) => {
      const versions = getBomVersions(record)
      return versions.length > 0 ? (
        <div className="production-bom-list">
          {versions.map(version => (
            <span className="production-bom-code" key={version}>{version}</span>
          ))}
        </div>
      ) : '-'
    },
  },
  {
    title: 'SL',
    key: 'quantity',
    width: 90,
    align: 'right',
    render: (_, record) => getProductionQuantity(record).toLocaleString('vi-VN'),
  },
  {
    title: 'Deadline',
    key: 'deadline',
    width: 110,
    render: (_, record) => formatListDate(getProductionDeadline(record)),
  },
  {
    title: 'Người tạo lệnh',
    dataIndex: 'createdByName',
    key: 'createdBy',
    width: 125,
    render: (value, record) => value ?? (record.createdBy != null ? `#${record.createdBy}` : '-'),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: value => (
      <span className={`production-status ${value || 'new'}`}>
        {value === 'running' ? 'Đang chạy' : value === 'completed' ? 'Hoàn thành' : 'Mới tạo'}
      </span>
    ),
  },
  {
    title: 'Thao tác',
    key: 'actions',
    width: 100,
    align: 'center',
    fixed: 'right',
    render: (_, record) => (
      <Space size={4}>
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            icon={<EyeOutlined />}
            aria-label="Xem chi tiết"
            onClick={(event) => {
              event.stopPropagation()
              onView(record)
            }}
          />
        </Tooltip>
        <Tooltip title="Chỉnh sửa">
          <Button
            type="text"
            icon={<EditOutlined />}
            aria-label="Chỉnh sửa"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(record)
            }}
          />
        </Tooltip>
      </Space>
    ),
  },
]

const ProductionOrderTable = ({
  orders = [],
  loading = false,
  onView,
  onEdit,
}) => {
  const columns = useMemo(
    () => getProductionOrderColumns({ onView, onEdit }),
    [onView, onEdit],
  )

  return (
    <div className="production-list-table">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={false}
        bordered
        locale={{ emptyText: 'Chưa có lệnh sản xuất' }}
        scroll={{ x: 1450 }}
      />
    </div>
  )
}

export default ProductionOrderTable
