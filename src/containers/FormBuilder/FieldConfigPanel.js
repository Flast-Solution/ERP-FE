/**
 * FieldConfigPanel.js
 *
 * Panel phải của Form Builder.
 * Hiện config của field đang được chọn trong canvas (selectedId).
 *
 * Sections:
 *   1. Field       — Nhãn, Mã field (field_key), Kiểu input (readonly badge)
 *   2. Toggles     — Bắt buộc, Cho phép tìm kiếm, Index (Solr), Làm tên cột
 *   3. Tùy chọn    — options editor (select/radio/checkbox...), ngay dưới toggles
 *   4. Ràng buộc   — dynamic theo inputType (min/max, accept, entity...)
 *   5. Advanced    — refDomain, autoGenerate, fieldRole (collapsed mặc định)
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

const OptionsEditor = ({ options = [], onChange, disabled = false }) => {
  const handleLabelChange = (index, value) => {
    if (disabled) return
    const next = options.map((o, i) =>
      i === index ? { ...o, label: value } : o
    )
    onChange(next)
  }

  const handleValueChange = (index, value) => {
    if (disabled) return
    const next = options.map((o, i) =>
      i === index ? { ...o, value } : o
    )
    onChange(next)
  }

  const handleRemove = (index) => {
    if (disabled) return
    onChange(options.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    if (disabled) return
    onChange([...options, { value: nanoid(6), label: '' }])
  }

  return (
    <>
      <OptionsList>
        {options.map((opt, index) => (
          <OptionRow key={index}>
            <Input
              placeholder="Nhãn"
              value={opt.label}
              disabled={disabled}
              onChange={e => handleLabelChange(index, e.target.value)}
              style={{ flex: 2 }}
            />
            <Input
              placeholder="Value"
              value={opt.value}
              disabled={disabled}
              onChange={e => handleValueChange(index, e.target.value)}
              style={{ flex: 1 }}
            />
            <OptionRemoveBtn disabled={disabled} onClick={() => handleRemove(index)}>
              <CloseCircleOutlined />
            </OptionRemoveBtn>
          </OptionRow>
        ))}
      </OptionsList>

      <AddOptionBtn disabled={disabled} onClick={handleAdd}>
        <PlusOutlined />
        Thêm tùy chọn
      </AddOptionBtn>
    </>
  )
}

const getFieldProvenance = (field) => field?._provenance ?? field?.config?.__provenance ?? null

const getSourceLabel = (source) => ({
  ai: 'AI',
  user: 'User',
  api: 'API',
  imported: 'Import',
}[source] ?? source ?? 'Unknown')

const getSourceColor = (source) => ({
  ai: '#1677ff',
  user: '#16a34a',
  api: '#64748b',
  imported: '#9333ea',
}[source] ?? '#64748b')

const SourceBadge = ({ field }) => {
  const provenance = getFieldProvenance(field)
  if (!provenance) return null

  const createdBy = provenance.createdBySource ?? provenance.source
  const updatedBy = provenance.updatedBySource
  const changedByOtherSource = updatedBy && updatedBy !== createdBy
  const color = getSourceColor(changedByOtherSource ? updatedBy : createdBy)

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        marginLeft: 8,
        padding: '2px 8px',
        borderRadius: 999,
        background: `${color}14`,
        color,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: '16px',
      }}
      title={changedByOtherSource
        ? `Tạo bởi ${getSourceLabel(createdBy)}, sửa bởi ${getSourceLabel(updatedBy)}`
        : `Tạo bởi ${getSourceLabel(createdBy)}`}
    >
      {changedByOtherSource
        ? `${getSourceLabel(createdBy)} → ${getSourceLabel(updatedBy)}`
        : getSourceLabel(createdBy)}
    </span>
  )
}

// ─── Options section (select / multi_select / radio / checkbox / autocomplete) ─

const OptionsSection = ({ field, onConfigChange, disabled = false }) => {
  const { inputType, config: rawConfig } = field
  const config = rawConfig ?? {}

  if (!['select', 'multi_select', 'radio', 'checkbox', 'autocomplete'].includes(inputType)) {
    return null
  }

  return (
  <>
    <SectionTitle style={{ marginTop: 12, marginBottom: 8 }}>
      {inputType === 'autocomplete' ? 'Gợi ý' : 'Tùy chọn'}
    </SectionTitle>
    <OptionsEditor
      options={config.options ?? []}
      onChange={opts => onConfigChange({ options: opts })}
      disabled={disabled}
    />
    {inputType === 'autocomplete' && (
      <>
        <Form.Item label="Value prop" style={{ marginBottom: 10, marginTop: 12 }}>
          <Input
            placeholder="value"
            value={config.valueProp ?? 'value'}
            disabled={disabled}
            onChange={e => onConfigChange({ valueProp: e.target.value })}
          />
        </Form.Item>
        <Form.Item label="Title prop" style={{ marginBottom: 0 }}>
          <Input
            placeholder="label"
            value={config.titleProp ?? 'label'}
            disabled={disabled}
            onChange={e => onConfigChange({ titleProp: e.target.value })}
          />
        </Form.Item>
      </>
    )}
  </>
  )
}

// ─── Constraint section — dynamic theo inputType ──────────────────────────────

const ConstraintSection = ({ field, onConfigChange }) => {
  const { inputType, config: rawConfig } = field
  const config = rawConfig ?? {}

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

  // lookup / select_api → entity + labelField
  if (inputType === 'lookup' || inputType === 'select_api') {
    return (
      <Section>
        <SectionTitle>{inputType === 'select_api' ? 'Cấu hình FormSelectAPI' : 'Cấu hình Lookup'}</SectionTitle>
        {inputType === 'select_api' && (
          <Form.Item
            label="API path"
            style={{ marginBottom: 10 }}
          >
            <Input
              placeholder="/customer/list"
              value={config.api ?? ''}
              onChange={e => onConfigChange({ api: e.target.value })}
            />
          </Form.Item>
        )}
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
        {inputType === 'select_api' && (
          <>
            <Form.Item label="Value prop" style={{ marginBottom: 10 }}>
              <Input
                placeholder="id"
                value={config.valueProp ?? 'id'}
                onChange={e => onConfigChange({ valueProp: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Title prop" style={{ marginBottom: 12 }}>
              <Input
                placeholder="name"
                value={config.titleProp ?? 'name'}
                onChange={e => onConfigChange({ titleProp: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Dữ liệu hiển thị" style={{ marginBottom: 10 }}>
              <Input
                placeholder="data?.valuesJson?.ten_menu"
                value={config.dataLabel ?? ''}
                onChange={e => onConfigChange({ dataLabel: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Dữ liệu gửi đi" style={{ marginBottom: 12 }}>
              <Input
                placeholder="data?.valuesJson?.so_thu_tu"
                value={config.dataValue ?? ''}
                onChange={e => onConfigChange({ dataValue: e.target.value })}
              />
            </Form.Item>
          </>
        )}
        <SectionDivider />
      </Section>
    )
  }

  return null
}

// ─── Advanced section (collapse) ─────────────────────────────────────────────

const AdvancedSection = ({ field, onUpdate }) => {
  const isLookup = ['lookup', 'select_api'].includes(field.inputType)

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
        enabled    : field.enabled,
      })
    } else {
      form.resetFields()
    }
  }, [form, field])

  if (!field) {
    return (
      <PanelWrapper>
        <PanelHeader>
          <PanelTitle>Cấu hình field</PanelTitle>
        </PanelHeader>
        <Form form={form} component={false} />
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
  const isAiLocked     = (getFieldProvenance(field)?.createdBySource ?? getFieldProvenance(field)?.source) === 'ai'

  const handleConfigChange = (patch) => {
    if (isAiLocked) return
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
          disabled={isAiLocked}
          style={{ padding: 0 }}
        >

          {/* ── Section: Field ── */}
          <Section>
            <SectionTitle>
              Field
              <SourceBadge field={field} />
            </SectionTitle>

            {/* Nhãn */}
            <Form.Item label="Nhãn" name="label" style={{ marginBottom: 10 }}>
              <Input
                placeholder="Nhãn hiển thị"
                value={field.label}
                disabled={isAiLocked}
                onChange={e => updateLabel(field._id, e.target.value)}
              />
            </Form.Item>

            {/* Mã field */}
            <Form.Item label="Mã field" name="fieldKey" style={{ marginBottom: 4 }}>
              <Input
                placeholder="field_key"
                value={field.fieldKey}
                disabled={isAiLocked}
                style={{ fontFamily: 'monospace' }}
                onChange={e => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                  updateField(field._id, { fieldKey: val })
                  form.setFieldValue('fieldKey', val)
                }}
              />
            </Form.Item>

            {/* Hint / warning cho field_key */}
            {isAiLocked ? (
              <FieldKeyWarning>Field do AI sinh đang khóa chỉnh sửa/kéo thả.</FieldKeyWarning>
            ) : isExisting ? (
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
            {['text','textarea','number','decimal','date','datetime','select','multi_select','lookup','select_api','autocomplete'].includes(field.inputType) && (
              <Form.Item label="Placeholder" style={{ marginBottom: 12 }}>
                <Input
                  placeholder="Nhập gợi ý cho người dùng..."
                  value={field.config?.placeholder ?? ''}
                  disabled={isAiLocked}
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
                  disabled={isAiLocked}
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
                    disabled={isAiLocked}
                    onClick={() => {
                      if (!isAiLocked) updateField(field._id, { colSpan: n })
                    }}
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
                disabled={isAiLocked}
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
                disabled={isAiLocked}
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
                disabled={isAiLocked}
                onChange={val => {
                  updateField(field._id, { isIndexed: val })
                  form.setFieldValue('isIndexed', val)
                }}
              />
            </ToggleRow>

            {field.inputType !== 'block' && (
            <ToggleRow>
              <ToggleLabel>
                Làm tên cột&nbsp;
                <Tooltip title="Hiển thị field này làm cột trong bảng danh sách dữ liệu.">
                  <InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: 11 }} />
                </Tooltip>
              </ToggleLabel>
              <Switch
                checked={field.enabled !== false}
                disabled={isAiLocked}
                onChange={val => {
                  updateField(field._id, { enabled: val })
                  form.setFieldValue('enabled', val)
                }}
              />
            </ToggleRow>
            )}

            <OptionsSection
              field={field}
              onConfigChange={handleConfigChange}
              disabled={isAiLocked}
            />
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
            onUpdate={patch => {
              if (!isAiLocked) updateField(field._id, patch)
            }}
          />

        </Form>
      </PanelBody>
    </PanelWrapper>
  )
}

export default FieldConfigPanel
