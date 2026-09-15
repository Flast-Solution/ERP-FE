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
import { getFormSubmitButtonConfig } from '@/utils/formSubmitButton'

const { Text, Title } = Typography
const LEAD_ASSET_BASE_URL = 'http://view.user.flast.vn/assets/icons'

const LeadWorkflowTracker = ({ steps, currentStep, selectedStepCode, onStepClick }) => {
  const currentOrder = Number(currentStep?.sortOrder ?? 0)

  return (
    <div className="pl-tracker">
      {steps.map((step, index) => {
        const stepOrder = Number(step?.sortOrder ?? index)
        const completed = stepOrder < currentOrder
        const current = String(step?.stepCode) === String(currentStep?.stepCode)
        const selected = String(step?.stepCode) === String(selectedStepCode)

        return (
          <button
            type="button"
            className={`pl-tracker__step${completed ? ' is-done' : ''}${current ? ' is-current' : ''}${selected ? ' is-selected' : ''}`}
            key={step?.stepCode ?? step?.id ?? index}
            onClick={() => onStepClick?.(step)}
          >
            {index ? <span className="pl-tracker__line" /> : null}
            <span className="pl-tracker__bullet">
              {completed
                ? <img src={`${LEAD_ASSET_BASE_URL}/check.svg`} alt="" />
                : current
                  ? '●'
                  : index + 1}
            </span>
            <span className="pl-tracker__label">{step?.name ?? step?.stepCode}</span>
          </button>
        )
      })}
    </div>
  )
}

const LeadWorkflowHistory = ({ histories = [] }) => (
  <div className="pl-timeline">
    {histories.map((item, index) => {
      const rawDate = item?.createdAt ? new Date(item.createdAt) : null
      const validDate = rawDate && !Number.isNaN(rawDate.getTime())
      const date = validDate ? rawDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '—'
      const time = validDate ? rawDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'
      const actor = item?.createdByName ?? 'Hệ thống'
      const initials = String(actor).trim().split(/\s+/).slice(-2).map(word => word.charAt(0)).join('').toUpperCase()

      return (
        <div className="pl-timeline__item" key={item?.id ?? index}>
          <span className="pl-timeline__time"><span className="d">{date}</span><span className="t">{time}</span></span>
          <span className="pl-timeline__dot-col"><span className="pl-timeline__dot" /></span>
          <div className="pl-timeline__body">
            <div className="pl-timeline__title">
              {item?.title ?? item?.name ?? item?.action ?? 'Chuyển stage'}
            </div>
            <div className="pl-timeline__stages">
              {item?.fromStepName ?? item?.fromStepCode ?? '—'}
              <img src={`${LEAD_ASSET_BASE_URL}/arrow-right.svg`} alt="" />
              {item?.toStepName ?? item?.toStepCode ?? '—'}
            </div>
            <div className="pl-timeline__meta"><span className="pl-timeline__avatar">{initials || 'HT'}</span>{actor}</div>
            {item?.note ? <div className="pl-timeline__extra">{item.note}</div> : null}
          </div>
        </div>
      )
    })}
  </div>
)

const normalizeLeadScoreItems = (value) => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).map(([label, points]) => ({ label, points }))
}

const LeadWorkflowScore = ({ lead }) => {
  const scoreDetails = lead?.scoreDetails ?? lead?.scoreBreakdown ?? {}
  const groups = [
    ['Intent', scoreDetails?.intent ?? lead?.intentScores],
    ['Engagement', scoreDetails?.engagement ?? lead?.engagementScores],
    ['Profile', scoreDetails?.profile ?? lead?.profileScores],
    ['Behavior', scoreDetails?.behavior ?? lead?.behaviorScores],
  ].map(([label, value]) => ({ label, items: normalizeLeadScoreItems(value) }))
  const score = lead?.score ?? lead?.leadScore ?? 0
  const hasDetails = groups.some(group => group.items.length > 0)

  return (
    <>
      <div className="pl-score-total">
        <span className="v">{score}</span>
        <div className="lbl">
          <span className="t-body-strong">Điểm hiện tại</span>
          <span className="t-caption">Cộng dồn từ Intent, Engagement, Profile, Behavior</span>
        </div>
      </div>

      {groups.filter(group => group.items.length > 0).map(group => (
        <div className="pl-score-group" key={group.label}>
          <h3 className="t-h3 pl-score-group__title">{group.label}</h3>
          <div className="pl-score-box">
            <button className="pl-score-copy" type="button" aria-label={`Danh sách điểm ${group.label}`}>
              <img src={`${LEAD_ASSET_BASE_URL}/list.svg`} alt="" />
            </button>
            {group.items.map((item, index) => {
              const points = item?.points ?? item?.score ?? item?.value ?? 0
              return (
                <div className="pl-score-row" key={`${item?.label ?? item?.name ?? index}-${index}`}>
                  <span>{item?.label ?? item?.name ?? item?.code ?? `Tiêu chí ${index + 1}`}</span>
                  <span className="pts">{Number(points) > 0 ? '+' : ''}{points}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {!hasDetails ? <div className="t-caption">Chưa có dữ liệu chi tiết chấm điểm.</div> : null}
    </>
  )
}

const WorkflowInstanceContent = ({
  order,
  orderDetail,
  workflowInstance,
  entityType = 'order',
  entityLabel,
  formOnly = false,
  leadMode = false,
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
  const displaySubmitButton = getFormSubmitButtonConfig(submissionState.displayForm)
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

  const handleConfiguredButton = useCallback((button) => {
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
  }, [submissionState.currentForm, submissionState.currentSubmission, workflowState])

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
              onClick={() => handleConfiguredButton(button)}
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

  if (leadMode) {
    const configuredButtons = workflowState.currentStepButtons
    const auxiliaryCodes = new Set(
      workflowState.allSteps.flatMap(step => (
        Array.isArray(step?.buttons)
          ? step.buttons
            .filter(button => button?.type === 'OPEN_HIDDEN_STEP')
            .map(button => String(button?.targetStepCode ?? ''))
          : []
      )),
    )
    const sortSteps = steps => [...steps].sort((left, right) => {
      const leftOrder = Number(left?.sortOrder)
      const rightOrder = Number(right?.sortOrder)
      if (Number.isFinite(leftOrder) && Number.isFinite(rightOrder) && leftOrder !== rightOrder) {
        return leftOrder - rightOrder
      }
      return String(left?.stepCode ?? '').localeCompare(String(right?.stepCode ?? ''))
    })
    const mainSteps = sortSteps(
      workflowState.steps.filter(step => !auxiliaryCodes.has(String(step?.stepCode))),
    )
    const auxiliarySteps = sortSteps(
      workflowState.allSteps.filter(step => auxiliaryCodes.has(String(step?.stepCode))),
    )
    const lead = orderDetail ?? order ?? {}
    const displayName = lead?.customerName ?? lead?.business?.companyName ?? lead?.companyName ?? `Lead #${lead?.id ?? ''}`
    const products = Array.isArray(lead?.productNames)
      ? lead.productNames.join(', ')
      : lead?.productName
    const leadActivities = lead?.leadActivities
      ?? lead?.activities
      ?? lead?.activityHistory
      ?? lead?.histories
      ?? []
    const historyItems = workflowState.histories.length
      ? workflowState.histories
      : (Array.isArray(leadActivities) ? leadActivities.map(item => ({
        ...item,
        createdAt: item?.createdAt ?? item?.createdDate ?? item?.time,
        createdByName: item?.createdByName ?? item?.userName ?? item?.actorName,
        fromStepName: item?.fromStepName ?? item?.fromStage,
        toStepName: item?.toStepName ?? item?.toStage,
        note: item?.note ?? item?.description,
      })) : [])
    const buttonIcon = button => (
      String(button?.style).toUpperCase() === 'DANGER'
        ? 'circle-x.svg'
        : button?.type === 'OPEN_HIDDEN_STEP'
          ? 'clock.svg'
          : 'target.svg'
    )

    return (
      <div className="lead-workflow-detail">
        <link rel="stylesheet" href="http://view.user.flast.vn/colors_and_type.css" />
        <link rel="stylesheet" href="http://view.user.flast.vn/pipe_lead.css" />

        <div className="pl-detail-page">
          <div className="pl-detail">
            <div>
              <div className="pl-detail-head">
                <div>
                  <div className="t-eyebrow">Lead</div>
                  <h1 className="t-h1" style={{ margin: '4px 0 0' }}>
                    {displayName}{products ? ` — ${products}` : ''}
                  </h1>
                  <div className="pl-detail-head__meta">
                    <span className="code-chip">LEAD-{lead?.id ?? '—'}</span>
                    <span className="badge badge--mid">{workflowState.currentStep?.name ?? 'Chưa bắt đầu'}</span>
                    <span className="t-small" style={{ color: 'var(--fg-subtle)' }}>
                      Quy trình: {workflowName}{lead?.assignTo ? ` · Sales: ${lead.assignTo}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <LeadWorkflowTracker
                steps={mainSteps}
                currentStep={workflowState.currentStep}
                selectedStepCode={workflowState.displayStep?.stepCode}
                onStepClick={workflowState.reviewStep}
              />

              {auxiliarySteps.length ? (
                <div className="pl-tracker__branches">
                  {auxiliarySteps.map(step => (
                    <span className="pl-tracker__branch" key={step?.stepCode}>
                      <img src={`${LEAD_ASSET_BASE_URL}/${/đóng|lost/i.test(step?.name ?? '') ? 'circle-x.svg' : 'clock.svg'}`} alt="" />
                      Nhánh phụ: {step?.name ?? step?.stepCode}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="pl-lockrow">
                <img src={`${LEAD_ASSET_BASE_URL}/shield.svg`} alt="" />
                <span>Bước hiện tại không thể sửa trực tiếp — chỉ chuyển qua các action được cấu hình.</span>
                <span className="lockval">workflow (read-only)</span>
              </div>

              {configuredButtons.length ? (
                <div className="pl-actions">
                  {configuredButtons.map((button, index) => {
                    const styleType = String(button?.style ?? 'DEFAULT').toUpperCase()
                    const disabled = workflowState.transitioning
                      || !button?.targetStepCode
                      || (Boolean(button?.requireSubmission) && !submissionState.hasCurrentSubmission)
                    return (
                      <Button
                        key={button?.id ?? index}
                        className={`btn ${styleType === 'DANGER' ? 'btn--danger' : styleType === 'PRIMARY' ? 'btn--primary' : 'btn--secondary'}`}
                        loading={workflowState.transitioning}
                        disabled={disabled}
                        onClick={() => handleConfiguredButton(button)}
                      >
                        <img src={`${LEAD_ASSET_BASE_URL}/${buttonIcon(button)}`} alt="" width="14" height="14" />
                        {button?.label ?? `Action ${index + 1}`}
                      </Button>
                    )
                  })}
                </div>
              ) : null}
            </div>

            <div className="lead-workflow-form">
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
            </div>

            <div>
              <div className="pl-section__head" style={{ marginBottom: 16 }}>
                <img src={`${LEAD_ASSET_BASE_URL}/history.svg`} alt="" width="15" height="15" />
                <span className="t-body-strong">Lịch sử chuyển stage</span>
              </div>
              {historyItems.length
                ? <LeadWorkflowHistory histories={historyItems} />
                : <div className="t-caption">Chưa có lịch sử chuyển stage.</div>}
            </div>

            <div>
              <div className="pl-section__head" style={{ marginBottom: 16 }}>
                <img src={`${LEAD_ASSET_BASE_URL}/bar-chart-3.svg`} alt="" width="15" height="15" />
                <span className="t-body-strong">Lead score</span>
              </div>
              <LeadWorkflowScore lead={lead} />
            </div>
          </div>
        </div>
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
