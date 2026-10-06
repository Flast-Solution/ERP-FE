import { fetchWorkflowPreviewList } from './workflowPreviewApi'
import { attachOrderProductionMetrics } from '../utils/orderProductionMetrics'
import { RequestUtils } from '@flast-erp/core/utils'
import {
  WORKFLOW_FILTER_API,
  WORKFLOW_INSTANCE_BY_ENTITY_API,
  WORKFLOW_PROCESS_FIND_API,
  ORDER_WORKFLOW_ENTITY_TYPE,
} from '../constants'
import {
  resolveWorkflowList,
  resolveWorkflowInstances,
  resolveWorkflowProcessDetail,
} from '../utils/responseResolvers'
import {
  getWorkflowInstanceEntityId,
  getWorkflowInstanceProcessId,
  normalizeWorkflowInstance,
} from '../utils/workflowMappers'

export const fetchWorkflowList = async (flowType) => {
  const api = flowType
    ? `${WORKFLOW_FILTER_API}&flowType=${encodeURIComponent(flowType)}`
    : WORKFLOW_FILTER_API
  const response = await RequestUtils.Get(api, {})
  return resolveWorkflowList(response)
}

export const attachWorkflow = async ({ processId, entityType, entityId }) => (
  RequestUtils.Post('/workflow/process/start', { processId, entityType, entityId })
)

// Check persisted instances after saving: editing or retrying must not start
// another instance of an already attached process.
export const attachSelectedWorkflows = async ({ processIds = [], entityType, entityId }) => {
  const selected = [...new Set(processIds.filter(id => id != null && id !== '').map(String))]
  if (!selected.length) return []
  if (!entityId) return selected.map(processId => ({ processId, message: 'Không có ID bản ghi đã lưu.' }))
  let instances
  try {
    instances = await fetchWorkflowInstancesByEntity({ entityName: entityType, entityIds: [entityId] })
  } catch (error) {
    return selected.map(processId => ({ processId, message: error?.message || 'Không kiểm tra được workflow đã gắn.' }))
  }
  const attached = new Set(instances.filter(instance => String(instance.entityId) === String(entityId))
    .map(instance => String(instance.processId)))
  const failures = []
  for (const processId of selected.filter(id => !attached.has(id))) {
    try {
      const response = await attachWorkflow({ processId: Number(processId), entityType, entityId })
      if (!(response?.success === true || Number(response?.errorCode) === 200)) {
        failures.push({ processId, message: response?.message || 'Khởi tạo workflow thất bại.' })
      }
    } catch (error) {
      failures.push({ processId, message: error?.message || 'Khởi tạo workflow thất bại.' })
    }
  }
  return failures
}

export const fetchWorkflowInstancesByEntity = async ({ entityName, entityIds }) => {
  const response = await RequestUtils.Post(WORKFLOW_INSTANCE_BY_ENTITY_API, {
    entityName,
    entityIds,
  })
  if (response?.success === false || (response?.errorCode != null && Number(response.errorCode) !== 200 && response?.success !== true)) {
    throw new Error(response?.message || 'Không tải được workflow đã gắn.')
  }
  return resolveWorkflowInstances(response)
    .map(normalizeWorkflowInstance)
    .filter(Boolean)
}

export const fetchWorkflowProcessDetail = async (processId) => {
  const detailResponse = await RequestUtils.Get(`${WORKFLOW_PROCESS_FIND_API}/${processId}`, {})
  return resolveWorkflowProcessDetail(detailResponse)
}

export const fetchWorkflowPreview = async instanceId => {
  const previews = await fetchWorkflowPreviewList([instanceId])
  const preview = previews.get(String(instanceId))
  if (!preview) throw new Error('API không trả về preview của workflow.')
  return preview
}

/**
 * Gắn dữ liệu workflow vào danh sách entity chung (sản phẩm, khách hàng...).
 * Không tải preview tại màn danh sách; preview chỉ được tải khi mở tiến trình.
 */
export const enrichEntitiesWithWorkflowData = async (tableData, entityType) => {
  const entities = Array.isArray(tableData?.embedded) ? tableData.embedded : []
  const entityIds = entities.map(item => item?.id).filter(Boolean)
  if (!entityIds.length) return tableData

  try {
    const instances = await fetchWorkflowInstancesByEntity({
      entityName: entityType,
      entityIds,
    })
    const instancesByEntityId = instances.reduce((result, instance) => {
      const entityId = getWorkflowInstanceEntityId(instance)
      if (entityId === undefined || entityId === null || entityId === '') return result
      const key = String(entityId)
      result.set(key, [...(result.get(key) ?? []), instance])
      return result
    }, new Map())
    const processIds = Array.from(new Set(
      instances.map(getWorkflowInstanceProcessId).filter(Boolean).map(Number)
    ))
    const processes = await Promise.all(processIds.map(async processId => {
      try {
        return await fetchWorkflowProcessDetail(processId)
      } catch {
        return { id: processId }
      }
    }))
    const processMap = new Map(processes.filter(Boolean).map(process => [Number(process.id), process]))

    return {
      ...tableData,
      embedded: entities.map(entity => {
        const workflowInstances = (instancesByEntityId.get(String(entity.id)) ?? []).map(instance => ({
          ...instance,
          process: processMap.get(Number(instance.processId)) ?? instance.process,
        }))
        return {
          ...entity,
          workflowInstances,
          workflowInstance: workflowInstances[0] ?? null,
          workflowProcess: workflowInstances[0]?.process ?? null,
        }
      }),
    }
  } catch {
    return {
      ...tableData,
      embedded: entities.map(entity => ({
        ...entity,
        workflowInstances: [],
        workflowInstance: null,
        workflowProcess: null,
      })),
    }
  }
}

/**
 * Enrich order table rows with workflow instance, process detail, and preview.
 * Fetches previews in one batch for the displayed page.
 */
export const enrichOrdersWithWorkflowData = async (tableData, { includeProductionLots = false } = {}) => {
  const orders = tableData?.embedded ?? []
  const parentEntityIds = orders
    .map(item => item?.id)
    .filter(Boolean)
  const detailEntityIds = orders.flatMap(item => (
    Array.isArray(item?.details)
      ? item.details.map(detail => detail?.id ?? detail?.detailId).filter(Boolean)
      : []
  ))
  const entityIds = Array.from(new Set([...parentEntityIds, ...detailEntityIds]))

  if (entityIds.length === 0) {
    return tableData
  }

  try {
    const [orderResult, productionResult] = await Promise.allSettled([
      fetchWorkflowInstancesByEntity({ entityName: ORDER_WORKFLOW_ENTITY_TYPE, entityIds }),
      includeProductionLots && detailEntityIds.length
        ? fetchWorkflowInstancesByEntity({ entityName: 'PRODUCTION', entityIds: [...new Set(detailEntityIds)] })
        : Promise.resolve([]),
    ])
    if (orderResult.status === 'rejected') throw orderResult.reason
    const instances = orderResult.value
    const productionInstances = productionResult.status === 'fulfilled' ? productionResult.value : []
    const productionError = productionResult.status === 'rejected'
      ? productionResult.reason?.message || 'Không tải được workflow sản xuất.' : ''

    const instancesByEntityId = instances.reduce((result, item) => {
      const entityId = getWorkflowInstanceEntityId(item)
      if (entityId !== undefined && entityId !== null && entityId !== '') {
        const entityKey = String(entityId)
        result.set(entityKey, [
          ...(result.get(entityKey) ?? []),
          item,
        ])
      }
      return result
    }, new Map())

    const processIds = Array.from(new Set(
      Array.from(instancesByEntityId.values())
        .flat()
        .map(getWorkflowInstanceProcessId)
        .filter(Boolean)
        .map(Number)
    ))

    const workflowProcessesById = new Map()
    if (processIds.length > 0) {
      const workflowProcesses = await Promise.all(
        processIds.map(async (processId) => {
          try {
            return await fetchWorkflowProcessDetail(processId)
          } catch (error) {
            return { id: processId }
          }
        })
      )

      workflowProcesses.forEach((process) => {
        if (process?.id) {
          workflowProcessesById.set(Number(process.id), process)
        }
      })
    }

    let workflowPreviewsByInstanceId = new Map()
    let previewError = ''
    try {
      workflowPreviewsByInstanceId = await fetchWorkflowPreviewList([...instances, ...productionInstances].map(instance => instance.id))
    } catch (error) {
      previewError = error.message || 'Không tải được dữ liệu workflow.'
    }

    tableData.embedded = orders.map((item) => {
      const parentInstances = instancesByEntityId.get(String(item.id)) ?? []
      const enrichedParentInstances = parentInstances.map(instance => ({
        ...instance,
        preview: workflowPreviewsByInstanceId.get(String(instance?.id)) ?? null,
        process: workflowProcessesById.get(Number(instance.processId)) ?? instance.process,
      }))
      const firstParentInstance = enrichedParentInstances[0] ?? null

      const enrichedOrder = {
        ...item,
        details: Array.isArray(item?.details)
          ? item.details.map((detail) => {
            const detailInstances = instancesByEntityId.get(String(detail?.id ?? detail?.detailId)) ?? []
            return {
              ...detail,
              workflowInstances: detailInstances.map(instance => ({
                ...instance,
                preview: workflowPreviewsByInstanceId.get(String(instance.id)) ?? null,
                process: workflowProcessesById.get(Number(instance.processId)) ?? instance.process,
              })),
            }
          })
          : item?.details,
        workflowInstances: enrichedParentInstances,
        workflowInstance: firstParentInstance,
        workflowProcess: firstParentInstance?.process ?? null,
      }
      return includeProductionLots
        ? attachOrderProductionMetrics(enrichedOrder, productionInstances, workflowPreviewsByInstanceId, productionError || previewError)
        : enrichedOrder
    })
  } catch (error) {
    tableData.embedded = orders.map(item => {
      const failedOrder = { ...item,
        details: Array.isArray(item.details) ? item.details.map(detail => ({ ...detail, workflowInstances: [] })) : item.details,
        workflowInstances: [], workflowInstance: null, workflowProcess: null }
      return includeProductionLots ? attachOrderProductionMetrics(failedOrder, [], new Map(),
        error.message || 'Không tải được dữ liệu workflow sản xuất.') : failedOrder
    })
  }


  return tableData
}
