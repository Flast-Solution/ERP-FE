import { mapLeadEntity } from './leadEntity';
import { mapShipmentEntity } from './shipmentEntity';
const parse = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};
export const getBusinessScenario = (alert) => {
  if (!alert) return null;
  const type = String(alert.type || '').toUpperCase();
  const types = {
    LEAD_STALE: 'lead',
    LEAD_NO_FIRST_CONTACT: 'lead',
    LEAD_3_DAY: 'lead',
    LEAD_NOT_CONVERTED: 'lead',
    DEAL_STAGE_STUCK: 'opportunity',
    DEAL_NO_ORDER: 'opportunity',
    OPPORTUNITY_7_DAY: 'opportunity',
    ORDER_NOT_PLANNED: 'unplanned',
    ORDER_NO_PRODUCTION: 'unplanned',
    INVOICE_OVERDUE: 'debt',
    ORDER_UNPAID: 'debt',
    ORDER_COMPLETED_UNPAID: 'debt',
    MO_DUE_SOON: 'production',
    PRODUCTION_DUE_SOON: 'production',
    MO_BEHIND_SCHEDULE: 'production',
    DELIVERY_NO_POD: 'pod',
  };
  if (types[type]) return types[type];
  const title = String(alert.title || '');
  if (/lead.*(?:3|ba).*ngày.*cơ hội/i.test(title)) return 'lead';
  if (/cơ hội.*7.*ngày.*đơn/i.test(title)) return 'opportunity';
  if (/chưa.*(?:lệnh|kế hoạch).*sản xuất/i.test(title)) return 'unplanned';
  if (/(?:hoàn thành|nhận đủ hàng).*chưa.*(?:thu|tiền)/i.test(title)) return 'debt';
  if (/sản xuất.*(?:đến hạn|sắp hạn)/i.test(title)) return 'production';
  if (/chưa.*(?:POD|proof of delivery)/i.test(title)) return 'pod';
  return null;
};
export const createBusinessReader = (alert, loaded = {}) => {
  const context = Object.fromEntries(
    (alert.context || [])
      .filter((item) => item?.key)
      .map((item) => [item.key, parse(item.value) ?? item.value]),
  );
  const sources = [
    loaded,
    alert.businessData,
    alert.data,
    alert.entityData,
    mapLeadEntity(alert.entityData, alert.ownerName),
    mapShipmentEntity(alert.entityData),
    context,
    alert,
  ]
    .map(parse)
    .filter((value) => value && typeof value === 'object');
  return (...paths) => {
    for (const path of paths)
      for (const source of sources) {
        const value = path.split('.').reduce((item, key) => item?.[key], source);
        if (value !== undefined && value !== null && value !== '') return value;
      }
    return undefined;
  };
};
export const alertDate = (value) => {
  if (value == null || value === '') return null;
  const date = new Date(
    typeof value === 'number' && value < 1e12
      ? value * 1000
      : typeof value === 'string'
        ? value.replace(' ', 'T')
        : value,
  );
  return Number.isNaN(date.getTime()) ? null : date;
};
export const businessDate = (value) => alertDate(value)?.toLocaleDateString('vi-VN') || '—';
export const moneyValue = (value, currency = 'VND') =>
  value == null || value === ''
    ? '—'
    : `${new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'vi-VN', { maximumFractionDigits: currency === 'VND' ? 0 : 2 }).format(Number(value))} ${currency === 'VND' ? 'đ' : currency}`;
export const businessActions = {
  lead: 'Gọi khách',
  opportunity: 'Tạo đơn',
  unplanned: 'Tạo lệnh SX',
  debt: 'Thu tiền',
  production: 'Liên hệ NCC',
  pod: 'Cập nhật POD',
};

export const businessDateTime = (value) =>
  alertDate(value)?.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) || '—';

export const orderStatusLabel = (status, fallback) =>
  ({ 2: 'Đang sản xuất', 3: 'Xuất hàng', 4: 'Hoàn thành' })[status] ||
  fallback ||
  (status != null ? `Trạng thái #${status}` : '—');
