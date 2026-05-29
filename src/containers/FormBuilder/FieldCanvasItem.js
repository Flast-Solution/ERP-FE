/**
 * FieldCanvasItem.js
 *
 * Một field row trong canvas giữa của Form Builder.
 *
 * Gồm 3 vùng ngang:
 *   [DragHandle] [PreviewArea] [ActionGroup]
 *
 * PreviewArea:
 *   - Render preview thực bằng chính Form* component tương ứng
 *   - Form.Item disabled + pointer-events:none → chỉ hiển thị, không nhập được
 *   - Hiện FieldKeyBadge (field_key) bên dưới preview
 *
 * Drag: dùng useSortable (@dnd-kit/sortable) — id = field._id
 * Select: click vào item → selectField(_id) → panel phải hiện config
 * Delete: nút xóa → removeField(_id) với Popconfirm
 */

import { Form, Input, InputNumber, DatePicker, Select, Radio, Checkbox, Upload, Tooltip } from 'antd'
import {
  HolderOutlined,
  DeleteOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import useFormBuilderStore from '@/store/useFormBuilderStore'
import { FIELD_TYPE_MAP } from '@/utils/fieldTypes'
import {
  ItemWrapper,
  DragHandle,
  PreviewArea,
  FieldKeyBadge,
  RequiredDot,
  ActionGroup,
  ActionBtn,
} from './FieldCanvasItem.style'

// ─── Preview renderer — map inputType → antd component thực ──────────────────
// Không import Form* từ form-flast vì trong canvas chỉ cần preview tĩnh,
// không cần i18n / FormContext / validation. Dùng antd component trực tiếp.

const renderPreview = (field) => {
  const { inputType, label, isRequired, config = {} } = field

  // Label dùng chung cho Form.Item
  const formLabel = (
    <>
      {label || <span style={{ color: '#bfbfbf' }}>Chưa có nhãn</span>}
      {isRequired && <RequiredDot>*</RequiredDot>}
    </>
  )

  // options dùng cho select/radio/checkbox
  const options = (config.options ?? []).map(o => ({
    label: o.label || o.value,
    value: o.value,
  }))

  switch (inputType) {
    case 'text':
      return (
        <Form.Item label={formLabel}>
          <Input disabled placeholder="Text..." />
        </Form.Item>
      )

    case 'textarea':
      return (
        <Form.Item label={formLabel}>
          <Input.TextArea disabled placeholder="Textarea..." rows={3} />
        </Form.Item>
      )

    case 'number':
      return (
        <Form.Item label={formLabel}>
          <InputNumber
            disabled
            style={{ width: '100%' }}
            placeholder="0"
            min={config.min ?? undefined}
            max={config.max ?? undefined}
          />
        </Form.Item>
      )

    case 'decimal':
      return (
        <Form.Item label={formLabel}>
          <InputNumber
            disabled
            style={{ width: '100%' }}
            placeholder="0.00"
            precision={2}
            min={config.min ?? undefined}
            max={config.max ?? undefined}
          />
        </Form.Item>
      )

    case 'date':
      return (
        <Form.Item label={formLabel}>
          <DatePicker disabled style={{ width: '100%' }} />
        </Form.Item>
      )

    case 'datetime':
      return (
        <Form.Item label={formLabel}>
          <DatePicker disabled showTime style={{ width: '100%' }} />
        </Form.Item>
      )

    case 'select':
      return (
        <Form.Item label={formLabel}>
          <Select disabled placeholder="Chọn..." style={{ width: '100%' }}>
            {options.map(o => (
              <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      )

    case 'multi_select':
      return (
        <Form.Item label={formLabel}>
          <Select disabled mode="multiple" placeholder="Chọn nhiều..." style={{ width: '100%' }}>
            {options.map(o => (
              <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      )

    case 'radio':
      return (
        <Form.Item label={formLabel}>
          <Radio.Group disabled>
            {options.length > 0
              ? options.map(o => <Radio key={o.value} value={o.value}>{o.label}</Radio>)
              : <span style={{ color: '#bfbfbf', fontSize: 12 }}>Chưa có tùy chọn</span>
            }
          </Radio.Group>
        </Form.Item>
      )

    case 'checkbox':
      return (
        <Form.Item label={formLabel}>
          <Checkbox.Group disabled>
            {options.length > 0
              ? options.map(o => <Checkbox key={o.value} value={o.value}>{o.label}</Checkbox>)
              : <span style={{ color: '#bfbfbf', fontSize: 12 }}>Chưa có tùy chọn</span>
            }
          </Checkbox.Group>
        </Form.Item>
      )

    case 'file':
      return (
        <Form.Item label={formLabel}>
          <Upload disabled>
            <Input
              disabled
              prefix={<span style={{ fontSize: 11, color: '#bfbfbf' }}>📎</span>}
              placeholder={`Kéo file vào đây hoặc bấm để chọn`}
              readOnly
              suffix={
                config.accept
                  ? <span style={{ fontSize: 11, color: '#bfbfbf' }}>{config.accept}</span>
                  : null
              }
            />
          </Upload>
        </Form.Item>
      )

    case 'image':
      return (
        <Form.Item label={formLabel}>
          <Input
            disabled
            prefix={<span style={{ fontSize: 11, color: '#bfbfbf' }}>🖼</span>}
            placeholder="Kéo ảnh vào đây hoặc bấm để chọn"
            readOnly
            suffix={
              config.accept
                ? <span style={{ fontSize: 11, color: '#bfbfbf' }}>{config.accept}</span>
                : null
            }
          />
        </Form.Item>
      )

    case 'richtext':
      return (
        <Form.Item label={formLabel}>
          <Input.TextArea
            disabled
            rows={4}
            placeholder="Rich text editor..."
            style={{ resize: 'none' }}
          />
        </Form.Item>
      )

    case 'lookup':
      return (
        <Form.Item label={formLabel}>
          <Select
            disabled
            placeholder={config.entity ? `Lookup: ${config.entity}` : 'Lookup...'}
            style={{ width: '100%' }}
            suffixIcon={null}
          />
        </Form.Item>
      )

    default:
      return (
        <Form.Item label={formLabel}>
          <Input disabled placeholder={inputType} />
        </Form.Item>
      )
  }
}

// ─── Validation warning — field chưa đủ config ───────────────────────────────

const hasWarning = (field) => {
  if (!field.label || !field.fieldKey) return true
  const { inputType, config } = field
  if (['select', 'multi_select', 'radio', 'checkbox'].includes(inputType)) {
    return !config?.options?.length
  }
  if (inputType === 'lookup') {
    return !config?.entity
  }
  return false
}

// ─── Main component ───────────────────────────────────────────────────────────

const FieldCanvasItem = ({ field }) => {
  const selectedId  = useFormBuilderStore(s => s.selectedId)
  const selectField = useFormBuilderStore(s => s.selectField)
  const removeField = useFormBuilderStore(s => s.removeField)

  const isSelected = selectedId === field._id
  const warn = hasWarning(field)

  // dnd-kit sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field._id })

  const style = {
    transform : CSS.Transform.toString(transform),
    transition,
    opacity   : isDragging ? 0.4 : 1,
    zIndex    : isDragging ? 999 : undefined,
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    removeField(field._id)
  }

  const fieldTypeMeta = FIELD_TYPE_MAP[field.inputType]

  return (
    <ItemWrapper
      ref={setNodeRef}
      style={style}
      $selected={isSelected}
      onClick={() => selectField(field._id)}
    >
      {/* ── Drag handle ── */}
      <DragHandle {...attributes} {...listeners} onClick={e => e.stopPropagation()}>
        <HolderOutlined />
      </DragHandle>

      {/* ── Preview ── */}
      <PreviewArea>
        {renderPreview(field)}

        {/* field_key badge */}
        {field.fieldKey && (
          <FieldKeyBadge>{field.fieldKey}</FieldKeyBadge>
        )}
      </PreviewArea>

      {/* ── Actions ── */}
      <ActionGroup>
        {warn && (
          <Tooltip title="Field chưa cấu hình đầy đủ" placement="left">
            <ActionBtn
              onClick={e => { e.stopPropagation(); selectField(field._id) }}
              style={{ color: '#faad14', opacity: 1 }}
            >
              <WarningOutlined />
            </ActionBtn>
          </Tooltip>
        )}

        <Tooltip
          title={`Xóa field${fieldTypeMeta ? ` (${fieldTypeMeta.label})` : ''}`}
          placement="left"
        >
          <ActionBtn
            $danger
            onClick={handleDelete}
          >
            <DeleteOutlined />
          </ActionBtn>
        </Tooltip>
      </ActionGroup>
    </ItemWrapper>
  )
}

export default FieldCanvasItem