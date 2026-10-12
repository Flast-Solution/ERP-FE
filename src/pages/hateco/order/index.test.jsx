/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import HatecoOrderPage from './index'
import useGetMe from '@/hooks/useGetMe'
import TenantPage from '@/components/TenantPage'
import { useTenantRoutes } from '@/features/TenantRoutes/Provider'

jest.mock('@/features/TenantRoutes/Provider', () => ({ useTenantRoutes: jest.fn() }))
jest.mock('@/hooks/useGetMe', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/components/TenantPage', () => ({ __esModule: true, default: jest.fn(() => null) }))
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ search: '?status=2', pathname: '/sale/hateco' }),
  Navigate: ({ to }) => <span>{to}</span>,
}))
jest.mock('react-helmet', () => ({ Helmet: () => null }))
jest.mock('@flast-erp/core/components', () => ({
  BreadcrumbCustom: ({data}) => <nav>{data.map(item => item.title).join(" > ")}</nav>, Loading: () => <span>Đang tải</span>,
}))

test('delegates to route configuration for every business and keeps query filters', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  const container = document.createElement('div')
  const root = createRoot(container)
  useTenantRoutes.mockReturnValue({status:'ready',config:{routes:[],remotes:[]}})
  TenantPage.mockClear()
  try {
    useGetMe.mockReturnValue({ user: {} })
    await act(async () => root.render(<HatecoOrderPage />))
    expect(container.textContent).toBe('Đang tải')
    expect(TenantPage).not.toHaveBeenCalled()

    useGetMe.mockReturnValue({ user: { id: 1, bizId: 100 } })
    await act(async () => root.render(<HatecoOrderPage />))
    expect(TenantPage).toHaveBeenCalled()

    useGetMe.mockReturnValue({ user: { id: 1, bizId: '1649' } })
    await act(async () => root.render(<HatecoOrderPage />))
    expect(TenantPage.mock.calls.at(-1)[0]).toMatchObject({
      page: 'OrderOverview', filter: { type: 'order', status: '2' },
    })
  } finally {
    await act(async () => root.unmount())
    delete global.IS_REACT_ACT_ENVIRONMENT
  }
})

 test('overview breadcrumb only renders for an enabled overview remote', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  const container = document.createElement('div'), root = createRoot(container)
  useGetMe.mockReturnValue({user:{id:1,bizId:1649}})
  TenantPage.mockImplementation(() => <span>Page content</span>)
  const config = {remotes:[{id:'hatenko',scope:'hatenko',remoteEntry:'https://example.com/remoteEntry.js'}],routes:[{route:'/sale/hateco',remoteId:'hatenko',module:'OrderOverview',enabled:true}]}
  try {
   useTenantRoutes.mockReturnValue({status:'ready',config})
   await act(async () => root.render(<HatecoOrderPage />))
   expect(container.querySelectorAll('nav')).toHaveLength(1)
   useTenantRoutes.mockReturnValue({status:'ready',config:{...config,routes:[{...config.routes[0],enabled:false}]}})
   await act(async () => root.render(<HatecoOrderPage />))
   expect(container.querySelectorAll('nav')).toHaveLength(0)
   useTenantRoutes.mockReturnValue({status:'ready',config:{routes:[],remotes:[]}})
   await act(async () => root.render(<HatecoOrderPage />))
   expect(container.querySelectorAll('nav')).toHaveLength(0)
  } finally { await act(async () => root.unmount()); delete global.IS_REACT_ACT_ENVIRONMENT }
 })
