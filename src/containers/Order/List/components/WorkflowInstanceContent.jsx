import React, { useCallback, useMemo } from 'react'
import { Button, Select, Spin, Typography } from 'antd'

import useGetMe from '@/hooks/useGetMe'
import { useWorkflowProgress } from '@/pages/order/progress/hooks/useWorkflowProgress'
import { useWorkflowSubmissions } from '@/pages/order/progress/hooks/useWorkflowSubmissions'
import { useWorkflowRemoteForm } from '@/pages/order/progress/hooks/useWorkflowRemoteForm'
import WorkflowFormSection from '@/pages/order/progress/components/WorkflowFormSection'
import WorkflowDrawerSteps from './WorkflowDrawerSteps'
import WorkflowOrderDetailCard from './WorkflowOrderDetailCard'
import WorkflowProductCard from './WorkflowProductCard'
import WorkflowEntityCard from './WorkflowEntityCard'
import { getStepSubmitButtonConfig } from '@/pages/order/progress/workflowHelpers'

const { Text, Title } = Typography

const WorkflowInstanceContent = ({
  order,
  orderDetail,
  workflowInstance,
  entityType = 'order',
  entityLabel,
  formOnly = false,
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
    allSteps: workflowState.allSteps,
    currentStep: workflowState.currentStep,
    displayStep: workflowState.displayStep,
    stepTransitionList: workflowState.stepTransitionList,
    processTypeMetaMap: workflowState.processTypeMetaMap,
  })
  const displaySubmitButton = getStepSubmitButtonConfig(workflowState.displayStep)
  const openedHiddenStepCode = workflowState.openedHiddenStepCode
  const backToCurrentStep = workflowState.backToCurrentStep
  const handleFormSubmitSuccess = useCallback(() => {
    if (openedHiddenStepCode && displaySubmitButton.closeAfterSubmit) {
      backToCurrentStep()
    }
  }, [
    backToCurrentStep,
    displaySubmitButton.closeAfterSubmit,
    openedHiddenStepCode,
  ])
  const formState = useWorkflowRemoteForm({
    currentForm: workflowState.openedHiddenStepCode
      ? submissionState.displayForm
      : submissionState.currentForm,
    displayForm: submissionState.displayForm,
    currentStep: workflowState.openedHiddenStepCode
      ? workflowState.displayStep
      : workflowState.currentStep,
    displayStep: workflowState.displayStep,
    displaySubmission: submissionState.displaySubmission,
    workflowPreview: workflowState.workflowPreview,
    refreshWorkflow: workflowState.refreshWorkflow,
    onSubmitSuccess: handleFormSubmitSuccess,
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
  const workflowEntity = useMemo(() => ({
    entityType,
    entityId: orderDetail?.id ?? order?.id,
    data: orderDetail ?? order,
  }), [entityType, order, orderDetail])

  const advanceControls = workflowState.isReviewingSubmission ? null : (
    workflowState.currentStepButtons.length > 0 ? (
      <div className="workflow-detail-drawer__advance">
        {workflowState.currentStepButtons.map((button, index) => {
          const styleType = String(button?.style ?? 'DEFAULT').toUpperCase()
          const disabled = workflowState.transitioning
            || !button?.targetStepCode
            || (Boolean(button?.requireSubmission) && !submissionState.hasCurrentSubmission)

          return (
            <Button
              key={button?.id ?? `${button?.type}-${button?.targetStepCode}-${index}`}
              type={styleType === 'PRIMARY' ? 'primary' : 'default'}
              danger={styleType === 'DANGER'}
              loading={workflowState.transitioning}
              disabled={disabled}
              onClick={() => {
                if (button?.type === 'OPEN_HIDDEN_STEP') {
                  workflowState.openHiddenStep(button.targetStepCode)
                  return
                }
                workflowState.advanceWorkflow({
                  currentSubmission: submissionState.currentSubmission,
                  currentForm: submissionState.currentForm,
                  toStepCode: button?.targetStepCode,
                  requireSubmission: Boolean(button?.requireSubmission),
                })
              }}
            >
              {button?.label || `Button ${index + 1}`}
            </Button>
          )
        })}
      </div>
    ) : workflowState.stepTransitionOptions.length > 0 ? (
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
    ) : null
  )

  if (workflowState.loadingPreview && !workflowState.workflowPreview) {
    return (
      <div className="workflow-detail-drawer__loading">
        <Spin />
      </div>
    )
  }

  if (formOnly) {
    return (
      <div className="workflow-detail-drawer__tab-content">
        <section className="workflow-detail-drawer__block">
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

          {advanceControls}
        </section>

        <WorkflowFormSection
          bare
          order={scopedOrder}
          selectedLot={null}
          workflowEntity={workflowEntity}
          workflowInstance={workflowInstance}
          displayStep={workflowState.displayStep}
          displayForm={submissionState.displayForm}
          displaySubmission={submissionState.displaySubmission}
          displaySubmissionValues={submissionState.displaySubmissionValues}
          inspectionResults={submissionState.inspectionResults}
          viewingStepCode={workflowState.viewingStepCode}
          isReviewingSubmission={workflowState.isReviewingSubmission}
          isAuxiliaryStep={Boolean(workflowState.openedHiddenStepCode)}
          onBack={workflowState.backToCurrentStep}
          formState={formState}
        />
      </div>
    )
  }

  return (
    <div className="workflow-detail-drawer__tab-content">
      {entityType === 'product'
        ? <WorkflowProductCard product={orderDetail ?? order} />
        : entityType === 'order'
          ? <WorkflowOrderDetailCard order={order} orderDetail={orderDetail} />
          : <WorkflowEntityCard entity={orderDetail ?? order} entityLabel={entityLabel} />}

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

        {advanceControls}
      </section>

      <section className="workflow-detail-drawer__form-block">
        <WorkflowFormSection
          order={scopedOrder}
          selectedLot={null}
          workflowEntity={workflowEntity}
          workflowInstance={workflowInstance}
          displayStep={workflowState.displayStep}
          displayForm={submissionState.displayForm}
          displaySubmission={submissionState.displaySubmission}
          displaySubmissionValues={submissionState.displaySubmissionValues}
          inspectionResults={submissionState.inspectionResults}
          viewingStepCode={workflowState.viewingStepCode}
          isReviewingSubmission={workflowState.isReviewingSubmission}
          isAuxiliaryStep={Boolean(workflowState.openedHiddenStepCode)}
          onBack={workflowState.backToCurrentStep}
          formState={formState}
        />
      </section>
    </div>
  )
}

export default WorkflowInstanceContent
