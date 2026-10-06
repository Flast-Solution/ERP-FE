import { updateOrderLine } from './orderEditorModel';
import { calculateEditorLine } from './orderPricing';
import { buildOrderEditorPayload } from './orderEditorPayload';

const context = { currency: 'USD', exchangeRate: 23000, shippingCost: 0, formula: '' };
const line = { key: 'line', detailId: 3, price: 2, priceV: null, productPrice: 1.7,
  quantity: 1000, discountAmount: 0, totalPrice: 2000, orderLine: { Width: '62' } };

test('derives prices without mutating backend values or freezing fallback after an unrelated edit', () => {
  const displayed = calculateEditorLine(line, context);
  expect(displayed.salePriceVnd).toBe(46000);
  expect(line.priceV).toBeNull();
  const edited = updateOrderLine(line, 'note', 'Edited');
  expect(calculateEditorLine(edited, { ...context, exchangeRate: 26000 }))
    .toMatchObject({ price: 2, priceV: null, salePriceVnd: 52000, totalPrice: 2000 });
  const quantityEdit = updateOrderLine(edited, 'quantity', 2);
  expect(calculateEditorLine(quantityEdit, context).totalPrice).toBe(4);
  expect(line.quantity).toBe(1000);
});

test('guards zero discount denominators and rejects non-finite numeric input', () => {
  const zero = { ...line, productPrice: 0, quantity: 0 };
  expect(updateOrderLine(zero, 'discountAmount', 10).discountRate).toBe(0);
  expect(updateOrderLine(line, 'quantity', 'invalid')).toBe(line);
  expect(updateOrderLine(line, 'price', Infinity)).toBe(line);
});

test('locks sale prices and code while allowing quantity and dates', () => {
  const options = { restrictOrderFields: true };
  expect(updateOrderLine(line, 'price', 3, options)).toBe(line);
  expect(updateOrderLine(line, 'priceV', 0, options)).toBe(line);
  expect(updateOrderLine(line, 'code', 'Changed', options)).toBe(line);
  expect(updateOrderLine(line, 'quantity', 2, options).quantity).toBe(2);
});

test('selects payload fields and retains identifiers, price precision, dates, SKU and payment terms', () => {
  const displayed = calculateEditorLine({ ...line, price: 2.123456, priceV: 47000.125,
    code: 'CH-1', dayQuote: '2026-09-21 08:32:28', editable: true,
    warehouseOptions: [{ id: 1 }], skuPrices: [{ price: 10 }],
    mSkuDetails: [{ text: 'Width', values: [{ id: 1, text: '62' }] }],
    _recalculateTotal: true, unknownUiProperty: true,
  }, context);
  const payload = buildOrderEditorPayload({ customer: { id: 1 }, customerOrder: { id: 2, code: 'CH',
    type: 'cohoi', payOptions: { paymentTerms: 'DEPOSIT', paymentPercent: 30 } },
    lines: [displayed], shippingCost: 0, vatRate: 8, ...context });
  expect(payload).toMatchObject({ id: 2, code: 'CH', payOptions: { paymentTerms: 'DEPOSIT', paymentPercent: 30 }, vat: 8 });
  expect(payload.details[0]).not.toHaveProperty('priceV');
  expect(payload).not.toHaveProperty('paymentTerms');
  expect(payload).not.toHaveProperty('paymentPercent');
  expect(payload.details[0]).toMatchObject({ detailId: 3, code: 'CH-1', price: 2.123456,
    productPrice: 1.7, dayQuote: '2026-09-21 08:32:28', orderLine: { Width: '62' } });
  expect(payload.details[0].skuDetails).toEqual(displayed.mSkuDetails);
  ['editable', 'warehouseOptions', 'skuPrices', '_recalculateTotal', 'salePriceVnd', 'unknownUiProperty']
    .forEach(field => expect(payload.details[0]).not.toHaveProperty(field));
});


test('VND payload sends independently entered purchase and sale prices including zero', () => {
  const payload = buildOrderEditorPayload({ customer: { id: 1 }, customerOrder: { id: 2 },
    lines: [{ productPrice: 1.5, price: 2, productPriceV: 0, priceV: 48000, quantity: 2 }],
    shippingCost: 0, vatRate: 0, currency: 'VND', exchangeRate: 23000 });
  expect(payload.currency).toBe('VND');
  expect(payload.details[0]).toMatchObject({ productPriceV: 0, priceV: 48000 });
  const usd = buildOrderEditorPayload({ customerOrder: {}, lines: [{ productPriceV: 35000, priceV: 48000 }], currency: 'USD' });
  expect(usd.details[0]).not.toHaveProperty('priceV');
  expect(usd.details[0]).not.toHaveProperty('productPriceV');
});
