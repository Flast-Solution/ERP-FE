import { RequestUtils } from '@flast-erp/core/utils'
import { fetchWorkflowPreviewList } from '../services/workflowPreviewApi'

const assertSuccess = response => {
  if (response?.success !== true && response?.errorCode !== 200) {
    throw new Error(response?.message || 'Không tải được chi tiết lot.')
  }
}

export const buildLotDetailRows = (preview, instanceId) => {
  const latest = new Map()
  ;(preview?.submissions ?? []).forEach(submission => {
    const key = submission.stepCode ?? submission.stepId ?? submission.templateId
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
    if (values && Object.prototype.hasOwnProperty.call(values, 'nhap_lot')) {
      const table = values.nhap_lot
      const steps = [preview?.stepProcesses, ...(preview?.stepProcessList ?? [])].filter(Boolean)
      const step = steps.find(item => String(item.id) === String(submission.stepId)
        || (submission.stepCode && item.stepCode === submission.stepCode))
      const findLotField = fields => {
        for (const field of fields ?? []) {
          if (field.fieldKey === 'nhap_lot') return field
          const nested = findLotField(field.children)
          if (nested) return nested
        }
        return null
      }
      const field = findLotField(step?.formTemplate?.fields)
      const columns = [...new Map([
        ...(Array.isArray(field?.config?.columns) ? field.config.columns : []),
        ...(Array.isArray(table?.columns) ? table.columns : []),
      ].filter(column => column?.key).map(column => [column.key, column])).values()]
      const criteria = columns
        .filter(column => !['code', 'quantity'].includes(column.key))
        .map(column => ({ id: column.key, name: column.label || column.key, type: column.type }))
      return (Array.isArray(table?.rows) ? table.rows : []).map((lot, index) => ({
        code_lot: lot.code,
        so_luong: lot.quantity,
        danh_gia: lot,
        _source: 'nhap_lot',
        _instanceId: instanceId,
        _submittedAt: submission.submittedAt,
        _submissionId: submission.id,
        _rowKey: `${instanceId}-${submission.id}-${lot.id ?? index}`,
        _lotId: lot.id,
        _stepName: step?.name || submission.stepCode,
        // Preserve the whole submitted table: test results are keyed by stable LOT IDs.
        _lotTable: table?.tests && typeof table.tests === 'object' ? {
          rows: table.rows, columns, tests: table.tests,
        } : null,
        _criteria: criteria,
      }))
    }
    const criteria = Array.isArray(values?.tieu_chi) ? values.tieu_chi : []
    return (Array.isArray(values?.lots) ? values.lots : []).map((lot, index) => ({
      ...lot,
      _rowKey: `${instanceId}-${submission.id}-${index}`,
      _instanceId: instanceId,
      _submittedAt: submission.submittedAt,
      _submissionId: submission.id,
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
  const previews = await fetchWorkflowPreviewList(instances.map(instance => instance.id))
  return instances.flatMap(instance => {
    const preview = previews.get(String(instance.id))
    if (!preview) throw new Error('API không trả về preview của workflow sản xuất.')
    return buildLotDetailRows(preview, instance.id)
  })
}
