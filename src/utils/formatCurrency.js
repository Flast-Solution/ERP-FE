// Display only: never use formatted amounts for calculations or API payloads.
const formatters = new Map();

export const formatCurrency = (value, currency = 'VND', locale) => {
  const code = String(currency || 'VND').trim().toUpperCase() || 'VND';
  const resolvedLocale = locale || (code === 'USD' ? 'en-US' : 'vi-VN');
  const key = `${resolvedLocale}:${code}`;
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: code === 'VND' ? 0 : 2,
    }));
  }
  const amount = Number(value ?? 0);
  return formatters.get(key).format(Number.isFinite(amount) ? amount : 0);
};

// Use when the currency is already identified in the surrounding UI.
export const formatMoneyAmount = (value, currency = 'VND') => {
  const code = String(currency || 'VND').trim().toUpperCase();
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(code === 'USD' ? 'en-US' : 'vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: code === 'VND' ? 0 : 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};
