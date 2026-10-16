import { shouldConfirmProductLeave } from './productFormEdit';

test('mở form rồi thoát ngay thì không hỏi', () => {
  expect(shouldConfirmProductLeave(false)).toBe(false);
});

test('đã sửa rồi thoát thì hỏi xác nhận', () => {
  expect(shouldConfirmProductLeave(true)).toBe(true);
});
