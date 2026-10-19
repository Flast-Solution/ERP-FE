import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useNotifications } from './useNotifications';
import { fetchNotifications, notificationAction, createAlertTask, fetchAlertDetails } from '@/features/Alerts/service';
jest.mock('./useGetMe',()=>({__esModule:true,default:()=>({user:mockUser})}));
jest.mock('@/features/Alerts/service',()=>({fetchNotifications:jest.fn(),notificationAction:jest.fn(),createAlertTask:jest.fn(),fetchAlertDetails:jest.fn(),normalizeNotification:value=>value}));
let mockUser, root, state;
function Harness(){state=useNotifications();return null;}
test('shares loaded entity identities with tenant buttons and clears them on refresh',async()=>{
 fetchNotifications.mockResolvedValue([{id:'a',entityData:{id:42,kind:'ORDER'}}]);
 await act(async()=>root.render(<Harness/>));
 const receive=jest.fn();window.addEventListener('ERP_ENTITY_ALERTS_UPDATED',receive);
 try {
  window.dispatchEvent(new CustomEvent('ERP_ENTITY_ALERTS_REQUEST'));
  expect(receive.mock.calls.at(-1)[0].detail).toEqual([{id:42,kind:'ORDER'}]);
  expect(fetchNotifications).toHaveBeenCalledTimes(1);
  fetchNotifications.mockResolvedValue([]);
  await act(async()=>state.refresh());
  expect(receive.mock.calls.at(-1)[0].detail).toEqual([]);
 } finally {window.removeEventListener('ERP_ENTITY_ALERTS_UPDATED',receive);}
});
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;jest.resetAllMocks();mockUser={bizId:1645,id:2};root=createRoot(document.createElement('div'));});
afterEach(async()=>{await act(async()=>root.unmount());delete global.IS_REACT_ACT_ENVIRONMENT;});
test('loads on mount, reloads on request, does not fall back to demo on errors',async()=>{
 fetchNotifications.mockResolvedValue([{id:'api-alert',title:'Real alert',read:false}]);
 await act(async()=>root.render(<Harness/>));
 expect(fetchNotifications).toHaveBeenCalledTimes(1);expect(state.notifications[0].id).toBe('api-alert');
 await act(async()=>state.refresh());expect(fetchNotifications).toHaveBeenCalledTimes(2);
 fetchNotifications.mockRejectedValue(new Error('API failed'));
 await act(async()=>state.refresh());expect(state.error).toBe('API failed');expect(state.notifications).toHaveLength(1);
});
test('ignores old tenant response and shares an in-flight refresh',async()=>{
 let resolveOld;
 fetchNotifications.mockImplementationOnce(()=>new Promise(resolve=>{resolveOld=resolve;}));
 await act(async()=>root.render(<Harness/>));
 act(()=>{state.refresh();});expect(fetchNotifications).toHaveBeenCalledTimes(1);
 mockUser={bizId:1649,id:3};fetchNotifications.mockResolvedValue([{id:'new-tenant'}]);
 await act(async()=>root.render(<Harness/>));
 await act(async()=>resolveOld([{id:'old-tenant'}]));
 expect(state.notifications.map(a=>a.id)).toEqual(['new-tenant']);
});

test('ignore failure does not change state; undo uses the refreshed version',async()=>{
 fetchNotifications.mockResolvedValue([{id:'a',version:3,status:'pending'}]);
 await act(async()=>root.render(<Harness/>));
 notificationAction.mockRejectedValueOnce(new Error('Không có quyền'));
 await act(async()=>{await expect(state.act('a','ignore')).rejects.toThrow('Không có quyền');});
 expect(state.notifications[0].status).toBe('pending');
 notificationAction.mockResolvedValue({});fetchNotifications.mockResolvedValue([{id:'a',version:4,status:'ignored'}]);
 await act(async()=>state.act('a','ignore',{}));
 expect(notificationAction).toHaveBeenLastCalledWith(expect.objectContaining({version:3}),'IGNORE',undefined);
 fetchNotifications.mockResolvedValue([{id:'a',version:5,status:'pending'}]);
 await act(async()=>state.undoIgnore('a'));
 expect(notificationAction).toHaveBeenLastCalledWith(expect.objectContaining({version:4}),'UNDO',undefined);
});
test('creates real task and reloads alert tasks after saving',async()=>{
 fetchNotifications.mockResolvedValue([{id:'a',version:3}]);createAlertTask.mockResolvedValue({});fetchAlertDetails.mockResolvedValue({tasks:[{id:501,alertId:'a',_remote:true}],alert:null});
 await act(async()=>root.render(<Harness/>));
 await act(async()=>state.act('a','assign',{title:'Liên hệ',ownerId:'2'}));
 expect(createAlertTask).toHaveBeenCalledWith(expect.objectContaining({id:'a',version:3}),{title:'Liên hệ',ownerId:'2'});
 expect(fetchAlertDetails).toHaveBeenCalledWith('a');expect(state.tasks[0].id).toBe(501);
});

test('loads tasks only for the opened alert and shares simultaneous detail requests',async()=>{
 fetchNotifications.mockResolvedValue([{id:'empty',status:'pending',taskIds:[]},{id:'task',status:'task',taskIds:[501]}]);
 let resolveDetails;fetchAlertDetails.mockImplementation(()=>new Promise(resolve=>{resolveDetails=resolve;}));
 await act(async()=>root.render(<Harness/>));
 await act(async()=>state.loadTasks());expect(fetchAlertDetails).not.toHaveBeenCalled();
 let first,second;act(()=>{first=state.loadTasks('task');second=state.loadTasks('task');});
 expect(fetchAlertDetails).toHaveBeenCalledTimes(1);expect(fetchAlertDetails).toHaveBeenCalledWith('task');
 await act(async()=>{resolveDetails({alert:null,tasks:[{id:501,alertId:'task'}]});await Promise.all([first,second]);});
 expect(state.tasks).toHaveLength(1);
});
