import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BusinessAlertDetails from './components/BusinessAlertDetails';
import { createBusinessReader, getBusinessScenario } from './businessModel';
import { applyAction } from './model';
jest.mock('antd',()=>({Alert:({message})=><div>{message}</div>,Button:({children,onClick})=><button onClick={onClick}>{children}</button>,Popover:({children})=><>{children}</>,Spin:()=>null,Tag:({children})=><span>{children}</span>}));
jest.mock('@flast-erp/core/utils',()=>({RequestUtils:{Get:jest.fn()}}));
const alert={id:1,title:'Cảnh báo mẫu',type:'ORDER_NOT_PLANNED',level:'high',status:'pending',entityData:{},code:'ORDER-1',category:'Đơn hàng',context:[],conditions:[],history:[]};
test.each([['LEAD_STALE','lead'],['DEAL_STAGE_STUCK','opportunity'],['ORDER_NOT_PLANNED','unplanned'],['INVOICE_OVERDUE','debt'],['PRODUCTION_DUE_SOON','production'],['DELIVERY_NO_POD','pod']])('renders the %s business view without fixture data', (type,scenario)=>{
 expect(getBusinessScenario({...alert,type})).toBe(scenario);
 const html=renderToStaticMarkup(<BusinessAlertDetails alert={{...alert,type}} scenario={scenario} onOpen={()=>{}}/>);
 expect(html).toContain(`business-alert-${scenario}`);
 expect(html).not.toContain('Phạm Minh Đức');
 expect(html).not.toContain('980.000');
});
test('reads live business fields and object context without throwing away zero amounts',()=>{
 const read=createBusinessReader({...alert,context:[{key:'order',value:{total:0,paid:0,currency:'USD'}}]});
 expect(read('order.total')).toBe(0);
 expect(read('order.currency')).toBe('USD');
 expect(createBusinessReader(alert,{order:{code:'LIVE'}})('order.code')).toBe('LIVE');
});
test('unknown interactions are not presented as confirmed inactivity',()=>{
 const html=renderToStaticMarkup(<BusinessAlertDetails alert={alert} scenario="lead" onOpen={()=>{}}/>);
 expect(html).toContain('Chưa có dữ liệu tương tác đầy đủ');
 expect(html).not.toContain('Không ghi nhận tương tác trong khoảng thời gian này.');
});
test('debt view keeps currency, computes outstanding amount and payment ratio',()=>{
 const data={...alert,businessData:{order:{total:1000,paid:250,currency:'USD'}}};
 const html=renderToStaticMarkup(<BusinessAlertDetails alert={data} scenario="debt" onOpen={()=>{}}/>);
 expect(html).toContain('750 USD');
 expect(html).toContain('aria-valuenow="25"');
});
test('recording an activity does not close an unresolved business alert',()=>{
 const state={alerts:[{...alert,history:[]}],tasks:[]};
 const next=applyAction(state,1,'record',{activity:'Gọi khách',notes:'Đã liên hệ, vẫn đang chờ thanh toán'});
 expect(next.alerts[0].status).toBe('pending');
 expect(next.alerts[0].history.at(-1).text).toContain('Đã liên hệ');
});
