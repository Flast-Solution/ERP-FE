import { RequestUtils } from '@flast-erp/core/utils'
import { enrichOrdersWithWorkflowData } from './workflowApi'

jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Post: jest.fn(), Get: jest.fn() } }), { virtual: true })
beforeEach(() => jest.clearAllMocks())

const order = () => ({ id: 34067, details: [{ id: 34196, unit: 'm' }],
  manufactureProducts: [{ details: [{ orderDetailId: 34196, target: 1000 }] }] })

test('batches order and production previews once and attaches cached lots and rollups to child and parent', async () => {
  RequestUtils.Post.mockImplementation(async (path, body) => {
    if (path.endsWith('get-entity')) return { success: true, data: body.entityName === 'order'
      ? [{ id: 33, processId: 56, entityId: 34067 }]
      : [{ id: 113, processId: 60, entityId: 34196 }] }
    return { success: true, data: [
      { processInstance: { id: 113 }, submissions: [{ id: 1, stepCode: 'start', version: 1,
        valuesJson: { nhap_lot: { rows: [{ code: 'L1', quantity: 600 }] } } }] },
      { processInstance: { id: 33 }, submissions: [] },
    ] }
  })
  RequestUtils.Get.mockResolvedValue({ success: true, data: { process: { id: 56 } } })
  const result = await enrichOrdersWithWorkflowData({ embedded: [order()] }, { includeProductionLots: true })
  expect(RequestUtils.Post).toHaveBeenCalledWith('/workflow/process/preview-list', [33, 113])
  expect(RequestUtils.Post.mock.calls.filter(([path]) => path.endsWith('preview-list'))).toHaveLength(1)
  expect(RequestUtils.Get.mock.calls.every(([path]) => !path.endsWith('/preview'))).toBe(true)
  expect(result.embedded[0]._productionMetrics).toMatchObject({ producedQuantity: 600, remainingProductionQuantity: 400 })
  expect(result.embedded[0].details[0]._productionLots[0].code_lot).toBe('L1')
  expect(result.embedded[0].workflowInstance.preview.processInstance.id).toBe(33)
})

test('keeps workflow rows but leaves production unknown when preview loading fails', async () => {
  RequestUtils.Post.mockImplementation(async (path, body) => {
    if (path.endsWith('preview-list')) throw new Error('Preview unavailable')
    return { success: true, data: body.entityName === 'order'
      ? [{ id: 33, processId: 56, entityId: 34067 }]
      : [{ id: 113, processId: 60, entityId: 34196 }] }
  })
  RequestUtils.Get.mockResolvedValue({ success: true, data: { process: { id: 56 } } })
  const result = await enrichOrdersWithWorkflowData({ embedded: [order()] }, { includeProductionLots: true })
  expect(result.embedded[0].workflowInstances).toHaveLength(1)
  expect(result.embedded[0]._productionMetrics.producedQuantity).toBeUndefined()
  expect(result.embedded[0]._productionMetrics.error).toBe('Preview unavailable')
})
