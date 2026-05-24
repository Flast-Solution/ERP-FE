import React, { useEffect } from 'react'
import { Form, Input, Select } from 'antd'
import { STEP_TYPE_OPTIONS } from '@/store/workflowConstants'
import { useUpdateNodeData } from '@/hooks/useWorkflowStore'
import { slugifyCode } from '@/utils/workflowValidators'
import { SectionLabel } from './styles'

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
    })
  }, [node.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleValuesChange = (changed, allValues) => {
    updateNodeData(node.id, allValues)
  }

  const handleLabelChange = (e) => {
    const currentCode = form.getFieldValue('code')
    if (currentCode === slugifyCode(node.data.label)) {
      form.setFieldValue('code', slugifyCode(e.target.value))
      updateNodeData(node.id, {
        ...form.getFieldsValue(),
        code: slugifyCode(e.target.value),
      })
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      size="small"
      onValuesChange={handleValuesChange}
    >
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
    </Form>
  )
}

export default StepForm