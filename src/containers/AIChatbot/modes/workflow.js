/*
 * modes/workflow.js — config cho Workflow Designer mode
 */

const workflow = {
  contextLabel  : 'Workflow Designer',
  contextIcon   : 'ApartmentOutlined',

  getContextMeta(context) {
    if (!context) return 'Workflow Designer'
    const steps  = context.steps?.length ?? 0
    const domain = context.domain ?? ''
    return [domain, `${steps} bước`].filter(Boolean).join(' · ')
  },

  welcome: [
    'Em đang xem workflow của bạn trong <b>Workflow Designer</b>.',
    'Mô tả thay đổi — em sẽ gợi ý guard, action hoặc thêm bước mới.',
  ],

  suggestions: [
    { icon: 'PlusOutlined',        text: 'Thêm bước kiểm duyệt' },
    { icon: 'SafetyOutlined',      text: 'Thêm guard kiểm tra field bắt buộc' },
    { icon: 'ThunderboltOutlined', text: 'Gửi email khi vào bước confirmed' },
    { icon: 'BranchesOutlined',    text: 'Tách luồng theo vai trò' },
  ],
}

export default workflow