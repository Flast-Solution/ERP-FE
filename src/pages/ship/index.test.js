import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { RestList } from '@flast-erp/core/components'
import { useWorkflowDrawer } from '@/contexts/WorkflowDrawerContext'
import useGetMe from '@/hooks/useGetMe'
import ShipPage from './index'

jest.mock('@flast-erp/core/components', () => ({ RestList: jest.fn(() => null), BreadcrumbCustom: () => null }), { virtual: true })
jest.mock('@flast-erp/core/hooks', () => ({ useGetList: jest.fn() }), { virtual: true })
jest.mock('@flast-erp/core/utils', () => ({ arrayEmpty: items => !items?.length, formatTime: value => value, RequestUtils: {}, InAppEvent: {} }), { virtual: true })
jest.mock('@/configs/constant', () => ({ HASH_MODAL: 'modal' }), { virtual: true })
jest.mock('@/hooks/useGetMe', () => ({ __esModule: true, default: jest.fn() }), { virtual: true })
jest.mock('@/contexts/WorkflowDrawerContext', () => ({ useWorkflowDrawer: jest.fn() }), { virtual: true })
jest.mock('@/containers/Order/List/constants', () => ({ SHIPPING_WORKFLOW_ENTITY_TYPE: 'shipping' }), { virtual: true })
jest.mock('@/containers/Order/List/services/workflowApi', () => ({ enrichEntitiesWithWorkflowData: jest.fn() }), { virtual: true })
jest.mock('@/containers/Order/List/hooks/useWorkflowModal', () => ({ __esModule: true, default: () => ({}) }), { virtual: true })
jest.mock('@/containers/Order/List/components/WorkflowAttachModal', () => () => null, { virtual: true })
jest.mock('./Filter', () => () => null)

let root
const openWorkflowDrawer = jest.fn()
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  jest.clearAllMocks()
  root = createRoot(document.createElement('div'))
  useWorkflowDrawer.mockReturnValue({ openWorkflowDrawer })
})
afterEach(async () => {
  await act(async () => root.unmount())
  delete global.IS_REACT_ACT_ENVIRONMENT
})
const getProgressButton = element => {
  if (!element) return null
  if (element.props?.menu) return element
  return React.Children.toArray(element.props?.children).map(getProgressButton).find(Boolean)
}

test('view-only users can open all workflows for the selected shipment', async () => {
  useGetMe.mockReturnValue({ hasPermission: permission => permission === 'shipping.delivery.view' })
  await act(async () => root.render(<ShipPage />))
  const list = RestList.mock.calls.at(-1)[0]
  const record = { id: 19, workflowInstances: [{ id: 1 }, { id: 2 }] }
  const button = getProgressButton(list.columns.find(column => column.key === 'action').render(record))
  button.props.menu.items.find(item => item.key === 'progress').onClick({ domEvent: { stopPropagation: jest.fn() } })
  expect(openWorkflowDrawer).toHaveBeenCalledWith(record, record, expect.objectContaining({
    entityName: 'shipping', entityType: 'shipping', includeAllInstances: true, workflowInstances: record.workflowInstances,
  }))
})

test('hides workflow action without view permission', async () => {
  useGetMe.mockReturnValue({ hasPermission: permission => permission === 'shipping.delivery.update' })
  await act(async () => root.render(<ShipPage />))
  const list = RestList.mock.calls.at(-1)[0]
  expect(getProgressButton(list.columns.find(column => column.key === 'action').render({ id: 19 })).props.menu.items.map(item => item.key)).toEqual(['attach'])
})


test.each([undefined, []])('shows only attachment for a shipment with no workflows (%s)', async workflowInstances => {
  useGetMe.mockReturnValue({ hasPermission: () => true })
  await act(async () => root.render(<ShipPage />))
  const list = RestList.mock.calls.at(-1)[0]
  const menu = getProgressButton(list.columns.find(column => column.key === 'action').render({ id: 19, workflowInstances }))
  expect(menu.props.menu.items.map(item => item.key)).toEqual(['attach'])
})

test('hides an empty menu for view-only users when no workflow is attached', async () => {
  useGetMe.mockReturnValue({ hasPermission: permission => permission === 'shipping.delivery.view' })
  await act(async () => root.render(<ShipPage />))
  const list = RestList.mock.calls.at(-1)[0]
  expect(getProgressButton(list.columns.find(column => column.key === 'action').render({ id: 19, workflowInstances: [] }))).toBeUndefined()
})
