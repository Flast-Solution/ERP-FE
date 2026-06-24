import { create } from 'zustand'
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow'
import { DEFAULT_STEP, DEFAULT_TRANSITION } from './workflowConstants'
import {
  getNodeSemanticType,
  getStepSemanticType,
  resolveFallbackProcessTypeKey,
  resolveStepTypeConfig,
} from '@/utils/workflowValidators'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

const snapshot = (nodes, edges) => ({
  nodes: JSON.parse(JSON.stringify(nodes)),
  edges: JSON.parse(JSON.stringify(edges)),
})

const MAX_HISTORY = 50

// ─── Initial state ────────────────────────────────────────────────────────────
const initialNodes = []
const initialEdges = []
const initialStepTypes = []

// ─── Store ────────────────────────────────────────────────────────────────────
const useWorkflowStore = create((set, get) => ({

  // ── Step types (palette "Thêm bước") ─────────────────────────────────────────
  // Mỗi item lấy từ API process-type-find: { key, label, color, bgColor, borderColor }
  stepTypes: initialStepTypes,

  // Gọi khi API trả về danh sách loại bước
  // Ví dụ: store.getState().setStepTypes(apiResponse)
  setStepTypes: (types) => set({ stepTypes: types }),

  // Reset về danh sách rỗng, không fallback hardcode.
  resetStepTypes: () => set({ stepTypes: initialStepTypes }),

  // ── Process info ────────────────────────────────────────────────────────────
  process: {
    id: null,
    processKey: '',
    name: '',
    code: '',
    description: '',
  },

  setProcess: (partial) => set((state) => ({
    process: { ...state.process, ...partial },
  })),

  // ── Nodes ────────────────────────────────────────────────────────────────────
  nodes: initialNodes,

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }))
  },

  addNode: (position, stepTypeKey) => {
    const id = generateId()
    set((state) => {
      const stepTypes = get().stepTypes
      const droppedSemantic = getStepSemanticType(stepTypeKey, stepTypes)
      const fallbackProcessKey = resolveFallbackProcessTypeKey(stepTypes)

      /* Nếu drop start mà đã có start → fallback process
       * Nếu drop end mà đã có end → fallback process 
      */
      const resolvedType =
        (droppedSemantic === 'start' && state.nodes.some((n) => getNodeSemanticType(n, stepTypes) === 'start'))
          ? fallbackProcessKey
        : (droppedSemantic === 'end' && state.nodes.some((n) => getNodeSemanticType(n, stepTypes) === 'end'))
          ? fallbackProcessKey
        : (stepTypeKey ?? fallbackProcessKey)

      const stepTypeConfig = resolveStepTypeConfig(stepTypes, resolvedType)

      const newNode = {
        id,
        type: 'stepNode',
        position,
        data: {
          ...DEFAULT_STEP,
          label: stepTypeConfig?.label ?? DEFAULT_STEP.label,
          type: resolvedType,
          code: `step_${id.slice(-5)}`,
        },
      }
      const next = [...state.nodes, newNode]
      return {
        nodes: next,
        ...pushHistory(state, next, state.edges),
      }
    })
    return id
  },

  updateNodeData: (nodeId, data) => {
    set((state) => {
      const next = state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      )
      return {
        nodes: next,
        ...pushHistory(state, next, state.edges),
      }
    })
  },

  deleteNode: (nodeId) => {
    set((state) => {
      const target = state.nodes.find((n) => n.id === nodeId)
      if (!target) {
        return {}
      }

      const stepTypes = get().stepTypes
      const targetSemantic = getNodeSemanticType(target, stepTypes)

      /* Chặn xoá start duy nhất */
      if (targetSemantic === 'start') {
        const startCount = state.nodes.filter((n) => getNodeSemanticType(n, stepTypes) === 'start').length
        if (startCount <= 1) return {}
      }

      /* Chặn xoá end duy nhất */
      if (targetSemantic === 'end') {
        const endCount = state.nodes.filter((n) => getNodeSemanticType(n, stepTypes) === 'end').length
        if (endCount <= 1) return {}
      }
 
      const nextNodes = state.nodes.filter((n) => n.id !== nodeId)
      const nextEdges = state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      )
      return {
        nodes: nextNodes,
        edges: nextEdges,
        selectedId: state.selectedId === nodeId ? null : state.selectedId,
        selectedType: state.selectedId === nodeId ? null : state.selectedType,
        ...pushHistory(state, nextNodes, nextEdges),
      }
    })
  },

  // ── Edges ─────────────────────────────────────────────────────────────────────
  edges: initialEdges,

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }))
  },

  onConnect: (connection) => {
    set((state) => {
      const newEdge = {
        ...connection,
        id: generateId(),
        type: 'transitionEdge',
        data: { ...DEFAULT_TRANSITION },
      }
      const next = addEdge(newEdge, state.edges)
      return {
        edges: next,
        ...pushHistory(state, state.nodes, next),
      }
    })
  },

  updateEdgeData: (edgeId, data) => {
    set((state) => {
      const next = state.edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e
      )
      return {
        edges: next,
        ...pushHistory(state, state.nodes, next),
      }
    })
  },

  deleteEdge: (edgeId) => {
    set((state) => {
      const next = state.edges.filter((e) => e.id !== edgeId)
      return {
        edges: next,
        selectedId: state.selectedId === edgeId ? null : state.selectedId,
        selectedType: state.selectedId === edgeId ? null : state.selectedType,
        ...pushHistory(state, state.nodes, next),
      }
    })
  },

  // ── Selection ────────────────────────────────────────────────────────────────
  selectedId: null,
  selectedType: null,

  setSelected: (id, type) => set({ selectedId: id, selectedType: type }),
  clearSelected: () => set({ selectedId: null, selectedType: null }),

  getSelectedItem: () => {
    const { selectedId, selectedType, nodes, edges } = get()
    if (!selectedId) return null
    if (selectedType === 'node') return nodes.find((n) => n.id === selectedId) ?? null
    if (selectedType === 'edge') return edges.find((e) => e.id === selectedId) ?? null
    return null
  },

  // ── History ──────────────────────────────────────────────────────────────────
  history: [],
  future: [],

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return {}
      const prev = state.history[state.history.length - 1]
      const newHistory = state.history.slice(0, -1)
      const newFuture = [snapshot(state.nodes, state.edges), ...state.future]
      return {
        nodes: prev.nodes,
        edges: prev.edges,
        history: newHistory,
        future: newFuture.slice(0, MAX_HISTORY),
      }
    })
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return {}
      const next = state.future[0]
      const newFuture = state.future.slice(1)
      const newHistory = [...state.history, snapshot(state.nodes, state.edges)]
      return {
        nodes: next.nodes,
        edges: next.edges,
        history: newHistory.slice(-MAX_HISTORY),
        future: newFuture,
      }
    })
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().future.length > 0,

  // ── Reset ─────────────────────────────────────────────────────────────────────
  resetFlow: () =>
    set({
      nodes: initialNodes,
      edges: initialEdges,
      selectedId: null,
      selectedType: null,
      history: [],
      future: [],
      process: { id: null, processKey: '', name: '', code: '', description: '' },
    }),

  // ── Load từ JSON (import) ─────────────────────────────────────────────────────
  loadFlow: ({ nodes, edges, process: processInfo }) => {
    set({
      nodes: nodes ?? [],
      edges: edges ?? [],
      process: processInfo ?? { id: null, processKey: '', name: '', code: '', description: '' },
      selectedId: null,
      selectedType: null,
      history: [],
      future: [],
    })
  },
}))

// ─── Internal helper ──────────────────────────────────────────────────────────
function pushHistory(state, nextNodes, nextEdges) {
  const newHistory = [
    ...state.history,
    snapshot(state.nodes, state.edges),
  ].slice(-MAX_HISTORY)
  return {
    history: newHistory,
    future: [],
  }
}

export default useWorkflowStore
