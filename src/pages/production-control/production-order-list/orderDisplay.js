export const getOrderCurrency = order => String(order?.currency || 'VND').trim().toUpperCase() || 'VND';

export const getCurrencySelectionError = orders => {
  const currencies = [...new Set(orders.map(getOrderCurrency))];
  return currencies.length > 1
    ? `Không thể chọn các đơn hàng khác loại tiền tệ (${currencies.join(', ')}). Vui lòng chọn các đơn cùng loại tiền tệ.`
    : null;
};

export const getProductUnit = product => String(product?.unit ?? '').trim();

export const formatProductQuantity = (quantity, unit) => {
  if (quantity == null) return '-';
  const value = Number(quantity);
  const amount = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 20 }).format(Number.isFinite(value) ? value : 0);
  return [amount, String(unit ?? '').trim()].filter(Boolean).join(' ');
};

export const getProductionQuantityLimit = product => {
  if (product?.quantity == null || product.quantity === '') return undefined;
  const quantity = Number(product.quantity);
  return Number.isFinite(quantity) && quantity >= 0 ? quantity : undefined;
};

export const getProductionQuantityError = (product, target) => {
  if (target == null || target === '') return 'Vui lòng nhập số lượng sản xuất.';
  const quantity = Number(target);
  if (!Number.isFinite(quantity) || quantity <= 0) return 'Số lượng sản xuất phải lớn hơn 0.';
  const limit = getProductionQuantityLimit(product);
  if (limit === undefined) return 'Chưa có số lượng của đơn con để kiểm tra giới hạn sản xuất.';
  if (quantity > limit) return `Số lượng sản xuất không được vượt quá ${formatProductQuantity(limit, getProductUnit(product))} của đơn con.`;
  return null;
};

export const formatProductionQuantities = (rows, productDetails, availableDetails = []) => {
  const totals = new Map();
  rows.forEach(({ product }) => {
    if (product?.id == null) return;
    const unit = getProductUnit(product);
    const quantity = Number(productDetails?.[String(product.id)]?.target ?? 0);
    totals.set(unit, (totals.get(unit) ?? 0) + (Number.isFinite(quantity) ? quantity : 0));
  });
  if (!totals.size) {
    const units = [...new Set(availableDetails.map(getProductUnit).filter(Boolean))];
    return formatProductQuantity(0, units.length === 1 ? units[0] : '');
  }
  // Quantities with different units cannot be summed together.
  return [...totals].map(([unit, quantity]) => formatProductQuantity(quantity, unit || '(chưa có đơn vị)')).join(' · ');
};
