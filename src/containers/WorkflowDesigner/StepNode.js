import React, { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Tag, Tooltip } from 'antd'
import { STEP_TYPES } from '@/store/workflowConstants'
import {
  StepNodeWrapper,
  StepNodeLabel,
  StepNodeCode,
  StepNodeDesc,
  StepNodeBadges,
} from './styles'

const StepNode = ({ data, selected }) => {
  const config = STEP_TYPES[data.type] ?? STEP_TYPES.process

  return (
    <StepNodeWrapper
      $bgColor={config.bgColor}
      $borderColor={config.borderColor}
      $selected={selected}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: config.color,
          width: 10,
          height: 10,
          border: '2px solid #fff',
        }}
      />

      <StepNodeLabel $color={config.color}>
        {data.label || 'Untitled'}
      </StepNodeLabel>

      <StepNodeCode $color={config.color}>
        [{data.code || '—'}]
      </StepNodeCode>

      {data.description && (
        <Tooltip title={data.description}>
          <StepNodeDesc $color={config.color}>
            {data.description}
          </StepNodeDesc>
        </Tooltip>
      )}

      {data.actions?.length > 0 && (
        <StepNodeBadges>
          {data.actions.map((a, i) => (
            <Tag
              key={i}
              style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '18px' }}
              color="default"
            >
              {a.type}
            </Tag>
          ))}
        </StepNodeBadges>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: config.color,
          width: 10,
          height: 10,
          border: '2px solid #fff',
        }}
      />
    </StepNodeWrapper>
  )
}

export default memo(StepNode)
