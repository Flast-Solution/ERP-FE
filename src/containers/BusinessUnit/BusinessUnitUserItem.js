import React from 'react'
import { Col, Row, Typography } from 'antd'
import {
  FormHidden,
  FormInput,
  FormSelect,
} from '@flast-erp/core/components'
import { USER_STATUS } from '@/configs/localData'

const BusinessUnitUserItem = ({ field, listProFile = [] }) => {
  const { name } = field || { name: 0 }

  return (
    <Row gutter={16}>
      <Col md={12} xs={24}>
        <FormHidden name={[name, 'id']} />
        <FormHidden name={[name, 'bizId']} />
        <FormInput
          required
          name={[name, 'fullName']}
          label="Họ tên"
          placeholder="Nhập họ tên"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          required
          name={[name, 'ssoId']}
          label="Tài khoản"
          placeholder="Tên đăng nhập"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          name={[name, 'password']}
          label="Mật khẩu"
          placeholder="Mật khẩu đăng nhập"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          required
          name={[name, 'phone']}
          label="Số điện thoại"
          placeholder="Số điện thoại"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          required
          name={[name, 'email']}
          label="Email"
          placeholder="Email"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelect
          name={[name, 'status']}
          label="Trạng thái"
          resourceData={USER_STATUS}
          valueProp="value"
          titleProp="text"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          name={[name, 'avatar']}
          label="Avatar"
          placeholder="URL ảnh đại diện"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          name={[name, 'address']}
          label="Địa chỉ"
          placeholder="Địa chỉ"
        />
      </Col>
      <Col span={24}>
        <FormSelect
          required
          name={[name, 'userProfiles']}
          label="Vai trò"
          resourceData={listProFile}
          valueProp="id"
          titleProp="type"
          mode="multiple"
          placeholder="Chọn vai trò"
        />
      </Col>
    </Row>
  )
}

export default BusinessUnitUserItem
