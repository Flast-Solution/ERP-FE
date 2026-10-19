import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import useBusinessAlertActions from './components/useBusinessAlertActions';
import {RequestUtils,InAppEvent} from '@flast-erp/core/utils';
const mockNavigate=jest.fn(),mockDial=jest.fn();
jest.mock('react-router-dom',()=>({useNavigate:()=>mockNavigate}));
jest.mock('@/hooks/useGetMe',()=>()=>({user:{sipExt:'user_1001'},hasPermission:()=>true}));
jest.mock('@/domains/call-center/store/useCallCenterStore',()=>({useCallCenterStore:selector=>selector({connection:'online',dial:mockDial})}));
jest.mock('@flast-erp/core/utils',()=>({RequestUtils:{Get:jest.fn()},InAppEvent:{emit:jest.fn()}}));
jest.mock('antd',()=>({message:{info:jest.fn(),error:jest.fn()}}));
let root,actions;
beforeEach(()=>{jest.clearAllMocks();global.IS_REACT_ACT_ENVIRONMENT=true;root=createRoot(document.createElement('div'))});
afterEach(async()=>{await act(async()=>root.unmount());delete global.IS_REACT_ACT_ENVIRONMENT});
async function mount(scenario,alert){const Harness=()=>{actions=useBusinessAlertActions(alert,scenario);return null};await act(async()=>root.render(<Harness/>))}
test('debt action opens real order payment with the original order identity',async()=>{
 const order={id:7,code:'ORDER-7',details:[{id:8}],currency:'USD'};
 RequestUtils.Get.mockResolvedValue({errorCode:200,data:{order,customer:{id:3}}});
 await mount('debt',{id:1,entityData:{id:7,kind:'ORDER'}});
 await actions.open('primary');
 expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/order/view-on-edit',{orderId:7});
 expect(InAppEvent.emit).toHaveBeenCalledWith('#modal',expect.objectContaining({hash:'#order.payment',data:expect.objectContaining({customerOrder:order,customer:{id:3}})}));
});
test('lead action dials the actual customer phone rather than closing the alert',async()=>{
 await mount('lead',{id:1,entityData:{kind:'LEAD'},businessData:{phone:'0900123456'}});
 await actions.open('primary');expect(mockDial).toHaveBeenCalledWith('0900123456');
 expect(RequestUtils.Get).not.toHaveBeenCalled();
});
test('POD action opens the exact shipping record when provided',async()=>{
 const shipping={id:11,orderId:7,deliveryCode:'DEL-11',attachments:[]};
 await mount('pod',{id:1,entityData:{kind:'SHIPPING'},businessData:{shipping}});
 await actions.open('primary');
 expect(InAppEvent.emit).toHaveBeenCalledWith('#modal',expect.objectContaining({hash:'#ship.update',data:shipping}));
});
