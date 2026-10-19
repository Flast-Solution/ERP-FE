import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { normalizeNotification } from './service';
import { createBusinessReader } from './businessModel';
import { leadTimelineDays } from './leadEntity';
import BusinessAlertDetails from './components/BusinessAlertDetails';
jest.mock('antd',()=>({Alert:({message})=><div>{message}</div>,Button:({children})=><button>{children}</button>,Popover:({children})=><>{children}</>,Spin:()=>null,Tag:({children})=><span>{children}</span>}));
jest.mock('@flast-erp/core/utils',()=>({RequestUtils:{Get:jest.fn()}}));
const raw={id:'alert-lead',type:'LEAD_STALE',severity:'MEDIUM',status:'OPEN',ownerId:901,ownerName:null,description:'Lead chưa có hoạt động mới trong hơn 7 ngày và chưa chuyển thành cơ hội.',entity:{id:101,kind:'LEAD',customerName:'Khách API',customerMobile:'0900001234',customerEmail:'demo@example.test',customerType:'INDIVIDUAL',source:2,status:0,interestLevel:'MEDIUM',quantityRange:'10000',productNames:['Sản phẩm A','Sản phẩm B'],saleId:901,assignTo:'sale.account',staff:'Creator account',createdBy:2,createdDate:'2026-08-13 05:58:53',lastContactedAt:null,nextAppointmentAt:'2026-10-20 14:30:00'},rule:{id:'LEAD_STALE_7D',name:'Lead không hoạt động quá 7 ngày',conditions:[]},context:[{key:'lastActivityAt',value:'Chưa có hoạt động'}]};
test('maps the expanded entity DTO to drawer fields without confusing creators and owners',()=>{
 const alert=normalizeNotification(raw), read=createBusinessReader(alert);
 expect(alert.entity).toBe('Khách API');
 expect(alert.owner).toBe('sale.account');
 expect(alert.entityData.createdDate).toBe(raw.entity.createdDate);
 expect(read('customer.name')).toBe('Khách API');
 expect(read('customer.mobilePhone')).toBe('0900001234');
 expect(read('customer.typeLabel')).toBe('Cá nhân');
 expect(read('lead.sourceName')).toBe('Zalo');
 expect(read('lead.statusName')).toBe('Tạo mới');
 expect(read('interestLabel')).toBe('Trung bình');
 expect(read('expectedQuantity')).toBe('10000');
 expect(read('appointmentAt')).toBe('2026-10-20 14:30:00');
 expect(read('owner.name')).toBe('sale.account');
 const html=renderToStaticMarkup(<BusinessAlertDetails alert={alert} scenario="lead" onOpen={()=>{}}/>);
 for(const value of ['Khách API','0900001234','Cá nhân','Zalo','Tạo mới','Trung bình','10000','Sản phẩm A, Sản phẩm B','sale.account','14:30','TƯƠNG TÁC 7 NGÀY QUA']) expect(html).toContain(value);
 expect(html).not.toContain('Creator account');
 expect(html).toContain('Chưa có dữ liệu tương tác đầy đủ');
 expect(alert.triggerCondition).toBe(raw.description);
});
test('uses explicit businessData labels ahead of DTO aliases and full owner name ahead of username',()=>{
 const alert=normalizeNotification({...raw,ownerName:'Sale fullname',businessData:{customer:{name:'Preferred name'},expectedQuantity:0}});
 const read=createBusinessReader(alert);
 expect(read('customer.name')).toBe('Preferred name');
 expect(read('expectedQuantity')).toBe(0);
 expect(read('owner.name')).toBe('Sale fullname');
});
test('does not invent fields or interaction completeness for a lightweight entity',()=>{
 const read=createBusinessReader(normalizeNotification({id:'light',type:'LEAD_STALE',entity:{id:102,kind:'LEAD',name:'Lightweight'}}));
 expect(read('customer.name')).toBe('Lightweight');
 expect(read('customer.mobilePhone')).toBeUndefined();
 expect(read('timeline.complete')).toBeUndefined();
 expect(read('interestLabel')).toBeUndefined();
});
test('keeps actual rule windows separate from the proposed 3-day rule',()=>{
 expect(leadTimelineDays(normalizeNotification(raw))).toBe(7);
 expect(leadTimelineDays({type:'LEAD_NO_FIRST_CONTACT',ruleData:{id:'LEAD_NO_FIRST_CONTACT_24H'}})).toBe(1);
 expect(leadTimelineDays({type:'LEAD_3_DAY'})).toBe(3);
});
