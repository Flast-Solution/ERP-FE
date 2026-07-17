import { useCallback, useEffect, useState } from 'react'

export const useOrderWorkflowInstance = (selectedLot) => {
  const lotId = selectedLot?.id
  const workflowInstanceId = selectedLot?.workflowInstanceId
  const [workflowInstance, setWorkflowInstance] = useState(null)

  useEffect(() => {
    setWorkflowInstance(workflowInstanceId ? {
      id: Number(workflowInstanceId),
      entityId: Number(lotId),
    } : null)
  }, [lotId, workflowInstanceId])

  const syncWorkflowInstance = useCallback((processInstance) => {
    if (!workflowInstanceId) return

    setWorkflowInstance({
      ...processInstance,
      id: Number(workflowInstanceId),
      entityId: Number(lotId),
    })
  }, [lotId, workflowInstanceId])

  return {
    workflowInstance,
    loadingWorkflowInstance: false,
    syncWorkflowInstance,
  }
}
