import { formatProductQuantity, formatProductionQuantities, getCurrencySelectionError, getOrderCurrency, getProductionQuantityError } from './orderDisplay';

test('compares normalized currencies and maintains the legacy VND default', () => {
  expect(getOrderCurrency({ currency: ' usd ' })).toBe('USD');
  expect(getOrderCurrency({})).toBe('VND');
  expect(getCurrencySelectionError([{ currency: 'usd' }, { currency: 'USD' }])).toBeNull();
  expect(getCurrencySelectionError([{ currency: 'USD' }, { currency: 'VND' }])).toContain('USD, VND');
});

test('displays decimal quantities and units from the API', () => {
  expect(formatProductQuantity(2.5, 'm')).toBe('2,5 m');
  expect(formatProductQuantity(0, 'kg')).toBe('0 kg');
  expect(formatProductQuantity(null, 'm')).toBe('-');
});

test('groups production quantities by unit instead of combining different dimensions', () => {
  const rows = [
    { product: { id: 1, unit: 'm' } }, { product: { id: 2, unit: 'm' } },
    { product: { id: 3, unit: 'kg' } }, { product: null },
  ];
  expect(formatProductionQuantities(rows, { 1: { target: 2.5 }, 2: { target: 3 }, 3: { target: 1 } })).toBe('5,5 m · 1 kg');
  expect(formatProductionQuantities([], {}, [{ unit: 'm' }])).toBe('0 m');
  expect(formatProductionQuantities([], {}, [])).toBe('0');
  expect(formatProductionQuantities([{ product: { id: 1 } }], { 1: { target: 2 } })).toBe('2 (chưa có đơn vị)');
});


test('validates production quantity against the individual child order including decimals and zero limits', () => {
  const product = { quantity: 2.5, unit: 'm' };
  expect(getProductionQuantityError(product, 2.5)).toBeNull();
  expect(getProductionQuantityError(product, 2.6)).toContain('2,5 m');
  expect(getProductionQuantityError(product, null)).toBeTruthy();
  expect(getProductionQuantityError(product, 0)).toBeTruthy();
  expect(getProductionQuantityError(product, -1)).toBeTruthy();
  expect(getProductionQuantityError(product, Infinity)).toBeTruthy();
  expect(getProductionQuantityError({ quantity: 0 }, 1)).toBeTruthy();
  expect(getProductionQuantityError({}, 1)).toBeTruthy();
});
