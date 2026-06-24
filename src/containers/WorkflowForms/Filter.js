import React from 'react'
import { Col, Form, Row, Select } from 'antd'
import { FormInput } from '@flast-erp/core/components'

const statusOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đã xuất bản', value: 'published' },
  { label: 'Nháp', value: 'draft' },
  { label: 'Chưa gắn bước', value: 'unassigned' },
]

const WorkflowFormsFilter = () => (
  <Row gutter={16}>
    <Col xl={8} lg={8} md={12} xs={24}>
      <FormInput
        name="keyword"
        placeholder="Tên form hoặc form_key"
      />
    </Col>
    <Col xl={8} lg={8} md={12} xs={24}>
      <FormInput
        name="domain"
        placeholder="Tiêu chuẩn"
      />
    </Col>
    <Col xl={8} lg={8} md={12} xs={24}>
      <Form.Item name="status">
        <Select
          allowClear
          options={statusOptions}
          placeholder="Trạng thái"
        />
      </Form.Item>
    </Col>
  </Row>
)

export default WorkflowFormsFilter
