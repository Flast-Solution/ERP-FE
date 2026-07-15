import { toNumberOrNull } from './utils'
import { coerceGuardValue } from './guards'

export const getFormFields = (formTemplate) => (
  Array.isArray(formTemplate?.fields) ? formTemplate.fields : []
)

export const resolveFieldOptionLabel = (field, value) => {
  const options = Array.isArray(field?.config?.options) ? field.config.options : []
  if (!options.length) return null

  const normalizedValue = coerceGuardValue(value)
  const match = options.find((option) =>
    coerceGuardValue(option?.value) === normalizedValue
    || coerceGuardValue(option?.label) === normalizedValue,
  )

  return match?.label ?? null
}

export const formatSubmissionFieldValue = (field, value) => {
  if (value === undefined || value === null || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Có' : 'Không'
  if (Array.isArray(value)) {
    const labels = value.map((item) => resolveFieldOptionLabel(field, item) ?? String(item))
    return labels.join(', ')
  }

  return resolveFieldOptionLabel(field, value) ?? String(value)
}

export const buildFieldDisplayItems = (values = {}, fields = []) => {
  const fieldMap = new Map(
    fields.map((field) => [field?.fieldKey, field]),
  )

  return Object.entries(values).map(([key, value]) => {
    const field = fieldMap.get(key)
    return {
      key,
      label: field?.label ?? key,
      value,
      displayValue: formatSubmissionFieldValue(field, value),
    }
  })
}

export const normalizeSubmissionValue = (value) => {
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

export const collectFormFieldKeys = (fields = []) => (
  fields.reduce((result, field) => {
    const key = field?.fieldKey
    if (key) {
      result.push(key)
    }

    const children = Array.isArray(field?.children) ? field.children : []
    if (children.length) {
      result.push(...collectFormFieldKeys(children))
    }

    return result
  }, [])
)

export const normalizeSubmissionValues = (values = {}, currentForm) => {
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

export const buildWorkflowSubmissionPayload = ({
  values,
  currentForm,
  currentStep,
  workflowPreview,
}) => {
  const processInstance = workflowPreview?.processInstance

  return {
    templateId: toNumberOrNull(currentForm?.id),
    processStepId: toNumberOrNull(currentStep?.id),
    entityType: processInstance?.entityType,
    entityId: toNumberOrNull(processInstance?.entityId),
    instanceId: toNumberOrNull(processInstance?.id),
    stepCode: currentStep?.stepCode,
    values: normalizeSubmissionValues(values, currentForm),
  }
}

export const resolveUserId = (user = {}) => toNumberOrNull(user?.id)

export const buildWorkflowTransitionPayload = ({
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
