import React, { useState } from 'react'
import { Form, Select, Input, InputNumber, Button, Divider } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { GUARD_TYPES, GUARD_TYPE_OPTIONS } from '@/store/workflowConstants'
import { PanelBody, SectionLabel } from './styles'
import {
  DrawerHeader,
  DrawerTitle,
  DrawerSubtitle,
  DrawerFooter,
} from './guardDrawer.styles'

const { TextArea } = Input

const buildGroupedFieldOptions = (nodeForms = []) =>
  nodeForms.filter((form) => form.fields?.length > 0).map((form) => ({
    label: form.name,
    options: form.fields.map((f) => ({
      value: f.fieldKey,
      label: `${f.label} (${f.inputType})`,
    })),
  }))

const ConfigFields = ({ fields = [], nodeForms = [] }) => {

  const groupedFieldOptions = buildGroupedFieldOptions(nodeForms)
  const hasFormFields = groupedFieldOptions.length > 0

  return fields.map((f) => {
    const rules = f.required ? [{ required: true, message: `Nhập ${f.label}` }] : []
    const name = ['config', f.name]

    if (f.name === 'field_name' && hasFormFields) {
      return (
        <Form.Item key={f.name} name={name} label={f.label} rules={rules}>
          <Select
            showSearch
            placeholder="Chọn field từ form"
            options={groupedFieldOptions}
            optionFilterProp="label"
            allowClear
          />
        </Form.Item>
      )
    }

    if (f.type === 'textarea')
      return (
        <Form.Item key={f.name} name={name} label={f.label} rules={rules}>
          <TextArea rows={3} />
        </Form.Item>
      )

    if (f.type === 'number')
      return (
        <Form.Item key={f.name} name={name} label={f.label} rules={rules}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
      )

    if (f.type === 'select')
      return (
        <Form.Item key={f.name} name={name} label={f.label} rules={rules}>
          <Select options={f.options} />
        </Form.Item>
      )

    return (
      <Form.Item key={f.name} name={name} label={f.label} rules={rules}>
        <Input />
      </Form.Item>
    )
  })
}

/**
 * Props:
 *   guardIndex   — index trong guards array
 *   initialValue — { type, config }
 *   nodeForms    — node.data.forms[] từ source node (cho field_name Select)
 *   onConfirm    — (values) => void
 *   onCancel     — () => void
 */
const GuardDrawer = ({
  guardIndex,
  initialValue,
  nodeForms = [],
  onConfirm,
  onCancel,
}) => {

  const [localForm] = Form.useForm()
  const [guardType, setGuardType] = useState(initialValue?.type ?? 'form_field')
  const configFields = GUARD_TYPES[guardType]?.configFields ?? []
  const guardConfig = GUARD_TYPES[guardType]

  const handleTypeChange = (val) => {
    setGuardType(val)
    localForm.setFieldsValue({ config: {} })
  }

  const handleConfirm = () => {
    localForm
      .validateFields()
      .then((values) => onConfirm(values))
      .catch(() => {})
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      <DrawerHeader>
        <div>
          <DrawerTitle>Guard #{guardIndex + 1}</DrawerTitle>
          {guardConfig?.description && (
            <DrawerSubtitle>{guardConfig.description}</DrawerSubtitle>
          )}
        </div>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={onCancel}
          style={{ color: '#8c8c8c' }}
        />
      </DrawerHeader>

      <PanelBody $padding="16px" style={{ flex: 1, overflowY: 'auto' }}>
        <Form
          form={localForm}
          layout="vertical"
          size="small"
          initialValues={{
            type: initialValue?.type ?? 'form_field',
            config: initialValue?.config ?? {},
          }}
        >
          <Form.Item name="type" label="Loại guard">
            <Select options={GUARD_TYPE_OPTIONS} onChange={handleTypeChange} />
          </Form.Item>

          {configFields.length > 0 && (
            <>
              <Divider style={{ margin: '4px 0 12px' }} />
              <SectionLabel>Cấu hình</SectionLabel>
              <ConfigFields
                fields={configFields}
                nodeForms={nodeForms}
              />
            </>
          )}
        </Form>
      </PanelBody>

      <DrawerFooter>
        <Button type="primary" size="small" block onClick={handleConfirm}>
          Xác nhận
        </Button>
        <Button size="small" onClick={onCancel}>
          Huỷ
        </Button>
      </DrawerFooter>

    </div>
  )
}

export default GuardDrawer