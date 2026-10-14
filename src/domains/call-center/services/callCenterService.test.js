import {findCustomerByPhone,normalizeCallCustomer} from './callCenterService';
import {RequestUtils} from '@flast-erp/core/utils';
jest.mock('@flast-erp/core/utils',()=>({RequestUtils:{Get:jest.fn()}}));
test('maps nested API data to incoming-call UI',async()=>{
 const data={iCustomer:{id:46,name:'Minh Duong',mobile:'0374148897'},saleName:'duongtm',lead:{lastContactedAt:null},summary:{orders:5,total:687674393},activities:[{id:650,name:'Gửi báo giá',status:0,createdAt:'2026-08-12 03:42:39'}],orders:[{id:1,code:'ORDER-1',currency:'USD',total:100,createdAt:1790152169000}]};
 RequestUtils.Get.mockResolvedValue({errorCode:200,data});
 const customer=await findCustomerByPhone('0374148897');
 expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/customer/find-by-phone',{phone:'0374148897'});
 expect(customer).toMatchObject({id:46,name:'Minh Duong',phone:'0374148897',status:'customer',saleName:'duongtm',kpi:{orderCount:5,debt:'—',lastContact:expect.any(String)}});
 expect(customer.kpi.totalPurchase).toBe('687M');
 expect(customer.openItems[0]).toMatchObject({type:'task',title:'Gửi báo giá'});
 expect(customer.orders[0].total).toBe('100 USD');
 expect(customer.timeline).toHaveLength(2);
 expect(customer.kpi.lastContact).not.toBe('—');
 expect(customer.commercialRecords[0]).toMatchObject({code:'ORDER-1',kind:'order',amount:'100 USD'});
});
test('preserves flat customer responses',()=>{
 const customer={id:1,name:'Customer',phone:'0374148897'};
 expect(normalizeCallCustomer(customer,customer.phone)).toEqual(customer);
});
