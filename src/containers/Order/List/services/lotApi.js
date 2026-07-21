import { RequestUtils } from '@flast-erp/core/utils'
import {
  ORDER_LOTS_FIND_API,
  LOT_WORKFLOW_ENTITY_TYPE,
  WORKFLOW_INSTANCE_BY_ENTITY_API,
} from '../constants'
import { resolveOrderLots, resolveWorkflowInstances } from '../utils/responseResolvers'
import { getWorkflowInstanceMapByEntityId } from '../utils/workflowMappers'

export const fetchLotsByOrderEntity = async (entityId) => {
  const response = await RequestUtils.Get(ORDER_LOTS_FIND_API, {
    entity: 'ORDER',
    entityId,
  })
  return resolveOrderLots(response)
}

export const fetchLotWorkflowInstances = async (lotIds) => {
  if (!lotIds.length) {
    return new Map()
  }

  try {
    const workflowResponse = await RequestUtils.Post(WORKFLOW_INSTANCE_BY_ENTITY_API, {
      entityName: LOT_WORKFLOW_ENTITY_TYPE,
      entityIds: lotIds,
    })
    return getWorkflowInstanceMapByEntityId(resolveWorkflowInstances(workflowResponse))
  } catch (error) {
    return new Map()
  }
}

export const fetchLotsWithWorkflow = async (entityId) => {
  const lots = await fetchLotsByOrderEntity(entityId)
  const lotIds = lots.map(lot => lot?.id).filter(Boolean)
  const workflowInstancesByLotId = await fetchLotWorkflowInstances(lotIds)

  return lots.map(lot => ({
    ...lot,
    workflowInstance: workflowInstancesByLotId.get(String(lot?.id)) ?? lot.workflowInstance ?? null,
  }))
}
