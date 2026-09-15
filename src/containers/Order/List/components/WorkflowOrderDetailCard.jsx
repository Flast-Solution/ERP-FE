import React from 'react'
import { Table, Typography } from 'antd'
import { formatMoney } from '@flast-erp/core/utils'

const { Text, Title } = Typography

const WorkflowOrderDetailCard = ({ order, orderDetail }) => {
  const columns = [
    {
      title: 'STT',
      width: 64,
      align: 'center',
      render: () => 1,
    },
    {
      title: 'Nội dung',
      render: () => (
        <div>
          <Text strong>{orderDetail?.productName ?? orderDetail?.name ?? '-'}</Text>
          {(orderDetail?.mSkuDetails ?? []).map((skuGroup, index) => (
            <div className="workflow-detail-drawer__sku" key={`${skuGroup?.text}-${index}`}>
              <Text strong>{skuGroup?.text}:</Text>{' '}
              {(skuGroup?.values ?? []).map(value => value?.text).filter(Boolean).join(', ') || '-'}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      width: 120,
      align: 'right',
      render: value => value ?? 0,
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      width: 150,
      align: 'right',
      render: value => formatMoney(value ?? 0),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      width: 160,
      align: 'right',
      render: value => <Text strong>{formatMoney(value ?? 0)}</Text>,
    },
  ]

  return (
    <section className="workflow-detail-drawer__block">
      <Text className="workflow-detail-drawer__eyebrow">THÔNG TIN ĐƠN HÀNG</Text>
      <Title level={3} className="workflow-detail-drawer__order-code">
        #{orderDetail?.code ?? order?.code ?? '-'}
      </Title>
      <Table
        rowKey={record => String(record?.id ?? record?.detailId ?? orderDetail?.code)}
        columns={columns}
        dataSource={orderDetail ? [orderDetail] : []}
        pagination={false}
        scroll={{ x: 680 }}
      />
    </section>
  )
}

export default WorkflowOrderDetailCard
