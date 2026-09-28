// The product API returns name/value pairs; saved orders may already contain
// grouped text/values. Keep both forms readable without grouping twice.
export const normalizeOrderSkuDetails = details => {
  if (!Array.isArray(details)) return [];
  const groups = new Map();
  details.forEach(detail => {
    const text = detail?.text ?? detail?.name;
    if (!text) return;
    const values = Array.isArray(detail.values)
      ? detail.values.map(value => ({
        ...(typeof value === 'object' ? value : {}),
        text: value?.text ?? value?.value ?? value,
      }))
      : [{ id: detail.id, text: detail.value }];
    if (!groups.has(text)) groups.set(text, { text, values: [] });
    groups.get(text).values.push(...values.filter(value => value.text != null && value.text !== ''));
  });
  return [...groups.values()].filter(group => group.values.length > 0);
};

export const resolveOrderSkuDetails = (detail = {}, product = {}) => {
  const sku = (product.skus ?? []).find(item => String(item.id) === String(detail.skuId));
  for (const candidate of [detail.mSkuDetails, detail.skuDetails, sku?.skuDetails]) {
    const normalized = normalizeOrderSkuDetails(candidate);
    if (normalized.length) return normalized;
  }
  return [];
};
