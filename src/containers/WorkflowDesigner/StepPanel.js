import React from 'react'
import { Empty, Switch, Tooltip } from 'antd'
import { PlusOutlined, SettingOutlined } from '@ant-design/icons'
import {
  useNodes,
  useProcess,
  useSelectedId,
  useSetSelected,
  useSetProcess,
  useStepTypes,
  useSetStepTypes,
} from '@/hooks/useWorkflowStore'
import { resolveStepTypeConfig } from '@/utils/workflowValidators'
import { HASH_POPUP } from '@/configs/constant'
import { InAppEvent } from '@flast-erp/core/utils'
import {
  PanelContainer,
  SectionTitleRow,
  SectionTitle,
  AddIconBtn,
  PaletteWrapper,
  TypePill,
  TypePillLeft,
  TypePillDot,
  TypePillLabel,
  TypePillIcon,
  PaletteDivider,
  StepListWrapper,
  WorkflowStatusRow,
  WorkflowStatusText,
  WorkflowStatusLabel,
  WorkflowStatusValue,
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
  const typeConfig = resolveStepTypeConfig(stepTypes, node.data?.type)
  const color = typeConfig?.color ?? '#8c8c8c'

  return (
    <StepRow $active={isActive} onClick={onClick}>
      <StepRowDot $color={color} />
      <StepRowLabel>{node.data?.name || node.data?.label || 'Untitled'}</StepRowLabel>
      <StepRowCode>{node.data?.code}</StepRowCode>
    </StepRow>
  )
}

// ─── StepPanel ────────────────────────────────────────────────────────────────

const StepPanel = ({ onReloadStepTypes }) => {
  const nodes = useNodes()
  const process = useProcess()
  const selectedId = useSelectedId()
  const setSelected = useSetSelected()
  const setProcess = useSetProcess()
  const stepTypes = useStepTypes()
  const setStepTypes = useSetStepTypes()
  const isWorkflowActive = Number(process.status ?? 1) === 1

  // Mở modal cấu hình loại bước
  const handleOpenConfig = () => {
    InAppEvent.emit(HASH_POPUP, {
      hash: 'workflow.step-types.config',
      title: 'Cấu hình loại bước',
      data: {
        stepTypes,
        workflowType: process.flowType,
        onSave: (updatedTypes) => setStepTypes(updatedTypes),
        onReload: onReloadStepTypes,
      },
    })
  }

  const handleOpenStatusConfig = () => {
    const workflowSteps = nodes
      .map((node) => ({
        id: node.data?.persistedId ?? node.data?.id,
        name: node.data?.name ?? node.data?.label ?? node.data?.code,
        code: node.data?.code,
      }))
      .filter((step) => step.id != null && step.id !== '')

    InAppEvent.emit(HASH_POPUP, {
      hash: 'workflow.status.config',
      title: '',
      data: {
        processId: process.id,
        flowType: process.flowType,
        workflowSteps,
        configurations: process.statusConfigurations ?? [],
        onSave: (statusConfigurations) => setProcess({ statusConfigurations }),
      },
    })
  }

  return (
    <PanelContainer>

      {/* ── Header "Thêm bước" + nút cấu hình ── */}
      <SectionTitleRow>
        <SectionTitle>Thêm bước</SectionTitle>
        <Tooltip title="Cấu hình loại bước">
          <AddIconBtn onClick={handleOpenConfig}>
            <PlusOutlined style={{ fontSize: 10 }} />
          </AddIconBtn>
        </Tooltip>
      </SectionTitleRow>

      {/* Palette pills — scroll khi > 250px */}
      <PaletteWrapper>
        {stepTypes.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có loại bước"
            style={{ margin: '12px 0' }}
          />
        ) : (
          stepTypes.map((stepType) => (
            <TypeItem
              key={String(stepType.id ?? stepType.key)}
              stepType={stepType}
            />
          ))
        )}
      </PaletteWrapper>

      <PaletteDivider />

      {/* ── Danh sách bước hiện có ── */}
      <SectionTitleRow style={{ paddingBottom: 8 }}>
        <SectionTitle>
          Bước trong quy trình{' '}
          {nodes.length > 0 && (
            <span style={{ color: '#262626' }}>{nodes.length}</span>
          )}
        </SectionTitle>
      </SectionTitleRow>

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

      <WorkflowStatusRow>
        <WorkflowStatusText>
          <WorkflowStatusLabel>Trạng thái</WorkflowStatusLabel>
          <WorkflowStatusValue>{isWorkflowActive ? 'Đang kích hoạt' : 'Tạm ngưng'}</WorkflowStatusValue>
        </WorkflowStatusText>
        <div className="workflow-status-actions">
          <Tooltip title="Cấu hình trạng thái">
            <button className="status-config-button" type="button" onClick={handleOpenStatusConfig}>
              <SettingOutlined />
            </button>
          </Tooltip>
          <Switch
            checked={isWorkflowActive}
            checkedChildren="Bật"
            unCheckedChildren="Tắt"
            onChange={(checked) => setProcess({ status: checked ? 1 : 0 })}
          />
        </div>
      </WorkflowStatusRow>

    </PanelContainer>
  )
}

export default StepPanel
