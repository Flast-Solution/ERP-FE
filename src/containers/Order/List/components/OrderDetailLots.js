import React, { useEffect, useState } from 'react'
import { Alert, Button, Checkbox, Table } from 'antd'
import { formatQuantity } from '../utils/orderTracking'
import { fetchOrderDetailLots } from '../utils/orderDetailLots'

const displayValue = (value, type) => {
  if (value == null || value === '') return '—'
  if (type === 'boolean' || typeof value === 'boolean') {
    return <Checkbox checked={value === true || value === 'true'} disabled aria-label="Kết quả đánh giá" />
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const OrderDetailLots = ({ detailId }) => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setRows([])
    fetchOrderDetailLots(detailId)
      .then(result => { if (active) setRows(result) })
      .catch(failure => { if (active) setError(failure?.message || 'Không tải được chi tiết lot.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [detailId, retry])

  const criteria = new Map()
  rows.forEach(row => row._criteria.forEach(criterion => {
    if (criterion?.id != null) criteria.set(String(criterion.id), criterion)
  }))
  const columns = [
    { title: 'Mã lot', dataIndex: 'code_lot', width: 130 },
    { title: 'Tên lot', dataIndex: 'name_lot', width: 160 },
    { title: 'Số lượng', dataIndex: 'so_luong', width: 110, align: 'right', render: value => formatQuantity(value) },
    ...Array.from(criteria.values()).map(criterion => ({
      title: criterion.name || criterion.id,
      key: `criterion-${criterion.id}`,
      width: 160,
      render: (_, row) => displayValue(row.danh_gia?.[criterion.id], criterion.type),
    })),
  ]
  return (
    <div style={{ padding: 12 }} onClick={event => event.stopPropagation()}>
      {error ? <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => setRetry(value => value + 1)}>Thử lại</Button>} /> : (
        <Table size="small" bordered rowKey="_rowKey" columns={columns} dataSource={rows} loading={loading}
          pagination={false} scroll={{ x: columns.reduce((sum, column) => sum + column.width, 0) }}
          locale={{ emptyText: 'Đơn con chưa có dữ liệu lot' }} />
      )}
    </div>
  )
}

export default OrderDetailLots
