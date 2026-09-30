import { calculateConvertedLineTotal } from './orderPricing';

const calculate = overrides => calculateConvertedLineTotal({
  item: { productPrice: 100, quantity: 2, profit: 20 },
  shippingCost: 10,
  currency: 'USD',
  exchangeRate: 25000,
  ...overrides,
});

test('preserves the default price times quantity formula and currency conversion', () => {
  expect(calculate({})).toBe(5000000);
  expect(calculate({ exchangeRate: 26000 })).toBe(5200000);
  expect(calculate({ currency: 'VND' })).toBe(200);
});

test('preserves configured profit and shipping calculations when inputs change', () => {
  const formula = '(price * quantity + shippingCost) / (1 - profit%)';
  expect(calculate({ formula })).toBe(6562500);
  expect(calculate({ formula, shippingCost: 20 })).toBe(6875000);
  expect(calculate({ formula, item: { productPrice: 100, quantity: 2, profit: 0 } })).toBe(5250000);
});

test('preserves fallback for invalid formulas', () => {
  expect(calculate({ formula: 'unknown + price' })).toBe(5000000);
});
