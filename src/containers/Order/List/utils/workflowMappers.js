/**
 * Contract duy nhat cua workflow instance trong FE.
 * API /workflow/process/instance/get-entity tra truc tiep cac field nay.
 */
export const normalizeWorkflowInstance = (instance) => {
  if (!instance?.id || !instance?.processId || !instance?.entityId) return null

  return {
    ...instance,
    id: instance.id,
    processId: instance.processId,
    entityType: instance.entityType,
    entityId: instance.entityId,
    currentStepCode: instance.currentStepCode ?? null,
    state: instance.state ?? null,
    process: instance.process ?? null,
  }
}

export const getWorkflowInstanceEntityId = (instance) => instance?.entityId

export const getWorkflowInstanceProcessId = (instance) => instance?.processId

export const getWorkflowCurrentStepLabel = (record) => (
  record?.workflowInstance?.preview?.stepProcesses?.name
)

export const getWorkflowInstanceMapByEntityId = (instances = []) => (
  instances.reduce((result, item) => {
    const instance = normalizeWorkflowInstance(item)
    const entityId = getWorkflowInstanceEntityId(instance)
    if (entityId !== undefined && entityId !== null && entityId !== '') {
      result.set(String(entityId), instance)
    }
    return result
  }, new Map())
)
