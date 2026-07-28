import { RequestUtils } from '@flast-erp/core/utils'
import {
  WORKFLOW_FILTER_API,
  ORDER_WORKFLOW_ATTACH_API,
  WORKFLOW_INSTANCE_BY_ENTITY_API,
  WORKFLOW_PROCESS_FIND_API,
  WORKFLOW_PREVIEW_API,
  ORDER_WORKFLOW_ENTITY_TYPE,
} from '../constants'
import {
  resolveWorkflowList,
  resolveWorkflowInstances,
  resolveWorkflowProcessDetail,
  resolveWorkflowPreview,
} from '../utils/responseResolvers'
import {
  getWorkflowInstanceEntityId,
  getWorkflowInstanceProcessId,
  normalizeWorkflowInstance,
} from '../utils/workflowMappers'

export const fetchWorkflowList = async () => {
  const response = await RequestUtils.Get(WORKFLOW_FILTER_API, {})
  return resolveWorkflowList(response)
}

export const attachWorkflow = async ({ processId, entityType, entityId }) => {
  return RequestUtils.Post(ORDER_WORKFLOW_ATTACH_API, {
    processId,
    entityType,
    entityId,
  })
}

export const fetchWorkflowInstancesByEntity = async ({ entityName, entityIds }) => {
  const response = await RequestUtils.Post(WORKFLOW_INSTANCE_BY_ENTITY_API, {
    entityName,
    entityIds,
  })
  return resolveWorkflowInstances(response)
}

export const fetchWorkflowProcessDetail = async (processId) => {
  const detailResponse = await RequestUtils.Get(`${WORKFLOW_PROCESS_FIND_API}/${processId}`, {})
  return resolveWorkflowProcessDetail(detailResponse)
}

export const fetchWorkflowPreview = async (instanceId) => {
  const previewResponse = await RequestUtils.Get(WORKFLOW_PREVIEW_API, { instanceId })
  return resolveWorkflowPreview(previewResponse)
}

/**
 * Enrich order table rows with workflow instance, process detail, and preview.
 * Preserves existing N+1 fetch behavior; extract-only refactor.
 */
export const enrichOrdersWithWorkflowData = async (tableData) => {
  const orders = tableData?.embedded ?? []
  const parentEntityIds = orders
    .map(item => item?.id)
    .filter(Boolean)
  const detailEntityIds = orders.flatMap(item => (
    Array.isArray(item?.details)
      ? item.details.map(detail => detail?.id).filter(Boolean)
      : []
  ))
  const entityIds = Array.from(new Set([...parentEntityIds, ...detailEntityIds]))

  if (entityIds.length === 0) {
    return tableData
  }

  try {
    const instances = await fetchWorkflowInstancesByEntity({
      entityName: ORDER_WORKFLOW_ENTITY_TYPE,
      entityIds,
    })

    const instancesByEntityId = instances.reduce((result, item) => {
      const entityId = getWorkflowInstanceEntityId(item)
      if (entityId !== undefined && entityId !== null && entityId !== '') {
        const entityKey = String(entityId)
        result.set(entityKey, [
          ...(result.get(entityKey) ?? []),
          normalizeWorkflowInstance(item),
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

    const workflowPreviewsByInstanceId = new Map()
    const previewableInstances = parentEntityIds
      .flatMap(entityId => instancesByEntityId.get(String(entityId)) ?? [])
      .filter(instance => instance?.id)

    if (previewableInstances.length > 0) {
      const workflowPreviews = await Promise.all(
        previewableInstances.map(async (instance) => {
          try {
            const preview = await fetchWorkflowPreview(instance.id)
            return {
              instanceId: Number(instance.id),
              preview,
            }
          } catch (error) {
            return {
              instanceId: Number(instance.id),
              preview: null,
            }
          }
        })
      )

      workflowPreviews.forEach(({ instanceId, preview }) => {
        if (instanceId && preview) {
          workflowPreviewsByInstanceId.set(Number(instanceId), preview)
        }
      })
    }

    tableData.embedded = orders.map((item) => {
      const parentInstances = instancesByEntityId.get(String(item.id)) ?? []
      const enrichedParentInstances = parentInstances.map(instance => ({
        ...instance,
        preview: workflowPreviewsByInstanceId.get(Number(instance?.id)) ?? null,
        workflowProcess: workflowProcessesById.get(Number(getWorkflowInstanceProcessId(instance))) ?? null,
      }))
      const firstParentInstance = enrichedParentInstances[0] ?? null

      return {
        ...item,
        details: Array.isArray(item?.details)
          ? item.details.map((detail) => {
            const detailInstances = instancesByEntityId.get(String(detail?.id)) ?? []
            return {
              ...detail,
              workflowInstances: detailInstances.map(instance => ({
                ...instance,
                workflowProcess: workflowProcessesById.get(
                  Number(getWorkflowInstanceProcessId(instance))
                ) ?? null,
              })),
            }
          })
          : item?.details,
        workflowInstances: enrichedParentInstances,
        workflowInstance: firstParentInstance,
        workflowProcess: firstParentInstance?.workflowProcess ?? null,
      }
    })
  } catch (error) {
    tableData.embedded = tableData.embedded.map(item => ({
      ...item,
      details: Array.isArray(item?.details)
        ? item.details.map(detail => ({ ...detail, workflowInstances: [] }))
        : item?.details,
      workflowInstances: [],
      workflowInstance: null,
      workflowProcess: null,
    }))
  }

  return tableData
}
