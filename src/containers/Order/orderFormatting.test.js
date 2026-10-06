import { formatUsdInput, parseUsdInput } from './orderFormatting';

test.each([[1.755, '1.76'], [1.754, '1.75'], [1.005, '1.01'], [1, '1.00'], [0, '0.00'], [1234.567, '1,234.57']])('formats USD %s with two decimals', (value, expected) => {
  expect(formatUsdInput(value)).toBe(expected);
});

test('preserves incomplete input while typing and parses grouped USD amounts', () => {
  expect(formatUsdInput(1, { userTyping: true, input: '1.' })).toBe('1.');
  expect(parseUsdInput('1,234.57')).toBe('1234.57');
  expect(formatUsdInput(null)).toBe('');
});
