import React from 'react'
import { Col, Row } from 'antd'
import { FormInput, FormSelect } from '@flast-erp/core/components'

const STATUS_OPTIONS = [
  { value: 1, label: 'Hoạt động' },
  { value: 0, label: 'Ngưng' },
]

const BusinessUnitsFilter = () => (
  <Row gutter={16}>
    <Col xl={6} lg={6} md={8} xs={24}>
      <FormInput
        name="name"
        placeholder="Tên đơn vị"
      />
    </Col>
    <Col xl={6} lg={6} md={8} xs={24}>
      <FormInput
        name="code"
        placeholder="Mã đơn vị"
      />
    </Col>
    <Col xl={6} lg={6} md={8} xs={24}>
      <FormInput
        name="hotline"
        placeholder="Hotline"
      />
    </Col>
    <Col xl={6} lg={6} md={8} xs={24}>
      <FormInput
        name="email"
        placeholder="Email"
      />
    </Col>
    <Col xl={8} lg={8} md={12} xs={24}>
      <FormInput
        name="address"
        placeholder="Địa chỉ"
      />
    </Col>
    <Col xl={4} lg={4} md={8} xs={24}>
      <FormSelect
        name="status"
        placeholder="Trạng thái"
        resourceData={STATUS_OPTIONS}
        valueProp="value"
        titleProp="label"
        allowClear
      />
    </Col>
  </Row>
)

export default BusinessUnitsFilter
