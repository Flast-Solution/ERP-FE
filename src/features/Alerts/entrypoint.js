import { InAppEvent } from '@flast-erp/core/utils';
export const OPEN_BUSINESS_ALERT = 'ERP_OPEN_BUSINESS_ALERT';
export const openBusinessAlert = target => InAppEvent.emit(OPEN_BUSINESS_ALERT,target);
const kind = value => ({PRODUCTION:'MO',MANUFACTURE:'MO',DELIVERY:'SHIPPING',QUOTE:'DEAL'})[value] || value;
export const findEntityAlerts = (alerts,target) => alerts.filter(alert => {
  if(target.alertId!=null)return String(alert.id)===String(target.alertId);
  return target.entityId!=null && alert.entityData?.id!=null && String(alert.entityData.id)===String(target.entityId)
    && kind(alert.entityData.kind)===kind(target.entityKind);
});
