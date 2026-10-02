import { formatCurrency } from './formatCurrency';

test('normalizes currency codes and defaults to VND', () => {
  expect(formatCurrency(12.345, ' usd ')).toBe('$12.35');
  expect(formatCurrency(12.345)).toBe(formatCurrency(12.345, 'VND'));
  expect(formatCurrency(12.345, null)).toBe(formatCurrency(12.345, 'VND'));
});

test.each([null, undefined, '', NaN, Infinity])('handles missing or non-finite amount %s', value => {
  expect(formatCurrency(value, 'USD')).toBe('$0');
});

test('accepts numeric strings and does not mutate source amounts', () => {
  const order = { price: 123.4567 };
  expect(formatCurrency('123.4567', 'USD')).toBe('$123.46');
  formatCurrency(order.price, 'VND');
  expect(order.price).toBe(123.4567);
});
