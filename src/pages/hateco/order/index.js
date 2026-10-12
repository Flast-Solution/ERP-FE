import React from 'react'
import { useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { BreadcrumbCustom, Loading } from '@flast-erp/core/components'
import TenantPage from '@/components/TenantPage'
import useGetMe from '@/hooks/useGetMe'
import { useTenantRoutes } from '@/features/TenantRoutes/Provider'
import { resolveRoute } from '@/features/TenantRoutes/model'


const LocalOrderPage = React.lazy(() => import('@/pages/order'))

const HatecoOrderPage = () => {
  const { user } = useGetMe()
  const { search, pathname } = useLocation()
  const { status, config } = useTenantRoutes()
  const showOverviewHeader = status === 'ready' && resolveRoute(config, pathname, 'OrderOverview')?.module === 'OrderOverview'

  if (!user?.id) {
    return <Loading />
  }

  const filterParams = Object.fromEntries(new URLSearchParams(search).entries())
  const filter = { type: 'order', ...filterParams }

  return (
    <div>
      {showOverviewHeader && <>
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
      </>}
      <TenantPage page="OrderOverview" local={LocalOrderPage} filter={filter} />
    </div>
  )
}

export default HatecoOrderPage
