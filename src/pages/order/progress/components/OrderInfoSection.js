import React from 'react'
import { Descriptions, Table, Typography } from 'antd'
import { ShoppingCartOutlined } from '@ant-design/icons'

import { formatMoney } from '@flast-erp/core/utils'

const { Text } = Typography

const orderDetailColumns = [
  {
    title: 'STT',
    key: 'index',
    width: 56,
    render: (_, __, index) => index + 1,
  },
  {
    title: 'Nội dung',
    key: 'name',
    render: (_, record) => record?.productName ?? '-',
  },
  {
    title: 'SL',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 90,
    align: 'right',
    render: (value) => value ?? 0,
  },
  {
    title: 'Thành tiền',
    key: 'total',
    width: 130,
    align: 'right',
    render: (_, record) => formatMoney(record?.totalPrice ?? 0),
  },
]

const OrderInfoSection = ({ order }) => {
  const orderDetailRows = Array.isArray(order?.details) ? order.details : []

  return (
    <div>
      <div className="workflow-progress-section-title">
        <ShoppingCartOutlined className="workflow-progress-section-icon" />
        <span>Thông tin đơn hàng</span>
      </div>
      <Table
        rowKey="detailId"
        size="small"
        columns={orderDetailColumns}
        dataSource={orderDetailRows}
        pagination={false}
      />
      <div style={{ marginTop: 16 }}>
        <Descriptions
          size="small"
          column={1}
          items={[
            { key: 'total', label: 'Tổng chi phí', children: formatMoney(order?.total ?? 0) },
            { key: 'shipping', label: 'Phí vận chuyển', children: formatMoney(order?.shippingCost ?? 0) },
            {
              key: 'vat',
              label: 'VAT',
              children: formatMoney(Number(order?.total ?? 0) * (Number(order?.vat ?? 0) / 100)),
            },
            { key: 'discount', label: 'Chiết khấu', children: formatMoney(order?.priceOff ?? 0) },
            { key: 'paid', label: 'Đã thanh toán', children: formatMoney(order?.paid ?? 0) },
            {
              key: 'remaining',
              label: 'Còn lại',
              children: (
                <Text strong type="success">
                  {formatMoney(Number(order?.total ?? 0) - Number(order?.paid ?? 0))}
                </Text>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}

export default OrderInfoSection
