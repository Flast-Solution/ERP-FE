import React, { Suspense } from 'react'
import { Loading } from '@flast-erp/core/components'
import { isHatecoBusiness } from '@/configs/business'
import useGetMe from '@/hooks/useGetMe'
import HatenkoRemotePage from '@/components/HatenkoRemotePage'

export default function TenantPage({ page, local: LocalPage, ...props }) {
  const { user } = useGetMe()
  if (!user?.id) return <Loading />
  if (isHatecoBusiness(user.bizId)) return <HatenkoRemotePage page={page} {...props} />
  return <Suspense fallback={<Loading />}><LocalPage {...props} /></Suspense>
}
