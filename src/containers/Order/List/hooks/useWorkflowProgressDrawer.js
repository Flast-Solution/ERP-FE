import { useCallback, useRef, useState } from 'react'
import { message } from 'antd'

import {
  fetchWorkflowInstancesByEntity,
  fetchWorkflowProcessDetail,
} from '../services/workflowApi'
import { ORDER_WORKFLOW_ENTITY_TYPE } from '../constants'
import {
  getWorkflowInstanceProcessId,
  normalizeWorkflowInstance,
} from '../utils/workflowMappers'

const useWorkflowProgressDrawer = () => {
  const requestIdRef = useRef(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const [workflowInstances, setWorkflowInstances] = useState([])

  const openWorkflowProgressDrawer = useCallback(async (selectedOrder, selectedDetail, options = {}) => {
    if (!selectedDetail?.id) return

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setOrder(selectedOrder)
    setOrderDetail(selectedDetail)
    setWorkflowInstances([])
    setOpen(true)
    setLoading(true)

    try {
      const suppliedInstances = Array.isArray(options.workflowInstances)
        ? options.workflowInstances
        : []
      let fetchedInstances = []
      try {
        fetchedInstances = await fetchWorkflowInstancesByEntity({
          entityName: options.entityName || ORDER_WORKFLOW_ENTITY_TYPE,
          entityIds: [selectedDetail.id],
        })
      } catch (error) {
        if (!suppliedInstances.length) throw error
      }

      const normalizedInstances = Array.from(new Map(
        [...suppliedInstances, ...fetchedInstances]
          .map(normalizeWorkflowInstance)
          .filter(Boolean)
          .map(instance => [
            String(instance.id),
            instance,
          ])
      ).values())
      const includeAllInstances = options.includeAllInstances === true
      const requestedProcessId = includeAllInstances ? null : options.processId
      const requestedInstanceId = includeAllInstances ? null : selectedDetail.workflowInstanceId
      const scopedInstances = normalizedInstances.filter(instance => {
        if (requestedInstanceId && String(instance.id) !== String(requestedInstanceId)) return false
        if (requestedProcessId && String(instance.processId) !== String(requestedProcessId)) return false
        return true
      })
      const effectiveInstances = scopedInstances.length > 0
        ? scopedInstances
        : (requestedProcessId && requestedInstanceId ? [{
          id: requestedInstanceId,
          processId: requestedProcessId,
          entityId: selectedDetail.id,
          entityType: options.entityName || ORDER_WORKFLOW_ENTITY_TYPE,
          currentStepCode: null,
          state: null,
          process: null,
        }] : [])
      const processIds = Array.from(new Set(
        effectiveInstances
          .map(getWorkflowInstanceProcessId)
          .filter(processId => processId !== undefined && processId !== null && processId !== '')
      ))
      const processEntries = await Promise.all(processIds.map(async (processId) => {
        try {
          return [String(processId), await fetchWorkflowProcessDetail(processId)]
        } catch (error) {
          return [String(processId), null]
        }
      }))

      if (requestIdRef.current !== requestId) return
      const processMap = new Map(processEntries)
      setWorkflowInstances(effectiveInstances.map(instance => ({
        ...instance,
        process: processMap.get(String(getWorkflowInstanceProcessId(instance))) ?? instance.process,
      })))
    } catch (error) {
      if (requestIdRef.current === requestId) {
        message.error(`Không tải được tiến trình workflow của ${options.entityLabel || 'đối tượng này'}.`)
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [])

  const closeWorkflowProgressDrawer = useCallback(() => {
    requestIdRef.current += 1
    setOpen(false)
    setLoading(false)
    setOrder(null)
    setOrderDetail(null)
    setWorkflowInstances([])
  }, [])

  return {
    workflowProgressDrawerOpen: open,
    workflowProgressDrawerLoading: loading,
    workflowProgressOrder: order,
    workflowProgressOrderDetail: orderDetail,
    workflowProgressInstances: workflowInstances,
    openWorkflowProgressDrawer,
    closeWorkflowProgressDrawer,
  }
}

export default useWorkflowProgressDrawer
