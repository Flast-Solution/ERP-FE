import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import useGetMe from '@/hooks/useGetMe'
import { useOrderProgressOrder } from './progress/hooks/useOrderProgressOrder'
import { useOrderLots } from './progress/hooks/useOrderLots'
import { useEntityWorkflowInstances } from './progress/hooks/useEntityWorkflowInstances'
import { useWorkflowProgress } from './progress/hooks/useWorkflowProgress'
import { useWorkflowSubmissions } from './progress/hooks/useWorkflowSubmissions'
import { useWorkflowRemoteForm } from './progress/hooks/useWorkflowRemoteForm'
import OrderProgressLayout from './progress/components/OrderProgressLayout'
import {
  LOT_WORKFLOW_ENTITY_TYPE,
  ORDER_WORKFLOW_ENTITY_TYPE,
} from './progress/constants'

const OrderProgressPage = () => {
  const { user } = useGetMe()
  const [searchParams, setSearchParams] = useSearchParams()
  const changingScopeRef = useRef(false)
  const orderState = useOrderProgressOrder()
  const lotState = useOrderLots(orderState.orderId)
  const {
    loadingLots,
    lots,
    selectedLot,
    selectLot,
    selectOrder,
  } = lotState
  const requestedEntityType = searchParams.get('entityType')
  const requestedEntityId = searchParams.get('entityId')
  const requestedInstanceId = searchParams.get('instanceId')
  const requestedLotExists = lots.some(
    lot => String(lot?.id) === String(requestedEntityId),
  )
  const resolvingRequestedLot = (
    requestedEntityType === LOT_WORKFLOW_ENTITY_TYPE
    && Boolean(requestedEntityId)
    && (loadingLots || requestedLotExists)
    && String(selectedLot?.id ?? '') !== String(requestedEntityId)
  )

  useEffect(() => {
    if (changingScopeRef.current) {
      const queryMatchesSelectedScope = selectedLot
        ? (
          requestedEntityType === LOT_WORKFLOW_ENTITY_TYPE
          && String(requestedEntityId) === String(selectedLot.id)
        )
        : requestedEntityType !== LOT_WORKFLOW_ENTITY_TYPE

      if (queryMatchesSelectedScope) {
        changingScopeRef.current = false
      }
      return
    }

    if (
      requestedEntityType !== LOT_WORKFLOW_ENTITY_TYPE
      || !requestedEntityId
      || loadingLots
      || selectedLot
    ) return

    const requestedLot = lots.find(
      lot => String(lot?.id) === String(requestedEntityId),
    )
    if (requestedLot) {
      selectLot(requestedLot)
    }
  }, [
    loadingLots,
    lots,
    requestedEntityId,
    requestedEntityType,
    selectLot,
    selectedLot,
  ])

  const handleSelectLot = useCallback((lot) => {
    if (!lot?.id) return

    changingScopeRef.current = true
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('entityType', LOT_WORKFLOW_ENTITY_TYPE)
    nextSearchParams.set('entityId', String(lot.id))
    nextSearchParams.delete('instanceId')
    setSearchParams(nextSearchParams, { replace: true })
    selectLot(lot)
  }, [searchParams, selectLot, setSearchParams])

  const handleSelectOrder = useCallback(() => {
    changingScopeRef.current = true
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('entityType')
    nextSearchParams.delete('entityId')
    nextSearchParams.delete('instanceId')
    setSearchParams(nextSearchParams, { replace: true })
    selectOrder()
  }, [searchParams, selectOrder, setSearchParams])

  const workflowEntity = useMemo(() => (
    selectedLot
      ? {
        entityType: LOT_WORKFLOW_ENTITY_TYPE,
        entityId: selectedLot.id,
      }
      : {
        entityType: ORDER_WORKFLOW_ENTITY_TYPE,
        entityId: orderState.orderId,
      }
  ), [selectedLot, orderState.orderId])

  const orderWorkflowState = useEntityWorkflowInstances({
    ...workflowEntity,
    preferredInstanceId: requestedInstanceId,
    providedInstances: selectedLot
      ? [
        ...(Array.isArray(selectedLot?.workflowInstances)
          ? selectedLot.workflowInstances
          : []),
        ...(Array.isArray(selectedLot?.workflowInstanceIds)
          ? selectedLot.workflowInstanceIds.map(id => ({ id }))
          : []),
        ...(selectedLot?.workflowInstanceId
          ? [{ id: selectedLot.workflowInstanceId }]
          : []),
      ]
      : [],
  })

  useEffect(() => {
    if (!workflowEntity.entityId || resolvingRequestedLot) return

    const nextSearchParams = new URLSearchParams(searchParams)
    if (workflowEntity.entityType === LOT_WORKFLOW_ENTITY_TYPE) {
      nextSearchParams.set('entityType', workflowEntity.entityType)
      nextSearchParams.set('entityId', String(workflowEntity.entityId))
    } else {
      nextSearchParams.delete('entityType')
      nextSearchParams.delete('entityId')
    }

    if (orderWorkflowState.selectedInstanceId) {
      nextSearchParams.set('instanceId', String(orderWorkflowState.selectedInstanceId))
    } else {
      nextSearchParams.delete('instanceId')
    }

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true })
    }
  }, [
    orderWorkflowState.selectedInstanceId,
    resolvingRequestedLot,
    searchParams,
    setSearchParams,
    workflowEntity.entityId,
    workflowEntity.entityType,
  ])

  const workflowState = useWorkflowProgress({
    workflowInstance: orderWorkflowState.workflowInstance,
    order: orderState.order,
    orderId: orderState.orderId,
    user,
    loadingWorkflowInstance: orderWorkflowState.loadingWorkflowInstance,
    syncWorkflowInstance: orderWorkflowState.syncWorkflowInstance,
  })

  const submissionState = useWorkflowSubmissions({
    workflowPreview: workflowState.workflowPreview,
    steps: workflowState.steps,
    currentStep: workflowState.currentStep,
    displayStep: workflowState.displayStep,
    stepTransitionList: workflowState.stepTransitionList,
    processTypeMetaMap: workflowState.processTypeMetaMap,
  })

  const formState = useWorkflowRemoteForm({
    currentForm: submissionState.currentForm,
    displayForm: submissionState.displayForm,
    currentStep: workflowState.currentStep,
    displayStep: workflowState.displayStep,
    displaySubmission: submissionState.displaySubmission,
    workflowPreview: workflowState.workflowPreview,
    refreshWorkflow: workflowState.refreshWorkflow,
    syncWorkflowInstance: orderWorkflowState.syncWorkflowInstance,
  })

  useEffect(() => {
    if (!selectedLot || !orderWorkflowState.workflowInstance) return

    const workflowName = workflowState.workflow?.name
      ?? orderWorkflowState.workflowInstance?.workflowProcess?.name
      ?? orderWorkflowState.workflowInstance?.process?.name
      ?? null

    if (!workflowName) return

    console.log('[OrderProgress] Workflow của lô đã chọn:', {
      lotId: selectedLot.id,
      lotCode: selectedLot.code,
      workflowInstanceId: orderWorkflowState.workflowInstance.id,
      workflowName,
    })
  }, [
    orderWorkflowState.workflowInstance,
    selectedLot,
    workflowState.workflow?.name,
  ])

  return (
    <OrderProgressLayout
      orderState={orderState}
      lotState={lotState}
      workflowEntity={workflowEntity}
      orderWorkflowState={orderWorkflowState}
      onSelectLot={handleSelectLot}
      onSelectOrder={handleSelectOrder}
      workflowState={workflowState}
      submissionState={submissionState}
      formState={formState}
    />
  )
}

export default OrderProgressPage
