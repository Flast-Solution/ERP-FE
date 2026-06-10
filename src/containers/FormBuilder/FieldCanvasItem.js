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

import { Form, Input, InputNumber, DatePicker, Select, Radio, Checkbox, Upload, Tooltip, Row, Col } from 'antd'
import { useDroppable } from '@dnd-kit/core'
import {
  HolderOutlined,
  DeleteOutlined,
  WarningOutlined,
  FormOutlined,
} from '@ant-design/icons'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
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
  BlockChildrenWrap,
  BlockDropZone,
  BlockChildrenHint,
} from './FieldCanvasItem.style'

// ─── Preview renderer — map inputType → antd component thực ──────────────────
// Không import Form* từ form-flast vì trong canvas chỉ cần preview tĩnh,
// không cần i18n / FormContext / validation. Dùng antd component trực tiếp.

const renderPreview = (field) => {
  const { inputType, label, isRequired, config: rawConfig, children = [] } = field
  const config = rawConfig ?? {}

  // Label dùng chung cho Form.Item
  const formLabel = (
    <>
      {label || <span style={{ color: '#bfbfbf' }}>Chưa có nhãn</span>}
      {isRequired && <RequiredDot>*</RequiredDot>}
    </>
  )

  // options dùng cho select/radio/checkbox
  const options = (config.options ?? []).map(o => ({
    label: o.label ?? o.name ?? o.value ?? o.id,
    value: o.value ?? o.id,
  }))

  switch (inputType) {
    case 'block':
      return (
        <div
          style={{
            border: '1px solid #d9d9d9',
            borderLeft: '4px solid #1677ff',
            background: '#f0f7ff',
            borderRadius: 6,
            padding: 12,
            margin: '8px 0',
          }}
        >
          <div style={{ fontWeight: 600, color: '#1f1f1f', marginBottom: 4 }}>
            {label || 'Block'}
          </div>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 8 }}>
            {children.length} field trong block
          </div>
        </div>
      )

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
          <Select disabled placeholder="Chọn..." style={{ width: '100%' }} options={options} />
        </Form.Item>
      )

    case 'multi_select':
      return (
        <Form.Item label={formLabel}>
          <Select disabled mode="multiple" placeholder="Chọn nhiều..." style={{ width: '100%' }} options={options} />
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

    case 'select_api':
      return (
        <Form.Item label={formLabel}>
          <Select
            disabled
            placeholder={config.api || config.entity ? `API: ${config.api || config.entity}` : 'FormSelectAPI...'}
            style={{ width: '100%' }}
            suffixIcon={null}
          />
        </Form.Item>
      )

    case 'autocomplete':
      return (
        <Form.Item label={formLabel}>
          <Select
            disabled
            showSearch
            placeholder="AutoComplete..."
            style={{ width: '100%' }}
            options={options}
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
  if (inputType === 'block') {
    return !field.label
  }
  if (['select', 'multi_select', 'radio', 'checkbox'].includes(inputType)) {
    return !config?.options?.length
  }
  if (inputType === 'lookup') {
    return !config?.entity
  }
  if (inputType === 'select_api') {
    return !(config?.api || config?.entity)
  }
  if (inputType === 'autocomplete') {
    return !config?.options?.length
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
  const childIds = (field.children ?? []).map(child => child._id)
  const {
    setNodeRef: setBlockDropRef,
    isOver: isBlockOver,
  } = useDroppable({
    id: `block-drop:${field._id}`,
  })

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
      onClick={(e) => {
        e.stopPropagation()
        selectField(field._id)
      }}
    >
      {/* ── Drag handle ── */}
      <DragHandle {...attributes} {...listeners} onClick={e => e.stopPropagation()}>
        <HolderOutlined />
      </DragHandle>

      {/* ── Preview ── */}
      <PreviewArea>
        {renderPreview(field)}

        {field.inputType === 'block' && (
          <BlockChildrenWrap
            onClick={e => e.stopPropagation()}
          >
            {(field.children ?? []).length === 0 ? (
              <BlockChildrenHint>
                <FormOutlined style={{ fontSize: 28, marginBottom: 10, color: '#bfbfbf' }} />
                <div>Kéo field vào đây để bắt đầu</div>
                <div style={{ marginTop: 6, color: '#bfbfbf' }}>Chọn loại field từ danh sách bên trái</div>
              </BlockChildrenHint>
            ) : (
              <SortableContext
                items={childIds}
                strategy={rectSortingStrategy}
              >
                <Row gutter={[8, 0]}>
                  {(field.children ?? []).map(child => (
                    <Col key={child._id} span={child.colSpan ?? 24}>
                      <FieldCanvasItem field={child} />
                    </Col>
                  ))}
                </Row>
              </SortableContext>
            )}

            <BlockDropZone
              ref={setBlockDropRef}
              $isOver={isBlockOver}
              onClick={e => e.stopPropagation()}
            >
              {isBlockOver ? 'Thả vào block này' : 'Kéo field vào đây để thêm vào block'}
            </BlockDropZone>
          </BlockChildrenWrap>
        )}

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
