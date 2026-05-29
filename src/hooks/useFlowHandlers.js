import { useCallback, useRef } from 'react'
import { useReactFlow } from 'reactflow'
import {
  useAddNode,
  useSetSelected,
  useClearSelected,
  useDeleteNode,
  useDeleteEdge,
} from '@/hooks/useWorkflowStore'

/**
 * Tập hợp tất cả event handler cho ReactFlow canvas.
 * FlowCanvas.js chỉ cần gọi hook này, không giữ logic nào.
 *
 * Usage:
 *   const handlers = useFlowHandlers()
 *   <ReactFlow
 *     onDrop={handlers.onDrop}
 *     onDragOver={handlers.onDragOver}
 *     onNodeClick={handlers.onNodeClick}
 *     onEdgeClick={handlers.onEdgeClick}
 *     onPaneClick={handlers.onPaneClick}
 *     onKeyDown={handlers.onKeyDown}
 *   />
 */
const useFlowHandlers = () => {
  const { screenToFlowPosition } = useReactFlow()
  const addNode = useAddNode()
  const setSelected = useSetSelected()
  const clearSelected = useClearSelected()
  const deleteNode = useDeleteNode()
  const deleteEdge = useDeleteEdge()

  // Ref giữ selectedId/Type mới nhất để dùng trong keyDown mà không cần subscribe
  const selectedRef = useRef({ id: null, type: null })

  // ── Drop: kéo StepTypeItem từ StepPanel thả vào canvas ──────────────────────
  const onDrop = useCallback(
    (event) => {
      event.preventDefault()
      const stepType = event.dataTransfer.getData('application/workflow-step-type')
      if (!stepType) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      addNode(position, stepType)
    },
    [screenToFlowPosition, addNode]
  )

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // ── Click node ───────────────────────────────────────────────────────────────
  const onNodeClick = useCallback(
    (_, node) => {
      setSelected(node.id, 'node')
      selectedRef.current = { id: node.id, type: 'node' }
    },
    [setSelected]
  )

  // ── Click edge ───────────────────────────────────────────────────────────────
  const onEdgeClick = useCallback(
    (_, edge) => {
      setSelected(edge.id, 'edge')
      selectedRef.current = { id: edge.id, type: 'edge' }
    },
    [setSelected]
  )

  // ── Click pane (nền) → bỏ chọn ───────────────────────────────────────────────
  const onPaneClick = useCallback(() => {
    clearSelected()
    selectedRef.current = { id: null, type: null }
  }, [clearSelected])

  // ── Delete key → xoá item đang chọn ──────────────────────────────────────────
  const onKeyDown = useCallback(
    (event) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      // Không xoá khi đang focus vào input / textarea
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return

      const { id, type } = selectedRef.current
      if (!id) return

      if (type === 'node') deleteNode(id)
      if (type === 'edge') deleteEdge(id)

      selectedRef.current = { id: null, type: null }
    },
    [deleteNode, deleteEdge]
  )

  return {
    onDrop,
    onDragOver,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    onKeyDown,
  }
}

export default useFlowHandlers
