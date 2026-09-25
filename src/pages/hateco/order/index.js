import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { BreadcrumbCustom, Loading } from '@flast-erp/core/components'
import HatecoOrderOverview from '@/containers/Hateco/OrderOverview'
import useGetMe from '@/hooks/useGetMe'
import { isHatecoBusiness } from '@/configs/business'

const HatecoOrderPage = () => {
  const { user } = useGetMe()
  const { search } = useLocation()

  if (!user?.id) {
    return <Loading />
  }

  if (!isHatecoBusiness(user?.bizId)) {
    return <Navigate to="/sale/order" replace />
  }

  const filterParams = Object.fromEntries(new URLSearchParams(search).entries())
  const filter = { type: 'order', ...filterParams }

  return (
    <div>
      <Helmet>
        <title>Tổng quan đơn hàng</title>
      </Helmet>
      <BreadcrumbCustom
        data={[
          { title: 'Trang chủ' },
          { title: 'Đơn hàng' },
          { title: 'Tổng quan đơn hàng' },
        ]}
      />
      <HatecoOrderOverview filter={filter} />
    </div>
  )
}

export default HatecoOrderPage
