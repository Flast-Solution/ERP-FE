import React, { useEffect } from 'react'
import { Col, Form, ColorPicker, Button } from 'antd'
import FormInput from '@/form-flast/FormInput'
import FormSelect from '@/form-flast/FormSelect'
import FormInputNumber from '@/form-flast/FormInputNumber'
import FormHidden from '@/form-flast/FormHidden'
import FormListAddition from '@/form-flast/FormListAddtion'
import { FormListStyles } from '@/css/global'

// ─── Một row trong danh sách ──────────────────────────────────────────────────

const StepTypeRow = ({ field }) => {
  const { name } = field || { name: 0 }

  return (
    <FormListStyles gutter={12}>
      {/* id ẩn */}
      <Col span={0}>
        <FormHidden name={[name, 'key']} />
      </Col>

      {/* Tên loại bước */}
      <Col md={7} xs={24}>
        <FormInput
          required
          placeholder="Tên loại bước"
          name={[name, 'label']}
        />
      </Col>

      {/* Trạng thái */}
      <Col md={6} xs={24}>
        <FormSelect
          required
          placeholder="Trạng thái"
          resourceData={[
            { id: 'active', name: 'Kích hoạt' },
            { id: 'inactive', name: 'Ngưng' },
          ]}
          name={[name, 'status']}
        />
      </Col>

      {/* Thứ tự */}
      <Col md={4} xs={24}>
        <FormInputNumber
          required
          placeholder="Thứ tự"
          name={[name, 'order']}
          min={1}
        />
      </Col>

      {/* Màu sắc — dùng antd ColorPicker trực tiếp vì cần getValueFromEvent */}
      <Col md={7} xs={24}>
        <Form.Item
          name={[name, 'color']}
          rules={[{ required: true, message: 'Chọn màu' }]}
          getValueFromEvent={(color) => color.toHexString()}
        >
          <ColorPicker showText format="hex" />
        </Form.Item>
      </Col>
    </FormListStyles>
  )
}

// ─── ModalStepTypes ───────────────────────────────────────────────────────────

/**
 * Props inject bởi modal system:
 *   stepTypes  — mảng loại bước hiện tại từ store
 *   onSave     — (updatedTypes) => void  — callback cập nhật store
 */
const ModalStepTypes = ({ stepTypes = [], onSave }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    // Map stepTypes store sang format form: thêm field status mặc định active
    form.setFieldsValue({
      lists: stepTypes.map((t) => ({
        key: t.key,
        label: t.label,
        color: t.color,
        order: t.order ?? 1,
        status: t.status ?? 'active',
      })),
    })
  }, [form, stepTypes])

  const onSubmit = ({ lists }) => {
    // Convert ngược lại về format store: giữ bgColor/borderColor cũ nếu có
    // Backend sau này sẽ trả về đầy đủ — hiện tại tự derive từ color
    const updated = lists.map((item, idx) => {
      const existing = stepTypes.find((t) => t.key === item.key)
      const hexColor = item.color?.startsWith?.('#') ? item.color : item.color

      // Derive bgColor = color + opacity 15%, borderColor = color + opacity 40%
      return {
        key: item.key ?? `step_type_${idx}`,
        label: item.label,
        color: hexColor,
        bgColor: existing?.bgColor ?? hexToAlpha(hexColor, 0.12),
        borderColor: existing?.borderColor ?? hexToAlpha(hexColor, 0.4),
        order: item.order ?? idx + 1,
        status: item.status ?? 'active',
      }
    })

    onSave(updated)
  }

  return (
    <Form form={form} onFinish={onSubmit}>
      <FormListAddition
        required
        name="lists"
        textAddNew="Thêm loại bước mới"
      >
        <StepTypeRow />
      </FormListAddition>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <Button type="primary" htmlType="submit" style={{ background: '#ff4d4f', borderColor: '#ff4d4f' }}>
          Hoàn thành
        </Button>
      </div>
    </Form>
  )
}

// ─── Helper: hex + alpha → rgba string ───────────────────────────────────────

const hexToAlpha = (hex, alpha) => {
  if (!hex || !hex.startsWith('#')) return hex
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default ModalStepTypes
