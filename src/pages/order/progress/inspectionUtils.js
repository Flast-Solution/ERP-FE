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

export const isInspectionStep = (step) => Boolean(step?.formUrl)

export const buildInspectionResults = ({
  submissions = [],
  steps = [],
  stepTransitionList = [],
  previewStepProcess,
  formTemplates = [],
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
    const formTemplate = submission
      ? formTemplates.find((template) => Number(template?.id) === Number(submission.templateId)) ?? null
      : stepCode === previewStepProcess?.stepCode
        ? previewStepProcess?.formTemplate ?? null
        : null
    const stepFields = getFormFields(formTemplate)
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

    const rows = Array.from(guardByField.entries()).map(([fieldKey, matched]) => {
      const fieldItem = fieldItemMap.get(fieldKey)
      const templateField = templateFieldMap.get(fieldKey)
      const rawValue = values?.[fieldKey]
      const guardMatched = hasSubmission ? evaluateGuard(matched.guard, submissions) : null
      const resultPass = guardMatched === null
        ? null
        : (matched.reject ? !guardMatched : guardMatched)

      return {
        key: fieldKey,
        label: fieldItem?.label ?? templateField?.label ?? fieldKey,
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
        toStepCode: transition?.toStepCode,
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
      stepName: step?.name,
      standard: formTemplate?.description ?? null,
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
      statusName: !hasSubmission ? 'Chưa có kết quả' : allGuardsPassed ? 'Đạt' : 'Không đạt',
    }
  }).filter((item) => item.guards.length > 0)
}
