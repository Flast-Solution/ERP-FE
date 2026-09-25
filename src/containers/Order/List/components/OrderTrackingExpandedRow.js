import React from 'react'
import { Empty, Table, Tabs, Tag, Tooltip, Typography } from 'antd'
import { formatMoney, formatTime } from '@flast-erp/core/utils'
import {
  formatQuantity,
  getOrderDetails,
  getSkuText,
  getWarehouseHistory,
  getShippingHistory,
} from '../utils/orderTracking'

const { Text } = Typography

const compactTableProps = {
  size: 'small',
  pagination: false,
  bordered: true,
}

const OrderTrackingExpandedRow = ({ record, shippingStatusById }) => {
  const details = getOrderDetails(record)
  const receipts = getWarehouseHistory(record)
  const shipping = getShippingHistory(record)

  const productColumns = [
    { title: 'Mã đơn con', dataIndex: 'code', width: 150 },
    {
      title: 'Sản phẩm / SKU',
      key: 'product',
      render: (_, detail) => (
        <div>
          <Text strong>{[detail?.productName, detail?.productCode].filter(Boolean).join(' - ') || '—'}</Text>
          <div><Text type="secondary">{getSkuText(detail) || 'Chưa có thuộc tính SKU'}</Text></div>
        </div>
      ),
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 120,
      align: 'right',
      render: (_, detail) => formatQuantity(detail?.quantity, detail?.unit),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      width: 130,
      align: 'right',
      render: value => formatMoney(value),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total',
      width: 140,
      align: 'right',
      render: value => formatMoney(value),
    },
  ]

  const receiptColumns = [
    { title: 'Mã phiếu nhập', dataIndex: 'receiptCode', width: 190 },
    { title: 'Đơn con', dataIndex: 'orderDetailCode', width: 150 },
    { title: 'Kho', dataIndex: 'stockName', width: 160, ellipsis: true },
    { title: 'Lô', dataIndex: 'lotNo', width: 120 },
    { title: 'Vị trí', dataIndex: 'binLocation', width: 110 },
    {
      title: 'Đã nhập',
      dataIndex: 'quantity',
      width: 110,
      align: 'right',
      render: value => formatQuantity(value),
    },
    {
      title: 'Ngày nhận',
      dataIndex: 'receivedAt',
      width: 140,
      render: value => formatTime(value) || '—',
    },
  ]

  const shippingColumns = [
    { title: 'Mã phiếu xuất', dataIndex: 'deliveryCode', width: 190 },
    { title: 'Đơn con', dataIndex: 'detailCode', width: 150, render: (value, item) => value || item?.orderDetailId || '—' },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 110,
      align: 'right',
      render: (_, item) => formatQuantity(
        (Array.isArray(item?.lots) ? item.lots : []).reduce(
          (total, lot) => total + Number(lot?.quantity ?? 0),
          0
        )
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 150,
      render: value => {
        const status = shippingStatusById[String(value)]
        return <Tag color={status?.color || 'processing'}>{status?.name || `Trạng thái ${value}`}</Tag>
      },
    },
    {
      title: 'Dự kiến giao',
      key: 'scheduledAt',
      width: 140,
      render: (_, item) => formatTime(item?.delivery?.scheduledAt) || '—',
    },
    {
      title: 'Người nhận / Địa chỉ',
      key: 'recipient',
      ellipsis: true,
      render: (_, item) => {
        const delivery = item?.delivery ?? {}
        const detail = [delivery?.recipientName, delivery?.recipientPhone, delivery?.address]
          .filter(Boolean)
          .join(' · ')
        return <Tooltip title={detail}><span>{detail || '—'}</span></Tooltip>
      },
    },
  ]

  const items = [
    {
      key: 'products',
      label: `Sản phẩm (${details.length})`,
      children: details.length > 0
        ? <Table {...compactTableProps} rowKey={item => item?.id ?? item?.code} columns={productColumns} dataSource={details} />
        : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có sản phẩm" />,
    },
    {
      key: 'receipts',
      label: `Lịch sử nhập kho (${receipts.length})`,
      children: receipts.length > 0
        ? <Table {...compactTableProps} rowKey={item => item?.id ?? item?.receiptCode} columns={receiptColumns} dataSource={receipts} scroll={{ x: 980 }} />
        : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phiếu nhập kho" />,
    },
    {
      key: 'shipping',
      label: `Xuất kho & giao hàng (${shipping.length})`,
      children: shipping.length > 0
        ? <Table {...compactTableProps} rowKey={item => item?.id ?? item?.deliveryCode} columns={shippingColumns} dataSource={shipping} scroll={{ x: 1050 }} />
        : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phiếu xuất kho" />,
    },
  ]

  return (
    <div style={{ padding: '0 12px 12px', background: '#fafafa' }}>
      <Tabs size="small" items={items} />
    </div>
  )
}

export default OrderTrackingExpandedRow

