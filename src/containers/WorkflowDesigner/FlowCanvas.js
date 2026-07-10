import React, { useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'

import {
  useNodes,
  useEdges,
  useOnNodesChange,
  useOnEdgesChange,
  useOnConnect,
  useSelectedId,
  useStepTypes,
} from '@/hooks/useWorkflowStore'
import useFlowHandlers from '@/hooks/useFlowHandlers'
import { resolveStepTypeConfig } from '@/utils/workflowValidators'

import StepNode from './StepNode'
import EdgeLabel from './EdgeLabel'
import CanvasToolbar from './CanvasToolbar'
import { CanvasWrapper } from './styles'

// Khai báo ngoài component để tránh recreate mỗi render
const nodeTypes = { stepNode: StepNode }
const edgeTypes = { transitionEdge: EdgeLabel }

const defaultEdgeOptions = {
  type: 'transitionEdge',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#8c8c8c' },
}

const FlowCanvasInner = () => {
  const nodes = useNodes()
  const edges = useEdges()
  const onNodesChange = useOnNodesChange()
  const onEdgesChange = useOnEdgesChange()
  const onConnect = useOnConnect()
  const selectedId = useSelectedId()
  const stepTypes = useStepTypes()

  const handlers = useFlowHandlers()

  // Gán selected + markerEnd màu theo selected vào edges
  const styledEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        selected: e.id === selectedId,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: e.id === selectedId ? '#1677ff' : '#8c8c8c',
        },
      })),
    [edges, selectedId]
  )

  return (
    <CanvasWrapper onKeyDown={handlers.onKeyDown} tabIndex={0}>
      <CanvasToolbar />

      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handlers.onNodeClick}
        onEdgeClick={handlers.onEdgeClick}
        onPaneClick={handlers.onPaneClick}
        onDrop={handlers.onDrop}
        onDragOver={handlers.onDragOver}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode={null} // tự xử lý trong useFlowHandlers
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e8e8e8" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => resolveStepTypeConfig(stepTypes, n.data?.type)?.color ?? '#8c8c8c'}
          maskColor="rgba(245,245,245,0.7)"
          style={{
            border: '1px solid #f0f0f0',
            borderRadius: 8,
          }}
        />
      </ReactFlow>
    </CanvasWrapper>
  )
}

// Bọc ReactFlowProvider để useReactFlow() trong CanvasToolbar và useFlowHandlers hoạt động
const FlowCanvas = () => (
  <ReactFlowProvider>
    <FlowCanvasInner />
  </ReactFlowProvider>
)

export default FlowCanvas
