export const getWorkflowInstanceEntityId = (instance) => instance?.entityId

export const normalizeWorkflowInstance = (instance) => {
  if (!instance?.processInstance) {
    return instance
  }

  return {
    ...instance,
    ...instance.processInstance,
    process: instance?.process ?? instance?.workflowProcess ?? instance?.processInstance?.process,
  }
}

export const getWorkflowInstanceProcessId = (instance) => instance?.processId

export const getWorkflowCurrentStepLabel = (record) => (
  record?.workflowInstance?.preview?.stepProcesses?.name
)

export const getWorkflowInstanceMapByEntityId = (instances = []) => (
  instances.reduce((result, item) => {
    const entityId = getWorkflowInstanceEntityId(item)
    if (entityId !== undefined && entityId !== null && entityId !== '') {
      result.set(String(entityId), normalizeWorkflowInstance(item))
    }
    return result
  }, new Map())
)
