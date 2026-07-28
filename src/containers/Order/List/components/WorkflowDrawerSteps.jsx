import React from 'react'
import { CheckOutlined } from '@ant-design/icons'
import { Empty } from 'antd'

import {
  buildStepGroups,
  findSubmissionForStep,
  getStepStatus,
  isParallelGroup,
} from '@/pages/order/progress/workflowHelpers'

const getGroupStatus = (statuses) => {
  if (statuses.includes('active')) return 'active'
  if (statuses.length > 0 && statuses.every(status => status === 'completed')) return 'completed'
  return 'pending'
}

const StepNode = ({
  label,
  status,
  index,
  selected,
  clickable,
  onClick,
}) => (
  <button
    type="button"
    className={[
      'workflow-detail-drawer__step',
      `workflow-detail-drawer__step--${status}`,
      selected ? 'workflow-detail-drawer__step--selected' : '',
    ].filter(Boolean).join(' ')}
    disabled={!clickable}
    onClick={clickable ? onClick : undefined}
  >
    <span className="workflow-detail-drawer__step-circle">
      {status === 'completed' ? <CheckOutlined /> : index}
    </span>
    <span className="workflow-detail-drawer__step-label">{label}</span>
  </button>
)

const WorkflowDrawerSteps = ({
  steps,
  currentStep,
  currentStepCode,
  processTypeLabelMap,
  completedRefs,
  submittedRefs,
  submissions,
  selectedStepCode,
  onStepClick,
}) => {
  if (!steps.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu các bước" />
  }

  const groups = buildStepGroups(steps, processTypeLabelMap)
  let mainStepIndex = 0

  return (
    <div className="workflow-detail-drawer__step-groups">
      <div className="workflow-detail-drawer__main-steps">
        {groups.map((group, groupIndex) => {
          const parallel = isParallelGroup(group)
          const statuses = group.steps.map(step => getStepStatus({
            step,
            currentStep,
            currentStepCode,
            completedRefs,
            submittedRefs,
            isParallel: parallel,
          }))
          const groupStatus = getGroupStatus(statuses)

          if (parallel) {
            mainStepIndex += 1
            return (
              <React.Fragment key={`${group.title}-${groupIndex}`}>
                {mainStepIndex > 1 ? <span className="workflow-detail-drawer__step-line" /> : null}
                <StepNode
                  label={group.title}
                  status={groupStatus}
                  index={mainStepIndex}
                  selected={group.steps.some(step => step?.stepCode === selectedStepCode)}
                  clickable={false}
                />
              </React.Fragment>
            )
          }

          return group.steps.map((step, index) => {
            mainStepIndex += 1
            const submission = findSubmissionForStep(submissions, step)
            const status = statuses[index]
            return (
              <React.Fragment key={step?.id ?? step?.stepCode ?? `${groupIndex}-${index}`}>
                {mainStepIndex > 1 ? <span className="workflow-detail-drawer__step-line" /> : null}
                <StepNode
                  label={step?.name ?? `Bước ${mainStepIndex}`}
                  status={status}
                  index={mainStepIndex}
                  selected={step?.stepCode === selectedStepCode}
                  clickable={Boolean(submission)}
                  onClick={() => onStepClick(step, submission)}
                />
              </React.Fragment>
            )
          })
        })}
      </div>

      {groups.filter(isParallelGroup).map((group, groupIndex) => (
        <div className="workflow-detail-drawer__parallel" key={`${group.title}-parallel-${groupIndex}`}>
          <div className="workflow-detail-drawer__parallel-title">
            {group.steps.length} bước song song
          </div>
          <div className="workflow-detail-drawer__parallel-items">
            {group.steps.map((step, index) => {
              const submission = findSubmissionForStep(submissions, step)
              const status = getStepStatus({
                step,
                currentStep,
                currentStepCode,
                completedRefs,
                submittedRefs,
                isParallel: true,
              })

              return (
                <StepNode
                  key={step?.id ?? step?.stepCode ?? index}
                  label={step?.name ?? `Bước ${index + 1}`}
                  status={status}
                  index={index + 1}
                  selected={step?.stepCode === selectedStepCode}
                  clickable={Boolean(submission)}
                  onClick={() => onStepClick(step, submission)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default WorkflowDrawerSteps
