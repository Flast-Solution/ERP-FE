// ─── Step Types ───────────────────────────────────────────────────────────────
// Mỗi entry map sang antd token color để StepNode & StepPanel dùng chung
export const STEP_TYPES = {
  start: {
    label: 'Bước đầu',
    color: '#1677ff',
    bgColor: '#e6f4ff',
    borderColor: '#91caff',
  },
  process: {
    label: 'Bước kiểm tra',
    color: '#1677ff',
    bgColor: '#e6f4ff',
    borderColor: '#91caff',
  },
  approval: {
    label: 'Bước duyệt',
    color: '#fa8c16',
    bgColor: '#fff7e6',
    borderColor: '#ffd591',
  },
  condition: {
    label: 'Bước đạt / cấp',
    color: '#52c41a',
    bgColor: '#f6ffed',
    borderColor: '#b7eb8f',
  },
  end: {
    label: 'Bước không đạt',
    color: '#f5222d',
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
  field_value: {
    label: 'Field tại bước nguồn',
    description: 'So sánh giá trị một field trong form đã điền ở bước nào đó với một hằng số.',
    configFields: [
      { name: 'from_step', label: 'Lấy field từ bước', type: 'select', required: true },
      { name: 'field_name', label: 'Tên field', type: 'input', required: true },
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
      { name: 'expected_value', label: 'Giá trị mong đợi', type: 'input', required: true },
    ],
  },
  step_form_field: {
    label: 'Form của bước đã điền',
    description: 'Yêu cầu form gắn vào một bước phải được điền đầy đủ (hoặc ngược lại).',
    configFields: [
      { name: 'step_code', label: 'Bước', type: 'input', required: true },
      { name: 'form_key', label: 'Form', type: 'input', required: false },
      {
        name: 'requirement',
        label: 'Yêu cầu',
        type: 'select',
        required: true,
        options: [
          { value: 'filled', label: 'Đã điền đầy đủ' },
          { value: 'not_filled', label: 'Chưa điền' },
        ],
      },
    ],
  },
  step_completed: {
    label: 'Bước đã hoàn thành',
    description: 'Một bước nào đó trong quy trình phải đã chuyển xong.',
    configFields: [
      { name: 'step_code', label: 'Code của bước', type: 'input', required: true },
    ],
  },
  sub_table_all: {
    label: 'Bảng phụ — tất cả thỏa',
    description: 'Mọi row trong bảng phụ phải pass điều kiện.',
    configFields: [
      { name: 'table_name', label: 'Bảng phụ', type: 'input', required: true },
    ],
  },
  sub_table_any: {
    label: 'Bảng phụ — ít nhất một thỏa',
    description: 'Có ít nhất một row pass điều kiện.',
    configFields: [
      { name: 'table_name', label: 'Bảng phụ', type: 'input', required: true },
    ],
  },
  sub_table_none: {
    label: 'Bảng phụ — không có row nào thỏa',
    description: 'Không row nào pass — đảm bảo không có lỗi.',
    configFields: [
      { name: 'table_name', label: 'Bảng phụ', type: 'input', required: true },
    ],
  },
  sub_table_count: {
    label: 'Bảng phụ — đếm số row',
    description: 'So sánh số lượng row với một hằng số.',
    configFields: [
      { name: 'table_name', label: 'Bảng phụ', type: 'input', required: true },
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
      { name: 'expected_value', label: 'Số row', type: 'number', required: true },
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
    label: 'Gọi webhook',
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
    label: 'Push notification',
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
  type: '',
  description: '',
  actions: [],
}
