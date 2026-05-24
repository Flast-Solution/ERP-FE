/**
 * Tất cả validation logic cho workflow.
 * Trả về mảng string lỗi — rỗng = hợp lệ.
 *
 * Không import store, nhận thẳng nodes/edges làm tham số
 * để dễ test và dùng lại ngoài React context.
 */

// ─── validateBeforeExport ─────────────────────────────────────────────────────
// Gọi trong useWorkflowExport trước khi serialize
export const validateBeforeExport = (nodes, edges) => {
  const errors = []

  // 1. Phải có ít nhất 1 node
  if (!nodes || nodes.length === 0) {
    errors.push('Workflow chưa có step nào')
    return errors // không check thêm nếu rỗng
  }

  // 2. Phải có đúng 1 start node
  const startNodes = nodes.filter((n) => n.data?.type === 'start')
  if (startNodes.length === 0) {
    errors.push('Thiếu step kiểu "start"')
  } else if (startNodes.length > 1) {
    errors.push(`Có ${startNodes.length} step kiểu "start", chỉ được có 1`)
  }

  // 3. Phải có ít nhất 1 end node
  const endNodes = nodes.filter((n) => n.data?.type === 'end')
  if (endNodes.length === 0) {
    errors.push('Thiếu step kiểu "end"')
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
    if (!n.data?.label?.trim()) {
      errors.push(`Step "${n.id}" chưa có label`)
    }
    if (!n.data?.code?.trim()) {
      errors.push(`Step "${n.data?.label || n.id}" chưa có code`)
    }
  })

  // 6. Orphan nodes — node không có edge nào kết nối (trừ nếu chỉ có 1 node)
  if (nodes.length > 1) {
    const connectedIds = new Set(
      edges.flatMap((e) => [e.source, e.target])
    )
    const orphans = nodes.filter((n) => !connectedIds.has(n.id))
    if (orphans.length > 0) {
      const labels = orphans.map((n) => `"${n.data?.label || n.id}"`)
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
export const validateFlow = (nodes, edges) => {
  const errors = validateBeforeExport(nodes, edges)
  const warnings = []

  // Warning: start node có edge đi vào
  const startNode = nodes.find((n) => n.data?.type === 'start')
  if (startNode) {
    const hasIncoming = edges.some((e) => e.target === startNode.id)
    if (hasIncoming) {
      warnings.push(`Step "start" (${startNode.data?.label}) đang có edge đi vào — thường không nên có`)
    }
  }

  // Warning: end node có edge đi ra
  const endNodes = nodes.filter((n) => n.data?.type === 'end')
  endNodes.forEach((n) => {
    const hasOutgoing = edges.some((e) => e.source === n.id)
    if (hasOutgoing) {
      warnings.push(`Step "end" (${n.data?.label}) đang có edge đi ra — thường không nên có`)
    }
  })

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
      (n.data?.actions ?? []).map((a) => ({ owner: n.data?.label || n.id, action: a }))
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
