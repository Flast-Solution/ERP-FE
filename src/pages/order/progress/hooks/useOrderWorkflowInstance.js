import { useCallback, useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { message } from 'antd'

import { RequestUtils } from '@flast-erp/core/utils'
import {
  ORDER_WORKFLOW_ENTITY_TYPE,
  WORKFLOW_INSTANCE_BY_ENTITY_API,
} from '../constants'
import { resolveWorkflowInstances } from '../workflowHelpers'

const toInstanceId = (value) => {
  if (value === undefined || value === null || value === '') return null
  const instanceId = Number(value)
  return Number.isNaN(instanceId) ? null : instanceId
}

export const useOrderWorkflowInstance = (orderId) => {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const routeInstanceId = toInstanceId(searchParams.get('instanceId'))
  const stateWorkflowInstance = location.state?.workflowInstance

  const [workflowInstance, setWorkflowInstance] = useState(() => {
    if (stateWorkflowInstance?.id) return stateWorkflowInstance
    return routeInstanceId ? { id: routeInstanceId } : null
  })

  useEffect(() => {
    if (routeInstanceId) {
      setWorkflowInstance((current) => (
        Number(current?.id) === routeInstanceId
          ? current
          : Number(stateWorkflowInstance?.id) === routeInstanceId
            ? stateWorkflowInstance
            : { id: routeInstanceId }
      ))
      return undefined
    }

    if (!orderId) {
      setWorkflowInstance(null)
      return undefined
    }

    let mounted = true

    RequestUtils.Post(WORKFLOW_INSTANCE_BY_ENTITY_API, {
      entityName: ORDER_WORKFLOW_ENTITY_TYPE,
      entityIds: [Number(orderId)],
    })
      .then((response) => {
        if (!mounted) return
        const instances = resolveWorkflowInstances(response)
        const instance = instances.find((item) => Number(item?.entityId) === Number(orderId)) ?? null
        setWorkflowInstance(instance)
      })
      .catch((error) => {
        if (!mounted) return
        setWorkflowInstance(null)
        message.error(error?.message || 'Không tải được workflow của đơn hàng.')
      })

    return () => {
      mounted = false
    }
  }, [orderId, routeInstanceId, stateWorkflowInstance])

  const syncWorkflowInstance = useCallback((processInstance) => {
    if (processInstance) {
      setWorkflowInstance(processInstance)
    }
  }, [])

  return {
    workflowInstance,
    syncWorkflowInstance,
  }
}
