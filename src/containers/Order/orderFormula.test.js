import { buildFormulaSnapshot, calculateFormulaLine, calculateEnteredPriceLine, configToFormula, evaluateOrderFormula, readFormulaSnapshot } from './orderFormula';

const line = { key: 'one', detailId: 12, productPrice: 100, productPriceV: 100000, quantity: 2, profit: 20, price: 110, discountAmount: 10 };
const context = { currency: 'USD', shippingCost: 20, orderedQuantity: 2 };

test('distinguishes markup from margin and handles percent after parentheses', () => {
  expect(evaluateOrderFormula({ expression: 'productPrice * (1 + profit%)' }, line, context).price).toBe(120);
  expect(evaluateOrderFormula({ expression: 'productPrice / ((100 - profit)%)' }, line, context).price).toBe(125);
});

test.each([
  'price + 1', 'productPrice +', '(productPrice + 1', 'productPrice / 0',
  '-productPrice', 'productPrice; alert(1)', 'productPrice ** 2', '1..2',
])('rejects unsupported or invalid formula %s', expression => {
  expect(evaluateOrderFormula({ expression }, line, context).error).toBeTruthy();
});

test('rejects missing VND purchase price instead of converting USD or silently using zero', () => {
  const formula = { expression: 'productPrice' };
  expect(evaluateOrderFormula(formula, { ...line, productPriceV: null }, { ...context, currency: 'VND' }).error).toContain('Giá mua');
  expect(evaluateOrderFormula(formula, { ...line, productPriceV: 0 }, { ...context, currency: 'VND' }).price).toBe(0);
});

test('applies currency rounding and keeps gross line amounts separate from discounts', () => {
  const formula = { expression: 'productPrice / 3' };
  expect(calculateFormulaLine(line, formula, context)).toMatchObject({ price: 33.33, totalPrice: 66.66, discountAmount: 10 });
  expect(calculateFormulaLine(line, formula, { ...context, currency: 'VND' })).toMatchObject({ priceV: 33333, totalPrice: 66666 });
});

test('retains entered sale prices and totals independently of the configured formula', () => {
  expect(calculateEnteredPriceLine({ ...line, price: 0, _recalculateTotal: true }, 'USD'))
    .toMatchObject({ price: 0, totalPrice: 0 });
  expect(calculateEnteredPriceLine({ ...line, price: 155, totalPrice: 310 }, 'USD'))
    .toMatchObject({ price: 155, totalPrice: 310 });
});

test('round-trips configuration for applying once without per-row pricing modes', () => {
  const snapshot = buildFormulaSnapshot({ name: 'Riêng', expression: 'productPrice + 10', shippingMode: 'included' });
  expect(readFormulaSnapshot({ payOptions: { pricingFormula: snapshot } })).toEqual(snapshot);
  expect(snapshot.applyMode).toBe('once');
  expect(snapshot).not.toHaveProperty('manualLineKeys');
  expect(readFormulaSnapshot({ payOptions: { pricingFormula: { expression: 'productPrice' } } })).toBeNull();
});

test('converts legacy line-total configuration to an explicit unit-price expression', () => {
  const config = configToFormula({ id: 1, value: '(price * quantity + shippingCost) / (1 - profit%)' });
  expect(config.shippingMode).toBe('included');
  expect(evaluateOrderFormula(config, line, context).price).toBe(137.5);
  expect(configToFormula({ value: 'productPrice * (1 + profit%)' }).expression).toBe('productPrice * (1 + profit%)');
});
