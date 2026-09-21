import { RequestUtils } from '@flast-erp/core/utils'
import { DEFAULT_STEP, DEFAULT_TRANSITION } from '@/store/workflowConstants'
import {
  getNodeTopologyType,
  isWorkflowStepHidden,
  normalizeWorkflowStepType,
  resolveNodeProcessTypeKey,
} from './workflowValidators'

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

const normalizeStepConfig = (config) => {
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    return config
  }
  if (typeof config !== 'string' || !config.trim()) return {}

  try {
    const parsed = JSON.parse(config)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch (_) {
    return {}
  }
}

const sanitizeStepConfig = (config) => Object.fromEntries(
  Object.entries(normalizeStepConfig(config)).filter(([key]) => (
    key !== 'saveSubmitLog' && key !== 'assigneeId'
  )),
)

const normalizeStepButtons = (value) => {
  let buttons = value
  if (typeof buttons === 'string' && buttons.trim()) {
    try {
      buttons = JSON.parse(buttons)
    } catch (_) {
      buttons = []
    }
  }
  if (!Array.isArray(buttons)) return []

  // GET find-id buttons: id, label, type, targetStepCode, style, requireSubmission, order
  return buttons.map((button, index) => ({
    id: button?.id ?? `button_${index + 1}`,
    label: button?.label ?? `Button ${index + 1}`,
    type: button?.type ?? 'TRANSITION',
    targetStepCode: button?.targetStepCode ?? null,
    style: button?.style ?? 'DEFAULT',
    requireSubmission: button?.requireSubmission ?? false,
    order: button?.order ?? index,
  }))
}

/** find-id steps[].actions */
const getStepActions = (step = {}) => (
  Array.isArray(step.actions) ? step.actions : []
)

/** find-id transitions[].guards */
const getTransitionGuards = (transition = {}) => (
  Array.isArray(transition.guards) ? transition.guards : []
)

/** Transition actions not present on find-id; keep empty unless FE edge has them. */
const getTransitionActions = (transition = {}) => (
  Array.isArray(transition.actions) ? transition.actions : []
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
  const hiddenTargetCodes = new Set(
    nodes.flatMap(node => (node?.data?.buttons ?? []))
      .filter(button => button?.type === 'OPEN_HIDDEN_STEP')
      .map(button => String(button?.targetStepCode ?? '').trim())
      .filter(Boolean),
  )
  const normalizedNodes = nodes.map(node => {
    const referencedAsHidden = hiddenTargetCodes.has(String(node?.data?.code ?? ''))
      || hiddenTargetCodes.has(String(node?.id ?? ''))
    return referencedAsHidden && !isWorkflowStepHidden(node)
      ? { ...node, data: { ...node.data, hidden: true } }
      : node
  })
  const stepCodeByNodeId = nodes.reduce((map, node) => {
    map.set(node.id, node.data?.code ?? node.id)
    return map
  }, new Map())

  return {
    process: serializeProcess(process),
    steps: normalizedNodes.map((node, index) => serializeStep(node, index, stepTypes, edges)),
    transitions: edges.map((edge, index) =>
      serializeTransition(edge, index, stepCodeByNodeId)
    ),
  }
}

/**
 * jsonToFlow(raw)
 * → { nodes, edges, process } để loadFlow() của store nhận
 *
 * raw = data từ GET /workflow/process/find-id/{id}: { process, steps, transitions }
 */
const getStepProcessTypeRef = (step = {}) => (
  step.label != null && String(step.label).trim() !== ''
    ? String(step.label)
    : null
)

export const enrichFlowStepTypes = (flow, stepTypes = []) => {
  if (!flow || !Array.isArray(flow.nodes) || stepTypes.length === 0) {
    return flow
  }

  return {
    ...flow,
    nodes: flow.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        type: resolveNodeProcessTypeKey(node.data, stepTypes),
      },
    })),
  }
}

export const jsonToFlow = (raw, stepTypes = []) => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Dữ liệu không hợp lệ')
  }

  const process = normalizeProcess(raw.process ?? {})

  const rawNodes = (raw.steps ?? []).map((step) => {
    const stepCode = step.stepCode ?? ''
    const name = step.name ?? stepCode
    const typeValue = getStepProcessTypeRef(step)
    const nodeId = getStepNodeId(step)
    const rawConfig = normalizeStepConfig(step.config)
    const nodeData = {
        ...DEFAULT_STEP,
        id: step.id ?? null,
        persistedId: step.id ?? null,
        processId: step.processId ?? null,
        code: stepCode,
        name,
        label: name,
        type: typeValue != null ? typeValue : normalizeStepType(step.type ?? 'process'),
        typeLabel: '',
        description: step.description ?? '',
        sortOrder: step.sortOrder ?? null,
        enabled: step.enabled ?? true,
        hidden: isWorkflowStepHidden(step.hidden ?? false),
        buttons: normalizeStepButtons(step.buttons),
        config: sanitizeStepConfig(rawConfig),
        saveSubmitLog: step.saveSubmitLog ?? false,
        forms: normalizeStepForms(step),
        actions: getStepActions(step).map(deserializeAction),
    }

    return {
      id: nodeId,
      type: 'stepNode',
      position: step.position ?? { x: 0, y: 0 },
      data: {
        ...nodeData,
        type: resolveNodeProcessTypeKey(nodeData, stepTypes),
      },
    }
  })

  const hiddenTargetCodes = new Set(
    rawNodes.flatMap(node => (node?.data?.buttons ?? []))
      .filter(button => button?.type === 'OPEN_HIDDEN_STEP')
      .map(button => String(button?.targetStepCode ?? '').trim())
      .filter(Boolean),
  )
  const nodes = rawNodes.map(node => {
    const referencedAsHidden = hiddenTargetCodes.has(String(node?.data?.code ?? ''))
      || hiddenTargetCodes.has(String(node?.id ?? ''))
    return referencedAsHidden
      ? { ...node, data: { ...node.data, hidden: true } }
      : node
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
        label: '',
        // FE store key; API field is requireNote
        require_note: t.requireNote ?? false,
        allowed_roles: normalizeRolesToArray(t.allowedRoles ?? ''),
        conditions: Array.isArray(t.conditions) ? t.conditions : [],
        autoEvaluate: t.autoEvaluate ?? false,
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
  if (step.stepCode) return String(step.stepCode)
  if (step.id != null) return `step_${step.id}`
  return `step_${Math.random().toString(36).slice(2, 8)}`
}

export const getAttachedFormId = (form) => {
  if (form == null || form === '') return null
  if (typeof form === 'number' || typeof form === 'string') return form
  return form.id ?? form.templateId ?? null
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
  const formKey = form.name ?? form.formKey ?? ''
  const name = (form.description ?? '').trim()
    || formKey
    || (id != null ? `Form #${id}` : 'Form')

  return {
    ...form,
    id,
    name,
    formKey,
    domain: form.domain ?? '',
    fields,
    required: form.required ?? false,
  }
}

export const getFormDisplayName = (form) => normalizeAttachedForm(form)?.name ?? 'Form'

/** find-id: form = template id, formTemplate = template object */
const normalizeStepForms = (step = {}) => {
  if (step.formTemplate && typeof step.formTemplate === 'object' && !Array.isArray(step.formTemplate)) {
    return [normalizeAttachedForm({
      ...step.formTemplate,
      id: step.form ?? step.formTemplate.id,
    })].filter(Boolean)
  }
  if (step.form != null && step.form !== '') {
    return [normalizeAttachedForm(step.form)].filter(Boolean)
  }
  return []
}

/** POST /workflow/forms/template/find-template-field → data = Template[] */
const getTemplateFieldList = (response) => {
  const items = response?.data
  return Array.isArray(items) ? items : []
}

/** GET /workflow/forms/template/find-id → data = Template */
const getTemplateDetail = (response) => {
  const item = response?.data
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null
  return item
}

const buildTemplateMetaMap = (items = []) => {
  const map = new Map()

  items.forEach((item) => {
    const templateId = getAttachedFormId(item)
    if (templateId == null || templateId === '') return

    const fields = Array.isArray(item.fields) ? item.fields : []
    const formKey = item.name ?? ''
    const name = (item.description ?? '').trim() || formKey || `Form #${templateId}`

    map.set(String(templateId), {
      id: templateId,
      name,
      description: item.description ?? '',
      formKey,
      domain: item.domain ?? '',
      fields,
    })
  })

  return map
}

const fetchTemplateMeta = async (templateId) => {
  try {
    const response = await RequestUtils.Get('/workflow/forms/template/find-id', { id: templateId })
    const item = getTemplateDetail(response)
    if (!item) return null

    const fields = Array.isArray(item.fields) ? item.fields : []
    const formKey = item.name ?? ''
    const name = (item.description ?? '').trim() || formKey || `Form #${templateId}`

    return {
      id: templateId,
      name,
      description: item.description ?? '',
      formKey,
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
    const metaMap = buildTemplateMetaMap(getTemplateFieldList(response))

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

/** find-id transitions: fromStepCode / toStepCode */
const getTransitionStepRef = (transition = {}, direction) => {
  const value = direction === 'from'
    ? transition.fromStepCode
    : transition.toStepCode
  return value != null && value !== '' ? String(value) : ''
}

/** ProcessUpdateItem fields inside listStatus string: listStepProcessId, text, color */
const normalizeStatusConfiguration = (item = {}) => ({
  stepProcessIds: Array.isArray(item.listStepProcessId)
    ? item.listStepProcessId
    : (Array.isArray(item.stepProcessIds) ? item.stepProcessIds : []),
  statusName: item.text ?? item.statusName ?? '',
  scope: item.scope ?? 'current',
  color: item.color ?? null,
})

export const normalizeProcessStatusConfigurations = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeStatusConfiguration)
  }

  if (value && typeof value === 'object') {
    const items = Array.isArray(value.items) ? value.items : []
    return items.map(normalizeStatusConfiguration)
  }

  if (typeof value !== 'string' || !value.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    return normalizeProcessStatusConfigurations(parsed)
  } catch (_) {
    const configurations = []
    const itemPattern = /ProcessUpdateItem\[listStepProcessId=\[([^\]]*)\],\s*text=([\s\S]*?),\s*color=([^\]]*)\]/g
    let match = itemPattern.exec(value)

    while (match) {
      const stepProcessIds = match[1]
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => {
          const numberValue = Number(item)
          return Number.isSafeInteger(numberValue) ? numberValue : item
        })
      const rawColor = match[3].trim()

      configurations.push({
        stepProcessIds,
        statusName: match[2].trim(),
        scope: 'current',
        color: rawColor === 'null' ? null : rawColor,
      })
      match = itemPattern.exec(value)
    }

    return configurations
  }
}

/** find-id data.process — status mapping lives in listStatus (string or structured) */
const normalizeProcess = (process = {}) => ({
  ...process,
  id: process?.id ?? null,
  processKey: process?.processKey ?? '',
  name: process?.name ?? 'Untitled',
  code: process?.code ?? '',
  description: process?.description ?? '',
  flowType: process?.flowType ?? '',
  enabled: process?.enabled ?? true,
  statusConfigurations: normalizeProcessStatusConfigurations(
    Array.isArray(process?.statusConfigurations) && process.statusConfigurations.length > 0
      ? process.statusConfigurations
      : process?.listStatus,
  ),
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
    flowType: process.flowType,
    bizId: process.bizId,
    createdBy: process.createdBy,
    updatedBy: process.updatedBy,
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
    hidden: isWorkflowStepHidden(node),
    buttons: normalizeStepButtons(node.data?.buttons).map((button, buttonIndex) => ({
      ...button,
      order: button.order ?? buttonIndex,
    })),
    config: sanitizeStepConfig(node.data?.config),
    saveSubmitLog: node.data?.saveSubmitLog ?? false,
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
    // FE store: allowed_roles / require_note → API: allowedRoles / requireNote
    allowedRoles: serializeAllowedRoles(edge.data?.allowed_roles ?? edge.data?.allowedRoles ?? []),
    requireNote: edge.data?.require_note ?? edge.data?.requireNote ?? false,
    conditions: edge.data?.conditions ?? [],
    autoEvaluate: edge.data?.autoEvaluate ?? false,
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
  // FE store uses type; API uses guardType
  const guardType = guard.guardType ?? guard.type ?? 'field_value'
  const errorMessage = guard.errorMessage ?? guard.config?.message ?? ''
  const baseConfig = guard.config ?? {}
  const config = guardType === 'field_value'
    ? { ...baseConfig, message: errorMessage }
    : baseConfig

  return {
    ...(guard.id != null && guard.id !== '' ? { id: guard.id } : {}),
    guardType,
    config,
    errorMessage,
    sortOrder: guard.sortOrder ?? index + 1,
    enabled: guard.enabled ?? true,
  }
}

const deserializeGuard = (guard) => ({
  id: guard.id ?? null,
  type: guard.guardType ?? 'field_value',
  config: guard.config ?? {},
  errorMessage: guard.errorMessage ?? guard.config?.message ?? '',
  sortOrder: guard.sortOrder ?? null,
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
  // FE store: type; API: actionType
  const actionType = toApiActionType(action.actionType ?? action.type ?? 'send_notification')
  const config = sanitizeActionConfig(action.config ?? {})
  const isAsync = action.isAsync ?? action.config?.async ?? true
  const sortOrder = action.sortOrder ?? index + 1
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
  type: fromApiActionType(action.actionType ?? 'notification'),
  trigger: normalizeTrigger(action.trigger),
  config: action.config ?? {},
  isAsync: action.isAsync ?? true,
  sortOrder: action.sortOrder ?? null,
  enabled: action.enabled ?? true,
})
