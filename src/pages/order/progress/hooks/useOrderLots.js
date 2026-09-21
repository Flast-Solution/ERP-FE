import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'

import { RequestUtils } from '@flast-erp/core/utils'
import { fetchWorkflowInstancesByEntity } from '@/containers/Order/List/services/workflowApi'
import {
  getWorkflowInstanceEntityId,
  getWorkflowInstanceProcessId,
  normalizeWorkflowInstance,
} from '@/containers/Order/List/utils/workflowMappers'
import {
  LOT_WORKFLOW_ENTITY_TYPE,
  ORDER_LOTS_FIND_API,
  WORKFLOW_PROCESS_FIND_API,
} from '../constants'
import { resolveOrderLots } from '../workflowHelpers'

const getQuanlityProcessId = (lot = {}) => (
  lot?.quanlityProcessId ?? null
)

const getQuanlityInstanceId = (lot = {}) => (
  lot?.quanlityInstanceId ?? null
)

const resolveProcessDetail = (response) => {
  const payload = response?.data ?? response
  return payload?.process ?? payload ?? null
}

const enrichLotsWithNcrWorkflow = async (lots = []) => {
  const processIds = Array.from(new Set(
    lots.map(getQuanlityProcessId).filter(Boolean).map(String),
  ))
  if (!processIds.length) return lots

  const [processEntries, workflowInstances] = await Promise.all([
    Promise.all(processIds.map(async (processId) => {
      try {
        const response = await RequestUtils.Get(
          `${WORKFLOW_PROCESS_FIND_API}/${processId}`,
          {},
        )
        return [String(processId), resolveProcessDetail(response)]
      } catch (error) {
        return [String(processId), null]
      }
    })),
    fetchWorkflowInstancesByEntity({
      entityName: LOT_WORKFLOW_ENTITY_TYPE,
      entityIds: lots.map(lot => lot?.id).filter(Boolean),
    }).catch(() => []),
  ])
  const processMap = new Map(processEntries)
  const instanceMap = new Map(workflowInstances.map((item) => {
    const instance = normalizeWorkflowInstance(item)
    return [
      `${getWorkflowInstanceEntityId(instance)}:${getWorkflowInstanceProcessId(instance)}`,
      instance,
    ]
  }))

  return lots.map((lot) => {
    const processId = getQuanlityProcessId(lot)
    const process = processMap.get(String(processId)) ?? null
    const fetchedInstance = instanceMap.get(`${lot?.id}:${processId}`) ?? null
    const instanceId = getQuanlityInstanceId(lot)
    const ncrWorkflowInstance = fetchedInstance ?? (instanceId
      ? {
        id: instanceId,
        entityId: lot?.id,
        entityType: LOT_WORKFLOW_ENTITY_TYPE,
        processId,
        currentStepCode: null,
        state: null,
        process,
      }
      : null)

    return processId
      ? {
        ...lot,
        quanlityProcessId: processId,
        quanlityInstanceId: instanceId ?? fetchedInstance?.id ?? null,
        ncrWorkflow: process,
        ncrWorkflowInstance,
      }
      : lot
  })
}

export const useOrderLots = (orderId) => {
  const [lots, setLots] = useState([])
  const [selectedLot, setSelectedLot] = useState(null)
  const [loadingLots, setLoadingLots] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setLots([])
      setSelectedLot(null)
      return undefined
    }

    let mounted = true
    setLoadingLots(true)

    const loadLots = async () => {
      try {
        const response = await RequestUtils.Get(ORDER_LOTS_FIND_API, {
          entity: 'ORDER',
          entityId: orderId,
        })

        const orderLots = await enrichLotsWithNcrWorkflow(resolveOrderLots(response))
        if (!mounted) return
        setLots(orderLots)
        setSelectedLot(current => (
          orderLots.find(lot => String(lot?.id) === String(current?.id)) ?? null
        ))
      } catch (error) {
        if (!mounted) return
        setLots([])
        setSelectedLot(null)
        message.error(error?.message || 'Không tải được danh sách lô hàng.')
      } finally {
        if (mounted) {
          setLoadingLots(false)
        }
      }
    }

    loadLots()

    return () => {
      mounted = false
    }
  }, [orderId])

  const selectLot = useCallback((lot) => {
    setSelectedLot(lot)
    return true
  }, [])

  const selectOrder = useCallback(() => {
    setSelectedLot(null)
  }, [])

  return {
    lots,
    selectedLot,
    loadingLots,
    selectLot,
    selectOrder,
  }
}
