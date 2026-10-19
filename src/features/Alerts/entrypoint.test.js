import { findEntityAlerts } from './entrypoint';
jest.mock('@flast-erp/core/utils',()=>({InAppEvent:{emit:jest.fn()}}));
const alerts=[{id:1,entityData:{id:42,kind:'ORDER'}},{id:2,entityData:{id:42,kind:'MO'}},{id:3,entityData:{id:43,kind:'ORDER'}}];
test('matches both entity identity and kind',()=>{
 expect(findEntityAlerts(alerts,{entityId:'42',entityKind:'ORDER'}).map(a=>a.id)).toEqual([1]);
 expect(findEntityAlerts(alerts,{entityId:42,entityKind:'PRODUCTION'}).map(a=>a.id)).toEqual([2]);
 expect(findEntityAlerts(alerts,{entityId:null,entityKind:'ORDER'})).toEqual([]);
});
test('opens an explicitly identified alert without matching another record',()=>{
 expect(findEntityAlerts(alerts,{alertId:'3'})).toEqual([alerts[2]]);
});
