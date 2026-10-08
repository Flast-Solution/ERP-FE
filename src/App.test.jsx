/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useWorkflowDrawer } from '@/contexts/WorkflowDrawerContext'
import useWorkflowProgressDrawer from '@/containers/Order/List/hooks/useWorkflowProgressDrawer'

jest.mock('@flast-erp/core/components', () => ({
  DataProvider: ({ children }) => children, Loading: () => null,
}))
jest.mock('react-router-dom', () => ({ BrowserRouter: ({ children }) => children }))
jest.mock('styled-components', () => ({ ThemeProvider: ({ children }) => children }))
jest.mock('@/theme', () => ({}))
jest.mock('@/i18n', () => ({ language: 'vi' }))
jest.mock('@/@history', () => ({}))
jest.mock('@/routes/PrivateRoutes', () => [])
jest.mock('@/auth', () => ({ Auth: ({ children }) => children }))
jest.mock('@/auth/Authorization', () => ({ __esModule: true, default: ({ children }) => children }))
jest.mock('@/components/TenantPage', () => ({ __esModule: true, default: () => null }))
jest.mock('@/containers/Order/List/hooks/useWorkflowProgressDrawer', () => ({ __esModule: true, default: jest.fn() }))

jest.mock('@/layouts/MainLayout', () => ({ __esModule: true, default: () => MockWorkflowProbe('main') }))
jest.mock('@/routes/ModalRoutes', () => ({ __esModule: true, default: () => MockWorkflowProbe('modal') }))
jest.mock('@/routes/PopupRoute', () => ({ __esModule: true, default: () => MockWorkflowProbe('popup') }))

const mockContexts = {}
function MockWorkflowProbe(name) {
  mockContexts[name] = useWorkflowDrawer()
  return null
}

test('main pages, modals and popups share one workflow provider and drawer actions', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  const open = jest.fn()
  const close = jest.fn()
  useWorkflowProgressDrawer.mockReturnValue({
    workflowProgressDrawerOpen: false,
    openWorkflowProgressDrawer: open,
    closeWorkflowProgressDrawer: close,
  })
  const root = createRoot(document.createElement('div'))
  try {
    await act(async () => root.render(<App />))
    expect(mockContexts.main).toBe(mockContexts.modal)
    expect(mockContexts.main).toBe(mockContexts.popup)
    expect(useWorkflowProgressDrawer).toHaveBeenCalledTimes(1)
    await act(async () => mockContexts.modal.openWorkflowDrawer({ id: 12 }, { id: 34 }, { formOnly: true }))
    expect(open).toHaveBeenCalledWith({ id: 12 }, { id: 34 }, { formOnly: true })
    await act(async () => mockContexts.popup.closeWorkflowDrawer())
    expect(close).toHaveBeenCalledTimes(1)
  } finally {
    await act(async () => root.unmount())
    delete global.IS_REACT_ACT_ENVIRONMENT
  }
})
