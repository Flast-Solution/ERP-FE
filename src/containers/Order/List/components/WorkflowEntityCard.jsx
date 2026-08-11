import React from 'react'
import { Descriptions, Typography } from 'antd'

const { Text, Title } = Typography

const WorkflowEntityCard = ({ entity, entityLabel = 'Đối tượng' }) => {
  const record = entity ?? {}
  const displayName = record.customerName
    || record.name
    || record.code
    || `#${record.id ?? ''}`

  return (
    <section className="workflow-detail-drawer__block">
      <Text className="workflow-detail-drawer__eyebrow">THÔNG TIN {String(entityLabel).toUpperCase()}</Text>
      <Title level={3} className="workflow-detail-drawer__order-code">{displayName}</Title>
      <Descriptions size="small" column={1} colon={false}>
        {record.customerMobile ? <Descriptions.Item label="Điện thoại">{record.customerMobile}</Descriptions.Item> : null}
        {record.customerEmail ? <Descriptions.Item label="Email">{record.customerEmail}</Descriptions.Item> : null}
        {record.productName ? <Descriptions.Item label="Sản phẩm">{record.productName}</Descriptions.Item> : null}
        {record.assignTo ? <Descriptions.Item label="Phụ trách">{record.assignTo}</Descriptions.Item> : null}
      </Descriptions>
    </section>
  )
}

export default WorkflowEntityCard
