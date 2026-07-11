import React, { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { DeleteOutlined } from '@ant-design/icons'
import { message, Tooltip } from 'antd'
import { useDeleteNode, useEdges, useStepTypes } from '@/hooks/useWorkflowStore'
import { resolveStepTypeConfig } from '@/utils/workflowValidators'
import {
  NodeWrapper,
  NodeHeader,
  GroupBadge,
  GroupBadgeDot,
  NodeLabel,
  DragHandle,
  NodeDeleteButton,
  NodeCode,
  NodeFooter,
  FooterBadge,
} from './StepNode.style'

// ─── Footer badges ────────────────────────────────────────────────────────────
// ⚡ N on_enter / on_exit  và  📋 N form (guards)

const buildFooterBadges = (data) => {
  const badges = []

  // Actions — group theo trigger
  const actions = data.actions ?? []
  if (actions.length > 0) {
    const byTrigger = actions.reduce((acc, a) => {
      const key = a.trigger ?? 'on_enter'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    Object.entries(byTrigger).forEach(([trigger, count]) => {
      badges.push({ icon: '⚡', label: `${count} ${trigger}`, key: `action_${trigger}` })
    })
  }

  // Forms gắn vào bước
  const formCount = data.forms?.length ?? 0
  if (formCount > 0) {
    badges.push({ icon: '📋', label: `${formCount} form`, key: 'forms' })
  }

  return badges
}

// ─── StepNode ─────────────────────────────────────────────────────────────────

const StepNode = ({ id, data, selected }) => {
  const stepTypes = useStepTypes()
  const edges = useEdges()
  const deleteNode = useDeleteNode()

  // Tìm config nhóm từ store theo data.type
  const typeConfig = resolveStepTypeConfig(stepTypes, data.type)
  const hasOutgoingEdge = edges.some((edge) => edge.source === id)

  const footerBadges = buildFooterBadges(data)

  const handleDelete = (event) => {
    event.stopPropagation()
    event.preventDefault()

    if (hasOutgoingEdge) {
      message.warning('Không thể xoá bước đã có đầu ra. Vui lòng xoá transition đi ra trước.')
      return
    }

    deleteNode(id)
  }

  return (
    <NodeWrapper $selected={selected}>
      {/* Handle trái — nhận connection */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: typeConfig?.color ?? '#8c8c8c',
          width: 10,
          height: 10,
          border: '2px solid #fff',
        }}
      />

      {/* ── Header: [GroupBadge] [Label] [DragHandle] ── */}
      <NodeHeader>
        {typeConfig && (
          <Tooltip title={typeConfig.label}>
            <GroupBadge $bgColor={typeConfig.bgColor} $color={typeConfig.color}>
              <GroupBadgeDot $color={typeConfig.color} />
              {typeConfig.label}
            </GroupBadge>
          </Tooltip>
        )}

        <NodeLabel>{data.name || data.label || 'Untitled'}</NodeLabel>

        <Tooltip title={hasOutgoingEdge ? 'Không thể xoá bước đã có đầu ra' : 'Xoá bước'}>
          <NodeDeleteButton
            type="button"
            $disabled={hasOutgoingEdge}
            aria-disabled={hasOutgoingEdge}
            onClick={handleDelete}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <DeleteOutlined />
          </NodeDeleteButton>
        </Tooltip>

        <DragHandle className="drag-handle__custom">⋮</DragHandle>
      </NodeHeader>

      {/* ── Code ── */}
      <NodeCode>{data.code || '—'}</NodeCode>

      {/* ── Footer badges ── */}
      {footerBadges.length > 0 && (
        <NodeFooter>
          {footerBadges.map((b) => (
            <FooterBadge key={b.key}>
              <span>{b.icon}</span>
              <span>{b.label}</span>
            </FooterBadge>
          ))}
        </NodeFooter>
      )}

      {/* Handle phải — bắt đầu connection */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: typeConfig?.color ?? '#8c8c8c',
          width: 10,
          height: 10,
          border: '2px solid #fff',
        }}
      />
    </NodeWrapper>
  )
}

export default memo(StepNode)
