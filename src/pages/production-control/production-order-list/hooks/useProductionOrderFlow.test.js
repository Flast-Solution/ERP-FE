import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { RequestUtils } from '@flast-erp/core/utils'
import { attachSelectedWorkflows } from '@/containers/Order/List/services/workflowApi'
import { useProductionOrderFlow } from './useProductionOrderFlow'
jest.mock('antd', () => ({ message: { error: jest.fn(), success: jest.fn(), warning: jest.fn() } }))
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Post: jest.fn() } }), { virtual: true })
jest.mock('@/containers/Order/List/services/workflowApi', () => ({ attachSelectedWorkflows: jest.fn() }), { virtual: true })
jest.mock('@/containers/Order/List/constants', () => ({ ORDER_WORKFLOW_ENTITY_TYPE: 'order' }), { virtual: true })
let root, flow
const options = { resetWaitingOrders: jest.fn(), reloadWaitingOrders: jest.fn(), onSaved: jest.fn() }
const productionOrder = { id: 10, orderDetails: [{ id: 21, productId: 5 }, { id: 22, productId: 5 }], productDetails: { 21: { workflowProcessIds: [1, 2] }, 22: { workflowProcessIds: [3] } } }
function Harness() { flow = useProductionOrderFlow(options); return null }
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  jest.clearAllMocks()
  attachSelectedWorkflows.mockResolvedValue([])
  root = createRoot(document.createElement('div'))
  await act(async () => root.render(<Harness />))
})
afterEach(async () => {
  await act(async () => root.unmount())
  delete global.IS_REACT_ACT_ENVIRONMENT
})
test.each(['create', 'edit'])('starts workflows for each child after a successful %s', async mode => {
  if (mode === 'edit') await act(async () => flow.openExistingOrder(productionOrder, 'edit'))
  RequestUtils.Post.mockResolvedValue({ errorCode: 200, data: { id: 10 } })
  await act(async () => flow.finishFlow({ productionOrder }))
  expect(attachSelectedWorkflows.mock.calls.map(([body]) => body)).toEqual([
    { processIds: [1, 2], entityType: 'order', entityId: 21 },
    { processIds: [3], entityType: 'order', entityId: 22 },
  ])
  expect(RequestUtils.Post.mock.invocationCallOrder[0]).toBeLessThan(attachSelectedWorkflows.mock.invocationCallOrder[0])
})
test('does not start anything when saving fails', async () => {
  RequestUtils.Post.mockResolvedValue({ errorCode: 500 })
  await act(async () => flow.finishFlow({ productionOrder }))
  expect(attachSelectedWorkflows).not.toHaveBeenCalled()
})
