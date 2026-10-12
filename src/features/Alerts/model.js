export const LEVELS = { critical: 'Khẩn cấp', high: 'Cao', medium: 'Trung bình', info: 'Thông tin' };
export const STATUSES = { pending: 'Chưa xử lý', task: 'Đã tạo việc', snoozed: 'Đang theo dõi', resolved: 'Đã xử lý', ignored: 'Đã bỏ qua' };
export const OWNERS = ['Trần Văn B', 'Nguyễn Thị Lan', 'Lê Minh Anh'];
export const isClosed = a => ['resolved', 'ignored'].includes(a.status);
export const urgent = a => !isClosed(a) && a.status !== 'snoozed' && (a.level === 'critical' || a.escalated || new Date(a.dueAt) <= new Date());
export function seedAlerts(now = new Date()) {
 const date = hours => new Date(now.getTime() + hours * 3600000).toISOString();
 return [
  ['ALT-00131','critical','Công nợ quá hạn 30 ngày','Công ty Bao bì Minh Phát','HD-2026-0412','500.000.000 đ','Công nợ','Công nợ quá hạn > 30 ngày',-2],
  ['ALT-00128','high','Khách hàng chưa được chăm sóc','Nguyễn Văn A','KH-00128','450.000.000 đ','Chăm sóc khách hàng','Khách hàng > 7 ngày chưa chăm sóc',-1],
  ['ALT-00129','high','Deal chưa có hoạt động 7 ngày','Công ty An Phát','DEAL-2026-00128','450.000.000 đ','Cơ hội','Deal > 7 ngày không có hoạt động',6],
  ['ALT-00130','medium','Báo giá sắp hết hạn','Xưởng May Hoà Bình','BG-0931','128.000.000 đ','Báo giá','Báo giá hết hạn trong 24 giờ',20],
  ['ALT-00132','info','Đơn hàng mới được tạo','Công ty Hoàng Gia','OA36925311','1.980.000 đ','Đơn hàng','Đơn hàng mới',24],
 ].map(([id,level,title,entity,code,amount,category,rule,hours],index) => ({ id,level,title,entity,code,amount,category,rule,dueAt:date(hours),createdAt:date(-index-2),owner:OWNERS[0],read:index>1,status:index===2?'task':index===4?'resolved':'pending',reminders:0,escalated:index===0,description:`${entity} · ${title.toLowerCase()}.`,conditions:index===1?[['Ngày không có hoạt động','8 ngày (> 7)'],['Trạng thái khách','Khách cũ']]:[['Điều kiện đã khớp',rule],['Giá trị thực tế',amount]],suggestion:index===1?'Gọi lại cho khách và xác nhận nhu cầu':'Kiểm tra thông tin và liên hệ người phụ trách',history:[{text:'Hệ thống kích hoạt cảnh báo',at:date(-index-2)}] }));
}
export function initialState() {
 const alerts=seedAlerts(); const a=alerts[2];
 return { alerts, tasks:[{ id:'TASK-001',alertId:a.id,title:'Liên hệ Công ty An Phát',owner:a.owner,dueAt:a.dueAt,priority:a.level,entity:a.entity,status:'pending' }] };
}
export function applyAction(state,id,action,payload={},now=new Date()) {
 const alert=state.alerts.find(a=>a.id===id); if(!alert) return state;
 let next={...alert}; let tasks=[...state.tasks]; let text='';
 if(action==='read'){if(alert.read)return state;next.read=true;text='Bạn đã xem cảnh báo';}
 if(action==='ignore'){if(!payload.reason?.trim())throw new Error('Vui lòng chọn lý do bỏ qua');if(alert.level==='critical'&&!payload.approved)throw new Error('Cảnh báo khẩn cấp cần quản lý đồng ý');next.status='ignored';next.reason=payload.reason;text=`Bỏ qua: ${payload.reason}`;}
 if(action==='snooze'){if(!(new Date(payload.until)>now))throw new Error('Chọn thời gian trong tương lai');next.status='snoozed';next.snoozedUntil=payload.until;next.reminders=alert.reminders+1;next.escalated=alert.escalated||next.reminders>=3;text=`Nhắc lại vào ${new Date(payload.until).toLocaleString('vi-VN')}${next.reminders>=3?' · Đã nâng cấp cho quản lý':''}`;}
 const addTask = task => { const created={id:`TASK-${now.getTime()}-${tasks.length}`,alertId:id,entity:alert.entity,status:'pending',...task};tasks.push(created);return created; };
 if(action==='assign'){if(!payload.title?.trim()||!payload.owner||!payload.dueAt)throw new Error('Tên việc, người phụ trách và hạn là bắt buộc');if(!(new Date(payload.dueAt)>now))throw new Error('Hạn công việc phải trong tương lai');if(tasks.some(t=>t.alertId===id&&t.status==='pending'))throw new Error('Cảnh báo đã có công việc đang mở');const task=addTask(payload);next.status='task';next.taskId=task.id;next.owner=payload.owner;text=`Đã giao việc cho ${payload.owner}`;}
 if(action==='resolve'){if(!payload.notes?.trim())throw new Error('Vui lòng nhập chi tiết xử lý');if(payload.followUp&&!(new Date(payload.followUp)>now))throw new Error('Hẹn theo dõi phải trong tương lai');next.status='resolved';next.resolution=payload;tasks=tasks.map(t=>t.alertId===id?{...t,status:'done'}:t);if(payload.followUp)addTask({title:`Theo dõi: ${alert.entity}`,owner:alert.owner,dueAt:payload.followUp,priority:alert.level});text=`Đã xử lý · ${payload.activity} · ${payload.result}: ${payload.notes}`;}
 next.history=[...alert.history,{text,at:now.toISOString()}];return {...state,alerts:state.alerts.map(a=>a.id===id?next:a),tasks};
}
export function awaken(state,now=new Date()) {
 let changed=false;const alerts=state.alerts.map(a=>{if(a.status!=='snoozed'||new Date(a.snoozedUntil)>now)return a;changed=true;return {...a,status:'pending',read:false,history:[...a.history,{text:'Đến giờ nhắc lại',at:now.toISOString()}]};});return changed?{...state,alerts}:state;
}
export const groups = alerts => ({ urgent:alerts.filter(urgent),high:alerts.filter(a=>!isClosed(a)&&a.level==='high'),watch:alerts.filter(a=>!isClosed(a)),closed:alerts.filter(isClosed) });
