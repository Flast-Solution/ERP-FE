import { RequestUtils } from '@flast-erp/core/utils'
import { attachSelectedWorkflows, attachWorkflow } from './workflowApi'

jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Post: jest.fn() } }), { virtual: true })
jest.mock('../utils/responseResolvers', () => ({ resolveWorkflowInstances: response => response.data ?? [] }))
beforeEach(() => jest.clearAllMocks())

test('starts workflow with the required API payload', async () => {
  await attachWorkflow({ processId: 3, entityType: 'warehouse', entityId: 42 })
  expect(RequestUtils.Post).toHaveBeenCalledWith('/workflow/process/start', { processId: 3, entityType: 'warehouse', entityId: 42 })
})

test('starts each new workflow once and skips existing workflows on edits', async () => {
  RequestUtils.Post.mockResolvedValueOnce({ errorCode: 200, data: [{ id: 1, processId: 2, entityId: 42 }] })
    .mockResolvedValue({ errorCode: 200 })
  expect(await attachSelectedWorkflows({ processIds: [2, 3, '3', 4], entityType: 'order', entityId: 42 })).toEqual([])
  expect(RequestUtils.Post.mock.calls.filter(([path]) => path === '/workflow/process/start').map(([, body]) => body))
    .toEqual([{ processId: 3, entityType: 'order', entityId: 42 }, { processId: 4, entityType: 'order', entityId: 42 }])
})

test('reports a partial failure while continuing with other selected workflows', async () => {
  RequestUtils.Post.mockResolvedValueOnce({ data: [] }).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ success: true })
  expect(await attachSelectedWorkflows({ processIds: [2, 3], entityType: 'warehouse', entityId: 42 }))
    .toEqual([{ processId: '2', message: 'offline' }])
  expect(RequestUtils.Post).toHaveBeenCalledTimes(3)
})

test('does not start workflows when no selection, missing saved ID, or lookup fails', async () => {
  await attachSelectedWorkflows({ processIds: [], entityType: 'warehouse', entityId: 42 })
  expect(await attachSelectedWorkflows({ processIds: [2], entityType: 'warehouse' })).toHaveLength(1)
  expect(RequestUtils.Post).not.toHaveBeenCalled()
  RequestUtils.Post.mockResolvedValueOnce({ success: false, errorCode: 500, message: 'lookup failed' })
  expect(await attachSelectedWorkflows({ processIds: [2], entityType: 'warehouse', entityId: 42 })).toHaveLength(1)
  expect(RequestUtils.Post).toHaveBeenCalledTimes(1)
})
