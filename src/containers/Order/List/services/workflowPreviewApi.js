import { RequestUtils } from '@flast-erp/core/utils'

export const fetchWorkflowPreviewList = async instanceIds => {
  const ids = [...new Set(instanceIds.filter(id => id != null).map(Number))]
  if (!ids.length) return new Map()
  const response = await RequestUtils.Post('/workflow/process/preview-list', ids)
  if (response?.success !== true && Number(response?.errorCode) !== 200) {
    throw new Error(response?.message || 'Không tải được dữ liệu workflow.')
  }
  if (!Array.isArray(response.data)) throw new Error('Dữ liệu preview-list không hợp lệ.')
  const requested = new Set(ids.map(String))
  return new Map(response.data.filter(preview => requested.has(String(preview?.processInstance?.id)))
    .map(preview => [String(preview.processInstance.id), preview]))
}
