import { resolveOrderSkuDetails } from './orderSku';
import { formatDayQuoteForPayload } from './orderEditorDates';
import { getExchangeRate } from './orderEditorModel';
import { resolveSalePriceVnd } from './orderPricing';

const DETAIL_FIELDS = [
  'id', 'key', 'detailId', 'code', 'note', 'productId', 'productCode', 'productName',
  'skuId', 'skuDetailCode', 'unit', 'warrantyPeriod', 'quantity', 'productPrice',
  'totalPrice', 'total', 'discountRate', 'discountAmount', 'shippingCost', 'profit',
  'warehouse', 'stock', 'status', 'orderLine', 'currency', 'exchangeRate',
];

export const buildOrderDetailPayload = line => {
  const detail = Object.fromEntries(DETAIL_FIELDS.filter(field => line[field] !== undefined).map(field => [field, line[field]]));
  return { ...detail, price: line.price ?? null, priceV: resolveSalePriceVnd(line, line.exchangeRate),
    dayQuote: formatDayQuoteForPayload(line.dayQuote), skuDetails: resolveOrderSkuDetails(line) };
};

export const buildOrderEditorPayload = ({ customer, business, customerOrder, dataId, lines, shippingCost, vatRate, currency, exchangeRate }) => {
  const payload = { customer, details: lines.map(buildOrderDetailPayload), shippingCost: Number(shippingCost || 0),
    vat: vatRate, currency, exchangeRate: getExchangeRate(currency, exchangeRate) };
  if (['cohoi', 'opportunity'].includes(customerOrder?.type)) {
    payload.payOptions = {
      ...customerOrder.payOptions,
      paymentTerms: customerOrder.payOptions?.paymentTerms ?? null,
      paymentPercent: customerOrder.payOptions?.paymentPercent ?? null,
    };
  }
  const enterprise = customer?.business ?? business;
  if (enterprise && typeof enterprise === 'object') {
    payload.enterpriseName = enterprise.companyName;
    payload.enterpriseId = enterprise.id;
  }
  if (customerOrder?.id) payload.id = customerOrder.id;
  if (customerOrder?.code != null) payload.code = customerOrder.code;
  if (dataId) payload.dataId = dataId;
  return payload;
};
