/**
 * Tất cả validation logic cho workflow.
 * Trả về mảng string lỗi — rỗng = hợp lệ.
 *
 * Không import store, nhận thẳng nodes/edges làm tham số
 * để dễ test và dùng lại ngoài React context.
 */

// ─── validateBeforeExport ─────────────────────────────────────────────────────
// Gọi trong useWorkflowExport trước khi serialize
const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const classifyStepTypeText = (value) => {
  const text = normalizeText(value)

  if (!text) return ''
  if (/\bstart\b|bat dau|buoc dau|khoi tao/.test(text)) return 'start'
  if (/\bend\b|ket thuc|buoc cuoi|khong dat|tu choi|hoan thanh/.test(text)) return 'end'
  if (/approval|duyet|phe duyet/.test(text)) return 'approval'
  if (/revision|bo sung|sua lai|tra ve/.test(text)) return 'revision'
  if (/condition|dieu kien|dat cap|dat \/ cap/.test(text)) return 'condition'
  if (/process|kiem tra|xu ly/.test(text)) return 'process'

  return text
}

export const normalizeWorkflowStepType = (type, stepTypes = [], node = {}) => {
  const raw = String(type ?? '').trim()
  const lower = raw.toLowerCase()
  const canonical = ['start', 'end', 'approval', 'revision', 'condition', 'process']

  if (canonical.includes(lower)) return lower

  const matchedStepType = stepTypes.find((stepType) => {
    const candidates = [
      stepType?.key,
      stepType?.id,
      stepType?.rawKey,
      stepType?.semanticType,
      stepType?.code,
      stepType?.type,
      stepType?.processTypeCode,
      stepType?.process_type_code,
    ]

    return candidates.some((candidate) => String(candidate ?? '') === raw)
  })

  if (matchedStepType?.semanticType && canonical.includes(matchedStepType.semanticType)) {
    return matchedStepType.semanticType
  }

  if (matchedStepType) {
    const semantic = classifyStepTypeText([
      matchedStepType.semanticType,
      matchedStepType.rawKey,
      matchedStepType.key,
      matchedStepType.code,
      matchedStepType.type,
      matchedStepType.processTypeCode,
      matchedStepType.process_type_code,
      matchedStepType.label,
      matchedStepType.name,
    ].filter(Boolean).join(' '))

    if (canonical.includes(semantic)) return semantic
  }

  const fallback = classifyStepTypeText([
    raw,
    node?.data?.typeLabel,
    node?.data?.typeName,
    node?.data?.label,
    node?.data?.name,
  ].filter(Boolean).join(' '))

  return canonical.includes(fallback) ? fallback : lower
}

const CANONICAL_STEP_TYPES = ['start', 'end', 'approval', 'revision', 'condition', 'process']

const getStepTypeMatchCandidates = (stepType) => [
  stepType?.key,
  stepType?.id,
  stepType?.rawKey,
  stepType?.code,
  stepType?.processTypeCode,
  stepType?.process_type_code,
  stepType?.typeCode,
  stepType?.type_code,
].filter((candidate) => candidate !== undefined && candidate !== null && candidate !== '')

export const isStepTypeMatch = (typeKey, stepType) => {
  const normalized = String(typeKey ?? '')
  if (!normalized || !stepType) return false
  return getStepTypeMatchCandidates(stepType).some((candidate) => String(candidate) === normalized)
}

export const resolveStepTypeConfig = (stepTypes = [], typeKey) =>
  stepTypes.find((stepType) => isStepTypeMatch(typeKey, stepType))

export const resolveNodeProcessTypeKey = (data = {}, stepTypes = []) => {
  const existing = resolveStepTypeConfig(stepTypes, data?.type)
  if (existing) return String(existing.key)

  const labelHint = data?.typeLabel ?? data?.typeName ?? data?.groupName
  if (labelHint) {
    const byLabel = stepTypes.find((stepType) => stepType?.label === labelHint)
    if (byLabel) return String(byLabel.key)
  }

  if (data?.type != null && data?.type !== '') {
    return String(data.type)
  }

  return resolveFallbackProcessTypeKey(stepTypes)
}

export const getStepSemanticType = (typeKey, stepTypes = [], node = {}) => {
  const config = resolveStepTypeConfig(stepTypes, typeKey)
  if (config?.semanticType && CANONICAL_STEP_TYPES.includes(config.semanticType)) {
    return config.semanticType
  }
  return normalizeWorkflowStepType(typeKey, stepTypes, node)
}

export const getNodeSemanticType = (node, stepTypes = []) =>
  getStepSemanticType(node?.data?.type, stepTypes, node)

export const resolveFallbackProcessTypeKey = (stepTypes = []) => {
  const processType = stepTypes.find((stepType) => stepType.semanticType === 'process')
  return processType?.key ?? 'process'
}

export const getNodeTopologyType = (node, edges = []) => {
  const hasIncoming = edges.some((edge) => edge.target === node.id)
  const hasOutgoing = edges.some((edge) => edge.source === node.id)

  if (!hasIncoming && hasOutgoing) return 'start'
  if (hasIncoming && !hasOutgoing) return 'end'
  return null
}

export const validateBeforeExport = (nodes, edges, stepTypes = []) => {
  const errors = []

  // 1. Phải có ít nhất 1 node
  if (!nodes || nodes.length === 0) {
    errors.push('Workflow chưa có step nào')
    return errors // không check thêm nếu rỗng
  }

  // 2. Phải có đúng 1 start node theo topology:
  // không có đầu vào và có ít nhất 1 đầu ra.
  const startNodes = nodes.filter((n) => getNodeTopologyType(n, edges) === 'start')
  if (startNodes.length === 0) {
    errors.push('Thiếu step bắt đầu: cần có 1 bước không có đầu vào và có đầu ra')
  } else if (startNodes.length > 1) {
    errors.push(`Có ${startNodes.length} bước bắt đầu, chỉ được có 1 bước không có đầu vào`)
  }

  // 3. Phải có ít nhất 1 end node theo topology:
  // có đầu vào và không có đầu ra.
  const endNodes = nodes.filter((n) => getNodeTopologyType(n, edges) === 'end')
  if (endNodes.length === 0) {
    errors.push('Thiếu step kết thúc: cần có ít nhất 1 bước có đầu vào và không có đầu ra')
  }

  // 4. Code không được trùng nhau
  const codes = nodes.map((n) => n.data?.code).filter(Boolean)
  const duplicateCodes = codes.filter((c, i) => codes.indexOf(c) !== i)
  if (duplicateCodes.length > 0) {
    const uniq = [...new Set(duplicateCodes)]
    errors.push(`Code bị trùng: ${uniq.join(', ')}`)
  }

  // 5. Mỗi node phải có label và code
  nodes.forEach((n) => {
    const stepName = n.data?.name ?? n.data?.label
    if (!stepName?.trim()) {
      errors.push(`Step "${n.id}" chưa có tên bước`)
    }
    if (!n.data?.code?.trim()) {
      errors.push(`Step "${stepName || n.id}" chưa có code`)
    }
  })

  // 6. Orphan nodes — node không có edge nào kết nối (trừ nếu chỉ có 1 node)
  if (nodes.length > 1) {
    const connectedIds = new Set(
      edges.flatMap((e) => [e.source, e.target])
    )
    const orphans = nodes.filter((n) => !connectedIds.has(n.id))
    if (orphans.length > 0) {
      const labels = orphans.map((n) => `"${n.data?.name || n.data?.label || n.id}"`)
      errors.push(`Step chưa kết nối: ${labels.join(', ')}`)
    }
  }

  // 7. Edge phải có source và target hợp lệ
  const nodeIds = new Set(nodes.map((n) => n.id))
  edges.forEach((e) => {
    if (!nodeIds.has(e.source)) {
      errors.push(`Transition "${e.id}" có source không tồn tại: ${e.source}`)
    }
    if (!nodeIds.has(e.target)) {
      errors.push(`Transition "${e.id}" có target không tồn tại: ${e.target}`)
    }
  })

  return errors
}

// ─── validateFlow ─────────────────────────────────────────────────────────────
// Validation đầy đủ hơn, dùng khi save lên API
// Trả về { valid: boolean, errors: string[], warnings: string[] }
export const validateFlow = (nodes, edges, stepTypes = []) => {
  const errors = validateBeforeExport(nodes, edges, stepTypes)
  const warnings = []

  // Warning: guard có config rỗng
  edges.forEach((e) => {
    ;(e.data?.guards ?? []).forEach((g, i) => {
      if (!g.config || Object.keys(g.config).length === 0) {
        warnings.push(
          `Transition "${e.data?.label || e.id}" — guard #${i + 1} (${g.type}) chưa có config`
        )
      }
    })
  })

  // Warning: action có config rỗng
  const allActions = [
    ...nodes.flatMap((n) =>
      (n.data?.actions ?? []).map((a) => ({ owner: n.data?.name || n.data?.label || n.id, action: a }))
    ),
    ...edges.flatMap((e) =>
      (e.data?.actions ?? []).map((a) => ({ owner: e.data?.label || e.id, action: a }))
    ),
  ]
  allActions.forEach(({ owner, action }) => {
    if (!action.config || Object.keys(action.config).length === 0) {
      warnings.push(`"${owner}" — action "${action.type}" chưa có config`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ─── checkOrphanNodes ─────────────────────────────────────────────────────────
// Trả về array node chưa kết nối — dùng để highlight trong canvas
export const checkOrphanNodes = (nodes, edges) => {
  if (nodes.length <= 1) return []
  const connectedIds = new Set(edges.flatMap((e) => [e.source, e.target]))
  return nodes.filter((n) => !connectedIds.has(n.id))
}

// ─── slugifyCode ──────────────────────────────────────────────────────────────
// Chuẩn hóa code: lowercase, thay khoảng trắng/ký tự đặc biệt bằng _
export const slugifyCode = (str) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')         // trim _
