import React from 'react'
import { Typography, Divider, Empty, Tag } from 'antd'
import { STEP_TYPES } from '@/store/workflowConstants'
import {
  useNodes,
  useSelectedId,
  useSetSelected,
} from '@/hooks/useWorkflowStore'
import {
  PanelHeader,
  PanelTitle,
  PanelBody,
  StepTypeItem,
  StepListItem,
} from './styles'

const { Text } = Typography

// ─── Palette item — kéo thả vào canvas ───────────────────────────────────────
const TypeItem = ({ type, config }) => {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/workflow-step-type', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <StepTypeItem
      draggable
      onDragStart={onDragStart}
      $color={config.color}
      $bgColor={config.bgColor}
      $borderColor={config.borderColor}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
        }}
      />
      <span>{config.label}</span>
    </StepTypeItem>
  )
}

// ─── List item — step đã có trên canvas ──────────────────────────────────────
const ExistingStepItem = ({ node, isActive, onClick }) => {
  const config = STEP_TYPES[node.data?.type] ?? STEP_TYPES.process

  return (
    <StepListItem $active={isActive} onClick={onClick}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#262626',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {node.data?.label || 'Untitled'}
        </div>
        <Text
          style={{ fontSize: 10, fontFamily: 'monospace', color: '#8c8c8c' }}
        >
          {node.data?.code}
        </Text>
      </div>
      <Tag
        color={config.color}
        style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '18px' }}
      >
        {node.data?.type}
      </Tag>
    </StepListItem>
  )
}

// ─── StepPanel ────────────────────────────────────────────────────────────────
const StepPanel = () => {
  const nodes = useNodes()
  const selectedId = useSelectedId()
  const setSelected = useSetSelected()

  return (
    <>
      <PanelHeader>
        <PanelTitle>Workflow Steps</PanelTitle>
      </PanelHeader>

      <PanelBody>
        {/* Palette kéo thả */}
        <Text
          style={{
            fontSize: 11,
            color: '#8c8c8c',
            display: 'block',
            marginBottom: 8,
          }}
        >
          Kéo vào canvas để thêm step
        </Text>

        {Object.entries(STEP_TYPES).map(([type, config]) => (
          <TypeItem key={type} type={type} config={config} />
        ))}

        <Divider style={{ margin: '12px 0' }} />

        {/* Danh sách steps hiện có */}
        <Text
          style={{
            fontSize: 11,
            color: '#8c8c8c',
            display: 'block',
            marginBottom: 8,
          }}
        >
          Steps ({nodes.length})
        </Text>

        {nodes.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có step nào"
            style={{ margin: '12px 0' }}
          />
        ) : (
          nodes.map((node) => (
            <ExistingStepItem
              key={node.id}
              node={node}
              isActive={selectedId === node.id}
              onClick={() => setSelected(node.id, 'node')}
            />
          ))
        )}
      </PanelBody>
    </>
  )
}

export default StepPanel
