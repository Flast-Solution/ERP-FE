export const formatOrderNumber = value => Number(value ?? 0).toLocaleString('en-US', {
  maximumFractionDigits: 20,
});

export const formatOrderCurrency = (value, currency = 'VND') => Number(value ?? 0).toLocaleString('en-US', {
  style: 'currency',
  currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 20,
});
