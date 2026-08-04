import { useCallback, useRef, useState } from 'react'
import { message } from 'antd'

import {
  fetchWorkflowInstancesByEntity,
  fetchWorkflowProcessDetail,
} from '../services/workflowApi'
import { ORDER_WORKFLOW_ENTITY_TYPE } from '../constants'
import { getWorkflowInstanceProcessId } from '../utils/workflowMappers'

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
      const instances = await fetchWorkflowInstancesByEntity({
        entityName: options.entityName || ORDER_WORKFLOW_ENTITY_TYPE,
        entityIds: [selectedDetail.id],
      })
      const processIds = Array.from(new Set(
        instances
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
      setWorkflowInstances(instances.map(instance => ({
        ...instance,
        workflowProcess: processMap.get(String(getWorkflowInstanceProcessId(instance))) ?? null,
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
