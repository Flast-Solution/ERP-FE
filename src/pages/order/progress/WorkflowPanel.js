import React from 'react'
import { Button, Card, Empty, Select, Space, Typography } from 'antd'
import {
  buildStepGroups,
  findSubmissionForStep,
  getStepStatus,
  isParallelGroup,
} from './workflowHelpers'

const { Text, Title } = Typography

const WorkflowStepItem = ({ step, status, index, submission, selected, onClick }) => {
  const isActive = status === 'active'
  const isCompleted = status === 'completed'
  const muted = status === 'pending'
  const clickable = Boolean(submission) && Boolean(onClick)
  const boxColor = isCompleted ? '#16a34a' : isActive ? '#2563eb' : '#d1d5db'

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onClick(step, submission) : undefined}
      onKeyDown={clickable ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick(step, submission)
        }
      } : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
        color: isActive ? '#1d4ed8' : muted ? '#64748b' : '#111827',
        fontWeight: isActive || selected ? 650 : 500,
        fontSize: 12,
        lineHeight: '18px',
        padding: clickable ? '6px 8px' : undefined,
        margin: clickable ? '-6px -8px' : undefined,
        borderRadius: clickable ? 8 : undefined,
        border: selected ? '1px solid #bfdbfe' : '1px solid transparent',
        background: selected ? '#eff6ff' : 'transparent',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <span
        aria-checked={isCompleted}
        aria-disabled={!clickable}
        role="checkbox"
        style={{
          flex: '0 0 auto',
          width: 14,
          height: 14,
          borderRadius: 3,
          border: `1.5px solid ${boxColor}`,
          background: isCompleted ? boxColor : isActive ? '#eff6ff' : '#f9fafb',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          lineHeight: '12px',
          fontWeight: 800,
        }}
      >
        {isCompleted ? '✓' : null}
      </span>
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {step?.name ?? `Bước ${index}`}
      </span>
    </div>
  )
}

const WorkflowStepList = ({
  steps,
  currentStep,
  currentStepCode,
  processTypeLabelMap,
  completedRefs = [],
  submittedRefs = [],
  submissions = [],
  selectedStepCode,
  onStepClick,
}) => {
  if (!steps.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu quy trình workflow" />
  }

  const groups = buildStepGroups(steps, processTypeLabelMap)

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {groups.map((group, groupIndex) => {
        const parallel = isParallelGroup(group)

        return (
          <section key={`${group.title}-${groupIndex}`}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  color: '#6b7280',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {group.title}
              </div>
              {parallel && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 12px',
                    borderRadius: 999,
                    border: '1px solid #bfdbfe',
                    background: '#dbeafe',
                    color: '#2563eb',
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
                  {group.steps.length} song song
                </span>
              )}
            </div>

            <div
              style={parallel ? {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '8px 12px',
                padding: 12,
                borderRadius: 8,
                border: '1px dashed #d8dee9',
                background: '#f8fafc',
              } : {
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {group.steps.map((step, index) => {
                const status = getStepStatus({
                  step,
                  currentStep,
                  currentStepCode,
                  completedRefs,
                  submittedRefs,
                  isParallel: parallel,
                })
                const submission = findSubmissionForStep(submissions, step)
                const selected = selectedStepCode === step?.stepCode
                return (
                  <div
                    key={step?.id ?? step?.stepCode ?? index}
                    style={!parallel ? { position: 'relative', paddingBottom: index === group.steps.length - 1 ? 0 : 10 } : undefined}
                  >
                    {!parallel && group.steps.length > 1 && index < group.steps.length - 1 && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 7,
                          top: 20,
                          bottom: -2,
                          width: 2,
                          background: '#d1d5db',
                        }}
                      />
                    )}
                    <WorkflowStepItem
                      step={step}
                      status={status}
                      index={index + 1}
                      submission={submission}
                      selected={selected}
                      onClick={onStepClick}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </Space>
  )
}

const WorkflowBlockingNotice = ({ currentForm, hasCurrentSubmission }) => {
  if (!currentForm || hasCurrentSubmission) {
    return null
  }

  const formName = currentForm?.name ?? 'form hiện tại'

  return (
    <div
      style={{
        margin: '24px -24px 0',
        padding: '18px 24px',
        background: '#fee2e2',
        borderTop: '1px solid #fecaca',
        borderBottom: '1px solid #fca5a5',
        color: '#b91c1c',
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span style={{ width: 18, height: 18, background: '#fff', flex: '0 0 18px', marginTop: 4 }} />
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
            Không thể chuyển bước
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 15, lineHeight: '24px' }}>
            <span style={{ fontSize: 20, lineHeight: '22px' }}>•</span>
            <span>
              Form <strong>{formName}</strong> chưa được điền
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const WorkflowAdvanceSection = ({
  disabled,
  loading,
  onAdvance,
  transitionOptions = [],
  selectedToStepCode,
  onToStepCodeChange,
}) => {
  const hasNextStep = transitionOptions.length > 0
  const buttonDisabled = disabled || loading || !hasNextStep || !selectedToStepCode

  return (
    <div style={{ paddingTop: 24 }}>
      <div
        style={{
          color: '#6b7280',
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          marginBottom: 16,
        }}
      >
        Chuyển bước
      </div>
      {transitionOptions.length > 0 && (
        <Select
          value={selectedToStepCode}
          onChange={onToStepCodeChange}
          options={transitionOptions}
          placeholder="Chọn bước tiếp theo"
          style={{ width: '100%', marginBottom: 12 }}
          disabled={loading}
        />
      )}
      <Button
        type="primary"
        block
        disabled={buttonDisabled}
        loading={loading}
        onClick={buttonDisabled ? undefined : onAdvance}
        style={{
          height: 54,
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 700,
          color: buttonDisabled ? '#6b7280' : '#fff',
          background: buttonDisabled ? '#d1d5db' : '#4f46e5',
          borderColor: buttonDisabled ? '#d1d5db' : '#4f46e5',
          cursor: buttonDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        Hoàn thành
      </Button>
    </div>
  )
}

export const WorkflowProgressPanel = ({
  workflow,
  steps,
  currentStep,
  currentStepCode,
  processTypeLabelMap,
  completedRefs,
  submittedRefs,
  submissions,
  selectedStepCode,
  onStepClick,
  currentForm,
  hasCurrentSubmission,
  transitioning,
  onAdvance,
  transitionOptions,
  selectedToStepCode,
  onToStepCodeChange,
}) => {
  const canAdvance = !currentForm || hasCurrentSubmission

  return (
    <Card
      className="workflow-progress-workflow-card"
      variant="outlined"
      styles={{ body: { padding: 0 } }}
      style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)' }}
    >
      <div style={{ padding: '22px 20px 18px' }}>
        <div
          style={{
            color: '#6b7280',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Quy trình
        </div>
        <Title level={3} style={{ margin: 0, fontSize: 18, lineHeight: '24px' }}>
          {workflow?.name ?? (workflow?.id ? `Quy trình #${workflow.id}` : 'Chưa gắn workflow')}
        </Title>
        <Text style={{ display: 'block', marginTop: 4, color: '#4b5563', fontSize: 13 }}>
          {workflow?.processKey ?? ''}
          {steps.length ? ` · ${steps.length} bước` : ''}
        </Text>
      </div>

      <div
        className="workflow-progress-workflow-scroll"
        style={{ borderTop: '1px solid #e5e7eb', padding: '22px 20px 20px' }}
      >
        <WorkflowStepList
          steps={steps}
          currentStep={currentStep}
          currentStepCode={currentStepCode}
          processTypeLabelMap={processTypeLabelMap}
          completedRefs={completedRefs}
          submittedRefs={submittedRefs}
          submissions={submissions}
          selectedStepCode={selectedStepCode}
          onStepClick={onStepClick}
        />
        <WorkflowBlockingNotice currentForm={currentForm} hasCurrentSubmission={hasCurrentSubmission} />
        <WorkflowAdvanceSection
          disabled={!canAdvance}
          loading={transitioning}
          onAdvance={onAdvance}
          transitionOptions={transitionOptions}
          selectedToStepCode={selectedToStepCode}
          onToStepCodeChange={onToStepCodeChange}
        />
      </div>
    </Card>
  )
}
