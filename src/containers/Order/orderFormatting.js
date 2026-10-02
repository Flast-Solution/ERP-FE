export const formatOrderNumber = value => Number(value ?? 0).toLocaleString('en-US', {
  maximumFractionDigits: 20,
});

export { formatCurrency as formatOrderCurrency } from '../../utils/formatCurrency';
