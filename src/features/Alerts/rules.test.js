import { ALERT_RULES, ACTION_LABELS, getAlertRule } from './rules';
import { normalizeNotification } from './service';
jest.mock('@flast-erp/core/utils',()=>({RequestUtils:{Get:jest.fn()}}));
test('covers all 36 rules and every suggested action in ERP_ALERT_RULES',()=>{
 expect(Object.keys(ALERT_RULES)).toHaveLength(36);
 Object.values(ALERT_RULES).forEach(rule=>{
  expect(ACTION_LABELS[rule.action]).toBeTruthy();
  expect(rule.title).toBeTruthy();expect(rule.condition).toBeTruthy();expect(rule.autoClose).toBeTruthy();
 });
 expect(Object.values(ALERT_RULES).filter(rule=>rule.blocksBusiness).map(rule=>rule.type)).toEqual(['QUOTE_LOW_MARGIN','ORDER_DEPOSIT_MISSING','ORDER_CREDIT_EXCEEDED','PROOF_NOT_APPROVED','DELIVERY_NO_POD']);
});
test('fills production display metadata from the type without calculating a trigger',()=>{
 const alert=normalizeNotification({id:'1',type:'MATERIAL_SHORTAGE',status:'OPEN'});
 expect(alert).toEqual(expect.objectContaining({title:'Thiếu nguyên vật liệu',level:'critical',category:'Sản xuất',entityData:{kind:'MO'},recipientGroup:'Kế hoạch + Mua hàng',autoClose:'Đủ vật tư hoặc đã giữ hàng',suggestion:'Tạo đơn mua hàng',suggestedAction:{code:'CREATE_PO',label:'Tạo đơn mua hàng'}}));
 expect(alert.conditions).toEqual([]);
});
test('backend names, severity, conditions, action and blocking override catalog defaults',()=>{
 const alert=normalizeNotification({type:'INVOICE_OVERDUE',severity:'CRITICAL',title:'Nợ quá hạn 30 ngày',typeLabel:'Kế toán',blocksBusiness:true,rule:{name:'Rule đã cấu hình',conditions:[{label:'Số ngày quá hạn',actual:30}]},suggestedAction:{code:'CUSTOM_ACTION',label:'Liên hệ kế toán'}});
 expect(alert.title).toBe('Nợ quá hạn 30 ngày');expect(alert.level).toBe('critical');expect(alert.rule).toBe('Rule đã cấu hình');expect(alert.conditions).toEqual([['Số ngày quá hạn','30']]);expect(alert.suggestion).toBe('Liên hệ kế toán');expect(alert.blocksBusiness).toBe(true);
});
test('supports grouped type and unknown future types without breaking the UI',()=>{
 expect(normalizeNotification({id:'1'},{type:'MO_NOT_STARTED'}).suggestedAction.code).toBe('START_MO');
 expect(normalizeNotification({id:'2',type:'NEW_BACKEND_RULE',title:'Mới',severity:'HIGH'})).toEqual(expect.objectContaining({title:'Mới',level:'high',ruleDefinition:null,conditions:[]}));
 expect(getAlertRule('lead_not_assigned').type).toBe('LEAD_NOT_ASSIGNED');
});
