import { create } from 'zustand'
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow'
import { DEFAULT_STEP, DEFAULT_TRANSITION } from './workflowConstants'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

// Snapshot dùng cho undo/redo — chỉ lưu nodes + edges
const snapshot = (nodes, edges) => ({
  nodes: JSON.parse(JSON.stringify(nodes)),
  edges: JSON.parse(JSON.stringify(edges)),
})

const MAX_HISTORY = 50

// ─── Initial state ────────────────────────────────────────────────────────────
const initialNodes = [
  {
    id: 'step_new',
    type: 'stepNode',
    position: { x: 80, y: 200 },
    data: { label: 'New', code: 'new', type: 'start', description: 'Khởi tạo', actions: [] },
  },
  {
    id: 'step_confirmed',
    type: 'stepNode',
    position: { x: 320, y: 200 },
    data: { label: 'Confirmed', code: 'confirmed', type: 'process', description: 'Đã xác nhận', actions: [] },
  },
  {
    id: 'step_done',
    type: 'stepNode',
    position: { x: 560, y: 200 },
    data: { label: 'Done', code: 'done', type: 'end', description: 'Hoàn thành', actions: [] },
  },
]

const initialEdges = [
  {
    id: 'e_new_confirmed',
    source: 'step_new',
    target: 'step_confirmed',
    type: 'transitionEdge',
    data: { label: 'Confirm', require_note: false, guards: [], actions: [] },
  },
  {
    id: 'e_confirmed_done',
    source: 'step_confirmed',
    target: 'step_done',
    type: 'transitionEdge',
    data: { label: 'Complete', require_note: false, guards: [], actions: [] },
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────
const useWorkflowStore = create((set, get) => ({

  // ── Process info ────────────────────────────────────────────────────────────
  process: {
    name: 'New Process',
    code: 'new_process',
    description: '',
  },

  setProcess: (partial) =>
    set((state) => ({
      process: { ...state.process, ...partial },
    })),

  // ── Nodes ────────────────────────────────────────────────────────────────────
  nodes: initialNodes,

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }))
  },

  addNode: (position) => {
    const id = generateId()
    const newNode = {
      id,
      type: 'stepNode',
      position,
      data: { ...DEFAULT_STEP, code: `step_${id.slice(-5)}` },
    }
    set((state) => {
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
      const nextNodes = state.nodes.filter((n) => n.id !== nodeId)
      // Xoá cả edges liên quan
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

  // ── Selection (node hoặc edge) ────────────────────────────────────────────────
  // selectedType: 'node' | 'edge' | null
  selectedId: null,
  selectedType: null,

  setSelected: (id, type) => set({ selectedId: id, selectedType: type }),
  clearSelected: () => set({ selectedId: null, selectedType: null }),

  // Computed: lấy data của item đang được chọn
  getSelectedItem: () => {
    const { selectedId, selectedType, nodes, edges } = get()
    if (!selectedId) return null
    if (selectedType === 'node') return nodes.find((n) => n.id === selectedId) ?? null
    if (selectedType === 'edge') return edges.find((e) => e.id === selectedId) ?? null
    return null
  },

  // ── History (undo / redo) ─────────────────────────────────────────────────────
  history: [],      // stack quá khứ [{nodes, edges}, ...]
  future: [],       // stack tương lai

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
      process: { name: 'New Process', code: 'new_process', description: '' },
    }),

  // ── Load từ JSON (import) ─────────────────────────────────────────────────────
  // Gọi sau khi workflowSerializer.jsonToFlow() parse xong
  loadFlow: ({ nodes, edges, process: processInfo }) => {
    set({
      nodes: nodes ?? [],
      edges: edges ?? [],
      process: processInfo ?? { name: '', code: '', description: '' },
      selectedId: null,
      selectedType: null,
      history: [],
      future: [],
    })
  },
}))

// ─── Internal helper — push vào history stack ─────────────────────────────────
// Trả về partial state để spread vào set()
function pushHistory(state, nextNodes, nextEdges) {
  const newHistory = [
    ...state.history,
    snapshot(state.nodes, state.edges),
  ].slice(-MAX_HISTORY)
  return {
    history: newHistory,
    future: [], // reset future mỗi khi có thay đổi mới
  }
}

export default useWorkflowStore
