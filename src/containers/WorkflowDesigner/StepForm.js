import React, { useEffect, useState } from 'react'
import { Form, Tag, Button, Checkbox, Input, Select, message } from 'antd'
import { DeleteOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons'
import { InAppEvent } from '@flast-erp/core/utils'
import { HASH_POPUP } from '@/configs/constant'
import {
  FormInput,
} from '@flast-erp/core/components'
import { useNodes, useStepTypes, useUpdateNodeData } from '@/hooks/useWorkflowStore'
import { ACTION_TYPES } from '@/store/workflowConstants'
import {
  isStepTypeMatch,
  isWorkflowStepHidden,
  resolveStepTypeConfig,
  slugifyCode,
} from '@/utils/workflowValidators'
import { getFormDisplayName, normalizeAttachedForm } from '@/utils/workflowSerializer'
import {
  Section,
  SectionDivider,
  SectionHeader,
  SectionTitle,
  SectionAction,
  FieldHint,
  TypePillGroup,
  TypePillBtn,
  EmptyState,
  ActionItem,
  ActionItemLabel,
  ActionItemMeta,
  FormCard,
  FormCardInfo,
  FormCardName,
  FormCardMeta,
} from './StepForm.style'
import {
  SlideWrapper,
  SlideTrack,
  SlidePane,
} from './transitionForm.styles'
import ActionDrawer from './ActionDrawer'

const ActionSection = ({ title, trigger, actions, onAdd, onOpen, onRemove }) => {
  const filtered = actions.filter((a) => (a.trigger ?? 'on_enter') === trigger)

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{title}</SectionTitle>
        <SectionAction onClick={() => onAdd(trigger)}>Thêm</SectionAction>
      </SectionHeader>

      {filtered.length === 0 ? (
        <EmptyState>Chưa có hành động {trigger}.</EmptyState>
      ) : (
        filtered.map((action, idx) => {
          const globalIdx = actions.indexOf(action)
          return (
            <ActionItem key={idx} onClick={() => onOpen(globalIdx)}>
              <div>
                <ActionItemLabel>
                  {ACTION_TYPES[action.type]?.label ?? action.type}
                </ActionItemLabel>
                <ActionItemMeta>{trigger}</ActionItemMeta>
              </div>
              <div className="action-item-actions">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemove(globalIdx)
                  }}
                />
                <RightOutlined style={{ fontSize: 11, color: '#bfbfbf' }} />
              </div>
            </ActionItem>
          )
        })
      )}
    </Section>
  )
}


const StepForm = ({ node }) => {

  const [form] = Form.useForm()
  const updateNodeData = useUpdateNodeData()
  const stepTypes = useStepTypes()
  const nodes = useNodes()

  /* actions giữ local state như guards trong TransitionForm */
  const [actions, setActions] = useState(node.data.actions ?? [])
  const [activeAction, setActiveAction] = useState(null)
  const stepName = node.data.name ?? node.data.label ?? ''

  useEffect(() => {
    const nextActions = node.data.actions ?? []
    const config = Object.fromEntries(
      Object.entries(node.data.config ?? {}).filter(([key]) => key !== 'assigneeId'),
    )
    setActions(nextActions)
    setActiveAction(null)
    form.setFieldsValue({
      name: node.data.name ?? node.data.label,
      code: node.data.code,
      type: node.data.type,
      config,
      saveSubmitLog: node.data.saveSubmitLog ?? false,
      hidden: isWorkflowStepHidden(node),
      buttons: node.data.buttons ?? [],
    })
    /* eslint-disable-next-line */
  }, [node.id])

  /* Sync field thường (name, code, type) → store */
  const handleValuesChange = (_, allValues) => {
    updateNodeData(node.id, {
      ...allValues,
      label: allValues.name,
      actions,
    })
  }

  const handleNameChange = (e) => {
    const currentCode = form.getFieldValue('code')
    if (currentCode === slugifyCode(stepName)) {
      const newCode = slugifyCode(e.target.value)
      form.setFieldValue('code', newCode)
      updateNodeData(node.id, {
        ...form.getFieldsValue(),
        name: e.target.value,
        label: e.target.value,
        code: newCode,
        actions,
      })
    }
  }

  const handleTypeSelect = (key) => {
    const stepType = resolveStepTypeConfig(stepTypes, key)
    form.setFieldValue('type', stepType?.key ?? key)
    updateNodeData(node.id, {
      ...form.getFieldsValue(),
      label: form.getFieldValue('name'),
      type: stepType?.key ?? key,
      typeLabel: stepType?.label,
      actions,
    })
  }

  const syncActions = (nextActions) => {
    setActions(nextActions)
    const values = form.getFieldsValue()
    updateNodeData(node.id, { ...values, label: values.name, actions: nextActions })
  }

  const handleAddAction = (trigger) => {
    const next = [...actions, { type: 'send_email', trigger, config: {} }]
    syncActions(next)
    setActiveAction({ index: actions.length, isNew: true })
  }

  const handleOpenAction = (index) => {
    setActiveAction({ index, isNew: false })
  }

  const handleConfirmAction = (values) => {
    const next = actions.map((action, index) =>
      index === activeAction.index ? values : action
    )
    syncActions(next)
    setActiveAction(null)
  }

  const handleCancelAction = () => {
    if (activeAction?.isNew) {
      syncActions(actions.slice(0, activeAction.index))
    }
    setActiveAction(null)
  }

  const handleRemoveAction = (index) => {
    const next = actions.filter((_, i) => i !== index)
    syncActions(next)
  }

  const handleAttachForm = () => {
    const attachedForms = node.data.forms ?? []
    if (attachedForms.length > 0) {
      message.warning('Mỗi bước chỉ được gắn 1 form. Vui lòng xóa form hiện tại trước khi gắn form mới.')
      return
    }

    InAppEvent.emit(HASH_POPUP, {
      hash: 'workflow.step.attach-form',
      title: '',
      data: {
        attachedForms,
        stepCode: node.data?.code,
        stepLabel: node.data?.name ?? node.data?.label,
        onSave: (selectedForms) => {
          const values = form.getFieldsValue()
          updateNodeData(node.id, {
            ...values,
            label: values.name,
            actions,
            forms: selectedForms,
          })
        },
      },
    })
  }

  const currentType = Form.useWatch('type', form)
  const targetStepOptions = nodes
    .filter((item) => item.id !== node.id)
    .map((item) => ({
      value: item.data?.code ?? item.id,
      label: `${item.data?.name ?? item.data?.label ?? item.id}${isWorkflowStepHidden(item) ? ' (bước ẩn)' : ''}`,
    }))

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      style={{ height: '100%' }}
    >
      <SlideWrapper>
        <SlideTrack $showSub={activeAction !== null}>
          <SlidePane>
            <div style={{ paddingBottom: 24 }}>
              {/* ══ Bước ══ */}
              <Section>
                <SectionTitle style={{ marginBottom: 12 }}>Bước</SectionTitle>

                <FormInput
                  name="name"
                  label="Tên bước"
                  placeholder="vd: Độ bền màu"
                  required
                  onChange={handleNameChange}
                />

                <FormInput
                  name="code"
                  label="Mã bước"
                  placeholder="vd: fastness"
                  required
                  style={{ fontFamily: 'monospace' }}
                  rules={[
                    { pattern: /^[a-z0-9_]+$/, message: 'Chỉ dùng chữ thường, số, dấu _' },
                  ]}
                />
                <FieldHint>
                  Dùng trong API và conditions. Không đổi sau khi xuất bản.
                </FieldHint>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    columnGap: 16,
                  }}
                >
                  <Form.Item
                    name="saveSubmitLog"
                    valuePropName="checked"
                    initialValue={false}
                    style={{ marginBottom: 16 }}
                  >
                    <Checkbox>Lưu log submit</Checkbox>
                  </Form.Item>

                  <Form.Item
                    name="hidden"
                    valuePropName="checked"
                    initialValue={false}
                    style={{ marginBottom: 16 }}
                  >
                    <Checkbox>Bước ẩn</Checkbox>
                  </Form.Item>
                </div>
                <FieldHint>
                  Bước ẩn không xuất hiện trong tiến trình và chỉ được mở bởi button của bước khác.
                </FieldHint>

                {/* Loại bước — pill radio */}
                <Form.Item name="type" label="Nhóm bước" style={{ marginBottom: 0 }}>
                  <TypePillGroup>
                    {stepTypes.map((t) => (
                      <TypePillBtn
                        key={String(t.id ?? t.key)}
                        type="button"
                        $active={isStepTypeMatch(currentType, t)}
                        onClick={() => handleTypeSelect(t.key)}
                      >
                        {t.label}
                      </TypePillBtn>
                    ))}
                  </TypePillGroup>
                </Form.Item>
              </Section>

              <SectionDivider />

              <Section>
                <SectionHeader>
                  <SectionTitle>Button của bước</SectionTitle>
                </SectionHeader>
                <FieldHint style={{ marginBottom: 12 }}>
                  TRANSITION chuyển workflow; Mở bước ẩn chỉ hiển thị form và không đổi bước hiện tại.
                </FieldHint>
                <Form.List name="buttons">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.length === 0 && (
                        <EmptyState>Chưa cấu hình button. Màn tiến trình tiếp tục dùng nút Hoàn thành mặc định.</EmptyState>
                      )}
                      {fields.map((field, index) => (
                        <div
                          key={field.key}
                          style={{
                            padding: 12,
                            marginBottom: 10,
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            background: '#fafafa',
                          }}
                        >
                          <Form.Item name={[field.name, 'id']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'label']}
                            label={`Tên button ${index + 1}`}
                            rules={[{ required: true, message: 'Nhập tên button' }]}
                          >
                            <Input placeholder="Ví dụ: Chuyển bước tiếp theo" />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'type']}
                            label="Hành động"
                            rules={[{ required: true, message: 'Chọn hành động' }]}
                          >
                            <Select
                              options={[
                                { value: 'TRANSITION', label: 'Chuyển workflow tới bước đích' },
                                { value: 'OPEN_HIDDEN_STEP', label: 'Mở form của bước ẩn' },
                              ]}
                            />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'targetStepCode']}
                            label="Bước đích"
                            rules={[{ required: true, message: 'Chọn bước đích' }]}
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              placeholder="Chọn bước đích"
                              options={targetStepOptions}
                            />
                          </Form.Item>
                          <Form.Item name={[field.name, 'style']} label="Kiểu hiển thị">
                            <Select
                              options={[
                                { value: 'PRIMARY', label: 'Primary' },
                                { value: 'DEFAULT', label: 'Mặc định' },
                                { value: 'DANGER', label: 'Nguy hiểm' },
                              ]}
                            />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'requireSubmission']}
                            valuePropName="checked"
                            style={{ marginBottom: 8 }}
                          >
                            <Checkbox>Yêu cầu submit form hiện tại trước khi bấm</Checkbox>
                          </Form.Item>
                          <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          >
                            Xoá button
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="dashed"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => add({
                          id: `button_${Date.now()}`,
                          label: '',
                          type: 'TRANSITION',
                          targetStepCode: null,
                          style: 'DEFAULT',
                          requireSubmission: true,
                          order: fields.length,
                        })}
                      >
                        Thêm button
                      </Button>
                    </>
                  )}
                </Form.List>
              </Section>

              <SectionDivider />

              {/* ══ Hành động khi vào bước ══ */}
              <ActionSection
                title="Hành động khi vào bước"
                trigger="on_enter"
                actions={actions}
                onAdd={handleAddAction}
                onOpen={handleOpenAction}
                onRemove={handleRemoveAction}
              />

              <SectionDivider />

              {/* ══ Hành động khi rời bước ══ */}
              <ActionSection
                title="Hành động khi rời bước"
                trigger="on_exit"
                actions={actions}
                onAdd={handleAddAction}
                onOpen={handleOpenAction}
                onRemove={handleRemoveAction}
              />

              <SectionDivider />

              {/* ══ Form gắn vào bước ══ */}
              <Section>
                <SectionHeader>
                  <SectionTitle>Form gắn vào bước</SectionTitle>
                  <SectionAction type="button" onClick={handleAttachForm}>Gắn form</SectionAction>
                </SectionHeader>

                {(node.data.forms ?? []).length === 0 ? (
                  <EmptyState>Chưa có form nào được gắn.</EmptyState>
                ) : (
                  (node.data.forms ?? []).map((f, i) => {
                    const attachedForm = normalizeAttachedForm(f)
                    return (
                    <FormCard key={`${node.id}-form-${attachedForm?.id ?? i}`}>
                      <FormCardInfo>
                        <FormCardName>{getFormDisplayName(attachedForm)}</FormCardName>
                        <FormCardMeta>
                          {[
                            attachedForm?.domain,
                            attachedForm?.fields?.length != null && `${attachedForm.fields.length} fields`,
                          ].filter(Boolean).join(' · ')}
                        </FormCardMeta>
                      </FormCardInfo>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {attachedForm?.required && (
                          <Tag
                            style={{
                              borderRadius: 20,
                              fontSize: 11,
                              padding: '0 10px',
                              background: '#e6f4ff',
                              borderColor: '#91caff',
                              color: '#1677ff',
                              margin: 0,
                            }}
                          >
                            Bắt buộc
                          </Tag>
                        )}
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            const next = (node.data.forms ?? []).filter((_, j) => j !== i)
                            const values = form.getFieldsValue()
                            updateNodeData(node.id, {
                              ...values,
                              label: values.name,
                              actions,
                              forms: next,
                            })
                          }}
                        />
                      </div>
                    </FormCard>
                    )
                  })
                )}

              </Section>
            </div>
          </SlidePane>

          <SlidePane>
            {activeAction !== null && (
              <ActionDrawer
                actionIndex={activeAction.index}
                initialValue={actions[activeAction.index]}
                isNew={activeAction.isNew}
                nodes={nodes}
                onConfirm={handleConfirmAction}
                onCancel={handleCancelAction}
              />
            )}
          </SlidePane>
        </SlideTrack>
      </SlideWrapper>
    </Form>
  )
};

export default StepForm;
