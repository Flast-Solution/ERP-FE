import dayjs from 'dayjs'
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

const getFieldInputType = (field = {}) => String(
  field.inputType ?? field.type ?? field.component ?? '',
).toLowerCase()

const normalizeTemporalString = (value, inputType) => {
  const text = String(value ?? '').trim()
  if (!text) return null

  const vietnameseDateTime = text.match(
    /^(\d{2})[/-](\d{2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  )
  const normalizedText = vietnameseDateTime
    ? `${vietnameseDateTime[3]}-${vietnameseDateTime[2]}-${vietnameseDateTime[1]}${vietnameseDateTime[4]
      ? ` ${vietnameseDateTime[4].padStart(2, '0')}:${vietnameseDateTime[5]}:${vietnameseDateTime[6] ?? '00'}`
      : ''}`
    : text.replace(/^(\d{4})\/(\d{2})\/(\d{2})/, '$1-$2-$3')

  const parsed = dayjs(normalizedText)
  if (!parsed.isValid()) return value

  return parsed.format(inputType === 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD')
}

export const normalizeSubmissionValue = (value, field) => {
  if (value === undefined || value === '') {
    return null
  }
  const inputType = getFieldInputType(field)
  if (inputType === 'date' || inputType === 'datetime') {
    if (
      value
      && typeof value === 'object'
      && typeof value.format === 'function'
      && typeof value.isValid === 'function'
    ) {
      if (!value.isValid()) return null
      return value.format(inputType === 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD')
    }
    return normalizeTemporalString(value, inputType)
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

const collectFormFields = (fields = []) => (
  fields.reduce((result, field) => {
    result.push(field)
    const children = Array.isArray(field?.children) ? field.children : []
    if (children.length) {
      result.push(...collectFormFields(children))
    }
    return result
  }, [])
)

export const normalizeSubmissionValues = (values = {}, currentForm) => {
  const formFields = collectFormFields(getFormFields(currentForm))
  const fieldsByKey = new Map(
    formFields
      .filter(field => field?.fieldKey)
      .map(field => [field.fieldKey, field]),
  )
  const payloadValues = values && typeof values === 'object' && !Array.isArray(values)
    ? Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        normalizeSubmissionValue(value, fieldsByKey.get(key)),
      ]),
    )
    : {}

  collectFormFieldKeys(formFields).forEach((key) => {
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
  workflowInstance,
  currentSubmission,
  user,
  toStepCode,
}) => {
  return {
    processId: toNumberOrNull(workflowInstance?.processId),
    processInstanceId: toNumberOrNull(workflowInstance?.id),
    entityType: workflowInstance?.entityType,
    entityId: toNumberOrNull(workflowInstance?.entityId),
    toStepCode: toStepCode || null,
    byUserId: resolveUserId(user),
    note: '',
    fromStepSubmissionId: toNumberOrNull(currentSubmission?.id),
  }
}
