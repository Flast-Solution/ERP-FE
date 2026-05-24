import useWorkflowStore from '@/store/workflowStore'

// ─── Process ──────────────────────────────────────────────────────────────────
export const useProcess = () => useWorkflowStore((s) => s.process)
export const useSetProcess = () => useWorkflowStore((s) => s.setProcess)

// ─── Nodes ────────────────────────────────────────────────────────────────────
export const useNodes = () => useWorkflowStore((s) => s.nodes)
export const useOnNodesChange = () => useWorkflowStore((s) => s.onNodesChange)
export const useAddNode = () => useWorkflowStore((s) => s.addNode)
export const useUpdateNodeData = () => useWorkflowStore((s) => s.updateNodeData)
export const useDeleteNode = () => useWorkflowStore((s) => s.deleteNode)

// ─── Edges ────────────────────────────────────────────────────────────────────
export const useEdges = () => useWorkflowStore((s) => s.edges)
export const useOnEdgesChange = () => useWorkflowStore((s) => s.onEdgesChange)
export const useOnConnect = () => useWorkflowStore((s) => s.onConnect)
export const useUpdateEdgeData = () => useWorkflowStore((s) => s.updateEdgeData)
export const useDeleteEdge = () => useWorkflowStore((s) => s.deleteEdge)

// ─── Selection ────────────────────────────────────────────────────────────────
export const useSelectedId = () => useWorkflowStore((s) => s.selectedId)
export const useSelectedType = () => useWorkflowStore((s) => s.selectedType)
export const useSetSelected = () => useWorkflowStore((s) => s.setSelected)
export const useClearSelected = () => useWorkflowStore((s) => s.clearSelected)

// getSelectedItem là fn tính toán — gọi trực tiếp tránh subscribe cả store
export const useSelectedItem = () =>
  useWorkflowStore((s) => s.getSelectedItem())

// ─── History ──────────────────────────────────────────────────────────────────
export const useUndo = () => useWorkflowStore((s) => s.undo)
export const useRedo = () => useWorkflowStore((s) => s.redo)
export const useCanUndo = () => useWorkflowStore((s) => s.history.length > 0)
export const useCanRedo = () => useWorkflowStore((s) => s.future.length > 0)

// ─── Global actions ───────────────────────────────────────────────────────────
export const useResetFlow = () => useWorkflowStore((s) => s.resetFlow)
export const useLoadFlow = () => useWorkflowStore((s) => s.loadFlow)
