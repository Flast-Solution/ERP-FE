/*
 * modes/formBuilder.js — config cho Form Builder mode
 */

const formBuilder = {
  contextLabel  : 'Form Builder',
  contextIcon   : 'FileTextOutlined',

  getContextMeta(context) {
    if (!context?.fields) return 'Form Builder'
    const total    = context.fields.length
    const required = context.fields.filter(f => f.isRequired).length
    const name     = context.meta?.name ?? ''
    return [name, `${total} field`, `${required} bắt buộc`].filter(Boolean).join(' · ')
  },

  welcome: [
    'Em đang xem form của bạn trong <b>Form Builder</b>.',
    'Mô tả thay đổi bằng lời — em sẽ chỉnh sửa và đưa diff để duyệt.',
  ],

  suggestions: [
    { icon: 'PlusOutlined',     text: 'Thêm field ảnh mẫu sau thử giặt' },
    { icon: 'EditOutlined',     text: 'Đổi cấp bền màu thành slider 1–5' },
    { icon: 'SafetyOutlined',   text: 'Validate ảnh ≥ 1024px' },
    { icon: 'CalendarOutlined', text: 'Thêm field ngày thực hiện' },
  ],
}

export default formBuilder