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
test('maps statusOpen, high, following and closed buckets without double-counting',()=>{
 const open={id:'open',severity:'CRITICAL',status:'OPEN',entity:{name:'A'}};
 const high={id:'high',severity:'HIGH',status:'OPEN',entity:{name:'B'}};
 const follow={id:'follow',severity:'MEDIUM',status:'OPEN',entity:{name:'D'}};
 const closed={id:'closed',severity:'HIGH',status:'CLOSE',entity:{name:'C'}};
 const alerts=normalizeNotificationSummary({statusOpen:[{total:2,alerts:[open,high]}],severityHight:[{total:1,alerts:[high]}],following:[{alerts:[follow]}],statusClose:[{alerts:[closed]}]});
 const grouped=groups(alerts);
 expect(grouped.urgent.map(item=>item.id)).toEqual(['open','high']);
 expect(grouped.high.map(item=>item.id)).toEqual(['high']);
 expect(grouped.watch.map(item=>item.id)).toEqual(['follow']);
 expect(grouped.closed.map(item=>item.id)).toEqual(['closed']);
 expect(alerts).toHaveLength(4);
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

test('sends reminders as REOPEN with selected time and current version',async()=>{
 RequestUtils.Post.mockResolvedValue({errorCode:200,data:{}});
 await notificationAction({id:'a',version:79},'REOPEN',undefined,'2099-01-01T07:00:00');
 expect(RequestUtils.Post).toHaveBeenLastCalledWith('/notification/action',{alertId:'a',expectedVersion:79,action:'REOPEN',snoozedUntil:'2099-01-01 07:00:00'});
 await expect(notificationAction({id:'a',version:79},'REOPEN',undefined,'2000-01-01')).rejects.toThrow('tương lai');
});

test('maps calendar task end as deadline and userId as assignee',async()=>{
 RequestUtils.Get.mockResolvedValue({success:true,data:{tasks:[{id:1252,title:'Thu hồi công nợ',userId:1639,createdBy:2,createdDate:'2026-10-14 08:33:33',start:'2026-10-14 15:33:33',end:'2026-10-14 16:35:00',priority:'HIGH'}]}});
 const {tasks}=await fetchAlertDetails('a');
 expect(tasks[0]).toMatchObject({owner:'Người dùng #1639',assignedBy:'Người dùng #2',priority:'high'});
 expect(new Date(tasks[0].dueAt).getHours()).toBe(16);
 expect(new Date(tasks[0].dueAt).getMinutes()).toBe(35);
 expect(tasks[0].assignedAt).toBeTruthy();
});

test('uses user directory names for assignee and assigning user',async()=>{
 RequestUtils.Get.mockImplementation(async path=>path==='/user/list-name-id'?{success:true,data:[{id:1638,fullName:'Nguyễn An'},{id:2,name:'Administrator'}]}:{success:true,data:{tasks:[{id:1,userId:1638,createdBy:2,end:'2026-10-14 16:35:00'}]}});
 const {tasks}=await fetchAlertDetails('a');
 expect(RequestUtils.Get).toHaveBeenCalledWith('/user/list-name-id');
 expect(tasks[0]).toMatchObject({owner:'Nguyễn An',assignedBy:'Administrator'});
});
