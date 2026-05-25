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

// ─── Dynamic config fields ────────────────────────────────────────────────────

const ConfigFields = ({ fields = [], localForm }) =>
  fields.map((f) => {
    const rules = f.required ? [{ required: true, message: `Nhập ${f.label}` }] : []

    if (f.type === 'textarea')
      return (
        <Form.Item key={f.name} name={['config', f.name]} label={f.label} rules={rules}>
          <TextArea rows={3} />
        </Form.Item>
      )
    if (f.type === 'number')
      return (
        <Form.Item key={f.name} name={['config', f.name]} label={f.label} rules={rules}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
      )
    if (f.type === 'select')
      return (
        <Form.Item key={f.name} name={['config', f.name]} label={f.label} rules={rules}>
          <Select options={f.options} />
        </Form.Item>
      )
    return (
      <Form.Item key={f.name} name={['config', f.name]} label={f.label} rules={rules}>
        <Input />
      </Form.Item>
    )
  })

// ─── GuardDrawer ──────────────────────────────────────────────────────────────
/**
 * Dùng form cục bộ (localForm) để giữ state tạm.
 * Chỉ ghi vào parentForm khi user bấm "Xác nhận".
 * Bấm X = huỷ, nếu guard mới (isNew=true) thì xoá luôn.
 *
 * Props:
 *   parentForm   — Form instance của TransitionForm
 *   guardIndex   — index trong guards array
 *   initialValue — giá trị ban đầu { type, config }
 *   isNew        — true nếu vừa được tạo (chưa xác nhận lần nào)
 *   onConfirm    — (values) => void  — lưu vào parentForm
 *   onCancel     — () => void        — đóng, không lưu
 *   onRemove     — () => void        — xoá guard khỏi list
 */
const GuardDrawer = ({
  guardIndex,
  initialValue,
  onConfirm,
  onCancel,
}) => {
  const [localForm] = Form.useForm()
  const [guardType, setGuardType] = useState(initialValue?.type ?? 'form_field')
  const configFields = GUARD_TYPES[guardType]?.configFields ?? []
  const guardConfig = GUARD_TYPES[guardType]

  const handleTypeChange = (val) => {
    setGuardType(val)
    localForm.setFieldsValue({ config: {} }) // reset config khi đổi type
  }

  const handleConfirm = () => {
    localForm
      .validateFields()
      .then((values) => onConfirm(values))
      .catch(() => {})
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ── */}
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

      {/* ── Body ── */}
      <PanelBody $padding="16px" style={{ flex: 1, overflowY: 'auto' }}>
        <Form
          form={localForm}
          layout="vertical"
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
              <ConfigFields fields={configFields} localForm={localForm} />
            </>
          )}
        </Form>
      </PanelBody>

      {/* ── Footer: Xác nhận ── */}
      <DrawerFooter>
        <Button
          type="primary"
          size="small"
          block
          onClick={handleConfirm}
        >
          Xác nhận
        </Button>
        <Button
          size="small"
          onClick={onCancel}
        >
          Huỷ
        </Button>
      </DrawerFooter>

    </div>
  )
}

export default GuardDrawer
