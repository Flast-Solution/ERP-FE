/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import TenantPage from './index'
import useGetMe from '@/hooks/useGetMe'
import HatenkoRemotePage from '@/components/HatenkoRemotePage'
jest.mock('@/hooks/useGetMe', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/components/HatenkoRemotePage', () => ({ __esModule: true, default: jest.fn(({ page }) => <span>{page}</span>) }))
jest.mock('@flast-erp/core/components', () => ({ Loading: () => <span>Loading</span> }))

test.each(['SalesEditor', 'ProductionOrders', 'ProductionTracking', 'WorkflowProgress', 'ManufacturingLotCreate', 'Invoice'])('%s loads remote for 1649 and keeps local page for other tenants', async page => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  const container = document.createElement('div')
  const root = createRoot(container)
  const Local = jest.fn(() => <span>Local</span>)
  HatenkoRemotePage.mockClear()
  HatenkoRemotePage.mockImplementation(({ page }) => <span>{page}</span>)
  try {
    useGetMe.mockReturnValue({ user: {} })
    await act(async () => root.render(<TenantPage page={page} local={Local} />))
    expect(container.textContent).toBe('Loading')
    expect(HatenkoRemotePage).not.toHaveBeenCalled()
    useGetMe.mockReturnValue({ user: { id: 1, bizId: 1 } })
    await act(async () => root.render(<TenantPage page={page} local={Local} />))
    expect(container.textContent).toBe('Local')
    expect(HatenkoRemotePage).not.toHaveBeenCalled()
    useGetMe.mockReturnValue({ user: { id: 1, bizId: '1649' } })
    await act(async () => root.render(<TenantPage page={page} local={Local} dataId={12} />))
    expect(container.textContent).toBe(page)
    expect(HatenkoRemotePage.mock.calls.at(-1)[0]).toEqual({ page, dataId: 12 })
  } finally {
    await act(async () => root.unmount())
    delete global.IS_REACT_ACT_ENVIRONMENT
  }
})
