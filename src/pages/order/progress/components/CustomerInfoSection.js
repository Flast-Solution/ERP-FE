import React, { useMemo } from 'react'
import { Descriptions, Empty } from 'antd'
import { UserOutlined } from '@ant-design/icons'

import { formatTime } from '@flast-erp/core/utils'

const CustomerInfoSection = ({ order }) => {
  const customerInfoItems = useMemo(() => [
    {
      key: 'code',
      label: 'Mã đơn',
      children: order?.code ?? '-',
    },
    {
      key: 'customer',
      label: 'Tên khách hàng',
      children: order?.customerReceiverName ?? order?.customerName ?? order?.customer?.name ?? '-',
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      children: order?.customerMobilePhone ?? order?.phone ?? '-',
    },
    {
      key: 'address',
      label: 'Địa chỉ',
      children: order?.customerAddress ?? order?.address ?? '-',
    },
    {
      key: 'owner',
      label: 'Người phụ trách',
      children: order?.userCreateUsername ?? order?.userName ?? order?.saleName ?? '-',
    },
    {
      key: 'createdAt',
      label: 'Ngày đặt',
      children: formatTime(order?.createdAt ?? order?.createdDate) || '-',
    },
  ], [order])

  return (
    <div>
      <div className="workflow-progress-section-title">
        <UserOutlined className="workflow-progress-section-icon" />
        <span>Thông tin khách hàng</span>
      </div>
      {order ? (
        <Descriptions
          className="workflow-progress-customer-info"
          size="small"
          column={1}
          items={customerInfoItems}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu đơn hàng" />
      )}
    </div>
  )
}

export default CustomerInfoSection
