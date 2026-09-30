export const isProviderProduction = (order = {}) => {
  const hasProvider = value => value != null && value !== '' && Number(value) > 0;
  if (hasProvider(order.providerId)) return true;
  const details = Array.isArray(order.details) ? order.details : [];
  return details.length > 0 && details.every(detail => hasProvider(detail.providerId));
};
