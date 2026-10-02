import React from 'react'
import { Descriptions, Tag, Typography } from 'antd'
import { formatCurrency as formatMoney } from '../../../../utils/formatCurrency';

const { Text, Title } = Typography

const WorkflowProductCard = ({ product }) => (
  <section className="workflow-detail-drawer__block">
    <Text className="workflow-detail-drawer__eyebrow">THÔNG TIN SẢN PHẨM</Text>
    <Title level={3} className="workflow-detail-drawer__order-code">
      {product?.name || 'Sản phẩm'}
    </Title>
    <Descriptions
      bordered
      size="small"
      column={{ xs: 1, sm: 2 }}
      items={[
        { key: 'code', label: 'Mã sản phẩm', children: product?.code || '-' },
        { key: 'unit', label: 'Đơn vị', children: product?.unit || '-' },
        { key: 'price', label: 'Giá bán', children: formatMoney(product?.price ?? 0, product?.currency) },
        {
          key: 'status',
          label: 'Trạng thái',
          children: Number(product?.status) === 1
            ? <Tag color="green">Kích hoạt</Tag>
            : <Tag>Ngưng</Tag>,
        },
      ]}
    />
  </section>
)

export default WorkflowProductCard
