import React, { useEffect, useState } from 'react'
import { Form, Select, Switch, Button, Divider } from 'antd'
import {
  PlusOutlined,
  ArrowRightOutlined,
  RightOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useNodes, useUpdateEdgeData } from '@/hooks/useWorkflowStore'
import { SectionLabel } from './styles'
import {
  StepInfoCard,
  StepBox,
  StepBoxLabel,
  StepBoxName,
  StepBoxCode,
  GuardsEmpty,
  GuardRow,
  GuardRowLeft,
  GuardRowActions,
  SlideWrapper,
  SlideTrack,
  SlidePane,
} from './transitionForm.styles'
import GuardDrawer from './GuardDrawer'

// ─── TransitionForm ───────────────────────────────────────────────────────────

const TransitionForm = ({ edge }) => {
  const [form] = Form.useForm()
  const nodes = useNodes()
  const updateEdgeData = useUpdateEdgeData()

  // guards giữ trong local state để render luôn cập nhật
  const [guards, setGuards] = useState(edge.data?.guards ?? [])

  // null = màn chính | { index, isNew } = GuardDrawer
  const [activeGuard, setActiveGuard] = useState(null)

  const fromNode = nodes.find((n) => n.id === edge.source)
  const toNode = nodes.find((n) => n.id === edge.target)

  useEffect(() => {
    setActiveGuard(null)
    const initialGuards = edge.data?.guards ?? []
    setGuards(initialGuards)
    form.setFieldsValue({
      allowed_roles: edge.data?.allowed_roles ?? [],
      require_note: edge.data?.require_note ?? false,
    })
  }, [edge.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper: sync guards + form fields vào store
  const syncToStore = (nextGuards, overrides = {}) => {
    const formValues = form.getFieldsValue()
    updateEdgeData(edge.id, {
      ...formValues,
      ...overrides,
      guards: nextGuards,
    })
  }

  // Sync các field ở màn chính (allowed_roles, require_note)
  const handleValuesChange = (_, allValues) => {
    updateEdgeData(edge.id, { ...allValues, guards })
  }

  // ── Guard handlers ────────────────────────────────────────────────────────

  const handleAddGuard = () => {
    const newGuard = { type: 'form_field', config: {} }
    const nextGuards = [...guards, newGuard]
    setGuards(nextGuards)
    setActiveGuard({ index: guards.length, isNew: true })
  }

  const handleOpenGuard = (index) => {
    setActiveGuard({ index, isNew: false })
  }

  // Xác nhận từ GuardDrawer → cập nhật guards state + store
  const handleConfirmGuard = (values) => {
    const nextGuards = guards.map((g, i) =>
      i === activeGuard.index ? values : g
    )
    setGuards(nextGuards)
    syncToStore(nextGuards)
    setActiveGuard(null)
  }

  // Huỷ: nếu isNew thì xoá placeholder vừa thêm
  const handleCancelGuard = () => {
    if (activeGuard?.isNew) {
      const nextGuards = guards.slice(0, activeGuard.index)
      setGuards(nextGuards)
      syncToStore(nextGuards)
    }
    setActiveGuard(null)
  }

  // Xoá guard trực tiếp từ row ngoài
  const handleRemoveGuard = (index, e) => {
    e.stopPropagation()
    const nextGuards = guards.filter((_, i) => i !== index)
    setGuards(nextGuards)
    syncToStore(nextGuards)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Form
      form={form}
      layout="vertical"
      size="small"
      onValuesChange={handleValuesChange}
      style={{ height: '100%' }}
    >
      <SlideWrapper>
        <SlideTrack $showSub={activeGuard !== null}>

          {/* ══ Pane 1: màn chính ══ */}
          <SlidePane>
            <div style={{ padding: '14px 16px' }}>

              {/* Từ bước → Đến bước */}
              <SectionLabel>Transition</SectionLabel>
              <StepInfoCard>
                <StepBox>
                  <StepBoxLabel>Từ bước</StepBoxLabel>
                  <StepBoxName>{fromNode?.data?.label ?? edge.source}</StepBoxName>
                  <StepBoxCode>{fromNode?.data?.code ?? ''}</StepBoxCode>
                </StepBox>
                <ArrowRightOutlined style={{ color: '#8c8c8c', flexShrink: 0 }} />
                <StepBox>
                  <StepBoxLabel>Đến bước</StepBoxLabel>
                  <StepBoxName>{toNode?.data?.label ?? edge.target}</StepBoxName>
                  <StepBoxCode>{toNode?.data?.code ?? ''}</StepBoxCode>
                </StepBox>
              </StepInfoCard>

              {/* Vai trò được phép */}
              <Form.Item name="allowed_roles" label="Vai trò được phép">
                <Select
                  mode="tags"
                  placeholder="+ Thêm"
                  style={{ width: '100%' }}
                  tokenSeparators={[',']}
                  open={false}
                />
              </Form.Item>

              {/* Bắt buộc ghi chú */}
              <Form.Item
                name="require_note"
                label="Bắt buộc ghi chú"
                valuePropName="checked"
                style={{ marginBottom: 8 }}
              >
                <Switch size="small" />
              </Form.Item>

              <Divider style={{ margin: '8px 0 12px' }} />

              {/* ── Guards ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <SectionLabel style={{ margin: 0 }}>
                  Guards{' '}
                  {guards.length > 0 && (
                    <span style={{ color: '#1677ff' }}>{guards.length}</span>
                  )}
                </SectionLabel>
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  style={{ padding: 0, fontSize: 12 }}
                  onClick={handleAddGuard}
                >
                  Thêm guard
                </Button>
              </div>

              {guards.length === 0 ? (
                <GuardsEmpty>
                  <div>Không có guard. Transition luôn cho phép chuyển bước.</div>
                  <span className="link" onClick={handleAddGuard}>
                    Thêm guard...
                  </span>
                </GuardsEmpty>
              ) : (
                guards.map((guard, index) => (
                  <GuardRow
                    key={index}
                    onClick={() => handleOpenGuard(index)}
                  >
                    <GuardRowLeft>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#d46b08' }}>
                        Guard #{index + 1}
                      </div>
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 1 }}>
                        {guard?.type ?? '—'}
                      </div>
                    </GuardRowLeft>

                    <GuardRowActions>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => handleRemoveGuard(index, e)}
                        style={{ opacity: 0.7 }}
                      />
                      <RightOutlined style={{ fontSize: 11, color: '#bfbfbf' }} />
                    </GuardRowActions>
                  </GuardRow>
                ))
              )}

            </div>
          </SlidePane>

          {/* ══ Pane 2: GuardDrawer ══ */}
          <SlidePane>
            {activeGuard !== null && (
              <GuardDrawer
                guardIndex={activeGuard.index}
                initialValue={guards[activeGuard.index]}
                onConfirm={handleConfirmGuard}
                onCancel={handleCancelGuard}
              />
            )}
          </SlidePane>

        </SlideTrack>
      </SlideWrapper>
    </Form>
  )
}

export default TransitionForm