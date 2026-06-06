import React, { useEffect, useState } from 'react'
import { Form, Tag, Button } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { InAppEvent } from '@flast-erp/core/utils'
import { HASH_POPUP } from '@/configs/constant'
import { FormInput } from '@flast-erp/core/components'
import { useStepTypes, useUpdateNodeData } from '@/hooks/useWorkflowStore'
import { ACTION_TYPES } from '@/store/workflowConstants'
import { slugifyCode } from '@/utils/workflowValidators'
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

const ActionSection = ({ title, trigger, actions, onAdd, onRemove }) => {
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
            <ActionItem key={idx}>
              <div>
                <ActionItemLabel>
                  {ACTION_TYPES[action.type]?.label ?? action.type}
                </ActionItemLabel>
                <ActionItemMeta>{trigger}</ActionItemMeta>
              </div>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onRemove(globalIdx)}
              />
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

  /* actions giữ local state như guards trong TransitionForm */
  const [actions, setActions] = useState(node.data.actions ?? [])

  useEffect(() => {
    const nextActions = node.data.actions ?? []
    setActions(nextActions)
    form.setFieldsValue({
      label: node.data.label,
      code: node.data.code,
      type: node.data.type,
    })
    /* eslint-disable-next-line */
  }, [node.id])

  /* Sync field thường (label, code, type) → store */
  const handleValuesChange = (_, allValues) => {
    updateNodeData(node.id, { ...allValues, actions })
  }

  const handleLabelChange = (e) => {
    const currentCode = form.getFieldValue('code')
    if (currentCode === slugifyCode(node.data.label)) {
      const newCode = slugifyCode(e.target.value)
      form.setFieldValue('code', newCode)
      updateNodeData(node.id, { ...form.getFieldsValue(), code: newCode, actions })
    }
  }

  const handleTypeSelect = (key) => {
    form.setFieldValue('type', key)
    updateNodeData(node.id, { ...form.getFieldsValue(), type: key, actions })
  }

  const handleAddAction = (trigger) => {
    const next = [...actions, { type: 'send_email', trigger, config: {} }]
    setActions(next)
    updateNodeData(node.id, { ...form.getFieldsValue(), actions: next })
  }

  const handleRemoveAction = (index) => {
    const next = actions.filter((_, i) => i !== index)
    setActions(next)
    updateNodeData(node.id, { ...form.getFieldsValue(), actions: next })
  }

  const handleAttachForm = () => {
    InAppEvent.emit(HASH_POPUP, {
      hash: 'workflow.step.attach-form',
      title: '',
      data: {
        attachedForms: node.data.forms ?? [],
        onSave: (selectedForms) => {
          updateNodeData(node.id, {
            ...form.getFieldsValue(),
            actions,
            forms: selectedForms,
          })
        },
      },
    })
  }

  const currentType = Form.useWatch('type', form)

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      style={{ paddingBottom: 24 }}
    >
      {/* ══ Bước ══ */}
      <Section>
        <SectionTitle style={{ marginBottom: 12 }}>Bước</SectionTitle>

        <FormInput
          name="label"
          label="Tên hiển thị"
          placeholder="vd: Độ bền màu"
          required
          onChange={handleLabelChange}
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

        {/* Loại bước — pill radio */}
        <Form.Item name="type" label="Loại bước" style={{ marginBottom: 0 }}>
          <TypePillGroup>
            {stepTypes.map((t) => (
              <TypePillBtn
                key={t.key}
                type="button"
                $active={currentType === t.key}
                onClick={() => handleTypeSelect(t.key)}
              >
                {t.label}
              </TypePillBtn>
            ))}
          </TypePillGroup>
        </Form.Item>
      </Section>

      <SectionDivider />

      {/* ══ Hành động khi vào bước ══ */}
      <ActionSection
        title="Hành động khi vào bước"
        trigger="on_enter"
        actions={actions}
        onAdd={handleAddAction}
        onRemove={handleRemoveAction}
      />

      <SectionDivider />

      {/* ══ Hành động khi rời bước ══ */}
      <ActionSection
        title="Hành động khi rời bước"
        trigger="on_exit"
        actions={actions}
        onAdd={handleAddAction}
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
          (node.data.forms ?? []).map((f, i) => (
            <FormCard key={f.id ?? i}>
              <FormCardInfo>
                <FormCardName>{f.name}</FormCardName>
                <FormCardMeta>
                  {[
                    f.domain,
                    f.fields?.length != null && `${f.fields.length} fields`,
                  ].filter(Boolean).join(' · ')}
                </FormCardMeta>
              </FormCardInfo>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {f.required && (
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
                    updateNodeData(node.id, { ...form.getFieldsValue(), actions, forms: next })
                  }}
                />
              </div>
            </FormCard>
          ))
        )}
      </Section>
    </Form>
  )
};

export default StepForm;