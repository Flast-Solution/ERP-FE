import React, { useEffect, useState } from 'react'
import { Button, Form, Input, InputNumber, Select, Switch } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { RequestUtils } from '@flast-erp/core/utils'
import { PanelBody, SectionLabel } from './styles'
import {
  CodeChip,
  ConditionBuilder,
  ConditionRow,
  ConfigSection,
  DrawerFooter,
  DrawerHeader,
  DrawerShell,
  DrawerSubtitle,
  DrawerTitle,
  GuardTypeCard,
  GuardTypeDesc,
  GuardTypeGrid,
  GuardTypeHead,
  GuardTypeName,
  FieldHelp,
  SectionTitle,
} from './guardDrawer.styles'

const { TextArea } = Input

const ACTION_TYPE_DEFS = {
  send_email: {
    label: 'Gửi email',
    desc: 'Gửi email cho người nhận theo field hoặc email cố định.',
    sectionTitle: 'Nội dung email',
    configFields: [
      { name: 'to', label: 'Người nhận', type: 'input', required: true, placeholder: 'email@domain.com hoặc {{field.email}}' },
      { name: 'subject', label: 'Tiêu đề', type: 'input', required: true, placeholder: 'Tiêu đề email' },
      { name: 'template', label: 'Template ID', type: 'input', required: false, placeholder: 'ID template email' },
    ],
  },
  send_sms: {
    label: 'Gửi SMS',
    desc: 'Gửi SMS cho số điện thoại lấy từ field hoặc giá trị cố định.',
    sectionTitle: 'Nội dung SMS',
    configFields: [
      { name: 'to', label: 'Số điện thoại', type: 'input', required: true, placeholder: '098... hoặc {{field.phone}}' },
      { name: 'message', label: 'Nội dung', type: 'textarea', required: true, placeholder: 'Nội dung tin nhắn' },
    ],
  },
  call_webhook: {
    label: 'Gọi webhook',
    desc: 'Gọi webhook sang hệ thống ngoài khi bước được kích hoạt.',
    sectionTitle: 'HTTP request',
  },
  set_field: {
    label: 'Set giá trị field',
    desc: 'Gán hoặc cập nhật giá trị một field trong dữ liệu quy trình.',
    sectionTitle: 'Set giá trị field',
  },
  notification: {
    label: 'Push notification',
    desc: 'Tạo thông báo in-app cho người dùng hoặc vai trò liên quan.',
    sectionTitle: 'Người nhận & nội dung',
  },
  task: {
    label: 'Tạo task',
    desc: 'Tạo task theo ngữ cảnh bước hiện tại.',
    sectionTitle: 'Task',
  },
}

const FIXED_ACTION_TYPES = [
  'send_email',
  'send_sms',
  'call_webhook',
  'set_field',
  'notification',
  'task',
]

const TRIGGER_LABELS = {
  on_enter: 'khi vào bước',
  on_exit: 'khi rời bước',
}

const RECIPIENT_OPTIONS = [
  { value: 'sample_customer', label: 'Khách hàng của mẫu' },
  { value: 'step_assignee', label: 'KTV phụ trách bước' },
  { value: 'custom', label: 'Tuỳ chỉnh' },
]

const TEMPLATE_OPTIONS = [
  { value: 'default', label: 'Template mặc định' },
  { value: 'result_ready', label: 'Thông báo có kết quả' },
  { value: 'request_info', label: 'Yêu cầu bổ sung thông tin' },
]

const ASSIGNEE_OPTIONS = [
  { value: 'step_assignee', label: 'KTV phụ trách bước' },
  { value: 'creator', label: 'Người tạo mẫu' },
  { value: 'role_manager', label: 'Quản lý phụ trách' },
]

const DEADLINE_OPTIONS = [
  { value: '1d', label: 'Trong 1 ngày' },
  { value: '2d', label: 'Trong 2 ngày' },
  { value: '3d', label: 'Trong 3 ngày' },
  { value: 'custom', label: 'Tuỳ chỉnh' },
]

const normalizeActionType = (type) =>
  ACTION_TYPE_DEFS[type] ? type : 'send_email'

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

const getResponseArray = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.embedded)) return response.embedded
  if (Array.isArray(response?.data?.embedded)) return response.data.embedded
  if (Array.isArray(response?.items)) return response.items
  if (Array.isArray(response?.data?.items)) return response.data.items
  return []
}

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

const getFormId = (form = {}) =>
  form.templateId ?? form.template_id ?? form.formId ?? form.form_id ?? form.id

const fetchStepFieldOptions = async (forms = []) => {
  const formIds = forms
    .map(getFormId)
    .filter((id) => id != null && id !== '')

  if (!formIds.length) return []

  const response = await RequestUtils.Post(
    '/workflow/forms/template/find-template-field',
    formIds
  )

  return getResponseArray(response)
    .flatMap((item) => Array.isArray(item?.fields) ? item.fields : [item])
    .map(normalizeFieldOption)
    .filter(Boolean)
}

const getDefaultConfig = (type) => {
  const label = ACTION_TYPE_DEFS[type]?.label ?? 'Action'

  if (type === 'call_webhook') {
    return {
      method: 'POST',
      url: 'https://',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body_template: '{\n  "sample_id": "{{sample.id}}"\n}',
      retry_count: 3,
      timeout_seconds: 15,
      display_name: label,
      async: true,
    }
  }

  if (type === 'set_field') {
    return {
      value: 'true · KD-{{sample.id}} · {{values.wash_grade}}',
      display_name: label,
      async: true,
    }
  }

  if (type === 'send_email') {
    return {
      recipient: 'sample_customer',
      display_name: label,
      async: true,
    }
  }

  if (type === 'send_sms') {
    return {
      recipient: 'sample_customer',
      display_name: 'Gửi SMS',
      async: true,
    }
  }

  if (type === 'task') {
    return {
      assign_to: 'step_assignee',
      title: 'Tiếp nhận mẫu {{sample.id}}',
      deadline: '1d',
      display_name: label,
      async: true,
    }
  }

  if (type === 'notification') {
    return {
      recipient: 'step_assignee',
      message: 'Mẫu {{sample.id}} đã có kết quả.',
      display_name: label,
      async: true,
    }
  }

  return {
    display_name: label,
    async: true,
  }
}

const ActionTypePicker = ({ value, onChange }) => (
  <GuardTypeGrid>
    {FIXED_ACTION_TYPES.map((type) => {
      const config = ACTION_TYPE_DEFS[type]
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
          <GuardTypeDesc>{config.desc}</GuardTypeDesc>
        </GuardTypeCard>
      )
    })}
  </GuardTypeGrid>
)

const ConfigFields = ({ fields = [] }) => (
  <>
    {fields.map((field) => {
      const rules = field.required ? [{ required: true, message: `Nhập ${field.label}` }] : []
      const name = ['config', field.name]

      if (field.type === 'textarea') {
        return (
          <Form.Item key={field.name} name={name} label={field.label} rules={rules}>
            <TextArea rows={3} placeholder={field.placeholder ?? field.label} />
          </Form.Item>
        )
      }

      if (field.type === 'number') {
        return (
          <Form.Item key={field.name} name={name} label={field.label} rules={rules}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder={field.placeholder ?? field.label} />
          </Form.Item>
        )
      }

      if (field.type === 'select') {
        return (
          <Form.Item key={field.name} name={name} label={field.label} rules={rules}>
            <Select options={field.options} placeholder={field.placeholder ?? field.label} />
          </Form.Item>
        )
      }

      return (
        <Form.Item key={field.name} name={name} label={field.label} rules={rules}>
          <Input placeholder={field.placeholder ?? field.label} />
        </Form.Item>
      )
    })}
  </>
)

const WebhookConfig = () => (
  <>
    <Form.Item
      name={['config', 'method']}
      label="Method"
      rules={[{ required: true, message: 'Chọn method' }]}
    >
      <Select
        options={[
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' },
        ]}
      />
    </Form.Item>
    <Form.Item
      name={['config', 'url']}
      label="URL"
      rules={[{ required: true, message: 'Nhập URL' }]}
    >
      <Input placeholder="https://" />
    </Form.Item>
    <FieldHelp>Hỗ trợ {'{{sample.id}}'}, {'{{values.fieldKey}}'}, {'{{secrets.…}}'}.</FieldHelp>

    <SectionTitle style={{ marginTop: 14 }}>Headers</SectionTitle>
    <Form.List name={['config', 'headers']}>
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }) => (
            <ConditionRow key={key} style={{ marginBottom: 8 }}>
              <Form.Item
                {...restField}
                name={[name, 'key']}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input placeholder="Content-Type" />
              </Form.Item>
              <Form.Item
                {...restField}
                name={[name, 'value']}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input placeholder="application/json" />
              </Form.Item>
              <Button size="small" onClick={() => remove(name)}>Xóa</Button>
            </ConditionRow>
          ))}
          <Button size="small" onClick={() => add({ key: '', value: '' })}>
            Thêm header
          </Button>
        </>
      )}
    </Form.List>

    <Form.Item name={['config', 'body_template']} label="Body" style={{ marginTop: 14 }}>
      <TextArea rows={5} />
    </Form.Item>
    <FieldHelp>Template JSON; hỗ trợ {'{{...}}'} như trên.</FieldHelp>

    <ConditionBuilder style={{ marginTop: 14 }}>
      <ConditionRow>
        <Form.Item name={['config', 'retry_count']} label="Số lần thử lại" style={{ flex: 1, marginBottom: 0 }}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name={['config', 'timeout_seconds']} label="Timeout (giây)" style={{ flex: 1, marginBottom: 0 }}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
      </ConditionRow>
    </ConditionBuilder>
  </>
)

const SetFieldConfig = ({
  fieldOptions,
  fieldsLoading,
  onTargetStepChange,
  stepOptions,
}) => (
  <>
    <Form.Item
      name={['config', 'target_step']}
      label="Bước đích"
      rules={[{ required: true, message: 'Chọn bước đích' }]}
    >
      <Select
        showSearch
        placeholder="— Chọn bước —"
        options={stepOptions}
        optionFilterProp="label"
        allowClear
        onChange={onTargetStepChange}
      />
    </Form.Item>
    <FieldHelp>Có thể set field trên bước phía sau để pre-fill / đánh dấu trạng thái.</FieldHelp>

    <Form.Item
      name={['config', 'field_name']}
      label="Field đích"
      rules={[{ required: true, message: 'Chọn field đích' }]}
      style={{ marginTop: 12 }}
    >
      <Select
        showSearch
        placeholder="— Chọn field —"
        options={fieldOptions}
        optionFilterProp="label"
        allowClear
        loading={fieldsLoading}
        disabled={fieldsLoading || fieldOptions.length === 0}
      />
    </Form.Item>

    <Form.Item
      name={['config', 'value']}
      label="Giá trị"
      rules={[{ required: true, message: 'Nhập giá trị' }]}
    >
      <Input placeholder="true · KD-{{sample.id}} · {{values.wash_grade}}" />
    </Form.Item>
    <FieldHelp>Có thể là hằng (true, 3.5) hoặc expression {'{{values.field_key}}'}.</FieldHelp>
  </>
)

const EmailOrSmsConfig = ({ type }) => (
  <>
    <Form.Item
      name={['config', 'recipient']}
      label="Người nhận"
      rules={[{ required: true, message: 'Chọn người nhận' }]}
    >
      <Select options={RECIPIENT_OPTIONS} />
    </Form.Item>
    <Form.Item name={['config', 'template']} label="Template">
      <Select
        placeholder="— Chọn template —"
        options={TEMPLATE_OPTIONS}
        allowClear
      />
    </Form.Item>
    {type === 'send_sms' && (
      <FieldHelp>SMS dùng template ngắn phù hợp cho điện thoại khách hàng.</FieldHelp>
    )}
  </>
)

const TaskConfig = () => (
  <>
    <Form.Item name={['config', 'assign_to']} label="Giao cho">
      <Select options={ASSIGNEE_OPTIONS} />
    </Form.Item>
    <Form.Item
      name={['config', 'title']}
      label="Tiêu đề task"
      rules={[{ required: true, message: 'Nhập tiêu đề task' }]}
    >
      <Input placeholder="Tiếp nhận mẫu {{sample.id}}" />
    </Form.Item>
    <Form.Item name={['config', 'deadline']} label="Deadline">
      <Select options={DEADLINE_OPTIONS} />
    </Form.Item>
  </>
)

const NotificationConfig = () => (
  <>
    <Form.Item name={['config', 'recipient']} label="Người nhận">
      <Select options={ASSIGNEE_OPTIONS} />
    </Form.Item>
    <Form.Item
      name={['config', 'message']}
      label="Nội dung"
      rules={[{ required: true, message: 'Nhập nội dung' }]}
    >
      <TextArea rows={3} placeholder="Mẫu {{sample.id}} đã có kết quả." />
    </Form.Item>
  </>
)

const CommonConfig = () => (
  <ConfigSection>
    <SectionTitle>Cấu hình chung</SectionTitle>
    <Form.Item
      name={['config', 'display_name']}
      label="Tên hiển thị"
      rules={[{ required: true, message: 'Nhập tên hiển thị' }]}
    >
      <Input />
    </Form.Item>
    <FieldHelp>Tự đề xuất, có thể sửa.</FieldHelp>
    <Form.Item
      name={['config', 'async']}
      label="Chạy async"
      valuePropName="checked"
      style={{ marginTop: 12, marginBottom: 0 }}
    >
      <Switch size="small" />
    </Form.Item>
    <FieldHelp>Action chạy ngầm, không chặn chuyển bước. Lỗi sẽ ghi audit log nhưng không rollback.</FieldHelp>
  </ConfigSection>
)

const ActionDrawer = ({
  actionIndex,
  initialValue,
  isNew,
  nodes = [],
  onConfirm,
  onCancel,
}) => {
  const [localForm] = Form.useForm()
  const [actionType, setActionType] = useState(normalizeActionType(initialValue?.type))
  const [fieldOptions, setFieldOptions] = useState([])
  const [fieldsLoading, setFieldsLoading] = useState(false)
  const actionConfig = ACTION_TYPE_DEFS[actionType]
  const trigger = initialValue?.trigger ?? 'on_enter'
  const stepOptions = buildStepOptions(nodes)

  useEffect(() => {
    const nextType = normalizeActionType(initialValue?.type)
    setActionType(nextType)
    setFieldOptions([])
    localForm.setFieldsValue({
      type: nextType,
      trigger,
      config: {
        ...getDefaultConfig(nextType),
        ...(initialValue?.config ?? {}),
      },
    })
  }, [initialValue, localForm, trigger])

  const handleTypeChange = (nextType) => {
    setActionType(nextType)
    setFieldOptions([])
    localForm.setFieldsValue({
      type: nextType,
      trigger,
      config: getDefaultConfig(nextType),
    })
  }

  const handleTargetStepChange = async (stepCode) => {
    localForm.setFieldValue(['config', 'field_name'], undefined)
    setFieldOptions([])

    if (!stepCode) return

    setFieldsLoading(true)
    try {
      const forms = getNodeFormsByStep(nodes, stepCode)
      const nextFields = await fetchStepFieldOptions(forms)
      setFieldOptions(nextFields)
    } catch (error) {
      console.error('[WorkflowDesigner][ActionDrawer] fetch target step fields failed', error)
    } finally {
      setFieldsLoading(false)
    }
  }

  const handleConfirm = () => {
    localForm
      .validateFields()
      .then((values) => onConfirm({
        ...values,
        trigger,
        config: values.config ?? {},
      }))
      .catch(() => {})
  }

  const renderActionConfig = () => {
    if (actionType === 'call_webhook') {
      return <WebhookConfig />
    }

    if (actionType === 'set_field') {
      return (
        <SetFieldConfig
          fieldOptions={fieldOptions}
          fieldsLoading={fieldsLoading}
          onTargetStepChange={handleTargetStepChange}
          stepOptions={stepOptions}
        />
      )
    }

    if (actionType === 'send_email' || actionType === 'send_sms') {
      return <EmailOrSmsConfig type={actionType} />
    }

    if (actionType === 'task') {
      return <TaskConfig />
    }

    if (actionType === 'notification') {
      return <NotificationConfig />
    }

    return <ConfigFields fields={actionConfig?.configFields ?? []} />
  }

  return (
    <DrawerShell>
      <DrawerHeader>
        <div>
          <SectionLabel style={{ margin: 0 }}>
            Action {actionIndex + 1} · {TRIGGER_LABELS[trigger] ?? trigger}
          </SectionLabel>
          <DrawerTitle>{isNew ? 'Thêm action cho bước' : 'Cấu hình action'}</DrawerTitle>
          {actionConfig?.label && (
            <DrawerSubtitle>{actionConfig.desc}</DrawerSubtitle>
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
          component={false}
          preserve={false}
          initialValues={{
            type: normalizeActionType(initialValue?.type),
            trigger,
            config: {
              ...getDefaultConfig(normalizeActionType(initialValue?.type)),
              ...(initialValue?.config ?? {}),
            },
          }}
        >
          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="trigger" hidden>
            <Input />
          </Form.Item>

          <Form.Item label="Loại action" style={{ marginBottom: 0 }}>
            <ActionTypePicker value={actionType} onChange={handleTypeChange} />
          </Form.Item>

          <ConfigSection>
            <SectionTitle>{actionConfig.sectionTitle ?? 'Cấu hình'}</SectionTitle>
            {renderActionConfig()}
          </ConfigSection>

          <CommonConfig />
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

export default ActionDrawer
