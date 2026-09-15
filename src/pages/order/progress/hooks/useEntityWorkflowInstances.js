import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { message } from 'antd'

import { RequestUtils } from '@flast-erp/core/utils'
import {
  WORKFLOW_INSTANCE_BY_ENTITY_API,
  WORKFLOW_PROCESS_FIND_API,
} from '../constants'
import { normalizeWorkflowInstance } from '@/containers/Order/List/utils/workflowMappers'

const resolveWorkflowInstances = response => (
  Array.isArray(response?.data) ? response.data : []
)

const normalizeDistinctInstances = (instances = []) => Array.from(
  instances
    .map(normalizeWorkflowInstance)
    .filter(Boolean)
    .reduce((result, instance) => {
      const instanceId = String(instance.id)
      result.set(instanceId, {
        ...(result.get(instanceId) ?? {}),
        ...instance,
      })
      return result
    }, new Map())
    .values(),
)

const resolveProcessDetail = (response) => {
  const payload = response?.data ?? response
  return payload?.process ?? payload ?? null
}

export const useEntityWorkflowInstances = ({
  entityType,
  entityId,
  preferredInstanceId,
  providedInstances = [],
}) => {
  const requestIdRef = useRef(0)
  const selectedByEntityRef = useRef(new Map())
  const preferredInstanceIdRef = useRef(preferredInstanceId)
  const providedInstancesRef = useRef(providedInstances)
  const [workflowInstances, setWorkflowInstances] = useState([])
  const [selectedInstanceId, setSelectedInstanceId] = useState(null)
  const [loadedEntityKey, setLoadedEntityKey] = useState(null)
  const [loadingWorkflowInstances, setLoadingWorkflowInstances] = useState(false)

  const entityKey = entityType && entityId
    ? `${entityType}:${entityId}`
    : null

  useEffect(() => {
    preferredInstanceIdRef.current = preferredInstanceId
  }, [preferredInstanceId])

  useEffect(() => {
    providedInstancesRef.current = providedInstances
  }, [providedInstances])

  const loadWorkflowInstances = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    if (!entityType || !entityId) {
      setWorkflowInstances([])
      setSelectedInstanceId(null)
      setLoadedEntityKey(null)
      setLoadingWorkflowInstances(false)
      return
    }

    setLoadingWorkflowInstances(true)
    setWorkflowInstances([])
    setSelectedInstanceId(null)
    setLoadedEntityKey(null)

    try {
      const response = await RequestUtils.Post(WORKFLOW_INSTANCE_BY_ENTITY_API, {
        entityName: entityType,
        entityIds: [String(entityId)],
      })
      if (requestIdRef.current !== requestId) return

      const fetchedInstances = resolveWorkflowInstances(response)
      const normalizedInstances = normalizeDistinctInstances(
        fetchedInstances.length > 0
          ? fetchedInstances
          : providedInstancesRef.current,
      )

      const processIds = Array.from(new Set(
        normalizedInstances.map(instance => instance.processId).filter(Boolean),
      ))
      const processEntries = await Promise.all(
        processIds.map(async (processId) => {
          try {
            const detail = await RequestUtils.Get(
              `${WORKFLOW_PROCESS_FIND_API}/${processId}`,
              {},
            )
            return [String(processId), resolveProcessDetail(detail)]
          } catch (error) {
            return [String(processId), null]
          }
        }),
      )
      if (requestIdRef.current !== requestId) return

      const processMap = new Map(processEntries)
      const enrichedInstances = normalizedInstances.map(instance => ({
        ...instance,
        process: processMap.get(String(instance.processId)) ?? instance.process,
      }))
      const rememberedInstanceId = selectedByEntityRef.current.get(entityKey)
      const nextInstanceId = [
        rememberedInstanceId,
        preferredInstanceIdRef.current,
        enrichedInstances[0]?.id,
      ].find(candidate => enrichedInstances.some(
        instance => String(instance.id) === String(candidate),
      ))

      setWorkflowInstances(enrichedInstances)
      setSelectedInstanceId(nextInstanceId ?? null)
      setLoadedEntityKey(entityKey)
    } catch (error) {
      if (requestIdRef.current !== requestId) return
      const fallbackInstances = normalizeDistinctInstances(providedInstancesRef.current)
      if (fallbackInstances.length > 0) {
        const fallbackInstanceId = fallbackInstances[0].id
        setWorkflowInstances(fallbackInstances)
        setSelectedInstanceId(fallbackInstanceId)
        setLoadedEntityKey(entityKey)
      } else {
        setWorkflowInstances([])
        setSelectedInstanceId(null)
        setLoadedEntityKey(entityKey)
        message.error(error?.message || 'Không tải được danh sách workflow.')
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoadingWorkflowInstances(false)
      }
    }
  }, [entityId, entityKey, entityType])

  useEffect(() => {
    loadWorkflowInstances()
  }, [loadWorkflowInstances])

  useEffect(() => {
    if (!preferredInstanceId || workflowInstances.length === 0) return
    const matched = workflowInstances.find(
      instance => String(instance.id) === String(preferredInstanceId),
    )
    if (matched) {
      setSelectedInstanceId(matched.id)
    }
  }, [preferredInstanceId, workflowInstances])

  const selectWorkflowInstance = useCallback((instanceId) => {
    setSelectedInstanceId(instanceId)
    if (entityKey) {
      selectedByEntityRef.current.set(entityKey, instanceId)
    }
  }, [entityKey])

  const scopedWorkflowInstances = useMemo(() => (
    loadedEntityKey === entityKey ? workflowInstances : []
  ), [entityKey, loadedEntityKey, workflowInstances])
  const scopedSelectedInstanceId = loadedEntityKey === entityKey
    ? selectedInstanceId
    : null

  const workflowInstance = useMemo(() => (
    scopedWorkflowInstances.find(
      instance => String(instance.id) === String(selectedInstanceId),
    ) ?? null
  ), [scopedWorkflowInstances, selectedInstanceId])

  const syncWorkflowInstance = useCallback((processInstance) => {
    if (!processInstance || !selectedInstanceId) return

    setWorkflowInstances(current => current.map(instance => (
      String(instance.id) === String(selectedInstanceId)
        ? {
          ...instance,
          ...processInstance,
          id: instance.id,
          process: instance.process,
        }
        : instance
    )))
  }, [selectedInstanceId])

  return {
    workflowInstances: scopedWorkflowInstances,
    workflowInstance,
    selectedInstanceId: scopedSelectedInstanceId,
    loadingWorkflowInstance: loadingWorkflowInstances,
    selectWorkflowInstance,
    syncWorkflowInstance,
    refreshWorkflowInstances: loadWorkflowInstances,
  }
}
