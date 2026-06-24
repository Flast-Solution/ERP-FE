import { useCallback, useRef } from 'react'
import { useReactFlow } from 'reactflow'
import { message } from 'antd'
import {
  useAddNode,
  useSetSelected,
  useClearSelected,
  useDeleteNode,
  useDeleteEdge,
} from '@/hooks/useWorkflowStore'
import useWorkflowStore from '@/store/workflowStore'
import { getNodeSemanticType, getStepSemanticType } from '@/utils/workflowValidators'

/*
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
  const getNodes = () => useWorkflowStore.getState().nodes

  /* Ref giữ selectedId/Type mới nhất để dùng trong keyDown */
  const selectedRef = useRef({ id: null, type: null })

  /* ── Drop: kéo StepTypeItem từ StepPanel thả vào canvas ── */
  const onDrop = useCallback(
    (event) => {
      event.preventDefault()
      const stepTypeKey = event.dataTransfer.getData('application/workflow-step-type')
      if (!stepTypeKey) {
        return
      }

      const nodes = getNodes()
      const stepTypes = useWorkflowStore.getState().stepTypes
      const droppedSemantic = getStepSemanticType(stepTypeKey, stepTypes)

      /* Cảnh báo nếu drop start/end đã tồn tại — node vẫn được tạo với type fallback process */
      if (droppedSemantic === 'start' && nodes.some((n) => getNodeSemanticType(n, stepTypes) === 'start')) {
        message.warning('Đã có bước Start, bước mới sẽ được tạo là Process')
      } else if (droppedSemantic === 'end' && nodes.some((n) => getNodeSemanticType(n, stepTypes) === 'end')) {
        message.warning('Đã có bước End, bước mới sẽ được tạo là Process')
      }

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      addNode(position, stepTypeKey)
    },
    [screenToFlowPosition, addNode]
  )

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  /* ── Click node ── */
  const onNodeClick = useCallback(
    (_, node) => {
      setSelected(node.id, 'node')
      selectedRef.current = { id: node.id, type: 'node' }
    },
    [setSelected]
  )

  /* ── Click edge ── */
  const onEdgeClick = useCallback(
    (_, edge) => {
      setSelected(edge.id, 'edge')
      selectedRef.current = { id: edge.id, type: 'edge' }
    },
    [setSelected]
  )

  /* ── Click pane → bỏ chọn ── */
  const onPaneClick = useCallback(() => {
    clearSelected()
    selectedRef.current = { id: null, type: null }
  }, [clearSelected])

  /* ── Delete/Backspace → xoá item đang chọn ── */
  const onKeyDown = useCallback(
    (event) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return
      }

      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') {
        return
      }

      const { id, type } = selectedRef.current
      if (!id) {
        return
      }

      if (type === 'node') {
        const nodes = getNodes()
        const target = nodes.find((n) => n.id === id)
        const targetType = target?.data?.type

        if (targetType === 'start') {
          const count = nodes.filter((n) => n.data.type === 'start').length
          if (count <= 1) {
            message.warning('Không thể xoá bước Start duy nhất')
            return
          }
        }
        
        if (targetType === 'end') {
          const count = nodes.filter((n) => n.data.type === 'end').length
          if (count <= 1) {
            message.warning('Không thể xoá bước End duy nhất')
            return
          }
        }
        deleteNode(id)
      }

      if (type === 'edge') {
        deleteEdge(id)
      }
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
