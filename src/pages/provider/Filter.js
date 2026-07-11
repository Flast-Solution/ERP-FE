import React from 'react';
import { Col, Row } from 'antd';
import {
  FormInput,
  FormSelect,
} from '@flast-erp/core/components';

const STATUS_OPTIONS = [
  { id: 1, name: 'Kích hoạt' },
  { id: 0, name: 'Ngưng' },
];

const ProviderFilter = () => (
  <Row gutter={16}>
    <Col xl={6} lg={6} md={8} xs={24}>
      <FormInput
        name="code"
        placeholder="Mã nhà cung cấp"
      />
    </Col>
    <Col xl={6} lg={6} md={8} xs={24}>
      <FormInput
        name="name"
        placeholder="Tên nhà cung cấp"
      />
    </Col>
    <Col xl={6} lg={6} md={8} xs={24}>
      <FormInput
        name="phoneContact"
        placeholder="Số điện thoại"
      />
    </Col>
    <Col xl={6} lg={6} md={8} xs={24}>
      <FormSelect
        name="status"
        placeholder="Trạng thái"
        resourceData={STATUS_OPTIONS}
        valueProp="id"
        titleProp="name"
      />
    </Col>
  </Row>
);

export default ProviderFilter;
