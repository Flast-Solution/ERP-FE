/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import HatecoOrderPage from './index'
import useGetMe from '@/hooks/useGetMe'
import HatenkoRemotePage from '@/components/HatenkoRemotePage'

jest.mock('@/hooks/useGetMe', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/components/HatenkoRemotePage', () => ({ __esModule: true, default: jest.fn(() => null) }))
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ search: '?status=2' }),
  Navigate: ({ to }) => <span>{to}</span>,
}))
jest.mock('react-helmet', () => ({ Helmet: () => null }))
jest.mock('@flast-erp/core/components', () => ({
  BreadcrumbCustom: () => null, Loading: () => <span>Đang tải</span>,
}))

test('only loads the Hatenko page for bizId 1649, keeping query filters', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  const container = document.createElement('div')
  const root = createRoot(container)
  HatenkoRemotePage.mockClear()
  try {
    useGetMe.mockReturnValue({ user: {} })
    await act(async () => root.render(<HatecoOrderPage />))
    expect(container.textContent).toBe('Đang tải')
    expect(HatenkoRemotePage).not.toHaveBeenCalled()

    useGetMe.mockReturnValue({ user: { id: 1, bizId: 100 } })
    await act(async () => root.render(<HatecoOrderPage />))
    expect(container.textContent).toBe('/sale/order')
    expect(HatenkoRemotePage).not.toHaveBeenCalled()

    useGetMe.mockReturnValue({ user: { id: 1, bizId: '1649' } })
    await act(async () => root.render(<HatecoOrderPage />))
    expect(HatenkoRemotePage.mock.calls.at(-1)[0]).toEqual({
      page: 'OrderOverview', filter: { type: 'order', status: '2' },
    })
  } finally {
    await act(async () => root.unmount())
    delete global.IS_REACT_ACT_ENVIRONMENT
  }
})
