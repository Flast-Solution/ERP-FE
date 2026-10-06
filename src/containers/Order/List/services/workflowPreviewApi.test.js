import { RequestUtils } from '@flast-erp/core/utils'
import { fetchWorkflowPreviewList } from './workflowPreviewApi'

jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Post: jest.fn() } }), { virtual: true })
beforeEach(() => jest.clearAllMocks())

test('POSTs unique instance IDs as a bare array and maps unordered responses by processInstance.id', async () => {
  RequestUtils.Post.mockResolvedValue({ errorCode: 200, data: [
    { processInstance: { id: 34, entityId: 34066 }, submissions: [] },
    { processInstance: { id: 33, entityId: 34064 }, submissions: [] },
  ] })
  const result = await fetchWorkflowPreviewList([33, 34, '33'])
  expect(RequestUtils.Post).toHaveBeenCalledWith('/workflow/process/preview-list', [33, 34])
  expect(result.get('33').processInstance.entityId).toBe(34064)
  expect(result.get('34').processInstance.entityId).toBe(34066)
})

test('skips an empty batch and reports API failures', async () => {
  expect(await fetchWorkflowPreviewList([])).toEqual(new Map())
  expect(RequestUtils.Post).not.toHaveBeenCalled()
  RequestUtils.Post.mockResolvedValue({ success: false, message: 'Unavailable' })
  await expect(fetchWorkflowPreviewList([33])).rejects.toThrow('Unavailable')
})
