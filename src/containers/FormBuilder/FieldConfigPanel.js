/**
 * FieldConfigPanel.js
 *
 * Panel phải của Form Builder.
 * Hiện config của field đang được chọn trong canvas (selectedId).
 *
 * Sections:
 *   1. Field       — Nhãn, Mã field (field_key), Kiểu input (readonly badge)
 *   2. Toggles     — Bắt buộc, Cho phép tìm kiếm, Index (Solr)
 *   3. Ràng buộc   — dynamic theo inputType (min/max, options editor, accept, entity...)
 *   4. Advanced    — refDomain, autoGenerate, fieldRole (collapsed mặc định)
 *
 * Không dùng Form* từ form-flast vì panel không có FormContextCustom.
 * Dùng antd Form controlled trực tiếp, sync 2 chiều với store.
 */

import { useEffect } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Select,
  Slider,
  Switch,
  Collapse,
  Tooltip,
} from 'antd'
import {
  SettingOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { nanoid } from 'nanoid'
import useFormBuilderStore from '@/store/useFormBuilderStore'
import { FIELD_TYPE_MAP } from '@/utils/fieldTypes'
import { isValidFieldKey } from '@/utils/slugify'
import {
  PanelWrapper,
  PanelHeader,
  PanelTitle,
  PanelBody,
  EmptyState,
  EmptyStateIcon,
  EmptyStateText,
  Section,
  SectionDivider,
  SectionTitle,
  FieldKeyHint,
  FieldKeyWarning,
  ToggleRow,
  ToggleLabel,
  MinMaxRow,
  MinMaxLabel,
  OptionsList,
  OptionRow,
  OptionRemoveBtn,
  AddOptionBtn,
  InputTypeBadge,
  ColSpanRow,
  ColSpanPreset,
  ColSpanValue,
} from './FieldConfigPanel.style'

// ─── Options Editor (cho select / multi_select / radio / checkbox) ────────────

const OptionsEditor = ({ options = [], onChange }) => {
  const handleLabelChange = (index, value) => {
    const next = options.map((o, i) =>
      i === index ? { ...o, label: value } : o
    )
    onChange(next)
  }

  const handleValueChange = (index, value) => {
    const next = options.map((o, i) =>
      i === index ? { ...o, value } : o
    )
    onChange(next)
  }

  const handleRemove = (index) => {
    onChange(options.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    onChange([...options, { value: nanoid(6), label: '' }])
  }

  return (
    <>
      <OptionsList>
        {options.map((opt, index) => (
          <OptionRow key={opt.value}>
            <Input
              placeholder="Nhãn"
              value={opt.label}
              onChange={e => handleLabelChange(index, e.target.value)}
              style={{ flex: 2 }}
            />
            <Input
              placeholder="Value"
              value={opt.value}
              onChange={e => handleValueChange(index, e.target.value)}
              style={{ flex: 1 }}
            />
            <OptionRemoveBtn onClick={() => handleRemove(index)}>
              <CloseCircleOutlined />
            </OptionRemoveBtn>
          </OptionRow>
        ))}
      </OptionsList>

      <AddOptionBtn onClick={handleAdd}>
        <PlusOutlined />
        Thêm tùy chọn
      </AddOptionBtn>
    </>
  )
}

// ─── Constraint section — dynamic theo inputType ──────────────────────────────

const ConstraintSection = ({ field, onConfigChange }) => {
  const { inputType, config = {} } = field

  // number / decimal → min + max
  if (inputType === 'number' || inputType === 'decimal') {
    const precision = inputType === 'decimal' ? 2 : 0
    return (
      <Section>
        <SectionTitle>Ràng buộc</SectionTitle>
        <MinMaxRow>
          <div>
            <MinMaxLabel>Min</MinMaxLabel>
            <InputNumber
              style={{ width: '100%' }}
              precision={precision}
              value={config.min ?? null}
              placeholder="—"
              onChange={val => onConfigChange({ min: val })}
            />
          </div>
          <div>
            <MinMaxLabel>Max</MinMaxLabel>
            <InputNumber
              style={{ width: '100%' }}
              precision={precision}
              value={config.max ?? null}
              placeholder="—"
              onChange={val => onConfigChange({ max: val })}
            />
          </div>
        </MinMaxRow>
        <SectionDivider />
      </Section>
    )
  }

  // select / multi_select / radio / checkbox → options editor
  if (['select', 'multi_select', 'radio', 'checkbox'].includes(inputType)) {
    return (
      <Section>
        <SectionTitle>Tùy chọn</SectionTitle>
        <OptionsEditor
          options={config.options ?? []}
          onChange={opts => onConfigChange({ options: opts })}
        />
        <SectionDivider />
      </Section>
    )
  }

  // file / image → accept + maxSize
  if (inputType === 'file' || inputType === 'image') {
    return (
      <Section>
        <SectionTitle>Ràng buộc</SectionTitle>
        <Form.Item
          label="Loại file cho phép"
          style={{ marginBottom: 10 }}
        >
          <Input
            placeholder={inputType === 'image' ? 'image/jpeg,image/png' : 'application/pdf,.docx'}
            value={config.accept ?? ''}
            onChange={e => onConfigChange({ accept: e.target.value })}
          />
        </Form.Item>
        <Form.Item
          label="Dung lượng tối đa (MB)"
          style={{ marginBottom: 12 }}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            max={100}
            precision={0}
            value={config.maxSize ?? 5}
            onChange={val => onConfigChange({ maxSize: val })}
          />
        </Form.Item>
        <SectionDivider />
      </Section>
    )
  }

  // lookup → entity + labelField
  if (inputType === 'lookup') {
    return (
      <Section>
        <SectionTitle>Cấu hình Lookup</SectionTitle>
        <Form.Item
          label="Entity"
          style={{ marginBottom: 10 }}
        >
          <Input
            placeholder="customer, order, farmer..."
            value={config.entity ?? ''}
            onChange={e => onConfigChange({ entity: e.target.value })}
          />
        </Form.Item>
        <Form.Item
          label="Hiển thị field"
          style={{ marginBottom: 12 }}
        >
          <Input
            placeholder="name"
            value={config.labelField ?? 'name'}
            onChange={e => onConfigChange({ labelField: e.target.value })}
          />
        </Form.Item>
        <SectionDivider />
      </Section>
    )
  }

  return null
}

// ─── Advanced section (collapse) ─────────────────────────────────────────────

const AdvancedSection = ({ field, onUpdate }) => {
  const isLookup = field.inputType === 'lookup'

  const items = [
    {
      key: 'advanced',
      label: 'Nâng cao',
      children: (
        <>
          {/* refDomain — chỉ hiện với lookup */}
          {isLookup && (
            <Form.Item
              label={
                <span>
                  Ref domain&nbsp;
                  <Tooltip title="Domain của form_template trỏ tới. TraceService dùng để resolve ref.">
                    <InfoCircleOutlined style={{ color: '#bfbfbf' }} />
                  </Tooltip>
                </span>
              }
              style={{ marginBottom: 10 }}
            >
              <Input
                placeholder="stamp_batch, farmer..."
                value={field.refDomain ?? ''}
                onChange={e => onUpdate({ refDomain: e.target.value || null })}
              />
            </Form.Item>
          )}

          {/* autoGenerate */}
          <Form.Item
            label={
              <span>
                Auto generate&nbsp;
                <Tooltip title="Tự sinh giá trị khi bulk_create_submission. null = không tự sinh.">
                  <InfoCircleOutlined style={{ color: '#bfbfbf' }} />
                </Tooltip>
              </span>
            }
            style={{ marginBottom: 10 }}
          >
            <Select
              allowClear
              placeholder="Không tự sinh"
              value={field.autoGenerate ?? undefined}
              onChange={val => onUpdate({ autoGenerate: val ?? null })}
              options={[
                { value: 'uuid_short', label: 'uuid_short' },
                { value: 'uuid',       label: 'uuid' },
                { value: 'timestamp',  label: 'timestamp' },
              ]}
            />
          </Form.Item>

          {/* fieldRole */}
          <Form.Item
            label={
              <span>
                Field role&nbsp;
                <Tooltip title="bulk_quantity: engine đọc field này làm số lượng khi bulk_create_submission.">
                  <InfoCircleOutlined style={{ color: '#bfbfbf' }} />
                </Tooltip>
              </span>
            }
            style={{ marginBottom: 4 }}
          >
            <Select
              allowClear
              placeholder="Không có vai trò"
              value={field.fieldRole ?? undefined}
              onChange={val => onUpdate({ fieldRole: val ?? null })}
              options={[
                { value: 'bulk_quantity', label: 'bulk_quantity' },
              ]}
            />
          </Form.Item>
        </>
      ),
    },
  ]

  return (
    <Collapse
      ghost
      items={items}
      style={{ borderTop: '1px solid #f0f0f0' }}
    />
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

const FieldConfigPanel = () => {
  const [form] = Form.useForm()

  const selectedId   = useFormBuilderStore(s => s.selectedId)
  const field        = useFormBuilderStore(s => s.getSelectedField())
  const updateField  = useFormBuilderStore(s => s.updateField)
  const updateLabel  = useFormBuilderStore(s => s.updateLabel)
  const updateConfig = useFormBuilderStore(s => s.updateConfig)
  const isDuplicate  = useFormBuilderStore(s => s.isDuplicateFieldKey)

  // Sync form values khi field thay đổi (chọn field khác)
  useEffect(() => {
    if (field) {
      form.setFieldsValue({
        label      : field.label,
        fieldKey   : field.fieldKey,
        isRequired : field.isRequired,
        isSearchable: field.isSearchable,
        isIndexed  : field.isIndexed,
      })
    } else {
      form.resetFields()
    }
  }, [
    form,
    field?._id,
    field?.label,
    field?.fieldKey,
    field?.isRequired,
    field?.isSearchable,
    field?.isIndexed,
  ])

  if (!field) {
    return (
      <PanelWrapper>
        <PanelHeader>
          <PanelTitle>Cấu hình field</PanelTitle>
        </PanelHeader>
        <EmptyState>
          <EmptyStateIcon><SettingOutlined /></EmptyStateIcon>
          <EmptyStateText>Chọn một field để cấu hình</EmptyStateText>
        </EmptyState>
      </PanelWrapper>
    )
  }

  const fieldTypeMeta  = FIELD_TYPE_MAP[field.inputType]
  const isExisting     = field.id != null   // đã save lên BE
  const isDuplicateKey = isDuplicate(field.fieldKey, field._id)
  const isInvalidKey   = field.fieldKey && !isValidFieldKey(field.fieldKey)

  const handleConfigChange = (patch) => {
    updateConfig(field._id, patch)
  }

  return (
    <PanelWrapper>
      <PanelHeader>
        <PanelTitle>Cấu hình field</PanelTitle>
      </PanelHeader>

      <PanelBody>
        <Form
          form={form}
          layout="vertical"
          style={{ padding: 0 }}
        >

          {/* ── Section: Field ── */}
          <Section>
            <SectionTitle>Field</SectionTitle>

            {/* Nhãn */}
            <Form.Item label="Nhãn" name="label" style={{ marginBottom: 10 }}>
              <Input
                placeholder="Nhãn hiển thị"
                value={field.label}
                onChange={e => updateLabel(field._id, e.target.value)}
              />
            </Form.Item>

            {/* Mã field */}
            <Form.Item label="Mã field" name="fieldKey" style={{ marginBottom: 4 }}>
              <Input
                placeholder="field_key"
                value={field.fieldKey}
                style={{ fontFamily: 'monospace' }}
                onChange={e => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                  updateField(field._id, { fieldKey: val })
                  form.setFieldValue('fieldKey', val)
                }}
              />
            </Form.Item>

            {/* Hint / warning cho field_key */}
            {isExisting ? (
              <FieldKeyWarning>
                ⚠ Field đã lưu — thay đổi mã field có thể gây lỗi dữ liệu.
              </FieldKeyWarning>
            ) : isDuplicateKey ? (
              <FieldKeyWarning>Mã field bị trùng trong form này.</FieldKeyWarning>
            ) : isInvalidKey ? (
              <FieldKeyWarning>Mã field chỉ gồm [a-z0-9_], bắt đầu bằng chữ cái.</FieldKeyWarning>
            ) : (
              <FieldKeyHint>Tự động sinh từ nhãn. Dùng làm key trong API.</FieldKeyHint>
            )}

            {/* Placeholder — chỉ hiện với type có text input */}
            {['text','textarea','number','decimal','date','datetime','select','multi_select','lookup'].includes(field.inputType) && (
              <Form.Item label="Placeholder" style={{ marginBottom: 12 }}>
                <Input
                  placeholder="Nhập gợi ý cho người dùng..."
                  value={field.config?.placeholder ?? ''}
                  onChange={e => updateConfig(field._id, { placeholder: e.target.value })}
                />
              </Form.Item>
            )}

            {/* Kiểu input — readonly badge */}
            <Form.Item label="Kiểu input" style={{ marginBottom: 12 }}>
              <InputTypeBadge>
                {fieldTypeMeta?.label ?? field.inputType}
              </InputTypeBadge>
            </Form.Item>

          </Section>
          <SectionDivider />

          {/* ── Section: Bố cục cột ── */}
          <Section>
            <SectionTitle>Bố cục</SectionTitle>
            <Form.Item label="Số cột chiếm (Grid 24)" style={{ marginBottom: 8 }}>
              <ColSpanRow>
                <Slider
                  min={1}
                  max={24}
                  step={1}
                  value={field.colSpan ?? 24}
                  onChange={val => updateField(field._id, { colSpan: val })}
                  style={{ flex: 1 }}
                  tooltip={{ formatter: val => `${val}/24` }}
                />
                <ColSpanValue>{field.colSpan ?? 24}</ColSpanValue>
              </ColSpanRow>
              <ColSpanRow style={{ marginTop: 6, gap: 4 }}>
                {[6, 8, 12, 16, 24].map(n => (
                  <ColSpanPreset
                    key={n}
                    $active={(field.colSpan ?? 24) === n}
                    onClick={() => updateField(field._id, { colSpan: n })}
                  >
                    {n === 24 ? 'Full' : `${n}`}
                  </ColSpanPreset>
                ))}
              </ColSpanRow>
            </Form.Item>
          </Section>
          <SectionDivider />

          {/* ── Section: Toggles ── */}
          <Section>
            <ToggleRow>
              <ToggleLabel>Bắt buộc</ToggleLabel>
              <Switch
                checked={field.isRequired}
                onChange={val => {
                  updateField(field._id, { isRequired: val })
                  form.setFieldValue('isRequired', val)
                }}
              />
            </ToggleRow>

            <ToggleRow>
              <ToggleLabel>Cho phép tìm kiếm</ToggleLabel>
              <Switch
                checked={field.isSearchable}
                onChange={val => {
                  updateField(field._id, { isSearchable: val })
                  form.setFieldValue('isSearchable', val)
                }}
              />
            </ToggleRow>

            <ToggleRow>
              <ToggleLabel>
                Index (Solr)&nbsp;
                <Tooltip title="Sync field này lên Solr khi lưu submission.">
                  <InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: 11 }} />
                </Tooltip>
              </ToggleLabel>
              <Switch
                checked={field.isIndexed}
                onChange={val => {
                  updateField(field._id, { isIndexed: val })
                  form.setFieldValue('isIndexed', val)
                }}
              />
            </ToggleRow>
          </Section>
          <SectionDivider />

          {/* ── Section: Ràng buộc — dynamic ── */}
          <ConstraintSection
            field={field}
            onConfigChange={handleConfigChange}
          />

          {/* ── Section: Advanced (collapse) ── */}
          <AdvancedSection
            field={field}
            onUpdate={patch => updateField(field._id, patch)}
          />

        </Form>
      </PanelBody>
    </PanelWrapper>
  )
}

export default FieldConfigPanel
