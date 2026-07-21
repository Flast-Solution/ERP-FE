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
  const entityIds = (tableData?.embedded ?? [])
    .map(item => item?.id)
    .filter(Boolean)

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
      if (entityId) {
        result.set(Number(entityId), normalizeWorkflowInstance(item))
      }
      return result
    }, new Map())

    const processIds = Array.from(new Set(
      Array.from(instancesByEntityId.values())
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
    const previewableInstances = Array.from(instancesByEntityId.values())
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

    tableData.embedded = tableData.embedded.map(item => ({
      ...item,
      workflowInstance: instancesByEntityId.get(Number(item.id))
        ? {
          ...instancesByEntityId.get(Number(item.id)),
          preview: workflowPreviewsByInstanceId.get(Number(instancesByEntityId.get(Number(item.id))?.id)) ?? null,
        }
        : null,
      workflowProcess: workflowProcessesById.get(Number(getWorkflowInstanceProcessId(instancesByEntityId.get(Number(item.id))))) ?? null,
    }))
  } catch (error) {
    tableData.embedded = tableData.embedded.map(item => ({
      ...item,
      workflowInstance: null,
      workflowProcess: null,
    }))
  }

  return tableData
}
