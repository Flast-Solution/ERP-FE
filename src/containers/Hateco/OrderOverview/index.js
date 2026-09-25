import React from 'react'
import ListOrder from '@/containers/Order/List'

/**
 * Layout tổng quan đơn hàng dành riêng cho Hateco.
 * ListOrder chỉ bật API/columns tracking khi prop trackingOverview được truyền vào.
 */
const HatecoOrderOverview = ({ filter }) => (
  <ListOrder
    filter={filter}
    trackingOverview
  />
)

export default HatecoOrderOverview

