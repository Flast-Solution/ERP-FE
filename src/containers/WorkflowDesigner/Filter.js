import React from 'react'
import { Col, Row } from 'antd'
import { FormInput } from '@flast-erp/core/components'

const WorkflowDesignerFilter = () => (
  <Row gutter={16}>
    <Col xl={8} lg={8} md={12} xs={24}>
      <FormInput
        name="name"
        placeholder="Tên nghiệp vụ"
      />
    </Col>
    <Col xl={8} lg={8} md={12} xs={24}>
      <FormInput
        name="processKey"
        placeholder="Process key"
      />
    </Col>
    <Col xl={8} lg={8} md={12} xs={24}>
      <FormInput
        name="code"
        placeholder="Mã"
      />
    </Col>
  </Row>
)

export default WorkflowDesignerFilter
