export const formatOrderNumber = value => Number(value ?? 0).toLocaleString('en-US', {
  maximumFractionDigits: 20,
});

export { formatCurrency as formatOrderCurrency } from '../../utils/formatCurrency';


const usdInputFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatUsdInput = (value, info) => {
  if (info?.userTyping) return info.input;
  if (value == null || value === '') return '';
  const number = Number(value);
  return Number.isFinite(number) ? usdInputFormat.format(number) : '';
};

export const parseUsdInput = value => String(value ?? '').replace(/,/g, '');
