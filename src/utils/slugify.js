/**
 * slugify.js
 *
 * Chuyển label tiếng Việt → field_key hợp lệ cho BE.
 * Quy tắc BE: chỉ [a-z0-9_], không dấu, không khoảng trắng.
 *
 * Ví dụ:
 *   "Định lượng (g/m²)" → "dinh_luong_g_m2"
 *   "Cấp độ bền màu"    → "cap_do_ben_mau"
 *   "Test Standard"     → "test_standard"
 */

const VI_MAP = {
  à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
  ă: 'a', ắ: 'a', ằ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
  â: 'a', ấ: 'a', ầ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
  è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
  ê: 'e', ế: 'e', ề: 'e', ể: 'e', ễ: 'e', ệ: 'e',
  ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
  ô: 'o', ố: 'o', ồ: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
  ơ: 'o', ớ: 'o', ờ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
  ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
  ư: 'u', ứ: 'u', ừ: 'u', ử: 'u', ữ: 'u', ự: 'u',
  ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
  đ: 'd',
  // uppercase
  À: 'a', Á: 'a', Ả: 'a', Ã: 'a', Ạ: 'a',
  Ă: 'a', Ắ: 'a', Ằ: 'a', Ẳ: 'a', Ẵ: 'a', Ặ: 'a',
  Â: 'a', Ấ: 'a', Ầ: 'a', Ẩ: 'a', Ẫ: 'a', Ậ: 'a',
  È: 'e', É: 'e', Ẻ: 'e', Ẽ: 'e', Ẹ: 'e',
  Ê: 'e', Ế: 'e', Ề: 'e', Ể: 'e', Ễ: 'e', Ệ: 'e',
  Ì: 'i', Í: 'i', Ỉ: 'i', Ĩ: 'i', Ị: 'i',
  Ò: 'o', Ó: 'o', Ỏ: 'o', Õ: 'o', Ọ: 'o',
  Ô: 'o', Ố: 'o', Ồ: 'o', Ổ: 'o', Ỗ: 'o', Ộ: 'o',
  Ơ: 'o', Ớ: 'o', Ờ: 'o', Ở: 'o', Ỡ: 'o', Ợ: 'o',
  Ù: 'u', Ú: 'u', Ủ: 'u', Ũ: 'u', Ụ: 'u',
  Ư: 'u', Ứ: 'u', Ừ: 'u', Ử: 'u', Ữ: 'u', Ự: 'u',
  Ỳ: 'y', Ý: 'y', Ỷ: 'y', Ỹ: 'y', Ỵ: 'y',
  Đ: 'd',
};

/**
 * Chuyển label → field_key hợp lệ.
 * @param {string} label
 * @returns {string} field_key — chỉ [a-z0-9_], không bắt đầu/kết thúc bằng _
 */
export function slugifyFieldKey(label = '') {
  return label
    .split('')
    .map(c => VI_MAP[c] ?? c)           // chuyển ký tự có dấu
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')        // ký tự không hợp lệ → _
    .replace(/^_+|_+$/g, '')            // trim _
    .replace(/_+/g, '_');               // nhiều _ liên tiếp → 1 _
}

/**
 * Kiểm tra field_key có hợp lệ không (để validate trong form).
 * @param {string} key
 * @returns {boolean}
 */
export function isValidFieldKey(key = '') {
  return /^[a-z][a-z0-9_]*$/.test(key);
}
