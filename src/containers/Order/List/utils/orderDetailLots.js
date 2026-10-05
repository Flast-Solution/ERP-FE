import { RequestUtils } from '@flast-erp/core/utils'

const assertSuccess = response => {
  if (response?.success !== true && response?.errorCode !== 200) {
    throw new Error(response?.message || 'Không tải được chi tiết lot.')
  }
}

export const buildLotDetailRows = (preview, instanceId) => {
  const latest = new Map()
  ;(preview?.submissions ?? []).forEach(submission => {
    const key = `${submission.stepCode}-${submission.templateId}`
    const previous = latest.get(key)
    if (!previous || Number(submission.version ?? 0) >= Number(previous.version ?? 0)) {
      latest.set(key, submission)
    }
  })
  return Array.from(latest.values()).flatMap(submission => {
    let values = submission.valuesJson
    if (typeof values === 'string') {
      try { values = JSON.parse(values) } catch { values = {} }
    }
    const criteria = Array.isArray(values?.tieu_chi) ? values.tieu_chi : []
    return (Array.isArray(values?.lots) ? values.lots : []).map((lot, index) => ({
      ...lot,
      _rowKey: `${instanceId}-${submission.id}-${index}`,
      _stepName: preview?.stepProcessList?.find(step => step.stepCode === submission.stepCode)?.name || submission.stepCode,
      _criteria: criteria,
    }))
  })
}

export const fetchOrderDetailLots = async detailId => {
  const response = await RequestUtils.Post('/workflow/process/instance/get-entity', {
    entityName: 'PRODUCTION',
    entityIds: [detailId],
  })
  assertSuccess(response)
  if (!Array.isArray(response.data)) throw new Error('Danh sách workflow không hợp lệ.')
  const instances = response.data.filter(instance => (
    instance?.id != null && String(instance.entityId) === String(detailId)
  ))
  const groups = await Promise.all(instances.map(async instance => {
    const preview = await RequestUtils.Get('/workflow/process/preview', { instanceId: instance.id })
    assertSuccess(preview)
    return buildLotDetailRows(preview.data, instance.id)
  }))
  return groups.flat()
}
