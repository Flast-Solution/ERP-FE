import React, { useEffect, useRef } from 'react'
import { Col, Form, ColorPicker, Button, message } from 'antd'
import { 
  FormInput, 
  FormHidden, 
  FormListAddtion,
  FormSelect,
	FormInputNumber
} from "@flast-erp/core/components";
import { RequestUtils } from '@flast-erp/core/utils'

import { FormListStyles } from '@/css/global'

// ─── Một row trong danh sách ──────────────────────────────────────────────────

const StepTypeRow = ({ field }) => {
  const { name } = field || { name: 0 }

  return (
    <FormListStyles gutter={12}>
      {/* id ẩn */}
      <Col span={0}>
        <FormHidden name={[name, 'id']} />
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
            { id: 1, name: 'Kích hoạt' },
            { id: 0, name: 'Ngưng' },
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
 *   workflowType — loại nghiệp vụ hiện tại của workflow
 *   onSave     — (updatedTypes) => void  — callback cập nhật store
 *   onReload   — () => void              — callback reload process-type-find khi đóng modal
 */
const ModalStepTypes = ({ stepTypes = [], workflowType, onSave, onReload }) => {
  const [form] = Form.useForm()
  const onReloadRef = useRef(onReload)

  useEffect(() => {
    onReloadRef.current = onReload
  }, [onReload])

  useEffect(() => () => {
    onReloadRef.current?.()
  }, [])

  useEffect(() => {
    // Map stepTypes store sang format form: thêm field status mặc định active
    form.setFieldsValue({
      lists: stepTypes.map((t) => ({
        id: t.id,
        label: t.label,
        color: t.color,
        order: t.order ?? 1,
        status: t.status ?? 1,
      })),
    })
  }, [form, stepTypes])

  const isChangedItem = (item) => {
    if (item.id == null || item.id === '') {
      return true
    }

    const existing = stepTypes.find((t) => t.id === item.id || t.key === String(item.id))
    if (!existing) {
      return true
    }

    return String(existing.label ?? '') !== String(item.label ?? '')
      || String(existing.color ?? '') !== String(item.color ?? '')
      || Number(existing.order ?? 1) !== Number(item.order ?? 1)
      || Number(existing.status ?? 1) !== Number(item.status ?? 1)
  }

  const onSubmit = async ({ lists }) => {
    if (!workflowType) {
      message.warning('Vui lòng chọn Loại nghiệp vụ trước khi lưu cấu hình loại bước.')
      return
    }

    // Convert ngược lại về format store: giữ bgColor/borderColor cũ nếu có
    // Backend sau này sẽ trả về đầy đủ — hiện tại tự derive từ color
    const updated = lists.map((item, idx) => {
      const existing = stepTypes.find((t) => t.id === item.id || t.key === String(item.id))
      const hexColor = item.color?.startsWith?.('#') ? item.color : item.color

      // Derive bgColor = color + opacity 15%, borderColor = color + opacity 40%
      return {
        id: item.id,
        key: String(item.id ?? `step_type_${idx}`),
        label: item.label,
        color: hexColor,
        bgColor: existing?.bgColor ?? hexToAlpha(hexColor, 0.12),
        borderColor: existing?.borderColor ?? hexToAlpha(hexColor, 0.4),
        order: item.order ?? idx + 1,
        status: item.status ?? 1,
      }
    })

    const changedItems = updated.filter(isChangedItem)
    const updatedRefs = new Set(
      updated
        .flatMap((item) => [item.id, item.key])
        .filter((value) => value !== undefined && value !== null && value !== '')
        .map(String)
    )
    const hasRemovedItems = stepTypes.some((item) => {
      const refs = [item.id, item.key]
        .filter((value) => value !== undefined && value !== null && value !== '')
        .map(String)
      return refs.length > 0 && !refs.some((ref) => updatedRefs.has(ref))
    })

    if (changedItems.length === 0 && !hasRemovedItems) {
      message.info('Không có thay đổi để lưu.')
      onSave(updated)
      return
    }

    const payload = updated.map((item) => ({
        id: item.id,
        name: item.label,
        type: workflowType,
        status: item.status,
        orderProcessType: item.order,
        colorCode: item.color,
    }))

    try {
      await RequestUtils.Post('/workflow/process/save-process-type', payload)
      message.success('Đã lưu cấu hình loại bước.')
    } catch (error) {
      message.error('Không lưu được cấu hình loại bước.')
      return
    }

    onSave(updated)
    await onReload?.()
  }

  return (
    <Form form={form} onFinish={onSubmit}>
      <FormListAddtion
        required
        name="lists"
        textAddNew="Thêm loại bước mới"
      >
        <StepTypeRow />
      </FormListAddtion>

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
