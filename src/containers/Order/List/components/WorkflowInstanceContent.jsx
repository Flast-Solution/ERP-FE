import React, { useMemo } from 'react'
import { Button, Select, Spin, Typography } from 'antd'

import useGetMe from '@/hooks/useGetMe'
import { useWorkflowProgress } from '@/pages/order/progress/hooks/useWorkflowProgress'
import { useWorkflowSubmissions } from '@/pages/order/progress/hooks/useWorkflowSubmissions'
import { useWorkflowRemoteForm } from '@/pages/order/progress/hooks/useWorkflowRemoteForm'
import WorkflowFormSection from '@/pages/order/progress/components/WorkflowFormSection'
import WorkflowDrawerSteps from './WorkflowDrawerSteps'
import WorkflowOrderDetailCard from './WorkflowOrderDetailCard'

const { Text, Title } = Typography

const WorkflowInstanceContent = ({
  order,
  orderDetail,
  workflowInstance,
}) => {
  const { user } = useGetMe()
  const scopedOrder = useMemo(() => ({
    ...order,
    id: orderDetail?.id,
    code: orderDetail?.code ?? order?.code,
    details: orderDetail ? [orderDetail] : [],
  }), [order, orderDetail])

  const workflowState = useWorkflowProgress({
    workflowInstance,
    order: scopedOrder,
    orderId: orderDetail?.id,
    user,
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
  })
  const workflowName = workflowState.workflow?.name
    ?? workflowInstance?.workflowProcess?.name
    ?? `Workflow #${workflowState.workflow?.id ?? workflowInstance?.processId}`
  const canAdvance = (
    !workflowState.isReviewingSubmission
    && (!submissionState.currentForm || submissionState.hasCurrentSubmission)
    && workflowState.stepTransitionOptions.length > 0
    && Boolean(workflowState.selectedToStepCode)
  )

  if (workflowState.loadingPreview && !workflowState.workflowPreview) {
    return (
      <div className="workflow-detail-drawer__loading">
        <Spin />
      </div>
    )
  }

  return (
    <div className="workflow-detail-drawer__tab-content">
      <WorkflowOrderDetailCard order={order} orderDetail={orderDetail} />

      <section className="workflow-detail-drawer__block">
        <div className="workflow-detail-drawer__process-head">
          <div>
            <Text className="workflow-detail-drawer__eyebrow">QUY TRÌNH</Text>
            <Title level={3}>{workflowName}</Title>
          </div>
          <Text type="secondary">
            {workflowState.workflow?.processKey ?? ''}
            {workflowState.steps.length ? ` · ${workflowState.steps.length} bước` : ''}
          </Text>
        </div>

        <WorkflowDrawerSteps
          steps={workflowState.steps}
          currentStep={workflowState.currentStep}
          currentStepCode={workflowState.currentStepCode}
          processTypeLabelMap={workflowState.processTypeLabelMap}
          completedRefs={submissionState.completedRefs}
          submittedRefs={submissionState.submittedRefs}
          submissions={submissionState.submissions}
          selectedStepCode={workflowState.displayStep?.stepCode}
          onStepClick={workflowState.reviewStep}
        />

        {!workflowState.isReviewingSubmission && workflowState.stepTransitionOptions.length > 0 ? (
          <div className="workflow-detail-drawer__advance">
            <Select
              value={workflowState.selectedToStepCode}
              onChange={workflowState.setSelectedToStepCode}
              options={workflowState.stepTransitionOptions}
              placeholder="Chọn bước tiếp theo"
              disabled={workflowState.transitioning}
            />
            <Button
              type="primary"
              loading={workflowState.transitioning}
              disabled={!canAdvance}
              onClick={() => workflowState.advanceWorkflow({
                currentSubmission: submissionState.currentSubmission,
                currentForm: submissionState.currentForm,
              })}
            >
              Hoàn thành
            </Button>
          </div>
        ) : null}
      </section>

      <section className="workflow-detail-drawer__form-block">
        <WorkflowFormSection
          order={scopedOrder}
          selectedLot={null}
          displayStep={workflowState.displayStep}
          displayForm={submissionState.displayForm}
          displaySubmission={submissionState.displaySubmission}
          displaySubmissionValues={submissionState.displaySubmissionValues}
          inspectionResults={submissionState.inspectionResults}
          viewingStepCode={workflowState.viewingStepCode}
          isReviewingSubmission={workflowState.isReviewingSubmission}
          onBack={workflowState.backToCurrentStep}
          formState={formState}
        />
      </section>
    </div>
  )
}

export default WorkflowInstanceContent
