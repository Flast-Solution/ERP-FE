import { fetchNotifications, normalizeNotificationSummary, NOTIFICATION_SUMMARY_API, createAlertTask, notificationAction, fetchAlertTasks, fetchAlertDetails } from './service';
import { RequestUtils } from '@flast-erp/core/utils';
import { groups } from './model';
jest.mock('@flast-erp/core/utils',()=>({RequestUtils:{Get:jest.fn(),Post:jest.fn()}}));
beforeEach(()=>jest.resetAllMocks());
test('maps backend groups and JSON fields without treating missing due dates as overdue',()=>{
 const alerts=normalizeNotificationSummary({severityHight:[{typeLabel:'Lead',total:1,alerts:[{id:'a',severity:'HIGH',status:'OPEN',dueAt:null,entityJson:'{"id":75,"kind":"LEAD","name":"Hùng"}',ruleJson:'{"name":"Quá 24 giờ","conditions":[{"label":"Đã giao","actual":"24 giờ"}]}',suggestedActionJson:'{"label":"Liên hệ lead"}',contextJson:'[]',taskIdsJson:'[]',triggeredAt:1791794578}]}],statusClose:[{alerts:[{id:'b',severity:'HIGH',status:'CLOSED',entity:{name:'Đã xử lý'}}]}]});
 expect(alerts[0]).toEqual(expect.objectContaining({entity:'Hùng',code:'75',category:'Lead',level:'high',status:'pending',dueAt:null,rule:'Quá 24 giờ',suggestion:'Liên hệ lead',conditions:[['Đã giao','24 giờ']]}));
 expect(groups(alerts).urgent).toHaveLength(0);
 expect(groups(alerts).high).toHaveLength(1);
 expect(groups(alerts).closed).toHaveLength(1);
});
test('deduplicates alerts, prefers structured fields and safely handles malformed JSON',()=>{
 const alert={id:'1',entity:{name:'Structured'},entityJson:'invalid',ruleJson:'invalid',taskIdsJson:'invalid',contextJson:'invalid'};
 expect(normalizeNotificationSummary({severityHight:[{alerts:[alert,alert]}],statusClose:[]})).toHaveLength(1);
 expect(normalizeNotificationSummary({severityHight:[{alerts:[alert]}]})[0]).toEqual(expect.objectContaining({entity:'Structured',conditions:[],context:[],taskIds:[]}));
});
test('uses the real summary GET and surfaces API failure',async()=>{
 RequestUtils.Get.mockResolvedValueOnce({errorCode:200,success:true,data:{severityHight:[],statusClose:[]}});
 await expect(fetchNotifications()).resolves.toEqual([]);
 expect(RequestUtils.Get).toHaveBeenCalledWith(NOTIFICATION_SUMMARY_API);
 RequestUtils.Get.mockResolvedValueOnce({errorCode:400,success:false,message:'Không có quyền'});
 await expect(fetchNotifications()).rejects.toThrow('Không có quyền');
});

test('uses supplied task and action endpoints with optional reason and live version',async()=>{
 RequestUtils.Post.mockResolvedValue({success:true,data:{}});
 const alert={id:'a',version:7};
 await createAlertTask(alert,{title:' Liên hệ ',ownerId:2,dueAt:'2099-01-01T00:00:00Z',priority:'high',description:'Mô tả'});
 expect(RequestUtils.Post).toHaveBeenLastCalledWith('/calendar/alert-task',{alertId:'a',expectedVersion:7,task:{title:'Liên hệ',ownerId:'2',dueAt:'2099-01-01T00:00:00Z',priority:'HIGH',description:'Mô tả'}});
 for(const action of ['IGNORE','APPROVE','UNDO']){
  await notificationAction(alert,action,'');
  expect(RequestUtils.Post).toHaveBeenLastCalledWith('/notification/action',{alertId:'a',expectedVersion:7,action});
 }
 await expect(notificationAction({id:'a'},'UNDO')).rejects.toThrow('version');
});
test('loads real tasks by alert ID and rejects malformed responses',async()=>{
 RequestUtils.Get.mockResolvedValueOnce({success:true,data:[{id:501,title:'Call',ownerId:2,status:'OPEN',entity:{name:'Lead'}}]});
 await expect(fetchAlertTasks('a')).resolves.toEqual([expect.objectContaining({id:501,alertId:'a',_remote:true,entity:'Lead',status:'pending'})]);
 expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/notification/alert/a');
 RequestUtils.Get.mockResolvedValueOnce({success:true,data:{}});
 await expect(fetchAlertTasks('a')).rejects.toThrow('không hợp lệ');
});

test('reads alert details and tasks from the new notification endpoint',async()=>{
 RequestUtils.Get.mockResolvedValueOnce({errorCode:200,success:true,data:{alert:{id:'a',version:79,severity:'HIGH',status:'OPEN',entity:{id:75,kind:'LEAD',name:'Trần văn hùng'},rule:{name:'Chưa liên hệ',conditions:[]}},tasks:[]}});
 await expect(fetchAlertDetails('a')).resolves.toMatchObject({alert:{id:'a',version:79,entity:'Trần văn hùng',level:'high'},tasks:[]});
 expect(RequestUtils.Get).toHaveBeenLastCalledWith('/erp/notification/alert/a');
});
