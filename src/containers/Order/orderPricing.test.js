import { calculateUsdLineTotal } from './orderPricing';

const calculate = overrides => calculateUsdLineTotal({
  item: { productPrice: 100, quantity: 2, profit: 20 },
  shippingCost: 10,
  currency: 'USD',
  exchangeRate: 25000,
  ...overrides,
});

test('preserves the default price times quantity formula in USD regardless of exchange rate', () => {
  expect(calculate({})).toBe(200);
  expect(calculate({ exchangeRate: 26000 })).toBe(200);
  expect(calculate({ currency: 'VND' })).toBe(200);
});

test('preserves configured profit and shipping calculations when inputs change', () => {
  const formula = '(price * quantity + shippingCost) / (1 - profit%)';
  expect(calculate({ formula })).toBe(262.5);
  expect(calculate({ formula, shippingCost: 20 })).toBe(275);
  expect(calculate({ formula, item: { productPrice: 100, quantity: 2, profit: 0 } })).toBe(210);
});

test('preserves fallback for invalid formulas', () => {
  expect(calculate({ formula: 'unknown + price' })).toBe(200);
});

test('keeps fractional USD amounts rather than rounding to whole VND', () => {
  expect(calculate({ item: { productPrice: 1.48, quantity: 3 } })).toBe(4.44);
});
