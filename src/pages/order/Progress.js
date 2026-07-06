import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Alert, Breadcrumb, Button, Card, Col, Descriptions, Empty, message, Row, Select, Space, Spin, Tag, Timeline, Typography } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, FormOutlined } from '@ant-design/icons'
import { Helmet } from 'react-helmet'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { formatMoney, formatTime, RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import useGetMe from '@/hooks/useGetMe'
import { getTokenPayload } from '@/utils/authUtils'
import OrderService from '@/services/OrderService'
import { loadRemote } from '@/utils/loadRemote'

const { Text, Title } = Typography
const WORKFLOW_SUBMISSION_API = '/workflow/process/submission'
const WORKFLOW_TRANSITION_API = '/workflow/process/transition'
const WORKFLOW_INSTANCE_BY_ENTITY_API = '/workflow/process/instance/get-entity'
const WORKFLOW_PREVIEW_API = '/workflow/process/preview'
const WORKFLOW_PROCESS_FIND_API = '/workflow/process/find-id'
const PROCESS_TYPE_FIND_API = '/workflow/process/process-type-find'

const resolveApiPayload = (response) => response?.data ?? response

const resolveWorkflowInstances = (response) => {
  const payload = resolveApiPayload(response)
  const candidates = [
    payload?.data,
    payload?.embedded,
    payload?.content,
    payload?.items,
    payload,
  ]
  return candidates.find(Array.isArray) ?? []
}

const resolveWorkflowPreview = (response) => {
  const payload = resolveApiPayload(response)
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  return payload
}

const resolveWorkflowProcessDetail = (response) => {
  const payload = resolveApiPayload(response)
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  if (payload?.process && typeof payload.process === 'object' && !Array.isArray(payload.process)) {
    return payload.process
  }
  return payload
}

const getResponseDataArray = (response) => {
  const data = response?.data ?? response
  const candidates = [
    data?.items,
    data?.rows,
    data?.content,
    data?.records,
    data?.list,
    data?.result,
    data?.results,
    data?.data,
    data?.data?.items,
    data?.data?.rows,
    data?.data?.content,
    data?.data?.records,
    data?.data?.list,
    data?.data?.result,
    data?.data?.results,
    data?.embedded,
    data,
  ]
  const arrayValue = candidates.find(Array.isArray)
  if (arrayValue) return arrayValue

  const objectValue = candidates.find(item => item && typeof item === 'object')
  if (!objectValue) return []

  return Object.entries(objectValue)
    .filter(([, value]) => value && typeof value !== 'object')
    .map(([key, value]) => ({ id: key, name: value }))
}

const getFirstArray = (...items) => items.find(Array.isArray) ?? []

const getValue = (...items) => items.find(item => item !== undefined && item !== null && item !== '')

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null
  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? null : numberValue
}

const normalizeRemoteContainerName = (value = '') => value.replace(/[^A-Za-z0-9_$]/g, '_')

const buildRemoteAlias = (...parts) => normalizeRemoteContainerName(
  parts
    .map(part => String(part ?? '').trim())
    .filter(Boolean)
    .join('__')
)

const normalizeProcessType = (item, index) => {
  const id = item?.id ?? item?.key ?? `process_type_${index + 1}`
  const value = item?.code
    ?? item?.processTypeCode
    ?? item?.process_type_code
    ?? item?.typeCode
    ?? item?.type_code
    ?? item?.type
    ?? item?.key
    ?? id
  const label = item?.name
    ?? item?.label
    ?? item?.title
    ?? item?.text
    ?? item?.displayText
    ?? item?.display_text
    ?? item?.displayName
    ?? item?.display_name
    ?? item?.processTypeName
    ?? item?.process_type_name
    ?? item?.typeName
    ?? item?.type_name
    ?? item?.description
    ?? String(value)

  return {
    ...item,
    id,
    value: String(value),
    label,
  }
}

const buildProcessTypeLabelMap = (processTypes = []) => {
  const map = new Map()

  processTypes.forEach((item) => {
    const label = item?.label ?? item?.name
    if (!label) return

    const keys = [
      item?.id,
      item?.value,
      item?.key,
      item?.code,
      item?.type,
      item?.typeCode,
      item?.type_code,
      item?.processTypeCode,
      item?.process_type_code,
    ]

    keys.forEach((key) => {
      if (key !== undefined && key !== null && key !== '') {
        map.set(String(key), label)
      }
    })
  })

  return map
}

const getStepProcessTypeLabel = (step, processTypeLabelMap = new Map()) => {
  const processTypeValue = getValue(
    step?.label,
    step?.processType,
    step?.process_type,
    step?.processTypeCode,
    step?.process_type_code,
    step?.type,
  )

  const mappedLabel = processTypeLabelMap.get(String(processTypeValue ?? ''))
  if (mappedLabel) return mappedLabel

  return Number.isNaN(Number(processTypeValue))
    ? processTypeValue
    : getValue(step?.typeName, step?.type_name, step?.processTypeName, step?.process_type_name, step?.name, step?.stepCode)
}

const normalizeStepRef = (value) => String(value ?? '').trim()

const isSameStepRef = (left, right) => {
  const normalizedLeft = normalizeStepRef(left)
  const normalizedRight = normalizeStepRef(right)
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight)
}

const isStepInRefs = (step, refs = []) => {
  const candidates = [
    step?.id,
    step?.stepCode,
    step?.code,
  ].map(normalizeStepRef).filter(Boolean)

  return refs.some((ref) => candidates.includes(normalizeStepRef(ref)))
}

const isSubmissionForStep = (submission, step) => {
  if (!submission || !step) return false

  return isSameStepRef(submission?.stepCode, step?.stepCode)
    || isSameStepRef(submission?.stepCode, step?.code)
    || isSameStepRef(submission?.stepId ?? submission?.step_id, step?.id)
}

const isSubmissionForTemplate = (submission, formTemplate) => {
  if (!submission || !formTemplate) return false

  return isSameStepRef(
    submission?.templateId ?? submission?.template_id,
    formTemplate?.id ?? formTemplate?.templateId ?? formTemplate?.formTemplateId,
  )
}

const getSubmissionValues = (submission) => {
  const values = submission?.valuesJson
    ?? submission?.values_json
    ?? submission?.values
    ?? submission?.value
    ?? submission?.formData
    ?? submission?.form_data
    ?? {}

  return values && typeof values === 'object' ? values : {}
}

const getStepDisplayName = (step, fallback) => getValue(
  step?.name,
  step?.labelName,
  step?.label_name,
  step?.title,
  step?.stepCode,
  step?.code,
  fallback,
)

const getStepTransitionCode = (transition) => {
  if (typeof transition === 'string' || typeof transition === 'number') {
    return String(transition)
  }

  return getValue(
    transition?.toStepCode,
    transition?.to_step_code,
    transition?.stepCode,
    transition?.step_code,
    transition?.code,
    transition?.value,
  )
}

const getStepTransitionLabel = (transition, steps = []) => {
  if (transition && typeof transition === 'object') {
    const directLabel = getValue(
      transition?.toStepName,
      transition?.to_step_name,
      transition?.name,
      transition?.label,
      transition?.title,
    )
    if (directLabel) return directLabel
  }

  const code = getStepTransitionCode(transition)
  const step = steps.find((item) =>
    isSameStepRef(item?.stepCode, code)
    || isSameStepRef(item?.code, code)
    || isSameStepRef(item?.id, code)
  )

  return getStepDisplayName(step, code)
}

const buildStepTransitionOptions = (transitions = [], steps = []) => (
  transitions
    .map((transition) => {
      const value = getStepTransitionCode(transition)
      if (!value) return null

      return {
        value,
        label: getStepTransitionLabel(transition, steps),
      }
    })
    .filter(Boolean)
)

const findWorkflowStep = (steps = [], ref) => {
  if (ref == null || ref === '') return null

  return steps.find((step) =>
    isSameStepRef(step?.stepCode, ref)
    || isSameStepRef(step?.code, ref)
    || isSameStepRef(step?.id, ref)
  ) ?? null
}

const resolveStepHistoryName = (steps = [], ...refs) => {
  const ref = getValue(...refs)
  const step = findWorkflowStep(steps, ref)
  return getStepDisplayName(step, ref)
}

const normalizeStepInstanceLog = (log = {}, steps = []) => ({
  id: log?.id,
  success: log?.success,
  fromStepName: resolveStepHistoryName(steps, log?.fromStepCode, log?.from_step_code, log?.fromStepId, log?.from_step_id),
  toStepName: resolveStepHistoryName(steps, log?.toStepCode, log?.to_step_code, log?.toStepId, log?.to_step_id),
  createdAt: log?.createdAt ?? log?.created_at,
  createdByName: log?.byUserName ?? log?.by_user_name ?? log?.createdByName ?? log?.created_by_name,
  note: log?.note,
})

const normalizeCompletedStepHistory = (item = {}, steps = []) => {
  const stepName = resolveStepHistoryName(
    steps,
    item?.stepCode,
    item?.step_code,
    item?.code,
    item?.stepId,
    item?.step_id,
  )

  return {
    id: item?.id ?? `${item?.step_code ?? item?.stepCode ?? item?.step_id ?? item?.stepId}-completed`,
    success: true,
    title: `${stepName || 'Bước'} đã hoàn thành`,
    createdAt: item?.completedAt ?? item?.completed_at ?? item?.createdAt ?? item?.created_at,
    createdByName: item?.completedByName ?? item?.completed_by_name ?? item?.createdByName ?? item?.created_by_name,
    userName: item?.completedBy ?? item?.completed_by,
    note: item?.note,
  }
}

const buildWorkflowHistoryItems = ({
  workflowPreview,
  workflowInstance,
  order,
  workflow,
  steps,
}) => {
  const explicitHistories = getFirstArray(
    workflowPreview?.histories,
    workflowPreview?.workflowHistories,
    workflowPreview?.workflowHistory,
    order?.workflowHistories,
    order?.workflowHistory,
    order?.stepHistories,
    order?.histories,
    workflow?.histories,
  )

  if (explicitHistories.length) {
    return explicitHistories
  }

  const stepLogs = getFirstArray(
    workflowPreview?.stepInstanceLogs,
    workflowPreview?.step_instance_logs,
    workflowPreview?.processInstance?.stepInstanceLogs,
    workflowPreview?.processInstance?.step_instance_logs,
    workflowInstance?.stepInstanceLogs,
    workflowInstance?.step_instance_logs,
  ).map((item) => normalizeStepInstanceLog(item, steps))

  if (stepLogs.length) {
    return stepLogs
  }

  return getFirstArray(
    workflowPreview?.processInstance?.completedSteps,
    workflowPreview?.processInstance?.completed_steps,
    workflowInstance?.completedSteps,
    workflowInstance?.completed_steps,
    order?.workflowInstance?.completedSteps,
    order?.workflowInstance?.completed_steps,
  ).map((item) => normalizeCompletedStepHistory(item, steps))
}

const buildStepGroups = (steps = [], processTypeLabelMap = new Map()) => {
  const sortedSteps = [...steps].sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))
  const groups = []

  sortedSteps.forEach((step) => {
    const title = getStepProcessTypeLabel(step, processTypeLabelMap) || 'Quy trình'
    const lastGroup = groups[groups.length - 1]

    if (lastGroup && lastGroup.title === title) {
      lastGroup.steps.push(step)
      return
    }

    groups.push({ title, steps: [step] })
  })

  return groups
}

const getCurrentStepSortOrder = (currentStep) => {
  const value = Number(currentStep?.sortOrder)
  return Number.isNaN(value) ? null : value
}

const getStepStatus = ({ step, currentStep, currentStepCode, completedRefs, submittedRefs, isParallel = false }) => {
  const active = isSameStepRef(currentStep?.id, step?.id)
    || isSameStepRef(currentStep?.stepCode, step?.stepCode)
    || isSameStepRef(currentStep?.code, step?.code)
    || isSameStepRef(step?.stepCode, currentStepCode)
    || isSameStepRef(step?.code, currentStepCode)
  const explicitCompleted = isStepInRefs(step, completedRefs) || isStepInRefs(step, submittedRefs)
  const currentSortOrder = getCurrentStepSortOrder(currentStep)
  const stepSortOrder = Number(step?.sortOrder)
  const beforeCurrent = !isParallel
    && currentSortOrder !== null
    && !Number.isNaN(stepSortOrder)
    && stepSortOrder < currentSortOrder

  if (active) return 'active'
  if (explicitCompleted || beforeCurrent) return 'completed'
  return 'pending'
}

const isParallelGroup = (group) => {
  const title = String(group?.title ?? '').toLowerCase()
  return group?.steps?.length > 3 || title.includes('song song') || title.includes('parallel')
}

const normalizeSubmissionValue = (value) => {
  if (value && typeof value === 'object' && typeof value.toISOString === 'function' && typeof value.isValid === 'function') {
    return value.isValid() ? value.toISOString() : null
  }
  if (Array.isArray(value)) {
    return value.map(normalizeSubmissionValue)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeSubmissionValue(item)]),
    )
  }
  return value
}
const resolveTemplateId = (formTemplate) => {
  const value = formTemplate?.templateId
    ?? formTemplate?.formTemplateId
    ?? formTemplate?.id

  const templateId = value ? Number(value) : null
  return templateId && !Number.isNaN(templateId) ? templateId : null
}

const buildWorkflowSubmissionPayload = ({
  values,
  currentForm,
  currentStep,
  workflowPreview,
  workflowInstance,
  order,
  orderId,
  instanceId,
}) => {
  const processInstance = workflowPreview?.processInstance ?? workflowInstance ?? {}
  const stepProcess = workflowPreview?.stepProcesses ?? currentStep ?? {}

  return {
    templateId: resolveTemplateId(currentForm),
    processStepId: toNumberOrNull(stepProcess?.id),
    entityType: processInstance?.entityType ?? order?.entityType ?? 'order',
    entityId: toNumberOrNull(processInstance?.entityId ?? order?.entityId ?? order?.id ?? orderId),
    instanceId: toNumberOrNull(processInstance?.id ?? instanceId),
    stepCode: stepProcess?.stepCode ?? stepProcess?.code ?? processInstance?.currentStepCode ?? workflowInstance?.currentStepCode,
    values: normalizeSubmissionValue(values),
  }
}

const resolveUserId = (user = {}) => toNumberOrNull(
  user?.id
  ?? user?.userId
  ?? user?.user_id
  ?? user?.accountId
  ?? user?.account_id
  ?? user?.ssoId
  ?? getTokenPayload()?.id
  ?? getTokenPayload()?.userId
  ?? getTokenPayload()?.user_id
  ?? getTokenPayload()?.accountId
  ?? getTokenPayload()?.account_id
  ?? getTokenPayload()?.sub
)

const buildWorkflowTransitionPayload = ({
  workflow,
  workflowPreview,
  workflowInstance,
  order,
  orderId,
  instanceId,
  currentSubmission,
  user,
  toStepCode,
}) => {
  const processInstance = workflowPreview?.processInstance ?? workflowInstance ?? {}

  return {
    processId: toNumberOrNull(workflow?.id ?? workflowPreview?.processId ?? processInstance?.processId),
    processInstanceId: toNumberOrNull(processInstance?.id ?? instanceId),
    entityType: processInstance?.entityType ?? order?.entityType ?? 'order',
    entityId: toNumberOrNull(processInstance?.entityId ?? order?.entityId ?? order?.id ?? orderId),
    toStepCode: toStepCode || null,
    byUserId: resolveUserId(user),
    note: '',
    fromStepSubmissionId: toNumberOrNull(currentSubmission?.id),
  }
}

const getRemoteConfigFromEntry = (remoteEntry, remoteComponentId, remoteVersionKey) => {
  if (!remoteEntry) {
    return null
  }

  try {
    const url = new URL(remoteEntry)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const entryIndex = pathParts.findIndex(part => part === 'remoteEntry.js')
    const remoteEntryComponentId = pathParts[entryIndex - 1] ?? pathParts[0]

    if (!remoteEntryComponentId) {
      return null
    }

    const entryGlobalName = normalizeRemoteContainerName(remoteComponentId || remoteEntryComponentId)
    const componentId = buildRemoteAlias(entryGlobalName, remoteVersionKey)

    return {
      componentId,
      entryGlobalName,
      remoteBaseUrl: url.origin,
      remoteEntryComponentId,
    }
  } catch (error) {
    return null
  }
}

const useRemoteForm = (remoteEntry, remoteComponentId, remoteVersionKey) => {
  const [ Component, setComponent ] = useState(null)
  const [ loading, setLoading ] = useState(false)
  const [ error, setError ] = useState('')

  useEffect(() => {
    const remoteConfig = getRemoteConfigFromEntry(remoteEntry, remoteComponentId, remoteVersionKey)
    let mounted = true

    setComponent(null)
    setError('')

    if (!remoteConfig) {
      return () => {
        mounted = false
      }
    }

    setLoading(true)
    loadRemote(
      remoteConfig.componentId,
      'MPage',
      remoteConfig.remoteBaseUrl,
      remoteConfig.remoteEntryComponentId,
      remoteConfig.entryGlobalName,
      remoteVersionKey
    )
      .then(mod => {
        if (mounted) {
          setComponent(() => mod.default ?? mod)
        }
      })
      .catch(() => {
        if (mounted) {
          setError('Không tải được remote component của form bước hiện tại.')
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [remoteEntry, remoteComponentId, remoteVersionKey])

  return { Component, loading, error }
}

const RemoteFormErrorFallback = ({ message }) => (
  <Alert
    type="warning"
    showIcon
    message={message}
  />
)

const hideDuplicatedRemoteFormTitle = (container, title) => {
  const normalizedTitle = String(title ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
  if (!container || !normalizedTitle) return

  const candidates = Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div,span,label'))
  const duplicateTitleElement = candidates.find((element) => {
    if (element.closest('.ant-card-head')) return false
    if (element.closest('.ant-form-item-control')) return false
    if (element.closest('.ant-radio-wrapper')) return false
    if (element.querySelector('input,textarea,select,button,.ant-radio,.ant-checkbox,.ant-form-item-control')) return false

    const text = String(element.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
    if (!text) return false

    return text === normalizedTitle || text.includes(normalizedTitle) || normalizedTitle.includes(text)
  })

  if (duplicateTitleElement) {
    duplicateTitleElement.dataset.progressHiddenTitle = 'true'
    duplicateTitleElement.style.display = 'none'
  }
}

const RemoteFormHost = forwardRef(({ Component, ...props }, ref) => {
  const [submitSignal, setSubmitSignal] = useState(null)

  useImperativeHandle(ref, () => ({
    submit: async () => {
      setSubmitSignal((signal) => (signal ?? 0) + 1)
    },
  }), [])

  if (!Component) {
    return null
  }

  return (
    <Component
      {...props}
      submitSignal={submitSignal}
    />
  )
})

RemoteFormHost.displayName = 'RemoteFormHost'

class RemoteFormBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.remoteKey !== this.props.remoteKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return <RemoteFormErrorFallback message="Remote component bị lỗi khi render." />
    }

    return this.props.children
  }
}

const WorkflowStepItem = ({ step, status, index }) => {
  const isActive = status === 'active'
  const isCompleted = status === 'completed'
  const muted = status === 'pending'
  const boxColor = isCompleted ? '#16a34a' : isActive ? '#2563eb' : '#d1d5db'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
        color: isActive ? '#1d4ed8' : muted ? '#64748b' : '#111827',
        fontWeight: isActive ? 650 : 500,
        fontSize: 12,
        lineHeight: '18px',
      }}
    >
      <span
        aria-checked={isCompleted}
        aria-disabled="true"
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
          cursor: 'not-allowed',
        }}
      >
        {isCompleted ? '✓' : null}
      </span>
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {step?.name ?? step?.label ?? step?.stepCode ?? `Bước ${index}`}
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
                return (
                  <div
                    key={step?.id ?? step?.stepCode ?? step?.code ?? index}
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

  const formName = currentForm?.name ?? currentForm?.label ?? currentForm?.description ?? 'form hiện tại'

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
}) => (
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
      disabled={disabled || loading}
      loading={loading}
      onClick={onAdvance}
      style={{
        height: 54,
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 700,
        background: disabled ? '#a5b4fc' : '#4f46e5',
        borderColor: disabled ? '#a5b4fc' : '#4f46e5',
      }}
    >
      Đã xong test này
    </Button>
  </div>
)

const WorkflowProgressPanel = ({
  workflow,
  order,
  steps,
  currentStep,
  currentStepCode,
  processTypeLabelMap,
  completedRefs,
  submittedRefs,
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
      bordered
      bodyStyle={{ padding: 0 }}
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
          {getValue(
            workflow?.name,
            workflow?.processName,
            workflow?.process_name,
            workflow?.title,
            order?.workflowProcessName,
            order?.processName,
            order?.workflowName,
            workflow?.id ? `Quy trình #${workflow.id}` : 'Chưa gắn workflow',
          )}
        </Title>
        <Text style={{ display: 'block', marginTop: 4, color: '#4b5563', fontSize: 13 }}>
          {getValue(workflow?.processKey, workflow?.process_key, workflow?.code, order?.workflowProcessKey, '')}
          {steps.length ? ` · ${steps.length} bước` : ''}
        </Text>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', padding: '22px 20px 20px' }}>
        <WorkflowStepList
          steps={steps}
          currentStep={currentStep}
          currentStepCode={currentStepCode}
          processTypeLabelMap={processTypeLabelMap}
          completedRefs={completedRefs}
          submittedRefs={submittedRefs}
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

const ResultList = ({ data }) => {
  if (!data.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />
  }

  return (
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      {data.map((item, index) => (
        <div
          key={item?.id ?? index}
          style={{
            padding: 12,
            border: '1px solid #eef1f5',
            borderRadius: 8,
            background: '#fff',
          }}
        >
          <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>
                {item?.name ?? item?.label ?? item?.title ?? `Kết quả ${index + 1}`}
              </div>
              <Text type="secondary">{item?.description ?? item?.note ?? item?.message ?? ''}</Text>
            </div>
            <Tag color={item?.success === false ? 'red' : 'green'}>
              {item?.statusName ?? item?.status ?? item?.result ?? 'Đạt'}
            </Tag>
          </Space>
        </div>
      ))}
    </Space>
  )
}

const HistoryList = ({ data }) => {
  if (!data.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu lịch sử chuyển bước từ BE" />
  }

  return (
    <Timeline
      items={data.map((item, index) => ({
        color: item?.success === false ? 'red' : 'green',
        dot: item?.success === false ? <ClockCircleOutlined /> : <CheckCircleOutlined />,
        children: (
          <div key={item?.id ?? index}>
            <div style={{ fontWeight: 600 }}>
              {item?.title ?? `${item?.fromStepName ?? item?.fromStep ?? 'Bước trước'} → ${item?.toStepName ?? item?.toStep ?? item?.stepName ?? 'Bước tiếp theo'}`}
            </div>
            <Text type="secondary">
              {formatTime(item?.createdAt ?? item?.createdDate ?? item?.time) || '-'}
              {item?.createdByName || item?.userName ? ` · ${item?.createdByName ?? item?.userName}` : ''}
            </Text>
            {item?.note && <div>{item.note}</div>}
          </div>
        ),
      }))}
    />
  )
}

const OrderProgressPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useGetMe()
  const remoteFormRef = useRef(null)
  const [order, setOrder] = useState(location.state?.order ?? null)
  const [workflowInstance, setWorkflowInstance] = useState(location.state?.workflowInstance ?? null)
  const [workflowPreview, setWorkflowPreview] = useState(null)
  const [workflowProcessDetail, setWorkflowProcessDetail] = useState(null)
  const [processTypes, setProcessTypes] = useState([])
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [submittingForm, setSubmittingForm] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [selectedToStepCode, setSelectedToStepCode] = useState()

  const orderId = getValue(order?.id, params.orderId, searchParams.get('orderId'), searchParams.get('id'))
  const instanceId = getValue(
    workflowInstance?.id,
    order?.workflowInstance?.id,
    searchParams.get('instanceId'),
  )

  const fetchWorkflowPreview = useCallback(async ({ silent = false } = {}) => {
    if (!instanceId) {
      setWorkflowPreview(null)
      return null
    }

    if (!silent) {
      setLoadingPreview(true)
    }

    try {
      const response = await RequestUtils.Get(WORKFLOW_PREVIEW_API, { instanceId })
      const preview = resolveWorkflowPreview(response)
      setWorkflowPreview(preview)

      const ok = response?.success === true || Number(response?.errorCode) === SUCCESS_CODE
      if (!ok && !preview) {
        message.error(response?.message || 'Không tải được tiến trình workflow.')
      }

      return preview
    } catch (error) {
      setWorkflowPreview(null)
      message.error(error?.message || 'Không tải được tiến trình workflow.')
      return null
    } finally {
      if (!silent) {
        setLoadingPreview(false)
      }
    }
  }, [instanceId])

  useEffect(() => {
    let mounted = true

    RequestUtils.Get(PROCESS_TYPE_FIND_API, {})
      .then((response) => {
        if (!mounted) return
        setProcessTypes(getResponseDataArray(response).map(normalizeProcessType))
      })
      .catch((error) => {
        if (!mounted) return
        setProcessTypes([])
        console.error('[OrderProgress] process type error', error)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!orderId) {
      return
    }

    let mounted = true
    if (!location.state?.order) {
      setLoadingOrder(true)
    }
    OrderService.getOrderOnEdit(orderId)
      .then(response => {
        if (mounted) {
          setOrder(pre => ({
            ...(pre ?? {}),
            ...(response?.order ?? {}),
            customer: response?.customer ?? pre?.customer,
            details: response?.data ?? pre?.details,
          }))
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingOrder(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [location.state?.order, orderId])

  useEffect(() => {
    if (workflowInstance?.id || !orderId) {
      return undefined
    }

    let mounted = true

    RequestUtils.Post(WORKFLOW_INSTANCE_BY_ENTITY_API, {
      entityName: 'order',
      entityIds: [Number(orderId)],
    })
      .then((response) => {
        if (!mounted) return
        const instance = resolveWorkflowInstances(response)[0] ?? null
        if (instance) {
          setWorkflowInstance(instance)
        }
      })
      .catch((error) => {
        console.error('[OrderProgress] workflow instance error', error)
      })

    return () => {
      mounted = false
    }
  }, [orderId, workflowInstance?.id])

  useEffect(() => {
    fetchWorkflowPreview()
  }, [fetchWorkflowPreview])

  const previewStepProcess = workflowPreview?.stepProcesses
  const workflowProcessId = getValue(
    workflowPreview?.process?.id,
    workflowPreview?.processId,
    workflowPreview?.process_id,
    workflowPreview?.processInstance?.processId,
    workflowPreview?.processInstance?.process_id,
    previewStepProcess?.processId,
    previewStepProcess?.process_id,
    workflowInstance?.processId,
    workflowInstance?.process_id,
    order?.workflowProcessId,
    order?.workflow_process_id,
    order?.processId,
    order?.process_id,
  )

  useEffect(() => {
    if (!workflowProcessId) {
      setWorkflowProcessDetail(null)
      return undefined
    }

    if (isSameStepRef(workflowProcessDetail?.id, workflowProcessId)) {
      return undefined
    }

    let mounted = true

    RequestUtils.Get(`${WORKFLOW_PROCESS_FIND_API}/${workflowProcessId}`, {})
      .then((response) => {
        if (!mounted) return
        setWorkflowProcessDetail(resolveWorkflowProcessDetail(response))
      })
      .catch((error) => {
        if (!mounted) return
        setWorkflowProcessDetail({ id: workflowProcessId })
        console.error('[OrderProgress] workflow process detail error', error)
      })

    return () => {
      mounted = false
    }
  }, [workflowProcessId, workflowProcessDetail?.id])

  const workflow = useMemo(() => (
    workflowProcessDetail
    ?? workflowPreview?.process
    ?? order?.workflowProcess
    ?? order?.process
    ?? order?.workflow
    ?? (workflowProcessId ? { id: workflowProcessId } : {})
  ), [workflowProcessDetail, workflowPreview, order, workflowProcessId])
  const processTypeLabelMap = useMemo(
    () => buildProcessTypeLabelMap(processTypes),
    [processTypes]
  )
  const steps = getFirstArray(
    workflowPreview?.stepProcessList,
    workflowPreview?.step_process_list,
    workflowPreview?.steps,
    previewStepProcess ? [previewStepProcess] : undefined,
    workflow?.steps,
    order?.workflowSteps,
    order?.steps,
  )
  const stepTransitions = getFirstArray(
    workflowPreview?.stepTransitions,
    workflowPreview?.step_transitions,
    workflowPreview?.transitions,
    workflowPreview?.nextSteps,
    workflowPreview?.next_steps,
    workflowPreview?.availableTransitions,
    workflowPreview?.available_transitions,
  )
  const stepTransitionOptions = useMemo(
    () => buildStepTransitionOptions(stepTransitions, steps),
    [stepTransitions, steps]
  )
  const currentStepCode = getValue(
    workflowInstance?.currentStepCode,
    workflowPreview?.processInstance?.currentStepCode,
    workflowPreview?.currentStepCode,
    order?.currentStepCode,
  )
  const currentStep = getValue(
    workflowPreview?.currentStep,
    previewStepProcess,
    steps.find(step =>
      step?.current
      || step?.active
      || isSameStepRef(step?.id, order?.currentStepId)
      || isSameStepRef(step?.stepCode, currentStepCode)
      || isSameStepRef(step?.code, currentStepCode),
    ),
    order?.currentWorkflowStep,
    order?.currentStep,
    steps[0],
  )

  useEffect(() => {
    if (!stepTransitionOptions.length) {
      setSelectedToStepCode(undefined)
      return
    }

    setSelectedToStepCode((currentValue) => {
      if (stepTransitionOptions.some(option => option.value === currentValue)) {
        return currentValue
      }
      return stepTransitionOptions.length === 1 ? stepTransitionOptions[0].value : undefined
    })
  }, [stepTransitionOptions])
  const formTemplates = getFirstArray(
    workflowPreview?.currentFormTemplates,
    workflowPreview?.formTemplates,
    currentStep?.formTemplate ? [currentStep.formTemplate] : undefined,
    currentStep?.formTemplates,
    currentStep?.forms,
    order?.currentFormTemplates,
    order?.formTemplates,
    order?.forms,
  )
  const currentForm = getValue(
    currentStep?.formTemplate,
    order?.currentForm,
    order?.requiredForm,
    formTemplates[0],
  )
  const sourceComponent = getValue(currentForm?.sourceComponent, currentForm?.source_component)
  const currentFormName = getValue(
    currentForm?.name,
    currentForm?.label,
    currentForm?.title,
    currentForm?.templateName,
    currentForm?.template_name,
    currentForm?.description,
  )
  const remoteFormContainerRef = useRef(null)
  const remoteEntry = getValue(
    sourceComponent?.microFrontendUrl,
    sourceComponent?.micro_frontend_url,
    currentForm?.remoteEntry,
    currentForm?.remoteEntryUrl,
    currentForm?.microFrontendUrl,
    currentStep?.remoteEntry,
    order?.remoteEntry,
  )
  const remoteComponentId = getValue(
    sourceComponent?.componentId,
    sourceComponent?.component_id,
    currentForm?.componentId,
    currentForm?.component_id,
  )
  const remoteVersionKey = buildRemoteAlias(
    resolveTemplateId(currentForm),
    sourceComponent?.version,
    sourceComponent?.updatedDate,
    sourceComponent?.updated_date,
    currentStep?.stepCode,
    currentStep?.code,
  )
  const remoteRenderKey = buildRemoteAlias(remoteComponentId, remoteEntry, remoteVersionKey)
  const checkResults = getFirstArray(
    workflowPreview?.checkResults,
    workflowPreview?.inspectionResults,
    order?.checkResults,
    order?.inspectionResults,
    order?.workflowCheckResults,
    currentStep?.checkResults,
    currentStep?.results,
  )
  const histories = buildWorkflowHistoryItems({
    workflowPreview,
    workflowInstance,
    order,
    workflow,
    steps,
  })
  const submissions = getFirstArray(
    workflowPreview?.submissions,
    order?.submissions,
  )
  const currentSubmission = submissions.find((item) =>
    isSubmissionForStep(item, currentStep) && isSubmissionForTemplate(item, currentForm)
  ) ?? submissions.find((item) =>
    isSubmissionForStep(item, currentStep)
  ) ?? submissions.find((item) =>
    isSubmissionForTemplate(item, currentForm)
  )
  const currentSubmissionValues = getSubmissionValues(currentSubmission)
  const completedRefs = getFirstArray(
    workflowPreview?.processInstance?.completedSteps,
    workflowInstance?.completedSteps,
    order?.workflowInstance?.completedSteps,
  )
  const submittedRefs = submissions.map((item) => getValue(item?.stepCode, item?.stepId, item?.step_id, item?.id))
  const hasCurrentSubmission = Boolean(currentSubmission)

  const { Component: RemoteForm, loading: loadingRemote, error: remoteError } = useRemoteForm(remoteEntry, remoteComponentId, remoteVersionKey)

  const handleRemoteFormSubmit = useCallback(async (values) => {
    const payload = buildWorkflowSubmissionPayload({
      values,
      currentForm,
      currentStep,
      workflowPreview,
      workflowInstance,
      order,
      orderId,
      instanceId,
    })

    if (!payload.templateId) {
      message.error('Không tìm thấy templateId của form.')
      return
    }
    if (!payload.processStepId) {
      message.error('Không tìm thấy processStepId của bước hiện tại.')
      return
    }
    if (!payload.entityId) {
      message.error('Không tìm thấy entityId của đơn hàng.')
      return
    }
    if (!payload.instanceId) {
      message.error('Không tìm thấy instanceId của workflow.')
      return
    }
    if (!payload.stepCode) {
      message.error('Không tìm thấy stepCode của bước hiện tại.')
      return
    }

    setSubmittingForm(true)
    try {
      const response = await RequestUtils.Post(WORKFLOW_SUBMISSION_API, payload)
      const ok = response?.success || Number(response?.errorCode) === SUCCESS_CODE
      if (!ok) {
        message.error(response?.message || 'Không lưu được dữ liệu form.')
        return
      }

      message.success(response?.message || 'Đã lưu dữ liệu form.')
      const preview = await fetchWorkflowPreview({ silent: true })
      if (preview?.processInstance) {
        setWorkflowInstance(preview.processInstance)
      }
    } catch (error) {
      message.error(error?.message || 'Không lưu được dữ liệu form.')
    } finally {
      setSubmittingForm(false)
    }
  }, [currentForm, currentStep, workflowPreview, workflowInstance, order, orderId, instanceId, fetchWorkflowPreview])

  const handleAdvanceWorkflow = useCallback(async () => {
    if (stepTransitionOptions.length > 0 && !selectedToStepCode) {
      message.warning('Vui lòng chọn bước tiếp theo.')
      return
    }

    const payload = buildWorkflowTransitionPayload({
      workflow,
      workflowPreview,
      workflowInstance,
      order,
      orderId,
      instanceId,
      currentSubmission,
      user,
      toStepCode: selectedToStepCode,
    })

    if (!payload.processId) {
      message.error('Không tìm thấy processId của quy trình.')
      return
    }
    if (!payload.processInstanceId) {
      message.error('Không tìm thấy processInstanceId của tiến trình.')
      return
    }
    if (!payload.entityId) {
      message.error('Không tìm thấy entityId của đơn hàng.')
      return
    }
    if (!payload.byUserId) {
      message.error('Không tìm thấy byUserId của người thao tác.')
      return
    }
    if (currentForm && !payload.fromStepSubmissionId) {
      message.error('Bước hiện tại chưa có submission để chuyển bước.')
      return
    }

    setTransitioning(true)
    try {
      const response = await RequestUtils.Post(WORKFLOW_TRANSITION_API, payload)
      const ok = response?.success || Number(response?.errorCode) === SUCCESS_CODE
      if (!ok) {
        message.error(response?.message || 'Không chuyển được bước workflow.')
        return
      }

      message.success(response?.message || 'Đã chuyển bước workflow.')
      const preview = await fetchWorkflowPreview({ silent: true })
      if (preview?.processInstance) {
        setWorkflowInstance(preview.processInstance)
      }
    } catch (error) {
      message.error(error?.message || 'Không chuyển được bước workflow.')
    } finally {
      setTransitioning(false)
    }
  }, [
    workflow,
    workflowPreview,
    workflowInstance,
    order,
    orderId,
    instanceId,
    currentSubmission,
    user,
    currentForm,
    fetchWorkflowPreview,
    stepTransitionOptions,
    selectedToStepCode,
  ])

  const handleRemoteFormSubmitError = useCallback((error) => {
    if (error?.errorFields) {
      message.warning('Vui lòng nhập đầy đủ thông tin bắt buộc.')
      return
    }
    message.error(error?.message || 'Không lấy được dữ liệu form.')
  }, [])

  const handleSubmitCurrentForm = useCallback(async () => {
    if (!RemoteForm) {
      message.error('Remote form chưa sẵn sàng.')
      return
    }

    if (!remoteFormRef.current || typeof remoteFormRef.current.submit !== 'function') {
      message.error('Remote form chưa hỗ trợ submit từ component cha.')
      return
    }

    try {
      await remoteFormRef.current.submit()
    } catch (error) {
      if (error?.remoteFormHandled) {
        return
      }
      handleRemoteFormSubmitError(error)
    }
  }, [RemoteForm, handleRemoteFormSubmitError])

  const orderInfoItems = useMemo(() => [
    {
      key: 'code',
      label: 'Mã đơn',
      children: order?.code ?? '-',
    },
    {
      key: 'customer',
      label: 'Khách hàng',
      children: order?.customerReceiverName ?? order?.customerName ?? order?.customer?.name ?? '-',
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      children: order?.customerMobilePhone ?? order?.phone ?? '-',
    },
    {
      key: 'address',
      label: 'Địa chỉ',
      children: order?.customerAddress ?? order?.address ?? '-',
    },
    {
      key: 'total',
      label: 'Tổng tiền',
      children: formatMoney(order?.total ?? 0),
    },
    {
      key: 'createdAt',
      label: 'Ngày đặt',
      children: formatTime(order?.createdAt ?? order?.createdDate) || '-',
    },
  ], [order])

  useEffect(() => {
    const container = remoteFormContainerRef.current
    if (!container || !currentFormName) return undefined

    hideDuplicatedRemoteFormTitle(container, currentFormName)

    const observer = new MutationObserver(() => {
      hideDuplicatedRemoteFormTitle(container, currentFormName)
    })
    observer.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      container
        .querySelectorAll('[data-progress-hidden-title="true"]')
        .forEach((element) => {
          element.style.display = ''
          delete element.dataset.progressHiddenTitle
        })
    }
  }, [currentFormName, remoteRenderKey])

  return (
    <>
      <Helmet>
        <title>Tiến trình workflow đơn hàng</title>
      </Helmet>
      <Breadcrumb
        style={{ marginBottom: 10 }}
        items={[
          { title: 'Trang chủ' },
          { title: 'Đơn hàng' },
          { title: 'Tiến trình workflow' },
        ]}
      />

      <Spin spinning={loadingOrder || loadingPreview}>
        <div style={{ paddingBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/sale/order')}
            style={{ marginBottom: 16 }}
          >
            Quay lại danh sách
          </Button>

          <Row gutter={16} align="top">
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card title="Thông tin đơn hàng">
                  {order ? (
                    <Descriptions
                      bordered
                      size="small"
                      column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
                      items={orderInfoItems}
                    />
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu đơn hàng" />
                  )}
                </Card>

                <Card
                  title={(
                    <Space>
                      <FormOutlined />
                      <span>{currentFormName || 'Form bắt buộc tại bước'}</span>
                    </Space>
                  )}
                >
                  {!remoteEntry && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bước hiện tại chưa có remoteEntry form" />
                  )}
                  {remoteEntry && loadingRemote && <Spin />}
                  {remoteEntry && remoteError && <RemoteFormErrorFallback message={remoteError} />}
                  {remoteEntry && RemoteForm && (
                    <div ref={remoteFormContainerRef}>
                      <RemoteFormBoundary key={remoteRenderKey} remoteKey={remoteRenderKey}>
                        <RemoteFormHost
                          key={remoteRenderKey}
                          ref={remoteFormRef}
                          Component={RemoteForm}
                          order={order}
                          record={order}
                          data={order}
                          step={currentStep}
                          formTemplate={currentForm}
                          submission={currentSubmission}
                          initialValues={currentSubmissionValues}
                          values={currentSubmissionValues}
                          defaultValues={currentSubmissionValues}
                          hideTitle
                          showTitle={false}
                          onSubmit={handleRemoteFormSubmit}
                          onSubmitError={handleRemoteFormSubmitError}
                        />
                      </RemoteFormBoundary>
                    </div>
                  )}
                  {remoteEntry && RemoteForm ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                      <Button
                        type="primary"
                        loading={submittingForm}
                        disabled={loadingRemote || Boolean(remoteError)}
                        onClick={handleSubmitCurrentForm}
                      >
                        Cập nhật
                      </Button>
                    </div>
                  ) : null}
                </Card>

                <Card title="Kết quả kiểm tra">
                  <ResultList data={checkResults} />
                </Card>

                <Card title="Lịch sử chuyển bước">
                  <HistoryList data={histories} />
                </Card>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <div
                style={{
                  position: 'sticky',
                  top: 96,
                  maxHeight: 'calc(100vh - 120px)',
                  overflowY: 'auto',
                }}
              >
                <WorkflowProgressPanel
                  workflow={workflow}
                  order={order}
                  steps={steps}
                  currentStep={currentStep}
                  currentStepCode={currentStepCode}
                  processTypeLabelMap={processTypeLabelMap}
                  completedRefs={completedRefs}
                  submittedRefs={submittedRefs}
                  currentForm={currentForm}
                  hasCurrentSubmission={hasCurrentSubmission}
                  transitioning={transitioning}
                  onAdvance={handleAdvanceWorkflow}
                  transitionOptions={stepTransitionOptions}
                  selectedToStepCode={selectedToStepCode}
                  onToStepCodeChange={setSelectedToStepCode}
                />
              </div>
            </Col>
          </Row>
        </div>
      </Spin>
    </>
  )
}

export default OrderProgressPage
