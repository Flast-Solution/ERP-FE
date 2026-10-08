import { evaluateCalculationFormula } from './orderPricing';

export const FORMULA_FIELDS = [
  { value: 'productPrice', label: 'Giá mua', description: 'Theo loại tiền của đơn' },
  { value: 'quantity', label: 'Số lượng dòng' },
  { value: 'orderedQuantity', label: 'Tổng số lượng đơn' },
  { value: 'profit', label: 'Lợi nhuận (%)' },
  { value: 'shippingCost', label: 'Phí vận chuyển' },
];

export const describeFormula = expression => (expression || '').replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g,
  variable => FORMULA_FIELDS.find(field => field.value === variable)?.label ?? variable);

export const buildFormulaSnapshot = formula => ({
  version: 1,
  target: 'unitPrice',
  name: formula?.name || 'Cấu hình tính giá bán',
  expression: formula?.expression || '',
  shippingMode: formula?.shippingMode === 'included' ? 'included' : 'separate',
  applyMode: 'once',
});

export const readFormulaSnapshot = order => {
  const snapshot = order?.payOptions?.pricingFormula;
  if (!snapshot || snapshot.version !== 1 || snapshot.target !== 'unitPrice' || typeof snapshot.expression !== 'string') return null;
  return buildFormulaSnapshot(snapshot);
};

// Existing configurations may describe a line total. Convert them explicitly to a unit price.
export const configToFormula = config => {
  const expression = typeof config?.value === 'string' ? config.value.trim() : '';
  if (!expression) return null;
  const isUnitPrice = /\b(productPrice|orderedQuantity)\b/.test(expression);
  const normalized = expression.replace(/\bprice\b/g, 'productPrice');
  return { id: `config-${config.id ?? expression}`, name: config.name || 'Công thức cấu hình',
    expression: isUnitPrice ? normalized : `(${normalized}) / quantity`,
    shippingMode: /\bshippingCost\b/.test(expression) ? 'included' : 'separate' };
};

export const evaluateOrderFormula = (formula, line, { currency, shippingCost, orderedQuantity }) => {
  if (!formula?.expression?.trim()) return { error: 'Nhập công thức tính giá' };
  if (formula.expression.length > 2000) return { error: 'Công thức tối đa 2.000 ký tự' };
  const variables = {
    productPrice: currency === 'VND' ? line.productPriceV : line.productPrice,
    quantity: line.quantity,
    orderedQuantity,
    profit: line.profit ?? 0,
    shippingCost,
  };
  try {
    for (const name of new Set(formula.expression.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [])) {
      if (!Object.prototype.hasOwnProperty.call(variables, name)) throw new Error(`Trường ${name} không được hỗ trợ`);
      if (variables[name] == null || !Number.isFinite(Number(variables[name]))) {
        throw new Error(`Thiếu hoặc sai giá trị ${FORMULA_FIELDS.find(field => field.value === name)?.label}`);
      }
    }
    const value = evaluateCalculationFormula(formula.expression, variables, { strict: true });
    if (value == null) throw new Error('Nhập công thức tính giá');
    if (value < 0) throw new Error('Giá bán không được âm');
    const factor = currency === 'VND' ? 1 : 100;
    const price = Math.round((value + Number.EPSILON) * factor) / factor;
    if (!Number.isFinite(price) || !Number.isFinite(price * Number(line.quantity ?? 0))) {
      throw new Error('Kết quả tính giá vượt giới hạn');
    }
    return { price };
  } catch (error) {
    return { error: error.message };
  }
};

export const calculateFormulaLine = (line, formula, context) => {
  const result = evaluateOrderFormula(formula, line, context);
  const price = context.currency === 'VND' ? line.priceV : line.price;
  const effectivePrice = result.price ?? price ?? 0;
  const factor = context.currency === 'VND' ? 1 : 100;
  // totalPrice is the gross amount; the editor subtracts discountAmount once.
  const totalPrice = Math.round((effectivePrice * Number(line.quantity ?? 0) + Number.EPSILON) * factor) / factor;
  return { ...line, ...(context.currency === 'VND' ? { priceV: effectivePrice } : { price: effectivePrice }),
    salePriceUsd: context.currency === 'USD' ? effectivePrice : line.price,
    salePriceVnd: context.currency === 'VND' ? effectivePrice : line.priceV,
    currency: context.currency, totalPrice, total: totalPrice, formulaError: result.error,
    _recalculateTotal: false, _recalculateSalePrice: false };
};


export const calculateEnteredPriceLine = (line, currency) => {
  const price = currency === 'VND' ? line.priceV : line.price;
  const factor = currency === 'VND' ? 1 : 100;
  const savedTotal = line.totalPrice ?? line.total;
  const totalPrice = !line._recalculateTotal && savedTotal != null ? Number(savedTotal)
    : Math.round((Number(price ?? 0) * Number(line.quantity ?? 0) + Number.EPSILON) * factor) / factor;
  return { ...line, salePriceUsd: line.price, salePriceVnd: line.priceV,
    currency, totalPrice, total: totalPrice, formulaError: undefined };
};
