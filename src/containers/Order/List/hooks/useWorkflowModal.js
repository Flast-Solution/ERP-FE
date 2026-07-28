import { useCallback, useMemo, useRef, useState } from 'react'
import { message } from 'antd'
import { SUCCESS_CODE } from '@/configs'
import {
  ORDER_WORKFLOW_ENTITY_TYPE,
  LOT_WORKFLOW_ENTITY_TYPE,
} from '../constants'
import {
  attachWorkflow,
  fetchWorkflowInstancesByEntity,
  fetchWorkflowList,
} from '../services/workflowApi'
import { resolveWorkflowInstances } from '../utils/responseResolvers'
import {
  getWorkflowInstanceEntityId,
  getWorkflowInstanceProcessId,
  normalizeWorkflowInstance,
} from '../utils/workflowMappers'

const createTargetKey = target => String(target?.id ?? '')

const resolveWorkflowTargets = (record, entityType) => {
  if (!record) return []
  if (entityType === LOT_WORKFLOW_ENTITY_TYPE) return record?.id ? [record] : []

  const orderDetails = Array.isArray(record?.details)
    ? record.details.filter(detail => detail?.id)
    : []

  return orderDetails.length > 0
    ? orderDetails
    : (record?.id ? [record] : [])
}

const getWorkflowIdsFromTarget = (target) => {
  const instances = Array.isArray(target?.workflowInstances)
    ? target.workflowInstances
    : (target?.workflowInstance ? [target.workflowInstance] : [])

  return instances
    .map(getWorkflowInstanceProcessId)
    .filter(id => id !== undefined && id !== null && id !== '')
}

const groupWorkflowIdsByEntity = (targets, instances = []) => {
  const result = targets.reduce((map, target) => {
    map[createTargetKey(target)] = getWorkflowIdsFromTarget(target)
    return map
  }, {})

  instances.forEach((instance) => {
    const entityKey = String(getWorkflowInstanceEntityId(instance) ?? '')
    const processId = getWorkflowInstanceProcessId(instance)
    if (!entityKey || processId === undefined || processId === null || processId === '') return

    result[entityKey] = Array.from(new Set([...(result[entityKey] ?? []), processId]))
  })

  return result
}

const isSuccessfulResponse = response => (
  response?.success === true || Number(response?.errorCode) === SUCCESS_CODE
)

const useWorkflowModal = ({ setLotsByOrderId } = {}) => {
  const openRequestRef = useRef(0)
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false)
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [workflowAttaching, setWorkflowAttaching] = useState(false)
  const [workflows, setWorkflows] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedWorkflowEntityType, setSelectedWorkflowEntityType] = useState(ORDER_WORKFLOW_ENTITY_TYPE)
  const [workflowTargets, setWorkflowTargets] = useState([])
  const [selectedWorkflowIdsByTarget, setSelectedWorkflowIdsByTarget] = useState({})
  const [initialWorkflowIdsByTarget, setInitialWorkflowIdsByTarget] = useState({})

  const setWorkflowIdsForTarget = useCallback((targetKey, workflowIds) => {
    const normalizedTargetKey = String(targetKey)
    const persistedIds = initialWorkflowIdsByTarget[normalizedTargetKey] ?? []

    setSelectedWorkflowIdsByTarget(current => ({
      ...current,
      [normalizedTargetKey]: Array.from(new Set([
        ...persistedIds,
        ...workflowIds,
      ])),
    }))
  }, [initialWorkflowIdsByTarget])

  const openWorkflowModal = useCallback(async (
    record,
    entityType = ORDER_WORKFLOW_ENTITY_TYPE
  ) => {
    const requestId = openRequestRef.current + 1
    openRequestRef.current = requestId
    const targets = resolveWorkflowTargets(record, entityType)
    const targetIds = targets.map(target => target.id)
    const localSelections = groupWorkflowIdsByEntity(targets)

    setSelectedOrder(record)
    setSelectedWorkflowEntityType(entityType)
    setWorkflowTargets(targets)
    setSelectedWorkflowIdsByTarget(localSelections)
    setInitialWorkflowIdsByTarget(localSelections)
    setWorkflowModalOpen(true)
    setWorkflowLoading(true)

    try {
      const [workflowList, attachedInstances] = await Promise.all([
        fetchWorkflowList(),
        targetIds.length > 0
          ? fetchWorkflowInstancesByEntity({
            entityName: entityType,
            entityIds: targetIds,
          })
          : Promise.resolve([]),
      ])

      if (openRequestRef.current !== requestId) return
      const selections = groupWorkflowIdsByEntity(targets, attachedInstances)
      setWorkflows(workflowList)
      setSelectedWorkflowIdsByTarget(selections)
      setInitialWorkflowIdsByTarget(selections)
    } catch (error) {
      if (openRequestRef.current === requestId) {
        message.error('Không tải được dữ liệu workflow.')
      }
    } finally {
      if (openRequestRef.current === requestId) setWorkflowLoading(false)
    }
  }, [])

  const closeWorkflowModal = useCallback(() => {
    openRequestRef.current += 1
    setWorkflowModalOpen(false)
    setSelectedOrder(null)
    setSelectedWorkflowEntityType(ORDER_WORKFLOW_ENTITY_TYPE)
    setWorkflowTargets([])
    setSelectedWorkflowIdsByTarget({})
    setInitialWorkflowIdsByTarget({})
  }, [])

  const pendingAssignments = useMemo(() => (
    workflowTargets.flatMap(target => {
      const targetKey = createTargetKey(target)
      const initialIds = new Set(
        (initialWorkflowIdsByTarget[targetKey] ?? []).map(String)
      )

      return (selectedWorkflowIdsByTarget[targetKey] ?? [])
        .filter(processId => !initialIds.has(String(processId)))
        .map(processId => ({
          processId,
          entityType: selectedWorkflowEntityType,
          entityId: target.id,
          target,
        }))
    })
  ), [
    initialWorkflowIdsByTarget,
    selectedWorkflowEntityType,
    selectedWorkflowIdsByTarget,
    workflowTargets,
  ])

  const handleAttachWorkflow = useCallback(async () => {
    if (pendingAssignments.length === 0) {
      message.warning('Vui lòng chọn thêm ít nhất một workflow.')
      return
    }

    setWorkflowAttaching(true)
    try {
      const results = await Promise.all(
        pendingAssignments.map(async (assignment) => {
          try {
            return {
              assignment,
              response: await attachWorkflow(assignment),
            }
          } catch (error) {
            return { assignment, response: null, error }
          }
        })
      )
      const successfulResults = results.filter(({ response }) => isSuccessfulResponse(response))
      const failedCount = results.length - successfulResults.length

      if (successfulResults.length === 0) {
        message.error(results[0]?.response?.message || 'Gắn workflow thất bại. Vui lòng thử lại.')
        return
      }

      setInitialWorkflowIdsByTarget(current => successfulResults.reduce((next, { assignment }) => {
        const targetKey = String(assignment.entityId)
        next[targetKey] = Array.from(new Set([
          ...(next[targetKey] ?? []),
          assignment.processId,
        ]))
        return next
      }, { ...current }))

      if (
        selectedWorkflowEntityType === LOT_WORKFLOW_ENTITY_TYPE
        && setLotsByOrderId
      ) {
        const latestSuccessfulResponse = successfulResults[successfulResults.length - 1].response
        const attachedInstance = resolveWorkflowInstances(latestSuccessfulResponse)[0]
          ?? normalizeWorkflowInstance(latestSuccessfulResponse?.data ?? latestSuccessfulResponse)
        const targetId = successfulResults[successfulResults.length - 1].assignment.entityId

        setLotsByOrderId(prev => Object.entries(prev).reduce((result, [orderId, lots]) => ({
          ...result,
          [orderId]: (lots ?? []).map(lot => (
            String(lot?.id) === String(targetId)
              ? {
                ...lot,
                workflowInstance: attachedInstance?.id ? attachedInstance : lot.workflowInstance,
              }
              : lot
          )),
        }), {}))
      }

      if (failedCount > 0) {
        message.warning(`Đã gắn ${successfulResults.length} workflow, ${failedCount} workflow thất bại.`)
        return
      }

      message.success(`Đã gắn ${successfulResults.length} workflow.`)
      closeWorkflowModal()
    } catch (error) {
      message.error('Gắn workflow thất bại. Vui lòng thử lại.')
    } finally {
      setWorkflowAttaching(false)
    }
  }, [
    closeWorkflowModal,
    pendingAssignments,
    selectedWorkflowEntityType,
    setLotsByOrderId,
  ])

  return {
    workflowModalOpen,
    workflowLoading,
    workflowAttaching,
    workflows,
    selectedOrder,
    selectedWorkflowEntityType,
    workflowTargets,
    selectedWorkflowIdsByTarget,
    initialWorkflowIdsByTarget,
    setWorkflowIdsForTarget,
    canSubmit: pendingAssignments.length > 0,
    openWorkflowModal,
    closeWorkflowModal,
    handleAttachWorkflow,
  }
}

export default useWorkflowModal
