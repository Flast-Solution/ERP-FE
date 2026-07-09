import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Alert, Breadcrumb, Button, Card, Col, Descriptions, Empty, message, Row, Select, Space, Spin, Tag, Timeline, Typography } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, FormOutlined } from '@ant-design/icons'
import { Helmet } from 'react-helmet'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'

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
const FORM_TEMPLATE_DETAIL_API = '/workflow/forms/template/find-id'
const WORKFLOW_PROCESS_FIND_API = '/workflow/process/find-id'
const PROCESS_TYPE_FIND_API = '/workflow/process/process-type-find'

const workflowFixedPanelStyle = {
  position: 'fixed',
  top: 96,
  right: 24,
  width: 360,
  maxHeight: 'calc(100vh - 120px)',
  overflowY: 'auto',
  zIndex: 10,
}

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

const findSubmissionForStep = (submissions = [], step) => (
  submissions.find((item) => isSubmissionForStep(item, step)) ?? null
)

const coerceGuardValue = (value) => {
  if (value === true || value === 'true') return 'true'
  if (value === false || value === 'false') return 'false'
  if (value === null || value === undefined) return ''
  return String(value)
}

const evaluateGuardOperator = (operator, actual, expected) => {
  const left = coerceGuardValue(actual)
  const right = coerceGuardValue(expected)

  switch (operator) {
    case 'neq':
      return left !== right
    case 'gt':
      return Number(left) > Number(right)
    case 'gte':
      return Number(left) >= Number(right)
    case 'lt':
      return Number(left) < Number(right)
    case 'lte':
      return Number(left) <= Number(right)
    case 'eq':
    default:
      return left === right
  }
}

const evaluateGuard = (guard, submissions = []) => {
  const guardType = guard?.guardType ?? guard?.guard_type ?? guard?.type ?? 'field_value'
  const config = guard?.config ?? {}

  if (guardType === 'field_value') {
    const sourceStepCode = config.from_step ?? config.fromStep ?? config.step_code ?? config.stepCode
    const fieldName = config.field_name ?? config.fieldName
    const submission = findSubmissionForStep(submissions, { stepCode: sourceStepCode, code: sourceStepCode })
    const values = getSubmissionValues(submission)
    const actual = values?.[fieldName]
    return evaluateGuardOperator(config.operator ?? 'eq', actual, config.expected_value ?? config.expectedValue)
  }

  if (guardType === 'step_completed') {
    const stepCode = config.step_code ?? config.stepCode
    return Boolean(findSubmissionForStep(submissions, { stepCode, code: stepCode }))
  }

  if (guardType === 'step_form_field') {
    const stepCode = config.step_code ?? config.stepCode
    const submission = findSubmissionForStep(submissions, { stepCode, code: stepCode })
    const requirement = config.requirement ?? 'filled'
    const hasSubmission = Boolean(submission && Object.keys(getSubmissionValues(submission)).length)
    return requirement === 'not_filled' ? !hasSubmission : hasSubmission
  }

  return true
}

const getGuardsForSourceStep = (stepCode, stepTransitionList = []) => {
  const normalizedStepCode = normalizeStepRef(stepCode)
  if (!normalizedStepCode) return []

  // Chỉ lấy guard trên các transition XUẤT PHÁT từ chính bước này. Một guard có thể
  // tham chiếu field của bước khác (config.from_step) nhưng lại nằm trên transition của
  // bước sau (ví dụ bước tổng hợp đọc lại field của bước trước) — những guard đó thuộc
  // về bước sau, không được kéo nhầm vào kết quả của bước hiện tại.
  return stepTransitionList.flatMap((transition) => {
    const transitionFrom = normalizeStepRef(transition?.fromStepCode ?? transition?.from_step_code)
    if (transitionFrom !== normalizedStepCode) return []

    return getFirstArray(transition?.guards).map((guard) => ({ transition, guard }))
  })
}

const GUARD_OPERATOR_LABELS = {
  eq: '=',
  neq: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
}

const formatGuardDescription = (guard, transition) => {
  const config = guard?.config ?? {}
  const fieldName = config.field_name ?? config.fieldName ?? 'field'
  const operator = GUARD_OPERATOR_LABELS[config.operator] ?? config.operator ?? '='
  const expectedValue = config.expected_value ?? config.expectedValue ?? ''
  const toStepCode = transition?.toStepCode ?? transition?.to_step_code ?? ''
  const message = guard?.errorMessage ?? guard?.error_message

  if (message) return message
  return `${fieldName} ${operator} ${expectedValue}${toStepCode ? ` → ${toStepCode}` : ''}`
}

const GUARD_OPERATOR_INVERSE = {
  eq: 'neq',
  neq: 'eq',
  gt: 'lte',
  gte: 'lt',
  lt: 'gte',
  lte: 'gt',
}

// Guard trên nhánh "loại" (reject) mô tả điều kiện để bị loại, nên khi hiển thị
// "Yêu cầu" (điều kiện để ĐẠT) ta phải đảo ngược lại toán tử của guard.
const formatGuardRequirement = (guard, reject = false) => {
  const config = guard?.config ?? {}
  const rawOperator = config.operator ?? 'eq'
  const operator = reject ? (GUARD_OPERATOR_INVERSE[rawOperator] ?? rawOperator) : rawOperator
  const operatorLabel = GUARD_OPERATOR_LABELS[operator] ?? operator
  const expected = coerceGuardValue(config.expected_value ?? config.expectedValue)

  if (expected === 'true' || expected === 'false') {
    // eq: đạt khi bằng expected; neq: đạt khi khác expected.
    const wantTrue = operator === 'eq' ? expected === 'true' : expected === 'false'
    return wantTrue ? 'Có' : 'Không'
  }

  if (operator === 'eq') return expected
  return `${operatorLabel} ${expected}`.trim()
}

const REJECT_TRANSITION_KEYWORDS = [
  'lỗi', 'loi', 'error', 'reject', 'fail', 'hỏng', 'hong',
  'hủy', 'huy', 'defect', 'từ chối', 'tu choi', 'cancel', 'loại', 'loai',
]

const normalizeLowerText = (value) => String(value ?? '')
  .toLowerCase()
  .normalize('NFC')

// Xác định một transition có phải nhánh "loại/không đạt" hay không dựa trên tên bước đích.
const isRejectTransition = (transition, stepNameMap = new Map()) => {
  const toStepRef = normalizeStepRef(transition?.toStepCode ?? transition?.to_step_code)
  const haystack = normalizeLowerText([
    stepNameMap.get(toStepRef),
    transition?.toStepName,
    transition?.to_step_name,
    transition?.toStepCode,
    transition?.to_step_code,
    transition?.name,
    transition?.label,
  ].filter(Boolean).join(' '))

  return REJECT_TRANSITION_KEYWORDS.some((keyword) => haystack.includes(keyword))
}

const getFormFields = (formTemplate) => getFirstArray(
  formTemplate?.fields,
  formTemplate?.formFields,
  formTemplate?.form_fields,
)

const resolveFieldOptionLabel = (field, value) => {
  const options = getFirstArray(field?.config?.options, field?.options)
  if (!options.length) return null

  const normalizedValue = coerceGuardValue(value)
  const match = options.find((option) =>
    coerceGuardValue(option?.value) === normalizedValue
    || coerceGuardValue(option?.label) === normalizedValue,
  )

  return match?.label ?? null
}

const formatSubmissionFieldValue = (field, value) => {
  if (value === undefined || value === null || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Có' : 'Không'
  if (Array.isArray(value)) {
    const labels = value.map((item) => resolveFieldOptionLabel(field, item) ?? String(item))
    return labels.join(', ')
  }

  return resolveFieldOptionLabel(field, value) ?? String(value)
}

const buildFieldDisplayItems = (values = {}, fields = []) => {
  const fieldMap = new Map(
    fields.map((field) => [field?.fieldKey ?? field?.field_key ?? field?.name, field]),
  )

  return Object.entries(values).map(([key, value]) => {
    const field = fieldMap.get(key)
    return {
      key,
      label: field?.label ?? field?.title ?? key,
      value,
      displayValue: formatSubmissionFieldValue(field, value),
    }
  })
}

const resolveFormTemplateForSubmission = (submission, {
  previewStepProcess,
  formTemplates = [],
} = {}) => {
  const templateId = submission?.templateId ?? submission?.template_id
  const previewTemplate = previewStepProcess?.formTemplate

  if (previewTemplate && isSubmissionForTemplate(submission, previewTemplate)) {
    return previewTemplate
  }

  return formTemplates.find((template) => isSubmissionForTemplate(submission, template)) ?? null
}

const isInspectionStep = (step) => Boolean(
  step?.formUrl ?? step?.form_url ?? step?.formTemplate ?? step?.formTemplates,
)

const getStepTemplateId = (step) => {
  const attachedForm = getFirstArray(step?.forms, step?.formTemplates)[0]
  return (
    step?.formTemplateId
    ?? step?.form_template_id
    ?? step?.templateId
    ?? step?.template_id
    ?? step?.formId
    ?? step?.form_id
    ?? step?.formTemplate?.id
    ?? step?.formTemplate?.templateId
    ?? attachedForm?.templateId
    ?? attachedForm?.template_id
    ?? attachedForm?.formId
    ?? attachedForm?.id
    ?? null
  )
}

// Tìm form template cho 1 bước dựa trên template id trong danh sách đã nạp.
const findTemplateByStep = (step, formTemplates = []) => {
  const stepTemplateId = getStepTemplateId(step)
  if (!stepTemplateId) return null
  return formTemplates.find(
    (template) => String(resolveTemplateId(template)) === String(stepTemplateId),
  ) ?? null
}

const buildInspectionResults = ({
  submissions = [],
  steps = [],
  stepTransitionList = [],
  previewStepProcess,
  formTemplates = [],
}) => {
  const relevantSteps = steps.filter((step) => (
    isInspectionStep(step) || Boolean(findSubmissionForStep(submissions, step))
  ))

  const orphanSubmissionSteps = submissions
    .filter((submission) => !relevantSteps.some((step) => isSubmissionForStep(submission, step)))
    .map((submission) => ({
      stepCode: submission?.stepCode ?? submission?.step_code,
      name: submission?.stepName ?? submission?.step_name,
      sortOrder: 999,
    }))

  const displaySteps = [...relevantSteps, ...orphanSubmissionSteps]
    .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))

  const stepNameMap = new Map(
    steps.map((step) => [
      normalizeStepRef(getValue(step?.stepCode, step?.code, step?.id)),
      getStepDisplayName(step),
    ]),
  )

  // Gom toàn bộ field của mọi template đã nạp để tra label khi bước chưa có template riêng.
  const globalFieldMap = new Map()
  formTemplates.forEach((template) => {
    getFormFields(template).forEach((field) => {
      const key = field?.fieldKey ?? field?.field_key ?? field?.name
      if (key && !globalFieldMap.has(key)) {
        globalFieldMap.set(key, field)
      }
    })
  })

  return displaySteps.map((step) => {
    const stepCode = getValue(step?.stepCode, step?.code)
    const submission = findSubmissionForStep(submissions, step)
    const hasSubmission = Boolean(submission)
    const values = getSubmissionValues(submission)
    // Gộp field từ mọi nguồn có thể của bước để tra label: template của submission,
    // template gắn sẵn, template fetch theo id, và các form đính kèm (step.forms).
    const stepFormTemplates = [
      submission
        ? resolveFormTemplateForSubmission(submission, { previewStepProcess, formTemplates })
        : null,
      step?.formTemplate,
      findTemplateByStep(step, formTemplates),
      ...getFirstArray(step?.forms, step?.formTemplates),
    ].filter(Boolean)

    const formTemplate = stepFormTemplates[0] ?? null
    const stepFields = stepFormTemplates.flatMap((template) => getFormFields(template))
    const fieldItems = buildFieldDisplayItems(values, stepFields)

    const stepGuards = getGuardsForSourceStep(stepCode, stepTransitionList)
    // Mỗi field có thể xuất hiện ở nhiều transition (nhánh đạt + nhánh loại).
    // Ưu tiên guard nhánh "đạt" (forward) để hiển thị yêu cầu/KQ; nếu chỉ có
    // guard nhánh "loại" thì đảo chiều kết quả cho đúng nghiệp vụ.
    const guardByField = new Map()
    stepGuards.forEach(({ guard, transition }) => {
      const key = guard?.config?.field_name ?? guard?.config?.fieldName
      if (!key) return
      const reject = isRejectTransition(transition, stepNameMap)
      const existing = guardByField.get(key)
      if (!existing || (existing.reject && !reject)) {
        guardByField.set(key, { guard, transition, reject })
      }
    })

    const fieldItemMap = new Map(fieldItems.map((field) => [field.key, field]))
    const templateFieldMap = new Map(
      stepFields.map((field) => [
        field?.fieldKey ?? field?.field_key ?? field?.name,
        field,
      ]),
    )

    const rows = Array.from(guardByField.entries()).map(([fieldKey, matched]) => {
      const fieldItem = fieldItemMap.get(fieldKey)
      const templateField = templateFieldMap.get(fieldKey) ?? globalFieldMap.get(fieldKey)
      const rawValue = values?.[fieldKey]
      const guardMatched = hasSubmission ? evaluateGuard(matched.guard, submissions) : null
      const resultPass = guardMatched === null
        ? null
        : (matched.reject ? !guardMatched : guardMatched)

      return {
        key: fieldKey,
        label: fieldItem?.label ?? templateField?.label ?? templateField?.title ?? fieldKey,
        displayValue: fieldItem?.displayValue ?? formatSubmissionFieldValue(templateField, rawValue),
        requirement: formatGuardRequirement(matched.guard, matched.reject),
        resultPass,
      }
    })

    const guards = stepGuards.map(({ transition, guard }) => {
      const reject = isRejectTransition(transition, stepNameMap)
      const matched = evaluateGuard(guard, submissions)
      return {
        id: guard?.id,
        passed: reject ? !matched : matched,
        reject,
        description: formatGuardDescription(guard, transition),
        toStepCode: transition?.toStepCode ?? transition?.to_step_code,
      }
    })

    // Kết quả đánh giá dựa hoàn toàn vào các guard gắn với form:
    // mọi guard thỏa -> Đạt, còn lại -> Không đạt.
    const allGuardsPassed = rows.length > 0
      ? rows.every((row) => row.resultPass === true)
      : guards.every((guard) => guard.passed)
    const status = !hasSubmission ? 'pending' : allGuardsPassed ? 'pass' : 'fail'
    const isPass = !hasSubmission ? null : allGuardsPassed

    return {
      id: submission?.id ?? stepCode,
      stepCode,
      stepName: getStepDisplayName(step),
      standard: getValue(step?.standard, step?.standardCode, step?.standard_code, formTemplate?.standard),
      submittedAt: submission?.submittedAt ?? submission?.submitted_at,
      submittedName: submission?.submittedName ?? submission?.submitted_name,
      values,
      fields: fieldItems,
      rows,
      guards,
      submission,
      hasSubmission,
      status,
      isPass,
      statusName: !hasSubmission ? 'Chưa có kết quả' : allGuardsPassed ? 'Đạt' : 'Không đạt',
    }
  }).filter((item) => item.guards.length > 0)
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
  if (value === undefined || value === '') {
    return null
  }
  if (value && typeof value === 'object' && typeof value.toISOString === 'function' && typeof value.isValid === 'function') {
    return value.isValid() ? value.toISOString() : null
  }
  if (Array.isArray(value)) {
    return value.length ? value.map(normalizeSubmissionValue) : null
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeSubmissionValue(item)]),
    )
  }
  return value
}

const getFieldValueKey = (field) => getValue(
  field?.fieldKey,
  field?.field_key,
  field?.name,
  field?.key,
)

const collectFormFieldKeys = (fields = []) => (
  fields.reduce((result, field) => {
    const key = getFieldValueKey(field)
    if (key) {
      result.push(key)
    }

    const children = getFirstArray(
      field?.children,
      field?.fields,
      field?.items,
    )
    if (children.length) {
      result.push(...collectFormFieldKeys(children))
    }

    return result
  }, [])
)

const normalizeSubmissionValues = (values = {}, currentForm) => {
  const normalizedValues = normalizeSubmissionValue(values) ?? {}
  const payloadValues = normalizedValues && typeof normalizedValues === 'object' && !Array.isArray(normalizedValues)
    ? { ...normalizedValues }
    : {}

  collectFormFieldKeys(getFormFields(currentForm)).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(payloadValues, key)) {
      payloadValues[key] = null
    }
  })

  return payloadValues
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
    values: normalizeSubmissionValues(values, currentForm),
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
                const stepCode = getValue(step?.stepCode, step?.code)
                const selected = isSameStepRef(selectedStepCode, stepCode)
                  || isSameStepRef(selectedStepCode, step?.id)
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

const INSPECTION_STATUS_STYLES = {
  pass: { accent: '#16a34a', pillBg: '#dcfce7', pillText: '#15803d', dot: '#16a34a', label: 'Đạt' },
  fail: { accent: '#dc2626', pillBg: '#fee2e2', pillText: '#b91c1c', dot: '#dc2626', label: 'Không đạt' },
  pending: { accent: '#f59e0b', pillBg: '#f1f5f9', pillText: '#64748b', dot: '#94a3b8', label: 'Chưa có kết quả' },
}

const InspectionStatusPill = ({ status, label }) => {
  const style = INSPECTION_STATUS_STYLES[status] ?? INSPECTION_STATUS_STYLES.pending
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 12px',
        borderRadius: 999,
        background: style.pillBg,
        color: style.pillText,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: style.dot }} />
      {label ?? style.label}
    </span>
  )
}

const InspectionResultDot = ({ pass }) => {
  const color = pass === true ? '#16a34a' : pass === false ? '#dc2626' : '#cbd5e1'
  const background = pass === true ? '#dcfce7' : pass === false ? '#fee2e2' : '#fff'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        background,
        color,
        fontSize: 11,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      {pass === true ? '✓' : pass === false ? '✕' : ''}
    </span>
  )
}

const InspectionResultCard = ({ item, index, defaultExpanded = true, onOpenForm }) => {
  const style = INSPECTION_STATUS_STYLES[item?.status] ?? INSPECTION_STATUS_STYLES.pending
  const hasRows = item?.rows?.length > 0
  const [expanded, setExpanded] = useState(defaultExpanded)
  const toggle = () => setExpanded((value) => !value)

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 12,
        border: '1px solid #eef1f5',
        borderLeft: `4px solid ${style.accent}`,
        background: '#fff',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggle()
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          padding: '14px 18px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              color: '#94a3b8',
              fontSize: 12,
              transition: 'transform 0.15s ease',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            ▶
          </span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
            {item?.stepName ?? item?.name ?? `Kết quả ${index + 1}`}
          </span>
          {item?.standard && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                background: '#f1f5f9',
                color: '#475569',
                fontSize: 12,
                fontFamily: 'monospace',
              }}
            >
              {item.standard}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 13 }}>
          {item?.submittedName && <span>{item.submittedName}</span>}
          {item?.submittedName && <span>·</span>}
          {item?.submittedAt && <span>{formatTime(item.submittedAt)}</span>}
          {item?.submittedAt && <span>·</span>}
          <InspectionStatusPill status={item?.status} label={item?.statusName} />
        </div>
      </div>

      {expanded && hasRows && (
        <div style={{ padding: '0 18px 16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 130px 120px 44px',
              gap: 12,
              padding: '10px 0',
              borderTop: '1px solid #f1f5f9',
              color: '#94a3b8',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            <span>Chỉ tiêu</span>
            <span style={{ textAlign: 'center' }}>Giá trị đo</span>
            <span style={{ textAlign: 'right' }}>Yêu cầu</span>
            <span style={{ textAlign: 'center' }}>KQ</span>
          </div>

          {item.rows.map((row) => (
            <div
              key={row.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 130px 120px 44px',
                gap: 12,
                alignItems: 'center',
                padding: '10px 0',
                borderTop: '1px solid #f6f8fb',
                fontSize: 14,
              }}
            >
              <span style={{ color: '#334155' }}>{row.label}</span>
              <span style={{ textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>{row.displayValue}</span>
              <span style={{ textAlign: 'right', color: '#64748b' }}>{row.requirement || '—'}</span>
              <span style={{ display: 'flex', justifyContent: 'center' }}>
                <InspectionResultDot pass={row.resultPass} />
              </span>
            </div>
          ))}
        </div>
      )}

      {expanded && !item?.hasSubmission && (
        <div style={{ padding: '0 18px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              padding: '14px 16px',
              borderRadius: 10,
              border: '1px dashed #e2e8f0',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
              <span
                style={{
                  flex: '0 0 auto',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: '2px solid #cbd5e1',
                  marginTop: 2,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#334155', marginBottom: 2 }}>
                  Chưa nhập kết quả thử
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  KTV cần điền form <em>{item?.stepName}</em> để ghi nhận kết quả kiểm tra.
                </Text>
              </div>
            </div>
            {onOpenForm && (
              <Button
                onClick={(event) => {
                  event.stopPropagation()
                  onOpenForm(item)
                }}
              >
                Mở form nhập
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const InspectionResultList = ({ data, defaultExpanded = true, onOpenForm }) => {
  if (!data.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kết quả kiểm tra" />
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {data.map((item, index) => (
        <InspectionResultCard
          key={item?.id ?? item?.stepCode ?? index}
          item={item}
          index={index}
          defaultExpanded={defaultExpanded}
          onOpenForm={onOpenForm}
        />
      ))}
    </Space>
  )
}

const InspectionSummary = ({ data }) => {
  const passCount = data.filter((item) => item?.status === 'pass').length
  const failCount = data.filter((item) => item?.status === 'fail').length
  const pendingCount = data.filter((item) => item?.status === 'pending').length

  return (
    <Text type="secondary" style={{ fontSize: 13 }}>
      {passCount} đạt · {failCount} không đạt · {pendingCount} chưa xong
    </Text>
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
  const [viewingStepCode, setViewingStepCode] = useState(null)
  const [submissionTemplates, setSubmissionTemplates] = useState({})

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
  const stepTransitionList = getFirstArray(
    workflowPreview?.stepTransitionList,
    workflowPreview?.step_transition_list,
    workflow?.stepTransitionList,
    workflow?.step_transition_list,
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

  const displayStep = useMemo(() => {
    if (!viewingStepCode) return currentStep
    return findWorkflowStep(steps, viewingStepCode) ?? currentStep
  }, [viewingStepCode, currentStep, steps])

  const isReviewingSubmission = Boolean(
    viewingStepCode
    && !isSameStepRef(viewingStepCode, currentStep?.stepCode)
    && !isSameStepRef(viewingStepCode, currentStep?.code)
    && !isSameStepRef(viewingStepCode, currentStep?.id),
  )

  useEffect(() => {
    setViewingStepCode(null)
  }, [currentStepCode, instanceId])

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
  const submissions = getFirstArray(
    workflowPreview?.submissions,
    order?.submissions,
  )
  const previewFormTemplates = getFirstArray(
    workflowPreview?.currentFormTemplates,
    workflowPreview?.formTemplates,
    currentStep?.formTemplate ? [currentStep.formTemplate] : undefined,
    previewStepProcess?.formTemplate ? [previewStepProcess.formTemplate] : undefined,
    currentStep?.formTemplates,
    currentStep?.forms,
    order?.currentFormTemplates,
    order?.formTemplates,
    order?.forms,
  )
  const formTemplates = useMemo(
    () => [...previewFormTemplates, ...Object.values(submissionTemplates)],
    [previewFormTemplates, submissionTemplates],
  )

  useEffect(() => {
    const availableTemplateIds = new Set(
      previewFormTemplates
        .map((template) => resolveTemplateId(template))
        .filter(Boolean)
        .map(String),
    )

    const guardedStepTemplateIds = steps
      .filter((step) => getGuardsForSourceStep(
        getValue(step?.stepCode, step?.code),
        stepTransitionList,
      ).length > 0)
      .map((step) => getStepTemplateId(step))
      .filter(Boolean)
      .map(String)

    const missingIds = Array.from(new Set([
      ...submissions
        .map((submission) => submission?.templateId ?? submission?.template_id)
        .filter(Boolean)
        .map(String),
      ...guardedStepTemplateIds,
    ])).filter((id) => !availableTemplateIds.has(id) && !submissionTemplates[id])

    if (!missingIds.length) return undefined

    let mounted = true

    Promise.all(missingIds.map(async (id) => {
      try {
        const response = await RequestUtils.Get(FORM_TEMPLATE_DETAIL_API, { id })
        const template = response?.data ?? response
        if (template && typeof template === 'object') {
          return [id, template]
        }
      } catch (error) {
        console.warn('[OrderProgress] fetch form template failed', id, error)
      }
      return null
    })).then((entries) => {
      if (!mounted) return
      const validEntries = entries.filter(Boolean)
      if (!validEntries.length) return
      setSubmissionTemplates((prev) => ({
        ...prev,
        ...Object.fromEntries(validEntries),
      }))
    })

    return () => {
      mounted = false
    }
  }, [submissions, previewFormTemplates, submissionTemplates, steps, stepTransitionList])

  const currentForm = getValue(
    currentStep?.formTemplate,
    previewStepProcess?.formTemplate,
    order?.currentForm,
    order?.requiredForm,
    formTemplates[0],
  )
  const displayForm = useMemo(() => {
    if (isSameStepRef(displayStep?.stepCode, previewStepProcess?.stepCode)
      || isSameStepRef(displayStep?.id, previewStepProcess?.id)) {
      return previewStepProcess?.formTemplate ?? currentForm
    }

    return getValue(
      displayStep?.formTemplate,
      formTemplates.find((template) => isSubmissionForTemplate(
        findSubmissionForStep(submissions, displayStep),
        template,
      )),
      currentForm,
    )
  }, [displayStep, previewStepProcess, currentForm, formTemplates, submissions])
  const sourceComponent = getValue(displayForm?.sourceComponent, displayForm?.source_component, currentForm?.sourceComponent, currentForm?.source_component)
  const currentFormName = getValue(
    displayForm?.name,
    displayForm?.label,
    displayForm?.title,
    displayForm?.templateName,
    displayForm?.template_name,
    displayForm?.description,
    getStepDisplayName(displayStep),
  )
  const remoteFormContainerRef = useRef(null)
  const remoteEntry = getValue(
    sourceComponent?.microFrontendUrl,
    sourceComponent?.micro_frontend_url,
    displayForm?.remoteEntry,
    displayForm?.remoteEntryUrl,
    displayForm?.microFrontendUrl,
    displayStep?.formUrl,
    displayStep?.form_url,
    currentForm?.remoteEntry,
    currentForm?.remoteEntryUrl,
    currentForm?.microFrontendUrl,
    currentStep?.remoteEntry,
    currentStep?.formUrl,
    order?.remoteEntry,
  )
  const remoteComponentId = getValue(
    sourceComponent?.componentId,
    sourceComponent?.component_id,
    displayForm?.componentId,
    displayForm?.component_id,
    currentForm?.componentId,
    currentForm?.component_id,
  )
  const remoteVersionKey = buildRemoteAlias(
    resolveTemplateId(displayForm),
    sourceComponent?.version,
    sourceComponent?.updatedDate,
    sourceComponent?.updated_date,
    displayStep?.stepCode,
    displayStep?.code,
  )
  const remoteRenderKey = buildRemoteAlias(remoteComponentId, remoteEntry, remoteVersionKey)
  const inspectionResults = useMemo(() => buildInspectionResults({
    submissions,
    steps,
    stepTransitionList,
    previewStepProcess,
    formTemplates,
  }), [submissions, steps, stepTransitionList, previewStepProcess, formTemplates])
  const histories = buildWorkflowHistoryItems({
    workflowPreview,
    workflowInstance,
    order,
    workflow,
    steps,
  })
  const currentSubmission = submissions.find((item) =>
    isSubmissionForStep(item, currentStep) && isSubmissionForTemplate(item, currentForm)
  ) ?? submissions.find((item) =>
    isSubmissionForStep(item, currentStep)
  ) ?? submissions.find((item) =>
    isSubmissionForTemplate(item, currentForm)
  )
  const displaySubmission = useMemo(() => (
    findSubmissionForStep(submissions, displayStep)
  ), [submissions, displayStep])
  const displaySubmissionValues = getSubmissionValues(displaySubmission)
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

  const handleReviewStep = useCallback((step) => {
    const stepCode = getValue(step?.stepCode, step?.code, step?.id)
    if (!stepCode) return
    setViewingStepCode(String(stepCode))
  }, [])

  const handleReviewInspectionResult = useCallback((item) => {
    if (!item?.stepCode) return
    setViewingStepCode(String(item.stepCode))
  }, [])

  const handleBackToCurrentStep = useCallback(() => {
    setViewingStepCode(null)
  }, [])

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
      <style>
        {`
          @media (min-width: 992px) {
            .workflow-progress-main-col {
              flex: 0 0 calc(100% - 400px) !important;
              max-width: calc(100% - 400px) !important;
            }

            .workflow-progress-side-col {
              flex: 0 0 400px !important;
              max-width: 400px !important;
            }
          }

          @media (max-width: 991px) {
            .workflow-progress-main-col,
            .workflow-progress-side-col {
              flex: 0 0 100% !important;
              max-width: 100% !important;
            }

            .workflow-progress-fixed-panel {
              position: static !important;
              width: 100% !important;
              max-width: none !important;
              min-width: 0 !important;
              max-height: none !important;
              overflow-y: visible !important;
            }
          }
        `}
      </style>
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
          <Row gutter={16} align="top">
            <Col xs={24} lg={16} className="workflow-progress-main-col">
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
                    <Space wrap>
                      <FormOutlined />
                      <span>{currentFormName || 'Form bắt buộc tại bước'}</span>
                      {isReviewingSubmission && (
                        <Tag color="blue">Đang xem lại</Tag>
                      )}
                    </Space>
                  )}
                  extra={isReviewingSubmission ? (
                    <Button type="link" onClick={handleBackToCurrentStep}>
                      Quay lại bước hiện tại
                    </Button>
                  ) : null}
                >
                  {isReviewingSubmission && !displaySubmission && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bước này chưa có dữ liệu đã gửi" />
                  )}
                  {!remoteEntry && !isReviewingSubmission && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bước hiện tại chưa có remoteEntry form" />
                  )}
                  {!remoteEntry && isReviewingSubmission && displaySubmission && (
                    <InspectionResultList
                      data={inspectionResults.filter((item) => isSameStepRef(item?.stepCode, viewingStepCode))}
                    />
                  )}
                  {remoteEntry && loadingRemote && <Spin />}
                  {remoteEntry && remoteError && <RemoteFormErrorFallback message={remoteError} />}
                  {remoteEntry && RemoteForm && (
                    <div ref={remoteFormContainerRef}>
                      <RemoteFormBoundary key={remoteRenderKey} remoteKey={remoteRenderKey}>
                        <RemoteFormHost
                          key={remoteRenderKey}
                          ref={isReviewingSubmission ? undefined : remoteFormRef}
                          Component={RemoteForm}
                          order={order}
                          record={order}
                          data={order}
                          step={displayStep}
                          formTemplate={displayForm}
                          submission={displaySubmission}
                          initialValues={displaySubmissionValues}
                          values={displaySubmissionValues}
                          defaultValues={displaySubmissionValues}
                          readOnly={isReviewingSubmission}
                          disabled={isReviewingSubmission}
                          hideTitle
                          showTitle={false}
                          onSubmit={isReviewingSubmission ? undefined : handleRemoteFormSubmit}
                          onSubmitError={handleRemoteFormSubmitError}
                        />
                      </RemoteFormBoundary>
                    </div>
                  )}
                  {remoteEntry && RemoteForm && !isReviewingSubmission ? (
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

                <Card
                  title={(
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span>Kết quả kiểm tra</span>
                      <InspectionSummary data={inspectionResults} />
                    </div>
                  )}
                >
                  <InspectionResultList
                    data={inspectionResults}
                    onOpenForm={handleReviewInspectionResult}
                  />
                </Card>

                <Card title="Lịch sử chuyển bước">
                  <HistoryList data={histories} />
                </Card>
              </Space>
            </Col>

            <Col xs={24} lg={8} className="workflow-progress-side-col">
              <div
                className="workflow-progress-fixed-panel"
                style={workflowFixedPanelStyle}
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
                  submissions={submissions}
                  selectedStepCode={viewingStepCode}
                  onStepClick={handleReviewStep}
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
