import { DEFAULT_STEP, DEFAULT_TRANSITION } from '@/store/workflowConstants'

/**
 * flowToJson({ nodes, edges, process })
 * → Flast NoCode API payload
 *
 * {
 *   process: { name, code, description },
 *   steps: [{ id, code, label, type, description, position, forms, actions }],
 *   transitions: [{ id, from_step, to_step, label, require_note, guards, actions }]
 * }
 */
export const flowToJson = ({ nodes, edges, process }) => ({
  process: {
    ...(process.id != null && process.id !== '' ? { id: process.id } : {}),
    processKey: process.processKey ?? '',
    name: process.name ?? '',
    code: process.code ?? '',
    description: process.description ?? '',
  },
  steps: nodes.map((node) => ({
    id: node.data?.persistedId ?? node.data?.id ?? node.id,
    code: node.data.code,
    label: node.data.label,
    type: node.data.type,
    description: node.data.description ?? '',
    position: node.position,
    forms: serializeFormIds(node.data.forms ?? []),
    actions: (node.data.actions ?? []).map(serializeAction),
  })),
  transitions: edges.map(serializeTransition),
})

/**
 * jsonToFlow(raw)
 * → { nodes, edges, process } để loadFlow() của store nhận
 *
 * Nhận payload từ API hoặc file JSON đã export bằng flowToJson.
 * Tự fallback nếu thiếu field.
 */
export const jsonToFlow = (raw) => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Dữ liệu không hợp lệ')
  }

  const process = {
    id: raw.process?.id ?? null,
    processKey: raw.process?.processKey ?? raw.process?.process_key ?? raw.process?.key ?? '',
    name: raw.process?.name ?? 'Untitled',
    code: raw.process?.code ?? raw.process?.processKey ?? raw.process?.process_key ?? 'untitled',
    description: raw.process?.description ?? '',
  }

  const nodes = (raw.steps ?? []).map((step) => {
    const stepCode = step.code ?? step.stepCode ?? step.step_code ?? ''
    const label = step.label ?? step.name ?? stepCode
    const nodeId = getStepNodeId(step)

    return {
      id: nodeId,
      type: 'stepNode',
      position: step.position ?? { x: 0, y: 0 },
      data: {
        ...DEFAULT_STEP,
        id: step.id ?? null,
        persistedId: step.id ?? null,
        processId: step.processId ?? step.process_id ?? null,
        code: stepCode,
        label,
        type: step.type ?? 'process',
        description: step.description ?? '',
        forms: normalizeStepForms(step),
        actions: (step.actions ?? []).map(deserializeAction),
      },
    }
  })

  const edges = (raw.transitions ?? []).map((t) => {
    const source = getTransitionStepRef(t, 'from')
    const target = getTransitionStepRef(t, 'to')

    return {
      id: t.id != null ? String(t.id) : `edge_${source}_${target}`,
      source,
      target,
      type: 'transitionEdge',
      data: {
        ...DEFAULT_TRANSITION,
        id: t.id ?? null,
        label: t.label ?? t.name ?? '',
        require_note: t.require_note ?? t.requireNote ?? false,
        allowed_roles: t.allowed_roles ?? t.allowedRoles ?? [],
        guards: (t.guards ?? []).map(deserializeGuard),
        actions: (t.actions ?? []).map(deserializeAction),
      },
    }
  }).filter(edge => edge.source && edge.target)

  return { nodes, edges, process }
}

const getStepNodeId = (step = {}) => {
  if (typeof step.id === 'string' && step.id && !/^\d+$/.test(step.id)) {
    return step.id
  }
  const code = step.code ?? step.stepCode ?? step.step_code
  if (code) return String(code)
  if (step.id != null) return `step_${step.id}`
  return `step_${Math.random().toString(36).slice(2, 8)}`
}

const normalizeStepForms = (step = {}) => {
  const forms = step.forms ?? step.formTemplates ?? step.form_templates ?? []
  return Array.isArray(forms) ? forms : []
}

const getTransitionStepRef = (transition = {}, direction) => {
  const candidates = direction === 'from'
    ? [
      transition.from_step,
      transition.fromStep,
      transition.fromStepCode,
      transition.from_step_code,
      transition.source,
      transition.sourceStepCode,
      transition.source_step_code,
    ]
    : [
      transition.to_step,
      transition.toStep,
      transition.toStepCode,
      transition.to_step_code,
      transition.target,
      transition.targetStepCode,
      transition.target_step_code,
    ]

  const value = candidates.find(item => item != null && item !== '')
  return value != null ? String(value) : ''
}

/*
  Keep legacy shape in comments for quick mental mapping:
  {
    id,
    source,
    target,
    type: 'transitionEdge',
    data: {
      label,
      guards,
      actions
    }
  }
*/

// ─── Guard serializers ────────────────────────────────────────────────────────

const isTemporaryTransitionId = (id) => {
  const value = String(id ?? '')
  return !value
    || value.startsWith('id_')
    || value.startsWith('e_')
    || value.startsWith('edge_')
}

const getPersistedTransitionId = (edge = {}) => {
  const persistedId = edge.data?.id ?? edge.data?.transitionId ?? edge.data?.persistedId
  if (persistedId != null && persistedId !== '') {
    return persistedId
  }

  return isTemporaryTransitionId(edge.id) ? null : edge.id
}

const serializeFormIds = (forms = []) => forms
  .map(form => {
    if (form == null || form === '') return null
    if (typeof form !== 'object') return form
    return form.id ?? form.templateId ?? form.formId ?? null
  })
  .filter(id => id != null && id !== '')

const serializeTransition = (edge) => {
  const transition = {
    from_step: edge.source,
    to_step: edge.target,
    label: edge.data?.label ?? '',
    require_note: edge.data?.require_note ?? false,
    allowed_roles: edge.data?.allowed_roles ?? [],
    guards: (edge.data?.guards ?? []).map(serializeGuard),
    actions: (edge.data?.actions ?? []).map(serializeAction),
  }

  const persistedId = getPersistedTransitionId(edge)
  if (persistedId != null && persistedId !== '') {
    transition.id = persistedId
  }

  return transition
}

const serializeGuard = (guard) => ({
  type: guard.type,
  config: guard.config ?? {},
})

const deserializeGuard = (guard) => ({
  type: guard.type ?? 'form_field',
  config: guard.config ?? {},
})

// ─── Action serializers ───────────────────────────────────────────────────────

const serializeAction = (action) => ({
  type: action.type,
  trigger: action.trigger ?? 'on_enter',
  config: action.config ?? {},
})

const deserializeAction = (action) => ({
  type: action.type ?? 'notification',
  trigger: action.trigger ?? 'on_enter',
  config: action.config ?? {},
})
