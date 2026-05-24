import { DEFAULT_STEP, DEFAULT_TRANSITION } from '@/store/workflowConstants'

/**
 * flowToJson({ nodes, edges, process })
 * → Flast NoCode API payload
 *
 * {
 *   process: { name, code, description },
 *   steps: [{ id, code, label, type, description, position, actions }],
 *   transitions: [{ id, from_step, to_step, label, require_note, guards, actions }]
 * }
 */
export const flowToJson = ({ nodes, edges, process }) => ({
  process: {
    name: process.name ?? '',
    code: process.code ?? '',
    description: process.description ?? '',
  },
  steps: nodes.map((node) => ({
    id: node.id,
    code: node.data.code,
    label: node.data.label,
    type: node.data.type,
    description: node.data.description ?? '',
    position: node.position,
    actions: (node.data.actions ?? []).map(serializeAction),
  })),
  transitions: edges.map((edge) => ({
    id: edge.id,
    from_step: edge.source,
    to_step: edge.target,
    label: edge.data?.label ?? '',
    require_note: edge.data?.require_note ?? false,
    allowed_roles: edge.data?.allowed_roles ?? [],
    guards: (edge.data?.guards ?? []).map(serializeGuard),
    actions: (edge.data?.actions ?? []).map(serializeAction),
  })),
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
    name: raw.process?.name ?? 'Untitled',
    code: raw.process?.code ?? 'untitled',
    description: raw.process?.description ?? '',
  }

  const nodes = (raw.steps ?? []).map((step) => ({
    id: step.id ?? `step_${step.code}`,
    type: 'stepNode',
    position: step.position ?? { x: 0, y: 0 },
    data: {
      ...DEFAULT_STEP,
      code: step.code ?? '',
      label: step.label ?? step.code ?? '',
      type: step.type ?? 'process',
      description: step.description ?? '',
      actions: (step.actions ?? []).map(deserializeAction),
    },
  }))

  const edges = (raw.transitions ?? []).map((t) => ({
    id: t.id ?? `edge_${t.from_step}_${t.to_step}`,
    source: t.from_step,
    target: t.to_step,
    type: 'transitionEdge',
    data: {
      ...DEFAULT_TRANSITION,
      label: t.label ?? '',
      require_note: t.require_note ?? false,
      allowed_roles: t.allowed_roles ?? [],
      guards: (t.guards ?? []).map(deserializeGuard),
      actions: (t.actions ?? []).map(deserializeAction),
    },
  }))

  return { nodes, edges, process }
}

// ─── Guard serializers ────────────────────────────────────────────────────────

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