/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import HatenkoRemotePage from './index'
import { loadRemoteFromUrl } from '@/utils/loadRemote'

jest.mock('@/utils/loadRemote', () => ({ loadRemoteFromUrl: jest.fn(), loadRemote: jest.fn(), registerRemoteList: jest.fn() }))
jest.mock('@/hooks/useGetMe', () => ({ __esModule: true, default: () => ({ user: { id: 1, bizId: 1649 }, hasPermission: () => true }) }))
jest.mock('@/contexts/WorkflowDrawerContext', () => ({ useWorkflowDrawer: () => ({ openWorkflowDrawer: jest.fn(), closeWorkflowDrawer: jest.fn() }) }))
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Get: jest.fn(), Post: jest.fn() }, InAppEvent: {} }))
jest.mock('@flast-erp/core/components', () => ({ Loading: () => <span>Đang tải</span> }))
jest.mock('antd', () => ({
  Result: ({ title, subTitle, extra }) => <div>{title}{subTitle}{extra}</div>,
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}))

let root
let container
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  loadRemoteFromUrl.mockReset()
  mockNavigate.mockReset()
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  delete global.IS_REACT_ACT_ENVIRONMENT
})

test('loads the exposed page and forwards the order filter', async () => {
  let resolve
  loadRemoteFromUrl.mockReturnValue(new Promise(done => { resolve = done }))
  await act(async () => root.render(<HatenkoRemotePage page="OrderOverview" filter={{ type: 'order', status: '2' }} />))
  expect(container.textContent).toBe('Đang tải')
  expect(loadRemoteFromUrl).toHaveBeenCalledWith(expect.objectContaining({
    name: 'hatenko', scope: 'hatenko', module: 'OrderOverview', entry: process.env.REACT_APP_HATENKO_REMOTE_ENTRY || '/remotes/hatenko/remoteEntry.js',
  }))
  await act(async () => resolve({ default: ({ filter }) => <span>{filter.type}:{filter.status}</span> }))
  expect(container.textContent).toBe('order:2')
})

test('recovers after a failed remote load when the user retries', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    loadRemoteFromUrl.mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ default: () => <span>Đã tải</span> })
    await act(async () => root.render(<HatenkoRemotePage page="OrderOverview" />))
    expect(container.textContent).toContain('Không tải được màn hình Hatenko')
    await act(async () => container.querySelector('button').click())
    expect(container.textContent).toBe('Đã tải')
    expect(loadRemoteFromUrl).toHaveBeenCalledTimes(2)
    expect(loadRemoteFromUrl).toHaveBeenLastCalledWith(expect.objectContaining({ force: true }))
    expect(consoleError).not.toHaveBeenCalled()
  } finally {
    consoleError.mockRestore()
  }
})


test('loads Hatenko from the configured external remote URL', async () => {
  const previous = process.env.REACT_APP_HATENKO_REMOTE_ENTRY
  process.env.REACT_APP_HATENKO_REMOTE_ENTRY = 'http://localhost:3001/remoteEntry.js'
  try {
    loadRemoteFromUrl.mockResolvedValue({ default: () => <span>Remote riêng</span> })
    await act(async () => root.render(<HatenkoRemotePage page="SalesEditor" />))
    expect(loadRemoteFromUrl).toHaveBeenCalledWith(expect.objectContaining({
      scope: 'hatenko', module: 'SalesEditor', entry: 'http://localhost:3001/remoteEntry.js',
    }))
    expect(container.textContent).toBe('Remote riêng')
  } finally {
    if (previous === undefined) delete process.env.REACT_APP_HATENKO_REMOTE_ENTRY
    else process.env.REACT_APP_HATENKO_REMOTE_ENTRY = previous
  }
})


test('offers navigation home when the remote cannot be loaded', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    loadRemoteFromUrl.mockRejectedValue(new Error('RUNTIME-008: unreachable'))
    await act(async () => root.render(<HatenkoRemotePage page="SalesEditor" />))
    expect(container.textContent).toContain('Về trang chủ')
    expect(container.textContent).not.toContain('RUNTIME-008')
    const homeButton = Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Về trang chủ')
    await act(async () => homeButton.click())
    expect(mockNavigate).toHaveBeenCalledWith('/')
    expect(consoleError).not.toHaveBeenCalled()
  } finally {
    consoleError.mockRestore()
  }
})

test('shows unavailable UI when a remote module has no component export', async () => {
  loadRemoteFromUrl.mockResolvedValue({})
  await act(async () => root.render(<HatenkoRemotePage page="SalesEditor" />))
  expect(container.textContent).toContain('Không tải được màn hình Hatenko')
  expect(container.querySelectorAll('button')).toHaveLength(2)
})
