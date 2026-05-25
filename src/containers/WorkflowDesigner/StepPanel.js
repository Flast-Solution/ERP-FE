import React from 'react'
import { Empty } from 'antd'
import {
  useNodes,
  useSelectedId,
  useSetSelected,
  useStepTypes,
} from '@/hooks/useWorkflowStore'
import {
  PanelContainer,
  SectionTitle,
  PaletteWrapper,
  TypePill,
  TypePillLeft,
  TypePillDot,
  TypePillLabel,
  TypePillIcon,
  PaletteDivider,
  StepListWrapper,
  StepRow,
  StepRowDot,
  StepRowLabel,
  StepRowCode,
} from './StepPanel.style'

// ─── TypeItem — palette pill kéo thả ─────────────────────────────────────────

const TypeItem = ({ stepType }) => {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/workflow-step-type', stepType.key)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <TypePill
      draggable
      onDragStart={onDragStart}
      $bgColor={stepType.bgColor}
    >
      <TypePillLeft>
        <TypePillDot $color={stepType.color} />
        <TypePillLabel $color={stepType.color}>{stepType.label}</TypePillLabel>
      </TypePillLeft>
      <TypePillIcon
        src="/img/icon-sidebar-right.svg"
        alt=""
        draggable={false}
      />
    </TypePill>
  )
}

// ─── ExistingStepItem — list row ──────────────────────────────────────────────

const ExistingStepItem = ({ node, stepTypes, isActive, onClick }) => {
  // Tìm config màu từ stepTypes trong store theo node.data.type
  const typeConfig = stepTypes.find((t) => t.key === node.data?.type)
  const color = typeConfig?.color ?? '#8c8c8c'
  const label = node.data?.label || 'Untitled'

  return (
    <StepRow $active={isActive} onClick={onClick}>
      <StepRowDot $color={color} />
      <StepRowLabel>{label}</StepRowLabel>
      <StepRowCode>{node.data?.code}</StepRowCode>
    </StepRow>
  )
}

// ─── StepPanel ────────────────────────────────────────────────────────────────

const StepPanel = () => {
  const nodes = useNodes()
  const selectedId = useSelectedId()
  const setSelected = useSetSelected()
  const stepTypes = useStepTypes()

  return (
    <PanelContainer>

      {/* ── Palette "Thêm bước" — scroll khi > 250px ── */}
      <SectionTitle>Thêm bước</SectionTitle>

      <PaletteWrapper>
        {stepTypes.map((stepType) => (
          <TypeItem key={stepType.key} stepType={stepType} />
        ))}
      </PaletteWrapper>

      <PaletteDivider />

      {/* ── Danh sách bước hiện có ── */}
      <SectionTitle>
        Bước trong quy trình{' '}
        {nodes.length > 0 && (
          <span style={{ color: '#262626' }}>{nodes.length}</span>
        )}
      </SectionTitle>

      <StepListWrapper>
        {nodes.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có bước nào"
            style={{ margin: '20px 0' }}
          />
        ) : (
          nodes.map((node) => (
            <ExistingStepItem
              key={node.id}
              node={node}
              stepTypes={stepTypes}
              isActive={selectedId === node.id}
              onClick={() => setSelected(node.id, 'node')}
            />
          ))
        )}
      </StepListWrapper>

    </PanelContainer>
  )
}

export default StepPanel
