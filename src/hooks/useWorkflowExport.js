import { useCallback } from 'react'
import { message } from 'antd'
import useWorkflowStore from '@/store/workflowStore'
import { flowToJson, jsonToFlow } from '@/utils/workflowSerializer'
import { validateBeforeExport } from '@/utils/workflowValidators'

/**
 * Export / Import workflow giữa ReactFlow format và Flast NoCode API format.
 *
 * Usage:
 *   const { exportJSON, importJSON, downloadJSON } = useWorkflowExport()
 */
const useWorkflowExport = () => {
  const nodes = useWorkflowStore((s) => s.nodes)
  const edges = useWorkflowStore((s) => s.edges)
  const process = useWorkflowStore((s) => s.process)
  const loadFlow = useWorkflowStore((s) => s.loadFlow)

  // ── Export: ReactFlow state → Flast NoCode JSON object ───────────────────────
  const exportJSON = useCallback(() => {
    const errors = validateBeforeExport(nodes, edges)
    if (errors.length > 0) {
      errors.forEach((e) => message.warning(e))
      return null
    }
    return flowToJson({ nodes, edges, process })
  }, [nodes, edges, process])

  // ── Download file .json ───────────────────────────────────────────────────────
  const downloadJSON = useCallback(() => {
    const json = exportJSON()
    if (!json) return

    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${process.code || 'workflow'}.json`
    a.click()
    URL.revokeObjectURL(url)
    message.success('Đã tải xuống file JSON')
  }, [exportJSON, process.code])

  // ── Import: đọc File object → load vào store ─────────────────────────────────
  const importJSON = useCallback(
    (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
          try {
            const raw = JSON.parse(e.target.result)
            const flow = jsonToFlow(raw)
            loadFlow(flow)
            message.success('Import thành công')
            resolve(flow)
          } catch (err) {
            message.error(`Import thất bại: ${err.message}`)
            reject(err)
          }
        }

        reader.onerror = () => {
          message.error('Không đọc được file')
          reject(new Error('FileReader error'))
        }

        reader.readAsText(file)
      })
    },
    [loadFlow]
  )

  // ── Copy JSON ra clipboard ────────────────────────────────────────────────────
  const copyJSON = useCallback(async () => {
    const json = exportJSON()
    if (!json) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2))
      message.success('Đã copy JSON vào clipboard')
    } catch {
      message.error('Không copy được, thử download thay thế')
    }
  }, [exportJSON])

  return {
    exportJSON,
    downloadJSON,
    importJSON,
    copyJSON,
  }
}

export default useWorkflowExport