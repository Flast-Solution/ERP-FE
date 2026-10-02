import { formatOrderCurrency, formatOrderNumber } from './orderFormatting';

test('displays VND as integers and USD with at most two decimals', () => {
  expect(formatOrderCurrency(100000.222, 'VND')).toContain('100.000');
  expect(formatOrderCurrency(100.9, 'VND')).toContain('101');
  expect(formatOrderCurrency(100000.222, 'USD')).toBe('$100,000.22');
  expect(formatOrderCurrency(0.005, 'USD')).toBe('$0.01');
  expect(formatOrderCurrency(-1234.5678, 'USD')).toBe('-$1,234.57');
  expect(formatOrderCurrency(100, 'USD')).toBe('$100');
});

test('formats fractional exchange rates without truncating or switching separators', () => {
  expect(formatOrderNumber(25000.12345)).toBe('25,000.12345');
});
