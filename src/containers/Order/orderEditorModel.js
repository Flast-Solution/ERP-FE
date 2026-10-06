export const CURRENCY_USD = 'USD';
export const CURRENCY_VND = 'VND';
export const warrantyOptions = [
  { name: '(Chưa có)', id: 1 },
  { name: '6 Tháng', id: 6 },
  { name: '12 Tháng', id: 12 },
  { name: '24 Tháng', id: 24 },
];

export const getExchangeRate = (currency, rate) => currency === CURRENCY_USD ? Number(rate ?? 0) : 1;

export const findSkuById = (skus, skuId) => (Array.isArray(skus) ? skus : []).find(
  sku => String(sku.id) === String(skuId)
);

export const resolveUnitPrice = ({ skuPrices = [], quantity, product = {} }) => {
  const range = skuPrices.find(item => quantity >= Number(item.quantityFrom) && quantity <= Number(item.quantityTo));
  return Number(range?.price ?? range?.priceRef ?? product.price ?? product.priceRef ?? 0);
};

const NUMBER_FIELDS = new Set(['quantity', 'productPrice', 'discountRate', 'discountAmount', 'profit', 'totalPrice']);
const PRICE_FIELDS = new Set(['price', 'priceV']);
const RECALCULATED_FIELDS = new Set([...NUMBER_FIELDS, 'price']);
const LOCKED_FIELDS = new Set(['code', 'profit', ...PRICE_FIELDS]);

const normalizeFieldValue = (line, field, value) => {
  if (PRICE_FIELDS.has(field)) return value == null || value === '' ? null : Number(value);
  if (NUMBER_FIELDS.has(field)) return Number.parseFloat(value || 0);
  if (field === 'warehouse') return (line.warehouseOptions || []).find(option => option.id === value)?.stockName || '';
  if (field === 'warrantyPeriod') return warrantyOptions.find(option => option.id === value)?.name || '';
  return value;
};

export const updateOrderLine = (line, field, value, { restrictOrderFields = false } = {}) => {
  if (restrictOrderFields && LOCKED_FIELDS.has(field)) return line;
  const normalized = normalizeFieldValue(line, field, value);
  if ((NUMBER_FIELDS.has(field) || PRICE_FIELDS.has(field)) && normalized != null && !Number.isFinite(normalized)) return line;
  const next = { ...line, [field]: normalized };
  if (RECALCULATED_FIELDS.has(field)) next._recalculateTotal = true;
  if (field === 'quantity' && !restrictOrderFields && line.skuPrices?.length) {
    next.productPrice = resolveUnitPrice({ skuPrices: line.skuPrices, quantity: next.quantity, product: { price: line.productPrice } });
  }
  const purchaseAmount = Number(next.productPrice || 0) * Number(next.quantity || 0);
  if (field === 'discountRate') next.discountAmount = purchaseAmount * next.discountRate / 100;
  if (field === 'discountAmount') next.discountRate = purchaseAmount > 0
    ? Number((next.discountAmount / purchaseAmount * 100).toFixed(2)) : 0;
  return next;
};
