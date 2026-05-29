/*
 * modes/default.js — config cho general mode (FAB không có context)
 */

const defaultMode = {
  contextLabel  : 'Flast NoCode',
  contextIcon   : 'ThunderboltOutlined',

  getContextMeta() {
    return 'Trợ lý chung'
  },

  welcome: [
    'Xin chào! Em là trợ lý AI của <b>Flast NoCode</b>.',
    'Em có thể giúp bạn với form, workflow, sản phẩm, đơn hàng và nhiều hơn nữa.',
  ],

  suggestions: [
    { icon: 'FormOutlined',        text: 'Hướng dẫn tạo form động' },
    { icon: 'ApartmentOutlined',   text: 'Cách cấu hình workflow' },
    { icon: 'QuestionCircleOutlined', text: 'Guard là gì?' },
    { icon: 'RocketOutlined',      text: 'Bắt đầu nhanh với Flast NoCode' },
  ],
}

export default defaultMode