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
    'Em đang xem form của bạn trong **Form Builder**.',
    'Mô tả thay đổi bằng lời — em sẽ chỉnh sửa và đưa diff để duyệt.',
  ],

  suggestions: [
    { icon: 'PlusOutlined',     text: 'Tôi cần trợ giúp về Form Builder' },
    { icon: 'EditOutlined',     text: 'Thêm field mới' }
  ]
}

export default formBuilder