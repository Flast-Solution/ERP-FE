import React, { useEffect, useMemo, useState } from 'react'
import { Button, Form, Input, InputNumber, Select } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { RequestUtils } from '@flast-erp/core/utils'
import { GUARD_TYPES } from '@/store/workflowConstants'
import { PanelBody, SectionLabel } from './styles'
import {
  CodeChip,
  ConditionBuilder,
  ConditionLabel,
  ConditionRow,
  ConfigSection,
  DrawerFooter,
  DrawerHeader,
  DrawerShell,
  DrawerSubtitle,
  DrawerTitle,
  FieldHelp,
  GuardTypeCard,
  GuardTypeDesc,
  GuardTypeGrid,
  GuardTypeHead,
  GuardTypeName,
  SectionTitle,
} from './guardDrawer.styles'

const { TextArea } = Input

const OPERATOR_OPTIONS = [
  { value: 'eq', label: '= (bằng)' },
  { value: 'neq', label: '≠ (khác)' },
  { value: 'gt', label: '> (lớn hơn)' },
  { value: 'gte', label: '≥ (lớn hơn hoặc bằng)' },
  { value: 'lt', label: '< (nhỏ hơn)' },
  { value: 'lte', label: '≤ (nhỏ hơn hoặc bằng)' },
]

const CONFIG_FIELD_NAMES = [
  'from_step',
  'field_name',
  'expected_value',
  'operator',
  'step_code',
  'form_key',
  'requirement',
  'table_name',
  'min_rows',
]

const normalizeGuardType = (type) => {
  if (type === 'form_field') return 'step_form_field'
  if (type === 'sub_table') return 'sub_table_count'
  return GUARD_TYPES[type] ? type : 'field_value'
}

const buildGroupedFieldOptions = (nodeForms = []) =>
  nodeForms.filter((form) => form.fields?.length > 0).map((form) => ({
    label: form.name,
    options: form.fields.map((field) => ({
      value: field.fieldKey ?? field.key ?? field.id ?? field.name,
      label: `${field.label ?? field.name ?? field.fieldKey ?? field.key} (${field.inputType ?? field.type ?? 'field'})`,
    })).filter((field) => field.value != null && field.value !== ''),
  }))

const getResponseArray = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.embedded)) return response.embedded
  if (Array.isArray(response?.data?.embedded)) return response.data.embedded
  if (Array.isArray(response?.items)) return response.items
  if (Array.isArray(response?.data?.items)) return response.data.items
  return []
}

const getFormTemplateId = (form = {}) =>
  form.templateId ?? form.template_id ?? form.formId ?? form.form_id ?? form.id

const normalizeFieldOption = (field = {}) => {
  const value = field.fieldKey ?? field.field_key ?? field.key ?? field.name ?? field.id
  const label = field.label ?? field.title ?? field.name ?? field.fieldKey ?? field.field_key ?? field.key
  const type = field.inputType ?? field.input_type ?? field.type

  if (value == null || value === '') return null

  return {
    value: String(value),
    label: `${label ?? value}${type ? ` (${type})` : ''}`,
  }
}

const fetchTemplateFieldOptions = async (forms = []) => {
  const formById = new Map()
  const templateIds = forms
    .map((form) => {
      const templateId = getFormTemplateId(form)
      if (templateId != null && templateId !== '') {
        formById.set(String(templateId), form)
      }
      return templateId
    })
    .filter((templateId) => templateId != null && templateId !== '')

  if (!templateIds.length) return []

  const response = await RequestUtils.Post(
    '/workflow/forms/template/find-template-field',
    templateIds
  )
  const items = getResponseArray(response)

  if (items.some((item) => Array.isArray(item?.fields))) {
    return items.map((item) => {
      const templateId = item.templateId ?? item.template_id ?? item.formId ?? item.form_id ?? item.id
      const form = formById.get(String(templateId)) ?? item
      const fields = (item.fields ?? [])
        .map(normalizeFieldOption)
        .filter(Boolean)

      return {
        label: form.name ?? form.label ?? item.name ?? item.label ?? `Form #${templateId}`,
        options: fields,
      }
    }).filter((group) => group.options.length > 0)
  }

  const groupedByTemplate = items.reduce((map, field) => {
    const templateId = field.templateId ?? field.template_id ?? field.formId ?? field.form_id
    const key = templateId != null && templateId !== '' ? String(templateId) : '__ungrouped__'
    const option = normalizeFieldOption(field)
    if (!option) return map

    if (!map.has(key)) map.set(key, [])
    map.get(key).push(option)
    return map
  }, new Map())

  return Array.from(groupedByTemplate.entries()).map(([templateId, options]) => {
    const form = formById.get(templateId)
    return {
      label: form?.name ?? form?.label ?? (templateId === '__ungrouped__' ? 'Fields' : `Form #${templateId}`),
      options,
    }
  }).filter((group) => group.options.length > 0)
}

const buildStepOptions = (nodes = []) =>
  nodes.map((node) => ({
    value: node?.data?.code || node.id,
    label: `${node?.data?.label || node.id}${node?.data?.code ? ` (${node.data.code})` : ''}`,
  }))

const getNodeFormsByStep = (nodes = [], stepCode) => {
  const node = nodes.find((item) =>
    item.id === stepCode || item?.data?.code === stepCode
  )

  return node?.data?.forms ?? []
}

const buildFormOptions = (forms = []) =>
  forms.map((form) => ({
    value: String(form.id ?? form.templateId ?? form.formId ?? form.key ?? form.name),
    label: form.name ?? form.label ?? String(form.id ?? form.templateId ?? form.formId ?? form.key),
  }))

const GuardTypePicker = ({ value, onChange }) => (
  <GuardTypeGrid>
    {Object.entries(GUARD_TYPES).map(([type, config]) => {
      const active = value === type

      return (
        <GuardTypeCard
          key={type}
          type="button"
          $active={active}
          onClick={() => onChange(type)}
        >
          <GuardTypeHead>
            <GuardTypeName>{config.label}</GuardTypeName>
            <CodeChip $active={active}>{type}</CodeChip>
          </GuardTypeHead>
          {config.description && (
            <GuardTypeDesc>{config.description}</GuardTypeDesc>
          )}
        </GuardTypeCard>
      )
    })}
  </GuardTypeGrid>
)

const FieldNameSelect = ({ name, label, rules, fieldOptions }) => {
  const hasFormFields = fieldOptions.length > 0

  return (
    <Form.Item name={name} label={label} rules={rules}>
      {hasFormFields ? (
        <Select
          showSearch
          placeholder="Chọn field từ form"
          options={fieldOptions}
          optionFilterProp="label"
          allowClear
        />
      ) : (
        <Input placeholder="Nhập tên field" />
      )}
    </Form.Item>
  )
}

const FieldValueConfig = ({
  fieldOptions,
  fieldsLoading,
  form,
  onFromStepChange,
  stepOptions,
}) => (
  <ConditionBuilder>
    <Form.Item
      name={['config', 'from_step']}
      label="Lấy field từ bước"
      rules={[{ required: true, message: 'Chọn bước' }]}
    >
      <Select
        showSearch
        placeholder="Chọn bước"
        options={stepOptions}
        optionFilterProp="label"
        allowClear
        onChange={(stepCode) => {
          form.setFieldValue(['config', 'field_name'], undefined)
          onFromStepChange(stepCode)
        }}
        onOpenChange={(open) => {
          if (!open) return
          const stepCode = form.getFieldValue(['config', 'from_step'])
          if (stepCode && fieldOptions.length === 0) {
            onFromStepChange(stepCode)
          }
        }}
      />
    </Form.Item>

    <Form.Item
      name={['config', 'field_name']}
      label="Field"
      rules={[{ required: true, message: 'Chọn field' }]}
    >
      <Select
        showSearch
        placeholder="Chọn field"
        options={fieldOptions}
        optionFilterProp="label"
        allowClear
        loading={fieldsLoading}
        disabled={fieldsLoading || fieldOptions.length === 0}
        notFoundContent={fieldsLoading ? 'Đang tải field...' : 'Bước này chưa có field'}
      />
    </Form.Item>

    <ConditionRow>
      <ConditionLabel>Khi</ConditionLabel>
      <Form.Item
        name={['config', 'operator']}
        rules={[{ required: true, message: 'Chọn toán tử' }]}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Select options={OPERATOR_OPTIONS} />
      </Form.Item>
      <Form.Item
        name={['config', 'expected_value']}
        rules={[{ required: true, message: 'Nhập giá trị' }]}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Input placeholder="giá trị" />
      </Form.Item>
    </ConditionRow>
    <FieldHelp>
      Chọn bước trước để lấy field từ các form đã gắn vào bước đó.
    </FieldHelp>
  </ConditionBuilder>
)

const StepFormFieldConfig = ({ form, stepOptions, formOptions }) => (
  <>
    <Form.Item
      name={['config', 'step_code']}
      label="Bước"
      rules={[{ required: true, message: 'Chọn bước' }]}
    >
      <Select
        showSearch
        placeholder="Chọn bước"
        options={stepOptions}
        optionFilterProp="label"
        allowClear
        onChange={() => {
          form.setFieldValue(['config', 'form_key'], undefined)
        }}
      />
    </Form.Item>

    <Form.Item name={['config', 'form_key']} label="Form">
      <Select
        showSearch
        placeholder="Tự động theo form của bước hoặc chọn form"
        options={formOptions}
        optionFilterProp="label"
        allowClear
        disabled={formOptions.length === 0}
      />
    </Form.Item>

    <Form.Item
      name={['config', 'requirement']}
      label="Yêu cầu"
      rules={[{ required: true, message: 'Chọn yêu cầu' }]}
    >
      <Select
        options={[
          { value: 'filled', label: 'Đã điền đầy đủ' },
          { value: 'not_filled', label: 'Chưa điền' },
        ]}
      />
    </Form.Item>
    <FieldHelp>Guard kiểm tra trạng thái form đã gắn vào bước được chọn.</FieldHelp>
  </>
)

const SubTableConfig = ({ guardType }) => (
  <>
    <Form.Item
      name={['config', 'table_name']}
      label="Bảng phụ"
      rules={[{ required: true, message: 'Nhập bảng phụ' }]}
    >
      <Input placeholder="Tên bảng phụ" />
    </Form.Item>

    {guardType === 'sub_table_count' && (
      <ConditionBuilder>
        <ConditionRow>
          <ConditionLabel>Số row</ConditionLabel>
          <Form.Item
            name={['config', 'operator']}
            rules={[{ required: true, message: 'Chọn toán tử' }]}
            style={{ width: 150 }}
          >
            <Select options={OPERATOR_OPTIONS} />
          </Form.Item>
          <Form.Item
            name={['config', 'expected_value']}
            rules={[{ required: true, message: 'Nhập số row' }]}
            style={{ flex: 1, minWidth: 0 }}
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="1" />
          </Form.Item>
        </ConditionRow>
      </ConditionBuilder>
    )}

    {guardType !== 'sub_table_count' && (
      <FieldHelp>Điều kiện chi tiết của từng row sẽ được engine xử lý theo cấu hình bảng phụ.</FieldHelp>
    )}
  </>
)

const GenericConfigFields = ({ fields = [], fieldOptions = [] }) => (
  <>
    {fields.map((field) => {
      const rules = field.required ? [{ required: true, message: `Nhập ${field.label}` }] : []
      const name = ['config', field.name]

      if (field.name === 'field_name') {
        return (
          <FieldNameSelect
            key={field.name}
            name={name}
            label={field.label}
            rules={rules}
            fieldOptions={fieldOptions}
          />
        )
      }

      if (field.type === 'textarea') {
        return (
          <Form.Item key={field.name} name={name} label={field.label} rules={rules}>
            <TextArea rows={3} placeholder={field.label} />
          </Form.Item>
        )
      }

      if (field.type === 'number') {
        return (
          <Form.Item key={field.name} name={name} label={field.label} rules={rules}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder={field.label} />
          </Form.Item>
        )
      }

      if (field.type === 'select') {
        return (
          <Form.Item key={field.name} name={name} label={field.label} rules={rules}>
            <Select options={field.options} placeholder={field.label} />
          </Form.Item>
        )
      }

      return (
        <Form.Item key={field.name} name={name} label={field.label} rules={rules}>
          <Input placeholder={field.label} />
        </Form.Item>
      )
    })}
  </>
)

const GuardConfigForm = ({
  guardType,
  configFields,
  fieldOptions,
  fieldsLoading,
  form,
  formOptions,
  onFromStepChange,
  stepOptions,
}) => {
  if (guardType === 'field_value') {
    return (
      <FieldValueConfig
        fieldOptions={fieldOptions}
        fieldsLoading={fieldsLoading}
        form={form}
        onFromStepChange={onFromStepChange}
        stepOptions={stepOptions}
      />
    )
  }

  if (guardType === 'step_form_field') {
    return (
      <StepFormFieldConfig
        form={form}
        formOptions={formOptions}
        stepOptions={stepOptions}
      />
    )
  }

  if (guardType === 'step_completed' && stepOptions.length > 0) {
    return (
      <>
        <Form.Item
          name={['config', 'step_code']}
          label="Code của bước"
          rules={[{ required: true, message: 'Chọn bước' }]}
        >
          <Select
            showSearch
            placeholder="Chọn bước cần hoàn thành"
            options={stepOptions}
            optionFilterProp="label"
            allowClear
          />
        </Form.Item>
        <FieldHelp>Engine sẽ kiểm tra bước này đã hoàn thành trước khi cho chuyển tiếp.</FieldHelp>
      </>
    )
  }

  if (guardType.startsWith('sub_table_')) {
    return <SubTableConfig guardType={guardType} />
  }

  return (
    <GenericConfigFields
      fields={configFields}
      fieldOptions={fieldOptions}
    />
  )
}

const GuardDrawer = ({
  guardIndex,
  initialValue,
  nodeForms = [],
  nodes = [],
  sourceStepCode,
  onConfirm,
  onCancel,
}) => {
  const [localForm] = Form.useForm()
  const [guardType, setGuardType] = useState(normalizeGuardType(initialValue?.type))
  const [fieldApiOptions, setFieldApiOptions] = useState([])
  const [fieldsLoading, setFieldsLoading] = useState(false)
  const guardConfig = GUARD_TYPES[guardType]
  const configFields = guardConfig?.configFields ?? []

  const fieldOptions = useMemo(() => buildGroupedFieldOptions(nodeForms), [nodeForms])
  const stepOptions = useMemo(() => buildStepOptions(nodes), [nodes])
  const selectedStepCode = Form.useWatch(['config', 'step_code'], localForm)
  const selectedStepForms = useMemo(
    () => getNodeFormsByStep(nodes, selectedStepCode),
    [nodes, selectedStepCode]
  )
  const formOptions = useMemo(() => buildFormOptions(selectedStepForms), [selectedStepForms])

  const handleFieldStepChange = (stepCode) => {
    if (!stepCode) {
      setFieldApiOptions([])
      return
    }

    setFieldApiOptions([])
    setFieldsLoading(true)

    fetchTemplateFieldOptions(getNodeFormsByStep(nodes, stepCode))
      .then((options) => {
        setFieldApiOptions(options)
      })
      .catch((error) => {
        console.error('[GuardDrawer] fetch template fields', error)
        setFieldApiOptions([])
      })
      .finally(() => {
        setFieldsLoading(false)
      })
  }

  useEffect(() => {
    const nextType = normalizeGuardType(initialValue?.type)
    setGuardType(nextType)
    localForm.setFieldsValue({
      type: nextType,
      config: {
        from_step: initialValue?.config?.from_step,
        operator: nextType === 'field_value' ? 'eq' : undefined,
        step_code: nextType === 'step_form_field' ? sourceStepCode : undefined,
        requirement: nextType === 'step_form_field' ? 'filled' : undefined,
        ...initialValue?.config,
      },
    })
  }, [initialValue, localForm, sourceStepCode])

  const handleTypeChange = (nextType) => {
    setGuardType(nextType)
    setFieldApiOptions([])
    CONFIG_FIELD_NAMES.forEach((fieldName) => {
      localForm.setFieldValue(['config', fieldName], undefined)
    })
    localForm.setFieldsValue({
      type: nextType,
      config: {
        from_step: undefined,
        operator: ['field_value', 'sub_table_count'].includes(nextType) ? 'eq' : undefined,
        step_code: nextType === 'step_form_field' ? sourceStepCode : undefined,
        requirement: nextType === 'step_form_field' ? 'filled' : undefined,
      },
    })
  }

  const handleConfirm = () => {
    localForm
      .validateFields()
      .then((values) => onConfirm(values))
      .catch(() => {})
  }

  return (
    <DrawerShell>
      <DrawerHeader>
        <div>
          <SectionLabel style={{ margin: 0 }}>Guard {guardIndex + 1}</SectionLabel>
          <DrawerTitle>
            {initialValue?.config && Object.keys(initialValue.config).length > 0
              ? 'Cấu hình guard'
              : 'Thêm guard cho transition'}
          </DrawerTitle>
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
          preserve={false}
          initialValues={{
            type: normalizeGuardType(initialValue?.type),
            config: {
              from_step: initialValue?.config?.from_step,
              operator: normalizeGuardType(initialValue?.type) === 'field_value' ? 'eq' : undefined,
              step_code: normalizeGuardType(initialValue?.type) === 'step_form_field' ? sourceStepCode : undefined,
              requirement: normalizeGuardType(initialValue?.type) === 'step_form_field' ? 'filled' : undefined,
              ...initialValue?.config,
            },
          }}
        >
          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>

          <Form.Item label="Loại guard" style={{ marginBottom: 0 }}>
            <GuardTypePicker value={guardType} onChange={handleTypeChange} />
          </Form.Item>

          {configFields.length > 0 && (
            <ConfigSection>
              <SectionTitle>Cấu hình</SectionTitle>
              <GuardConfigForm
                guardType={guardType}
                configFields={configFields}
                fieldOptions={guardType === 'field_value' ? fieldApiOptions : fieldOptions}
                fieldsLoading={fieldsLoading}
                form={localForm}
                formOptions={formOptions}
                onFromStepChange={handleFieldStepChange}
                stepOptions={stepOptions}
              />
            </ConfigSection>
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
    </DrawerShell>
  )
}

export default GuardDrawer
