import React, { useEffect } from 'react'
import { Form, Input, Select, Button, Divider } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { STEP_TYPE_OPTIONS, ACTION_TYPE_OPTIONS, ACTION_TRIGGER_OPTIONS } from '@/store/workflowConstants'
import { useUpdateNodeData } from '@/hooks/useWorkflowStore'
import { slugifyCode } from '@/utils/workflowValidators'
import { SectionLabel, ActionCard } from './styles'

const { TextArea } = Input

const StepForm = ({ node }) => {
  const [form] = Form.useForm()
  const updateNodeData = useUpdateNodeData()

  useEffect(() => {
    form.setFieldsValue({
      label: node.data.label,
      code: node.data.code,
      type: node.data.type,
      description: node.data.description,
      actions: node.data.actions ?? [],
    })
  }, [node.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleValuesChange = (_, allValues) => {
    updateNodeData(node.id, allValues)
  }

  const handleLabelChange = (e) => {
    const currentCode = form.getFieldValue('code')
    if (currentCode === slugifyCode(node.data.label)) {
      const newCode = slugifyCode(e.target.value)
      form.setFieldValue('code', newCode)
      updateNodeData(node.id, { ...form.getFieldsValue(), code: newCode })
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      size="small"
      onValuesChange={handleValuesChange}
    >
      {/* ── Thông tin step ── */}
      <SectionLabel>Thông tin step</SectionLabel>

      <Form.Item
        name="label"
        label="Label"
        rules={[{ required: true, message: 'Nhập label' }]}
      >
        <Input placeholder="vd: Confirmed" onChange={handleLabelChange} />
      </Form.Item>

      <Form.Item
        name="code"
        label="Code"
        rules={[
          { required: true, message: 'Nhập code' },
          { pattern: /^[a-z0-9_]+$/, message: 'Chỉ dùng chữ thường, số, dấu _' },
        ]}
      >
        <Input placeholder="vd: confirmed" style={{ fontFamily: 'monospace' }} />
      </Form.Item>

      <Form.Item name="type" label="Loại step">
        <Select options={STEP_TYPE_OPTIONS} />
      </Form.Item>

      <Form.Item name="description" label="Mô tả">
        <TextArea rows={2} placeholder="Mô tả ngắn về bước này" />
      </Form.Item>

      <Divider style={{ margin: '4px 0 12px' }} />

      {/* ── Actions ── */}
      <Form.List name="actions">
        {(fields, { add, remove }) => (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <SectionLabel style={{ margin: 0 }}>
                Actions{' '}
                {fields.length > 0 && (
                  <span style={{ color: '#1677ff' }}>{fields.length}</span>
                )}
              </SectionLabel>
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                style={{ padding: 0, fontSize: 12 }}
                onClick={() => add({ type: 'send_email', trigger: 'on_enter', config: {} })}
              >
                Thêm action
              </Button>
            </div>

            {fields.map(({ key, name: listName, ...restField }) => (
              <ActionCard key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#389e0d' }}>
                    Action #{listName + 1}
                  </span>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(listName)}
                  />
                </div>

                <Form.Item {...restField} name={[listName, 'type']} label="Loại action">
                  <Select options={ACTION_TYPE_OPTIONS} />
                </Form.Item>

                <Form.Item {...restField} name={[listName, 'trigger']} label="Trigger" style={{ marginBottom: 0 }}>
                  <Select options={ACTION_TRIGGER_OPTIONS} />
                </Form.Item>
              </ActionCard>
            ))}
          </>
        )}
      </Form.List>
    </Form>
  )
}

export default StepForm
