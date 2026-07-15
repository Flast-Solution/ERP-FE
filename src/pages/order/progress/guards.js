import { findSubmissionForStep, getSubmissionValues, normalizeStepRef } from './stepUtils'

export const coerceGuardValue = (value) => {
  if (value === true || value === 'true') return 'true'
  if (value === false || value === 'false') return 'false'
  if (value === null || value === undefined) return ''
  return String(value)
}

export const evaluateGuardOperator = (operator, actual, expected) => {
  const left = coerceGuardValue(actual)
  const right = coerceGuardValue(expected)
  const leftNumber = Number(left)
  const rightNumber = Number(right)

  switch (operator) {
    case 'neq':
      return left !== right
    case 'gt':
      return left !== '' && right !== '' && !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)
        && leftNumber > rightNumber
    case 'gte':
      return left !== '' && right !== '' && !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)
        && leftNumber >= rightNumber
    case 'lt':
      return left !== '' && right !== '' && !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)
        && leftNumber < rightNumber
    case 'lte':
      return left !== '' && right !== '' && !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)
        && leftNumber <= rightNumber
    case 'eq':
      return left === right
    default:
      return false
  }
}

export const evaluateGuard = (guard, submissions = []) => {
  if (guard?.guardType !== 'field_value') return false

  const config = guard?.config
  if (!config?.from_step || !config?.field_name || !config?.operator) return false

  const submission = findSubmissionForStep(submissions, { stepCode: config.from_step })
  const values = getSubmissionValues(submission)
  return evaluateGuardOperator(config.operator, values?.[config.field_name], config.expected_value)
}

export const getGuardsForSourceStep = (stepCode, stepTransitionList = []) => {
  const normalizedStepCode = normalizeStepRef(stepCode)
  if (!normalizedStepCode) return []

  // Chỉ lấy guard trên các transition XUẤT PHÁT từ chính bước này. Một guard có thể
  // tham chiếu field của bước khác (config.from_step) nhưng lại nằm trên transition của
  // bước sau (ví dụ bước tổng hợp đọc lại field của bước trước) — những guard đó thuộc
  // về bước sau, không được kéo nhầm vào kết quả của bước hiện tại.
  return stepTransitionList.flatMap((transition) => {
    const transitionFrom = normalizeStepRef(transition?.fromStepCode)
    if (transitionFrom !== normalizedStepCode) return []

    return Array.isArray(transition?.guards)
      ? transition.guards.map((guard) => ({ transition, guard }))
      : []
  })
}

export const GUARD_OPERATOR_LABELS = {
  eq: '=',
  neq: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
}

export const formatGuardDescription = (guard, transition) => {
  const config = guard?.config ?? {}
  const fieldName = config.field_name ?? 'field'
  const operator = GUARD_OPERATOR_LABELS[config.operator] ?? config.operator ?? '='
  const expectedValue = config.expected_value ?? ''
  const toStepCode = transition?.toStepCode ?? ''
  const message = guard?.errorMessage || config.message

  if (message) return message
  return `${fieldName} ${operator} ${expectedValue}${toStepCode ? ` → ${toStepCode}` : ''}`
}

export const GUARD_OPERATOR_INVERSE = {
  eq: 'neq',
  neq: 'eq',
  gt: 'lte',
  gte: 'lt',
  lt: 'gte',
  lte: 'gt',
}

// Guard trên nhánh "loại" (reject) mô tả điều kiện để bị loại, nên khi hiển thị
// "Yêu cầu" (điều kiện để ĐẠT) ta phải đảo ngược lại toán tử của guard.
export const formatGuardRequirement = (guard, reject = false) => {
  const config = guard?.config ?? {}
  const rawOperator = config.operator ?? 'eq'
  const operator = reject ? (GUARD_OPERATOR_INVERSE[rawOperator] ?? rawOperator) : rawOperator
  const operatorLabel = GUARD_OPERATOR_LABELS[operator] ?? operator
  const expected = coerceGuardValue(config.expected_value)

  if (expected === 'true' || expected === 'false') {
    // eq: đạt khi bằng expected; neq: đạt khi khác expected.
    const wantTrue = operator === 'eq' ? expected === 'true' : expected === 'false'
    return wantTrue ? 'Có' : 'Không'
  }

  if (operator === 'eq') return expected
  return `${operatorLabel} ${expected}`.trim()
}

export const REJECT_TRANSITION_KEYWORDS = [
  'lỗi', 'loi', 'error', 'reject', 'fail', 'hỏng', 'hong',
  'hủy', 'huy', 'defect', 'từ chối', 'tu choi', 'cancel', 'loại', 'loai',
]

export const normalizeLowerText = (value) => String(value ?? '')
  .toLowerCase()
  .normalize('NFC')

// Xác định một transition có phải nhánh "loại/không đạt" hay không dựa trên tên bước đích.
export const isRejectTransition = (transition, stepNameMap = new Map()) => {
  const toStepRef = normalizeStepRef(transition?.toStepCode)
  const haystack = normalizeLowerText([
    stepNameMap.get(toStepRef),
    transition?.toStepCode,
  ].filter(Boolean).join(' '))

  return REJECT_TRANSITION_KEYWORDS.some((keyword) => haystack.includes(keyword))
}
