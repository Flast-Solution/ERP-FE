import React from 'react'

import useGetMe from '@/hooks/useGetMe'
import { useOrderProgressOrder } from './progress/hooks/useOrderProgressOrder'
import { useOrderLots } from './progress/hooks/useOrderLots'
import { useOrderWorkflowInstance } from './progress/hooks/useOrderWorkflowInstance'
import { useWorkflowProgress } from './progress/hooks/useWorkflowProgress'
import { useWorkflowSubmissions } from './progress/hooks/useWorkflowSubmissions'
import { useWorkflowRemoteForm } from './progress/hooks/useWorkflowRemoteForm'
import OrderProgressLayout from './progress/components/OrderProgressLayout'

const OrderProgressPage = () => {
  const { user } = useGetMe()
  const orderState = useOrderProgressOrder()
  const lotState = useOrderLots(orderState.orderId)
  const orderWorkflowState = useOrderWorkflowInstance(orderState.orderId)

  const workflowState = useWorkflowProgress({
    workflowInstance: orderWorkflowState.workflowInstance,
    order: orderState.order,
    orderId: orderState.orderId,
    user,
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
    workflowPreview: workflowState.workflowPreview,
    refreshWorkflow: workflowState.refreshWorkflow,
    syncWorkflowInstance: orderWorkflowState.syncWorkflowInstance,
  })

  return (
    <OrderProgressLayout
      orderState={orderState}
      lotState={lotState}
      workflowState={workflowState}
      submissionState={submissionState}
      formState={formState}
    />
  )
}

export default OrderProgressPage
