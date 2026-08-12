import { getStepProcessTypeLabel } from './processType'

export const normalizeStepRef = (value) => String(value ?? '').trim()

export const isWorkflowStepHidden = (step = {}) => {
  const value = step?.hidden ?? step?.isHidden ?? step?.is_hidden
  return value === true || value === 1 || String(value).toLowerCase() === 'true'
}

export const getWorkflowStepButtons = (step = {}) => {
  let buttons = step?.buttons ?? step?.stepButtons ?? step?.step_buttons ?? []
  if (typeof buttons === 'string' && buttons.trim()) {
    try {
      buttons = JSON.parse(buttons)
    } catch (_) {
      buttons = []
    }
  }
  if (!Array.isArray(buttons)) return []

  return buttons
    .map((button, index) => ({
      ...button,
      id: button?.id ?? `button_${index + 1}`,
      label: button?.label ?? button?.name ?? `Button ${index + 1}`,
      type: button?.type ?? button?.actionType ?? button?.action_type ?? 'TRANSITION',
      targetStepCode: button?.targetStepCode ?? button?.target_step_code ?? null,
      style: button?.style ?? button?.buttonStyle ?? button?.button_style ?? 'DEFAULT',
      requireSubmission: button?.requireSubmission ?? button?.require_submission ?? false,
      order: Number(button?.order ?? index),
    }))
    .sort((left, right) => left.order - right.order)
}

export const getStepSubmitButtonConfig = (step = {}) => {
  let config = step?.submitButton ?? step?.submit_button
  if (typeof config === 'string' && config.trim()) {
    try {
      config = JSON.parse(config)
    } catch (_) {
      config = {}
    }
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) config = {}

  return {
    visible: config.visible ?? true,
    label: config.label ?? config.text ?? 'Cập nhật',
    style: config.style ?? config.buttonStyle ?? config.button_style ?? 'PRIMARY',
    closeAfterSubmit: config.closeAfterSubmit ?? config.close_after_submit ?? false,
  }
}

export const isSameStepRef = (left, right) => {
  const normalizedLeft = normalizeStepRef(left)
  const normalizedRight = normalizeStepRef(right)
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight)
}

export const isStepInRefs = (step, refs = []) => {
  const stepCode = normalizeStepRef(step?.stepCode)
  return Boolean(stepCode && refs.some((ref) => normalizeStepRef(ref) === stepCode))
}

export const isSubmissionForStep = (submission, step) => {
  if (!submission || !step) return false

  return isSameStepRef(submission?.stepCode, step?.stepCode)
}

export const getSubmissionValues = (submission) => {
  const values = submission?.valuesJson

  return values && typeof values === 'object' ? values : {}
}

export const findSubmissionForStep = (submissions = [], step) => (
  submissions.find((item) => isSubmissionForStep(item, step)) ?? null
)
export const getStepDisplayName = (step, fallback) => step?.name ?? fallback

export const getStepTransitionCode = (transition) => {
  return typeof transition === 'string' ? transition : null
}

export const getStepTransitionLabel = (transition, steps = []) => {
  const code = getStepTransitionCode(transition)
  const step = steps.find((item) => item?.stepCode === code)

  return step?.name ?? code
}

export const buildStepTransitionOptions = (transitions = [], steps = []) => (
  transitions
    .map((transition) => {
      const value = getStepTransitionCode(transition)
      if (!value) return null

      const step = steps.find((item) => item?.stepCode === value)
      if (isWorkflowStepHidden(step)) return null

      return {
        value,
        label: getStepTransitionLabel(transition, steps),
      }
    })
    .filter(Boolean)
)

export const findWorkflowStep = (steps = [], ref) => {
  if (ref == null || ref === '') return null

  return steps.find((step) => step?.stepCode === ref) ?? null
}

export const buildStepGroups = (steps = [], processTypeLabelMap = new Map()) => {
  const sortedSteps = [...steps].sort((a, b) => Number(a?.sortOrder) - Number(b?.sortOrder))
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

export const getCurrentStepSortOrder = (currentStep) => {
  const value = Number(currentStep?.sortOrder)
  return Number.isNaN(value) ? null : value
}

export const getStepStatus = ({ step, currentStep, currentStepCode, completedRefs, submittedRefs, isParallel = false }) => {
  const active = step?.stepCode === currentStepCode
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

export const isParallelGroup = (group) => {
  const title = String(group?.title ?? '').toLowerCase()
  return group?.steps?.length > 3 || title.includes('song song') || title.includes('parallel')
}
