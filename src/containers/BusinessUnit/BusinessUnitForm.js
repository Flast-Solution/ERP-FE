import React, { useEffect, useState } from 'react'
import { Col, Divider, Row, Table, Tag, Typography } from 'antd'
import {
  CustomButton,
  FormHidden,
  FormInput,
  FormListAddtion,
  FormSelect,
  FormTextArea,
} from '@flast-erp/core/components'
import { RequestUtils } from '@flast-erp/core/utils'
import { BUSINESS_UNIT_API } from './utils'
import BusinessUnitUserItem from './BusinessUnitUserItem'

const STATUS_OPTIONS = [
  { value: 1, label: 'Hoạt động' },
  { value: 0, label: 'Ngưng' },
]

const userColumns = [
  {
    title    : 'Họ tên',
    dataIndex: 'fullName',
    width    : 160,
    ellipsis : true,
  },
  {
    title    : 'Tài khoản',
    dataIndex: 'ssoId',
    width    : 120,
    ellipsis : true,
  },
  {
    title    : 'Số điện thoại',
    dataIndex: 'phone',
    width    : 130,
  },
  {
    title    : 'Email',
    dataIndex: 'email',
    width    : 180,
    ellipsis : true,
  },
  {
    title : 'Vai trò',
    key   : 'userProfiles',
    width : 160,
    render: (_, record) => (
      record.userProfiles?.map(item => item.type ?? item.id).join(', ') || '—'
    ),
  },
  {
    title    : 'Trạng thái',
    dataIndex: 'status',
    width    : 110,
    render   : value => (
      Number(value) === 0
        ? <Tag color="red">Ngưng</Tag>
        : <Tag color="green">Hoạt động</Tag>
    ),
  },
]

const BusinessUnitForm = ({ isEdit = false, users = [] }) => {
  const [listProFile, setListProFile] = useState([])

  useEffect(() => {
    RequestUtils.GetAsList(BUSINESS_UNIT_API.listRole).then(setListProFile)
  }, [])

  const UserItem = (props) => (
    <BusinessUnitUserItem {...props} listProFile={listProFile} />
  )

  return (
    <Row gutter={16} style={{ marginTop: 20 }}>
      <Col span={24}>
        <Typography.Title level={5} style={{ marginBottom: 0 }}>
          Thông tin đơn vị
        </Typography.Title>
      </Col>

      <FormHidden name="id" />
      <FormHidden name="bizId" />

      <Col md={12} xs={24}>
        <FormInput
          required
          name="name"
          label="Tên đơn vị"
          placeholder="Công ty / chi nhánh / tổ chức"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          name="code"
          label="Mã đơn vị"
          placeholder="VD: XYZ"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          name="hotline"
          label="Hotline"
          placeholder="0900999888"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          name="email"
          label="Email"
          placeholder="info@example.com"
        />
      </Col>
      <Col span={24}>
        <FormInput
          name="address"
          label="Địa chỉ"
          placeholder="Địa chỉ đơn vị"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          name="logo"
          label="Logo"
          placeholder="https://example.com/logo.png"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelect
          name="status"
          label="Trạng thái"
          placeholder="Chọn trạng thái"
          resourceData={STATUS_OPTIONS}
          valueProp="value"
          titleProp="label"
        />
      </Col>
      <Col span={24}>
        <FormTextArea
          name="meta"
          label="Mô tả"
          placeholder="Ghi chú / mô tả đơn vị"
        />
      </Col>

      <Col span={24}>
        <Divider style={{ margin: '8px 0 16px' }} />
        <Typography.Title level={5} style={{ marginBottom: 12 }}>
          Danh sách tài khoản
        </Typography.Title>
        {isEdit && users.length > 0 ? (
          <Table
            rowKey={record => record.id ?? record.ssoId ?? record.email}
            size="small"
            pagination={false}
            columns={userColumns}
            dataSource={users}
            scroll={{ x: 900 }}
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <FormListAddtion
          name="users"
          textAddNew="Thêm tài khoản"
          title="Tài khoản đơn vị"
        >
          <UserItem />
        </FormListAddtion>
      </Col>

      <Col span={24}>
        <CustomButton
          htmlType="submit"
          title="Hoàn thành"
          color="danger"
          variant="solid"
        />
      </Col>
    </Row>
  )
}

export default BusinessUnitForm
