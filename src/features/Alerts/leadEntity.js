import { CHANNEL_SOURCE_MAP_KEYS } from '@/configs/localData';
import { getLeadStatusOption } from '@/pages/lead/leadStatusOptions';

// Map the actual LEAD entity DTO; staff/createdBy identify creators, not the sale assignee.
export const mapLeadEntity = (entity, ownerName) => {
  if (!entity || String(entity.kind).toUpperCase() !== 'LEAD') return {};
  const source = CHANNEL_SOURCE_MAP_KEYS[entity.source];
  const status = getLeadStatusOption(entity.status);
  return {
    customer: {
      name: entity.customerName ?? entity.name,
      mobilePhone: entity.customerMobile,
      email: entity.customerEmail,
      typeLabel:
        { INDIVIDUAL: 'Cá nhân', BUSINESS: 'Doanh nghiệp' }[entity.customerType] ??
        entity.customerType,
    },
    lead: {
      ...entity,
      createdAt: entity.createdDate ?? entity.inTime,
      sourceName:
        entity.sourceName ??
        source?.name ??
        (entity.source != null ? `Nguồn #${entity.source}` : undefined),
      statusName:
        entity.statusName ??
        status?.name ??
        (entity.status != null ? `Trạng thái #${entity.status}` : undefined),
    },
    owner: { id: entity.saleId, name: ownerName || entity.saleName || entity.assignTo },
    productNames: entity.productNames,
    expectedQuantity: entity.quantityRange,
    interestLabel:
      entity.interestLabel ??
      { HIGH: 'Cao', MEDIUM: 'Trung bình', LOW: 'Thấp' }[
        String(entity.interestLevel || '').toUpperCase()
      ] ??
      entity.interestLevel,
    appointmentAt: entity.nextAppointmentAt,
    lastContactedAt: entity.lastContactedAt,
  };
};

export const leadTimelineDays = (alert) => {
  const rule = alert.ruleData || {};
  const configured = Number(rule.parameters?.interactionWindowDays ?? rule.parameters?.days);
  if (Number.isFinite(configured) && configured > 0) return Math.min(31, Math.ceil(configured));
  const code = String(rule.id || rule.code || '');
  const days = code.match(/_(\d+)D(?:_|$)/i);
  if (days) return Math.min(31, Math.max(1, Number(days[1])));
  const hours = code.match(/_(\d+)H(?:_|$)/i);
  if (hours) return Math.min(31, Math.max(1, Math.ceil(Number(hours[1]) / 24)));
  return alert.type === 'LEAD_STALE' ? 7 : alert.type === 'LEAD_NO_FIRST_CONTACT' ? 1 : 3;
};
