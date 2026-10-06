import { normalizeOrderDetail } from './OrderService';

jest.mock('@/configs', () => ({ SUCCESS_CODE: 200 }), { virtual: true });
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: {}, arrayEmpty: value => !value?.length }), { virtual: true });

test('preserves backend USD totals and falls back to USD sale price times quantity', () => {
  const order = { currency: 'USD', exchangeRate: 23000 };
  expect(normalizeOrderDetail({ price: 2, priceV: 46000, quantity: 100, totalPrice: 200 }, {}, order).totalPrice).toBe(200);
  expect(normalizeOrderDetail({ price: 2, priceV: 46000, quantity: 100 }, {}, order).totalPrice).toBe(200);
});

test('normalizes independent sale prices without currency conversion or inventing missing values', () => {
  const order = { currency: 'USD', exchangeRate: 23000 };
  expect(normalizeOrderDetail({ price: 2, priceV: 46000, productPrice: 1.7, quantity: 1000, totalPrice: 2000 }, {}, order))
    .toMatchObject({ price: 2, priceV: 46000, productPrice: 1.7, totalPrice: 2000 });
  expect(normalizeOrderDetail({ price: 0, priceV: 0 }, {}, order))
    .toMatchObject({ price: 0, priceV: 0 });
  expect(normalizeOrderDetail({ price: 2 }, {}, order).priceV).toBeNull();
  expect(normalizeOrderDetail({ priceV: 46000 }, {}, order).price).toBeNull();
});
