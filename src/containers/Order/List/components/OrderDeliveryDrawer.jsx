import React, { useEffect, useState } from 'react'
import { Alert, Button, Drawer, Table } from 'antd'
import { TruckOutlined } from '@ant-design/icons'
import { InAppEvent, RequestUtils } from '@flast-erp/core/utils'
import { HASH_MODAL } from '@/configs'
import { groupOrderDeliveryStock } from '../utils/orderDelivery'

const OrderDeliveryDrawer = ({ order, onClose, onSaved }) => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (order?.id == null) return undefined
    let active = true
    setRows([])
    setLoading(true)
    setError('')
    RequestUtils.Get('/erp/warehouse/fetch-history', { orderId: order.id, isFull: 'True' })
      .then(response => {
        if (response?.success === false || (response?.errorCode != null && response.errorCode !== 200)) {
          throw new Error(response.message || 'Không tải được tồn kho của đơn hàng.')
        }
        const history = Array.isArray(response?.data) ? response.data : response?.data?.embedded
        if (!Array.isArray(history)) throw new Error('Dữ liệu tồn kho không hợp lệ.')
        if (active) setRows(groupOrderDeliveryStock(order, history))
      })
      .catch(failure => { if (active) setError(failure.message || 'Không tải được tồn kho của đơn hàng.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [order, retry])
  const openDelivery = row => {
    onClose()
    InAppEvent.emit(HASH_MODAL, {
      hash: '#warehouse.delivery', title: 'Giao hàng',
      data: { itemInStock: row.itemInStock, inStocks: row.inStocks, skuId: row.itemInStock.skuId,
        orderDetailId: row.orderDetailId, onSaved },
    })
  }
  return (
    <Drawer title={`Giao hàng — ${order?.code ?? ''}`} open={Boolean(order)} onClose={onClose} width={900}>
      {error ? <Alert type="error" showIcon message={error} action={<Button onClick={() => setRetry(value => value + 1)}>Thử lại</Button>} /> : (
        <Table size="small" rowKey="key" dataSource={rows} loading={loading} pagination={false} scroll={{ x: 750 }}
          locale={{ emptyText: 'Đơn hàng chưa có lot tồn kho khả dụng để giao.' }}
          columns={[
            { title: 'Đơn con', dataIndex: 'detailCode' },
            { title: 'Sản phẩm', dataIndex: 'productName' },
            { title: 'SKU', render: (_, row) => row.itemInStock.skuId ?? '—' },
            { title: 'Kho', dataIndex: 'stockName' },
            { title: 'Tồn còn', dataIndex: 'quantity', align: 'right', render: value => value.toLocaleString('vi-VN') },
            { title: '', key: 'action', render: (_, row) => <Button icon={<TruckOutlined />} onClick={() => openDelivery(row)}>Giao hàng</Button> },
          ]} />
      )}
    </Drawer>
  )
}

export default OrderDeliveryDrawer
