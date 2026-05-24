// ─── Step Types ───────────────────────────────────────────────────────────────
// Mỗi entry map sang antd token color để StepNode & StepPanel dùng chung
export const STEP_TYPES = {
  start: {
    label: 'Start',
    color: '#1677ff',       // antd blue
    bgColor: '#e6f4ff',
    borderColor: '#91caff',
  },
  process: {
    label: 'Process',
    color: '#52c41a',       // antd green
    bgColor: '#f6ffed',
    borderColor: '#b7eb8f',
  },
  approval: {
    label: 'Approval',
    color: '#fa8c16',       // antd orange
    bgColor: '#fff7e6',
    borderColor: '#ffd591',
  },
  condition: {
    label: 'Condition',
    color: '#722ed1',       // antd purple
    bgColor: '#f9f0ff',
    borderColor: '#d3adf7',
  },
  end: {
    label: 'End',
    color: '#f5222d',       // antd red
    bgColor: '#fff1f0',
    borderColor: '#ffa39e',
  },
}

export const STEP_TYPE_OPTIONS = Object.entries(STEP_TYPES).map(([value, { label }]) => ({
  value,
  label,
}))

// ─── Guard Types ──────────────────────────────────────────────────────────────
// Mỗi guard type có configFields mô tả các field cần render trong GuardItem
export const GUARD_TYPES = {
  form_field: {
    label: 'Form field required',
    description: 'Yêu cầu field trong form phải được điền',
    configFields: [
      { name: 'field_name', label: 'Tên field', type: 'input', required: true },
    ],
  },
  field_value: {
    label: 'Field value equals',
    description: 'Kiểm tra giá trị của một field',
    configFields: [
      { name: 'field_name', label: 'Tên field', type: 'input', required: true },
      { name: 'expected_value', label: 'Giá trị mong đợi', type: 'input', required: true },
      {
        name: 'operator',
        label: 'Toán tử',
        type: 'select',
        required: true,
        options: [
          { value: 'eq', label: '= (bằng)' },
          { value: 'neq', label: '≠ (khác)' },
          { value: 'gt', label: '> (lớn hơn)' },
          { value: 'gte', label: '≥ (lớn hơn hoặc bằng)' },
          { value: 'lt', label: '< (nhỏ hơn)' },
          { value: 'lte', label: '≤ (nhỏ hơn hoặc bằng)' },
        ],
      },
    ],
  },
  step_completed: {
    label: 'Step completed',
    description: 'Yêu cầu một bước khác đã hoàn thành',
    configFields: [
      { name: 'step_code', label: 'Code của bước', type: 'input', required: true },
    ],
  },
  sub_table: {
    label: 'Sub table check',
    description: 'Kiểm tra dữ liệu trong sub table',
    configFields: [
      { name: 'table_name', label: 'Tên bảng', type: 'input', required: true },
      { name: 'min_rows', label: 'Số dòng tối thiểu', type: 'number', required: false },
    ],
  },
}

export const GUARD_TYPE_OPTIONS = Object.entries(GUARD_TYPES).map(([value, { label }]) => ({
  value,
  label,
}))

// ─── Action Types ─────────────────────────────────────────────────────────────
export const ACTION_TYPES = {
  send_email: {
    label: 'Gửi email',
    configFields: [
      { name: 'to', label: 'Người nhận (field hoặc email)', type: 'input', required: true },
      { name: 'subject', label: 'Tiêu đề', type: 'input', required: true },
      { name: 'template', label: 'Template ID', type: 'input', required: false },
    ],
  },
  send_sms: {
    label: 'Gửi SMS',
    configFields: [
      { name: 'to', label: 'Số điện thoại (field)', type: 'input', required: true },
      { name: 'message', label: 'Nội dung', type: 'textarea', required: true },
    ],
  },
  call_webhook: {
    label: 'Call webhook',
    configFields: [
      { name: 'url', label: 'URL', type: 'input', required: true },
      {
        name: 'method',
        label: 'Method',
        type: 'select',
        required: true,
        options: [
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' },
        ],
      },
      { name: 'body_template', label: 'Body (JSON template)', type: 'textarea', required: false },
    ],
  },
  set_field: {
    label: 'Set giá trị field',
    configFields: [
      { name: 'field_name', label: 'Tên field', type: 'input', required: true },
      { name: 'value', label: 'Giá trị (hoặc template)', type: 'input', required: true },
    ],
  },
  notification: {
    label: 'Thông báo in-app',
    configFields: [
      { name: 'title', label: 'Tiêu đề', type: 'input', required: true },
      { name: 'message', label: 'Nội dung', type: 'textarea', required: false },
      { name: 'target_role', label: 'Role nhận (để trống = tất cả)', type: 'input', required: false },
    ],
  },
  task: {
    label: 'Tạo task',
    configFields: [
      { name: 'title', label: 'Tiêu đề task', type: 'input', required: true },
      { name: 'assign_to', label: 'Giao cho (field hoặc userId)', type: 'input', required: false },
      { name: 'due_offset_days', label: 'Hạn (số ngày từ hôm nay)', type: 'number', required: false },
    ],
  },
}

export const ACTION_TYPE_OPTIONS = Object.entries(ACTION_TYPES).map(([value, { label }]) => ({
  value,
  label,
}))

export const ACTION_TRIGGER_OPTIONS = [
  { value: 'on_enter', label: 'on_enter — khi vào bước' },
  { value: 'on_exit', label: 'on_exit — khi rời bước' },
]

// ─── Edge defaults ────────────────────────────────────────────────────────────
export const DEFAULT_TRANSITION = {
  label: '',
  require_note: false,
  guards: [],
  actions: [],
}

// ─── Node defaults ────────────────────────────────────────────────────────────
export const DEFAULT_STEP = {
  label: 'New Step',
  code: 'new_step',
  type: 'process',
  description: '',
  actions: [],
}
