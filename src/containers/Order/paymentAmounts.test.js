import { getPaymentLineTotal } from './paymentAmounts';

test('uses backend totals without applying a second discount', () => {
  expect(getPaymentLineTotal({ total: 101, totalPrice: 0, priceOff: 10 })).toBe(101);
  expect(getPaymentLineTotal({ total: 0, price: 101, quantity: 1 })).toBe(0);
});
test('supports normalized details with only totalPrice', () => {
  expect(getPaymentLineTotal({ totalPrice: 101, price: 101, quantity: 1 })).toBe(101);
  expect(getPaymentLineTotal({ totalPrice: 26000 }, 'USD', 26000)).toBe(26000);
});
test('calculates a fallback only when both total fields are missing', () => {
  expect(getPaymentLineTotal({ price: 101, quantity: 1 })).toBe(101);
  expect(getPaymentLineTotal({ price: 2, quantity: 3, priceOff: 1 }, 'USD', 26000)).toBe(130000);
});
