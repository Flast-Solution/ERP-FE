import { calculateUsdLineTotal, calculateSalePriceUsd, calculateEditorLine } from './orderPricing';

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


const backendFormula = '(productPrice+(shippingCost/orderedQuantity))/((100-profit)%)';

test('backend formula calculates a unit USD sale price using total order quantity', () => {
  const context = { formula: backendFormula, shippingCost: 100, orderedQuantity: 200 };
  expect(calculateSalePriceUsd({ ...context, item: { productPrice: 1.5, profit: 20 } })).toBe(2.5);
  expect(calculateUsdLineTotal({ ...context, item: { productPrice: 1.5, profit: 20, quantity: 100 } })).toBe(250);
  const computed = calculateEditorLine({ productPrice: 1.5, profit: 20, quantity: 100 },
    { ...context, exchangeRate: 23000, currency: 'USD' });
  expect(computed.price).toBe(2.5);
  expect(computed.salePriceVnd).toBe(57500);
  expect(computed.totalPrice).toBe(250);
});

test('saved prices and VND values are retained until pricing inputs change', () => {
  const context = { formula: backendFormula, shippingCost: 100, orderedQuantity: 200, exchangeRate: 23000 };
  const saved = { price: 3, priceV: 69000, productPrice: 1.5, profit: 20, quantity: 100, totalPrice: 300 };
  expect(calculateEditorLine(saved, context).price).toBe(3);
  const edited = calculateEditorLine({ ...saved, _recalculateSalePrice: true, _recalculateTotal: true }, context);
  expect(edited.price).toBe(2.5);
  expect(edited.salePriceVnd).toBe(69000);
  expect(edited.totalPrice).toBe(250);
});

test('invalid quantity, division by zero and unsupported formula do not produce infinite prices', () => {
  const args = { formula: backendFormula, shippingCost: 100, orderedQuantity: 200, item: { productPrice: 1.5, profit: 100 } };
  expect(calculateSalePriceUsd(args)).toBeNull();
  expect(calculateSalePriceUsd({ ...args, orderedQuantity: 0 })).toBeNull();
  expect(calculateSalePriceUsd({ ...args, formula: 'unknown + productPrice' })).toBeNull();
});


test('VND uses manually entered sale price without applying the USD formula or exchange rate', () => {
  const result = calculateEditorLine({ productPrice: 1.5, price: 2, productPriceV: 35000, priceV: 48000,
    quantity: 2, _recalculateTotal: true }, { currency: 'VND', exchangeRate: 23000, formula: backendFormula, orderedQuantity: 2 });
  expect(result.totalPrice).toBe(96000);
  expect(result.salePriceVnd).toBe(48000);
});
