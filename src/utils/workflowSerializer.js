import { RequestUtils } from '@flast-erp/core/utils'
import { DEFAULT_STEP, DEFAULT_TRANSITION } from '@/store/workflowConstants'
import { getNodeTopologyType, normalizeWorkflowStepType } from './workflowValidators'

const normalizeTrigger = (trigger) =>
  trigger == null || trigger === '' ? 'on_enter' : String(trigger).toLowerCase()

const normalizeStepType = (type, stepTypes = [], node = {}) =>
  normalizeWorkflowStepType(type, stepTypes, node)

const toApiStepType = (type, stepTypes = [], node = {}) =>
  normalizeStepType(type, stepTypes, node).toUpperCase()

const normalizeRolesToArray = (roles) => {
  if (Array.isArray(roles)) return roles
  if (typeof roles === 'string') {
    return roles.split(',').map((role) => role.trim()).filter(Boolean)
  }
  return []
}

const firstArray = (...values) => values.find(Array.isArray) ?? []

const getStepActions = (step = {}) => firstArray(
  step.actions,
  step.stepActions,
  step.step_actions,
  step.onEnterActions,
  step.on_enter_actions,
  step.onExitActions,
  step.on_exit_actions,
)

const getTransitionGuards = (transition = {}) => firstArray(
  transition.guards,
  transition.transitionGuards,
  transition.transition_guards,
  transition.guardList,
  transition.guard_list,
)

const getTransitionActions = (transition = {}) => firstArray(
  transition.actions,
  transition.transitionActions,
  transition.transition_actions,
)

const serializeAllowedRoles = (roles) => {
  if (Array.isArray(roles)) return roles.filter(Boolean).join(',')
  return roles ?? ''
}

/**
 * flowToJson({ nodes, edges, process })
 * → Flast NoCode API payload
 *
 * {
 *   process: { processKey, name, description },
 *   steps: [{ stepCode, name, label, type, description, position, form, actions }],
 *   transitions: [{ fromStepCode, toStepCode, allowedRoles, requireNote, guards }]
 * }
 */
export const flowToJson = ({ nodes, edges, process, stepTypes = [] }) => {
  const stepCodeByNodeId = nodes.reduce((map, node) => {
    map.set(node.id, node.data?.code ?? node.id)
    return map
  }, new Map())

  return {
    process: serializeProcess(process),
    steps: nodes.map((node, index) => serializeStep(node, index, stepTypes, edges)),
    transitions: edges.map((edge, index) =>
      serializeTransition(edge, index, stepCodeByNodeId)
    ),
  }
}

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

  const process = normalizeProcess({
    ...(raw.process ?? {}),
    id: raw.process?.id ?? raw.id ?? raw.processId ?? raw.process_id ?? null,
  })

  const nodes = (raw.steps ?? []).map((step) => {
    const stepCode = step.code ?? step.stepCode ?? step.step_code ?? ''
    const name = step.name ?? step.displayName ?? step.display_name ?? step.stepName ?? step.step_name ?? stepCode
    const typeValue = step.label
      ?? step.processTypeCode
      ?? step.process_type_code
      ?? step.groupCode
      ?? step.group_code
      ?? step.type
      ?? 'process'
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
        name,
        label: name,
        type: typeValue != null && typeValue !== '' ? String(typeValue) : normalizeStepType(step.type ?? 'process'),
        typeLabel: step.typeLabel ?? step.type_label ?? step.groupName ?? step.group_name ?? '',
        description: step.description ?? '',
        sortOrder: step.sortOrder ?? step.sort_order ?? null,
        enabled: step.enabled ?? true,
        forms: normalizeStepForms(step),
        actions: getStepActions(step).map(deserializeAction),
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
        allowed_roles: normalizeRolesToArray(t.allowed_roles ?? t.allowedRoles ?? []),
        conditions: t.conditions ?? [],
        autoEvaluate: t.autoEvaluate ?? t.auto_evaluate ?? false,
        priority: t.priority ?? 0,
        enabled: t.enabled ?? true,
        guards: getTransitionGuards(t).map(deserializeGuard),
        actions: getTransitionActions(t).map(deserializeAction),
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

export const getAttachedFormId = (form) => {
  if (form == null || form === '') return null
  if (typeof form === 'number' || typeof form === 'string') return form
  return form.id
    ?? form.templateId
    ?? form.template_id
    ?? form.formTemplateId
    ?? form.form_template_id
    ?? form.formId
    ?? form.form_id
    ?? null
}

export const normalizeAttachedForm = (form) => {
  if (form == null || form === '') return null

  if (typeof form === 'number' || typeof form === 'string') {
    const id = form
    return {
      id,
      name: `Form #${id}`,
      formKey: '',
      domain: '',
      fields: [],
      required: false,
    }
  }

  const id = getAttachedFormId(form)
  const fields = Array.isArray(form.fields) ? form.fields : []
  const name = (form.description ?? '').trim()
    || (form.name ?? '').trim()
    || form.label
    || form.formKey
    || (id != null ? `Form #${id}` : 'Form')

  return {
    ...form,
    id,
    name,
    formKey: form.name ?? form.formKey ?? form.key ?? '',
    domain: form.domain ?? '',
    fields,
    required: form.required ?? false,
  }
}

export const getFormDisplayName = (form) => normalizeAttachedForm(form)?.name ?? 'Form'

const normalizeStepForms = (step = {}) => {
  const forms = step.forms
    ?? step.formTemplates
    ?? step.form_templates
    ?? (step.form != null && step.form !== '' ? [step.form] : [])
  if (!Array.isArray(forms)) return []
  return forms.map(normalizeAttachedForm).filter(Boolean)
}

const getResponseArray = (response) => {
  const data = response?.data ?? response
  const candidates = [data?.items, data?.rows, data?.embedded, data?.data, data]
  return candidates.find(Array.isArray) ?? []
}

const buildTemplateMetaMap = (items = []) => {
  const map = new Map()

  items.forEach((item) => {
    const templateId = getAttachedFormId(item)
    if (templateId == null || templateId === '') return

    const fields = Array.isArray(item.fields) ? item.fields : []
    const name = (item.description ?? '').trim()
      || (item.name ?? '').trim()
      || item.label
      || `Form #${templateId}`

    map.set(String(templateId), {
      id: templateId,
      name,
      description: item.description ?? '',
      formKey: item.name ?? item.formKey ?? '',
      domain: item.domain ?? '',
      fields,
    })
  })

  return map
}

const fetchTemplateMeta = async (templateId) => {
  try {
    const response = await RequestUtils.Get('/workflow/forms/template/find-id', { id: templateId })
    const item = response?.data ?? response
    if (!item || typeof item !== 'object') return null

    const fields = Array.isArray(item.fields) ? item.fields : []
    const name = (item.description ?? '').trim()
      || (item.name ?? '').trim()
      || item.label
      || `Form #${templateId}`

    return {
      id: templateId,
      name,
      description: item.description ?? '',
      formKey: item.name ?? item.formKey ?? '',
      domain: item.domain ?? '',
      fields,
    }
  } catch (error) {
    console.warn('[workflowSerializer] fetchTemplateMeta failed', templateId, error)
    return null
  }
}

/**
 * Sau khi jsonToFlow, gọi hàm này để lấy tên form từ API
 * (payload lưu forms chỉ còn id).
 */
export const enrichWorkflowForms = async (flow) => {
  const nodes = flow?.nodes ?? []
  const formIds = new Set()

  nodes.forEach((node) => {
    (node.data?.forms ?? []).forEach((form) => {
      const id = getAttachedFormId(form)
      if (id != null && id !== '') {
        formIds.add(String(id))
      }
    })
  })

  if (formIds.size === 0) {
    return flow
  }

  try {
    const response = await RequestUtils.Post(
      '/workflow/forms/template/find-template-field',
      Array.from(formIds),
    )
    const metaMap = buildTemplateMetaMap(getResponseArray(response))

    const missingIds = Array.from(formIds).filter((id) => !metaMap.has(String(id)))
    if (missingIds.length > 0) {
      const details = await Promise.all(missingIds.map(fetchTemplateMeta))
      details.filter(Boolean).forEach((meta) => {
        metaMap.set(String(meta.id), meta)
      })
    }

    if (metaMap.size === 0) {
      return flow
    }

    const enrichedNodes = nodes.map((node) => {
      const forms = node.data?.forms ?? []
      if (!forms.length) return node

      const nextForms = forms.map((form) => {
        const id = getAttachedFormId(form)
        const meta = id != null ? metaMap.get(String(id)) : null
        if (!meta) return normalizeAttachedForm(form)

        return normalizeAttachedForm({
          ...form,
          ...meta,
          required: form.required ?? meta.required ?? false,
        })
      })

      return { ...node, data: { ...node.data, forms: nextForms } }
    })

    return { ...flow, nodes: enrichedNodes }
  } catch (error) {
    console.warn('[workflowSerializer] enrichWorkflowForms failed', error)
    return flow
  }
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

const normalizeProcess = (process = {}) => ({
  ...process,
  id: process?.id ?? null,
  processKey: process?.processKey ?? process?.process_key ?? process?.key ?? process?.code ?? '',
  name: process?.name ?? 'Untitled',
  code: process?.code ?? process?.processKey ?? process?.process_key ?? 'untitled',
  description: process?.description ?? '',
  flowType: process?.flowType ?? process?.flow_type ?? '',
})

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

const serializeFormId = (forms = []) => {
  const form = forms[0]
  const id = getAttachedFormId(form)
  if (id == null || id === '') return null

  const numericId = Number(id)
  return Number.isInteger(numericId) ? numericId : null
}

const serializeProcess = (process = {}) => {
  const payload = {
    ...(process.id != null && process.id !== '' ? { id: process.id } : {}),
    processKey: process.processKey ?? process.code ?? '',
    name: process.name ?? '',
    description: process.description ?? '',
    enabled: process.enabled ?? true,
    status: Number(process.status ?? 1) === 1 ? 1 : 0,
  }

  const optionalFields = {
    flowType: process.flowType ?? process.flow_type,
    bizId: process.bizId ?? process.biz_id,
    createdBy: process.createdBy ?? process.created_by,
    updatedBy: process.updatedBy ?? process.updated_by,
  }

  Object.entries(optionalFields).forEach(([field, value]) => {
    if (value != null && value !== '') {
      payload[field] = value
    }
  })

  return payload
}

const serializeStep = (node, index, stepTypes = [], edges = []) => {
  const persistedId = node.data?.persistedId ?? node.data?.id
  const topologyType = getNodeTopologyType(node, edges)
  const stepTypeValue = node.data?.type ?? topologyType ?? 'process'
  const name = node.data?.name ?? node.data?.label ?? node.data?.code ?? node.id
  const step = {
    ...(persistedId != null && persistedId !== '' ? { id: persistedId } : {}),
    stepCode: node.data?.code ?? node.id,
    name,
    label: stepTypeValue,
    type: toApiStepType(topologyType ?? node.data?.type, stepTypes, node),
    description: node.data?.description ?? '',
    position: node.position,
    sortOrder: node.data?.sortOrder ?? index,
    enabled: node.data?.enabled ?? true,
    form: serializeFormId(node.data?.forms ?? []),
    actions: (node.data?.actions ?? []).map(serializeAction),
  }

  return step
}

const serializeTransition = (edge, index, stepCodeByNodeId = new Map()) => {
  const fromStepCode = stepCodeByNodeId.get(edge.source) ?? edge.source
  const toStepCode = stepCodeByNodeId.get(edge.target) ?? edge.target

  const transition = {
    fromStepCode,
    toStepCode,
    allowedRoles: serializeAllowedRoles(edge.data?.allowed_roles ?? edge.data?.allowedRoles ?? []),
    requireNote: edge.data?.require_note ?? edge.data?.requireNote ?? false,
    conditions: edge.data?.conditions ?? [],
    autoEvaluate: edge.data?.autoEvaluate ?? edge.data?.auto_evaluate ?? false,
    priority: edge.data?.priority ?? index,
    enabled: edge.data?.enabled ?? true,
    guards: (edge.data?.guards ?? []).map(serializeGuard),
  }

  const persistedId = getPersistedTransitionId(edge)
  if (persistedId != null && persistedId !== '') {
    transition.id = persistedId
  }

  return transition
}

const serializeGuard = (guard, index) => {
  const guardType = guard.type ?? guard.guardType ?? 'field_value'
  const errorMessage = guard.errorMessage ?? guard.error_message ?? guard.config?.message ?? ''
  const baseConfig = guard.config ?? {}
  const config = guardType === 'field_value'
    ? { ...baseConfig, message: errorMessage }
    : baseConfig

  return {
    ...(guard.id != null && guard.id !== '' ? { id: guard.id } : {}),
    guardType,
    config,
    errorMessage,
    sortOrder: guard.sortOrder ?? guard.sort_order ?? index + 1,
    enabled: guard.enabled ?? true,
  }
}

const deserializeGuard = (guard) => ({
  id: guard.id ?? null,
  type: guard.type ?? guard.guardType ?? guard.guard_type ?? 'field_value',
  config: guard.config ?? {},
  errorMessage: guard.errorMessage ?? guard.error_message ?? guard.config?.message ?? '',
  sortOrder: guard.sortOrder ?? guard.sort_order ?? null,
  enabled: guard.enabled ?? true,
})

// ─── Action serializers ───────────────────────────────────────────────────────

const toApiActionType = (type) => {
  if (type === 'notification') return 'send_notification'
  if (type === 'task') return 'create_task'
  return type
}

const fromApiActionType = (type) => {
  if (type === 'send_notification') return 'notification'
  if (type === 'create_task') return 'task'
  return type
}

const sanitizeActionConfig = (config = {}) => {
  const {
    async: _async,
    display_name: _displayName,
    ...rest
  } = config

  return rest
}

const serializeAction = (action, index) => {
  const trigger = normalizeTrigger(action.trigger)
  const actionType = toApiActionType(action.type ?? action.actionType ?? action.action_type ?? 'send_notification')
  const config = sanitizeActionConfig(action.config ?? {})
  const isAsync = action.isAsync ?? action.is_async ?? action.config?.async ?? true
  const sortOrder = action.sortOrder ?? action.sort_order ?? index + 1
  const enabled = action.enabled ?? true

  return {
    ...(action.id != null && action.id !== '' ? { id: action.id } : {}),
    trigger,
    actionType,
    config,
    isAsync,
    sortOrder,
    enabled,
  }
}

const deserializeAction = (action) => ({
  id: action.id ?? null,
  type: fromApiActionType(action.type ?? action.actionType ?? action.action_type ?? 'notification'),
  trigger: normalizeTrigger(action.trigger),
  config: action.config ?? {},
  isAsync: action.isAsync ?? action.is_async ?? true,
  sortOrder: action.sortOrder ?? action.sort_order ?? null,
  enabled: action.enabled ?? true,
})
