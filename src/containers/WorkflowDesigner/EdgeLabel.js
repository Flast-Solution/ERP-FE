import React, { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from 'reactflow'
import { Tooltip } from 'antd'

const EdgeLabel = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data = {},
  selected,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const guardCount = data.guards?.length ?? 0
  const actionCount = data.actions?.length ?? 0
  const hasNote = data.require_note

  const edgeColor = selected ? '#1677ff' : '#8c8c8c'

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 2 : 1.5,
          strokeDasharray: hasNote ? '6 3' : 'none',
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: selected ? '#e6f4ff' : '#fff',
              border: `1px solid ${selected ? '#91caff' : '#e8e8e8'}`,
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 500,
              color: selected ? '#0958d9' : '#595959',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              cursor: 'default',
            }}
          >
            {hasNote && (
              <Tooltip title="Yêu cầu ghi chú">
                <span style={{ fontSize: 10 }}>📝</span>
              </Tooltip>
            )}
            {guardCount > 0 && (
              <Tooltip title={`${guardCount} guard`}>
                <span style={{ fontSize: 10 }}>🔒</span>
              </Tooltip>
            )}
            {actionCount > 0 && (
              <Tooltip title={`${actionCount} action`}>
                <span style={{ fontSize: 10 }}>⚡</span>
              </Tooltip>
            )}
            <span>{data.label || 'transition'}</span>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(EdgeLabel)
