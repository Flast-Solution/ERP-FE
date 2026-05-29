/*
 * modes/index.js
 *
 * Registry tất cả AI modes.
 * Mỗi màn hình/use case đăng ký 1 entry.
 *
 * Shape của 1 mode config:
 * {
 *   contextLabel  : string                   — tên hiện trong context strip
 *   contextIcon   : string                   — tên icon antd
 *   getContextMeta: (context) => string      — meta text (số field, domain...)
 *   welcome       : string[]                 — các bubble welcome khi mở
 *   suggestions   : { icon, text }[]         — chip gợi ý
 * }
 *
 * Server Qwen-agent tự xử lý prompt — client chỉ cần truyền mode + context.
 * Thêm mode mới: tạo file trong modes/ rồi import vào đây.
 */

import formBuilder from './formBuilder'
import workflow    from './workflow'
import defaultMode from './default'

export const MODE_CONFIG = {
  form_builder: formBuilder,
  workflow    : workflow,
  default     : defaultMode,

  /*
   * Thêm sau khi cần:
   * product : product,
   * order   : order,
   * customer: customer,
   */
}

/*
 * Lấy config của một mode.
 * Fallback về default nếu mode không tồn tại.
 */
export function getMode(mode) {
  return MODE_CONFIG[mode] ?? MODE_CONFIG.default
}
