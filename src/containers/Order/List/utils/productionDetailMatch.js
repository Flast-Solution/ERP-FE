export const matchesProductionDetail = (production, detail, details) => {
  if (production?.orderDetailId != null) {
    return String(production.orderDetailId) === String(detail?.id ?? detail?.detailId)
  }
  // Legacy records can only be matched by product/SKU when there is one candidate.
  const candidates = details.filter(item => (
    production?.productId != null
    && String(production.productId) === String(item.productId)
    && (production.skuId == null || item.skuId == null || String(production.skuId) === String(item.skuId))
  ))
  return candidates.length === 1 && candidates[0] === detail
}
