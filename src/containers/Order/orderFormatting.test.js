import { formatOrderCurrency, formatOrderNumber } from './orderFormatting';

test.each(['VND', 'USD'])('preserves decimal money values for %s', currency => {
  expect(formatOrderCurrency(100000.222, currency)).toContain('100,000.222');
  expect(formatOrderCurrency(100.323, currency)).toContain('100.323');
  expect(formatOrderCurrency(0.005, currency)).toContain('0.005');
  expect(formatOrderCurrency(-1234.5678, currency)).toContain('1,234.5678');
  expect(formatOrderCurrency(null, currency)).toContain('0');
});

test('formats fractional exchange rates without truncating or switching separators', () => {
  expect(formatOrderNumber(25000.12345)).toBe('25,000.12345');
});
