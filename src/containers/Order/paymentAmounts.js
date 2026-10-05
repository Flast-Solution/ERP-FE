// API total and normalized totalPrice are already converted to VND.
export const getPaymentLineTotal = (detail) => {
  if (detail.total != null) return Number(detail.total);
  if (detail.totalPrice != null) return Number(detail.totalPrice);
  return Math.max(Number(detail.price ?? 0) * Number(detail.quantity ?? 0)
    - Number(detail.priceOff ?? detail.discountAmount ?? 0), 0);
};
