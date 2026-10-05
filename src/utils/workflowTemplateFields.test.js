import { RequestUtils } from '@flast-erp/core/utils'
import { fetchWorkflowTemplateFields } from './workflowTemplateFields'

jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Get: jest.fn(), Post: jest.fn() } }), { virtual: true })
beforeEach(() => jest.clearAllMocks())

test('loads full templates including non-indexed table column metadata', async () => {
  const template = { id: 52, fields: [{ fieldKey: 'nhap_lot', isIndexed: false,
    config: { widget: 'dynamic_table', columns: [{ key: 'code', erpExport: true }] } }] }
  RequestUtils.Get.mockResolvedValue({ success: true, data: template })
  expect(await fetchWorkflowTemplateFields([52])).toEqual({ data: [template] })
  expect(RequestUtils.Get).toHaveBeenCalledWith('/workflow/forms/template/find-id', { id: 52 })
  expect(RequestUtils.Post).not.toHaveBeenCalled()
})

test('falls back to the existing field endpoint for unavailable full templates', async () => {
  RequestUtils.Get.mockRejectedValue(new Error('unavailable'))
  RequestUtils.Post.mockResolvedValue({ success: true, data: [{ fieldKey: 'note', inputType: 'text' }] })
  expect(await fetchWorkflowTemplateFields([1])).toEqual({ data: [{ id: 1, fields: [{ fieldKey: 'note', inputType: 'text' }] }] })
})
