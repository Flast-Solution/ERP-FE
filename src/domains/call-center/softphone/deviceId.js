const STORAGE_PREFIX = 'call-center.device.';

const randomId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
};

/* Bộ nhớ dự phòng khi localStorage bị chặn (chế độ riêng tư, ...) */
const memory = {};

/*
 * Mã thiết bị của trình duyệt này cho một tài khoản (máy nhánh).
 * Tạo một lần, lưu localStorage theo tài khoản, các lần sau dùng lại.
 */
export const getDeviceId = (account) => {
  const key = `${STORAGE_PREFIX}${account || 'default'}`;
  try {
    const saved = window.localStorage.getItem(key);
    if (saved) {
      return saved;
    }
    const created = randomId();
    window.localStorage.setItem(key, created);
    return created;
  } catch (error) {
    if (!memory[key]) {
      memory[key] = randomId();
    }
    return memory[key];
  }
};
