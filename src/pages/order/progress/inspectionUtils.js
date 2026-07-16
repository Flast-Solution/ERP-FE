import {
  getSubmissionValues,
} from './stepUtils'
import {
  evaluateGuard,
  formatGuardDescription,
  formatGuardRequirement,
  getGuardsForSourceStep,
  isRejectTransition,
} from './guards'
import {
  buildFieldDisplayItems,
  formatSubmissionFieldValue,
  getFormFields,
} from './formUtils'
import { getStepProcessTypeMeta } from './processType'

const normalizeRef = (value) => String(value ?? '').trim()

const resolveStandard = (fieldItems, formTemplate) => {
  const standardField = fieldItems.find((field) => field.key === 'test_standard')
  if (standardField?.displayValue && standardField.displayValue !== '-') {
    return standardField.displayValue
  }

  const description = String(formTemplate?.description ?? '').trim()
  return description.replace(/^Tiêu chuẩn\s*/i, '') || null
}

export const isInspectionStep = (step) => Boolean(step?.formUrl)

export const buildInspectionResults = ({
  submissions = [],
  steps = [],
  stepTransitionList = [],
  previewStepProcess,
  formTemplates = [],
  completedStepCodes = [],
  processTypeMetaMap = new Map(),
}) => {
  const relevantSteps = steps.filter((step) => (
    isInspectionStep(step)
    || submissions.some((submission) => submission?.stepCode === step?.stepCode)
  ))

  const displaySteps = [...relevantSteps]
    .sort((a, b) => Number(a?.sortOrder) - Number(b?.sortOrder))

  const stepNameMap = new Map(
    steps.map((step) => [String(step?.stepCode ?? ''), step?.name]),
  )

  return displaySteps.map((step) => {
    const stepCode = step?.stepCode
    const submission = submissions.find((item) => item?.stepCode === stepCode) ?? null
    const hasSubmission = Boolean(submission)
    const values = getSubmissionValues(submission)
    const templateId = submission?.templateId ?? step?.formTemplate?.id
    const formTemplate = formTemplates.find((template) => (
      Number(template?.id) === Number(templateId)
    )) ?? step?.formTemplate ?? null
    const stepFields = [...getFormFields(formTemplate)]
      .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))
    const fieldItems = buildFieldDisplayItems(values, stepFields)

    const stepGuards = getGuardsForSourceStep(stepCode, stepTransitionList)
    // Mỗi field có thể xuất hiện ở nhiều transition (nhánh đạt + nhánh loại).
    // Ưu tiên guard nhánh "đạt" (forward) để hiển thị yêu cầu/KQ; nếu chỉ có
    // guard nhánh "loại" thì đảo chiều kết quả cho đúng nghiệp vụ.
    const guardByField = new Map()
    stepGuards.forEach(({ guard, transition }) => {
      const key = guard?.config?.field_name
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
        field?.fieldKey,
        field,
      ]),
    )

    const rowKeys = new Set([
      ...stepFields.map((field) => field?.fieldKey).filter(Boolean),
      ...fieldItems.map((field) => field.key),
      ...guardByField.keys(),
    ])

    const rows = Array.from(rowKeys).map((fieldKey) => {
      const matched = guardByField.get(fieldKey)
      const fieldItem = fieldItemMap.get(fieldKey)
      const templateField = templateFieldMap.get(fieldKey)
      const rawValue = values?.[fieldKey]
      const guardMatched = hasSubmission && matched
        ? evaluateGuard(matched.guard, submissions)
        : null
      const resultPass = matched
        ? (guardMatched === null ? null : (matched.reject ? !guardMatched : guardMatched))
        : (hasSubmission ? true : null)

      return {
        key: fieldKey,
        label: fieldItem?.label ?? templateField?.label ?? fieldKey,
        displayValue: fieldItem?.displayValue ?? formatSubmissionFieldValue(templateField, rawValue),
        requirement: matched
          ? formatGuardRequirement(matched.guard, matched.reject)
          : null,
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
        toStepCode: transition?.toStepCode,
      }
    })

    // Nếu bước có guard, kết quả được đánh giá theo guard. Bước đã hoàn thành
    // nhưng không cấu hình guard được coi là đạt ở cấp workflow.
    const evaluableRows = rows.filter((row) => typeof row.resultPass === 'boolean')
    const allGuardsPassed = evaluableRows.length > 0
      ? evaluableRows.every((row) => row.resultPass)
      : guards.length > 0 && guards.every((guard) => guard.passed)
    const normalizedStepCode = normalizeRef(stepCode)
    const isCurrent = normalizedStepCode === normalizeRef(previewStepProcess?.stepCode)
    const isCompleted = completedStepCodes.some((item) => (
      normalizeRef(item?.step_code) === normalizedStepCode
    ))
    const hasEvaluation = evaluableRows.length > 0 || guards.length > 0
    const status = !hasSubmission || (!hasEvaluation && !isCompleted)
      ? 'pending'
      : allGuardsPassed || (!hasEvaluation && isCompleted)
        ? 'pass'
        : 'fail'
    const isPass = status === 'pending' ? null : status === 'pass'
    const processType = getStepProcessTypeMeta(step, processTypeMetaMap)
    const executionState = isCurrent ? 'current' : isCompleted ? 'completed' : 'waiting'

    return {
      id: submission?.id ?? stepCode,
      stepCode,
      stepName: step?.name,
      formName: formTemplate?.name ?? null,
      standard: resolveStandard(fieldItems, formTemplate),
      processType,
      processTypeColor: processType?.colorCode ?? null,
      submittedAt: submission?.submittedAt,
      submittedName: submission?.submittedName,
      values,
      fields: fieldItems,
      rows,
      guards,
      submission,
      hasSubmission,
      status,
      isPass,
      executionState,
      executionLabel: isCurrent ? 'đang chạy' : isCompleted ? null : 'chưa bắt đầu',
      canOpenForm: isCurrent,
      defaultExpanded: isCurrent || hasSubmission,
      statusName: status === 'pending'
        ? (isCurrent ? 'Chưa có kết quả' : 'Chờ')
        : status === 'pass' ? 'Đạt' : 'Không đạt',
    }
  })
}
