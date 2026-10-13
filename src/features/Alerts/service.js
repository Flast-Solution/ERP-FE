import { getAlertRule, getActionLabel } from './rules';
import { RequestUtils } from '@flast-erp/core/utils';

export const NOTIFICATION_SUMMARY_API = '/erp/notification/summary/closed-high';
const parse = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
};
const date = value => {
  if (value == null || value === '') return null;
  const parsed = new Date(typeof value === 'number' ? value * (value < 1e12 ? 1000 : 1) : value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export function normalizeNotification(alert, group = {}) {
  const definition = getAlertRule(alert.type || group.type);
  const entity = parse(alert.entity ?? alert.entityJson, {});
  const rule = parse(alert.rule ?? alert.ruleJson, {});
  const suggestion = parse(alert.suggestedAction ?? alert.suggestedActionJson, {});
  const context = parse(alert.context ?? alert.contextJson, []);
  const taskIds = parse(alert.taskIds ?? alert.taskIdsJson, []);
  const status = String(alert.status || '').toUpperCase();
  const createdAt = date(alert.triggeredAt ?? alert.createdDate);
  return {
    ...alert,
    type: alert.type || group.type,
    title: alert.title || definition?.title || alert.typeLabel || group.typeLabel || 'Cảnh báo',
    ruleDefinition: definition,
    blocksBusiness: alert.blocksBusiness ?? definition?.blocksBusiness ?? false,
    recipientGroup: definition?.recipients || '',
    autoClose: rule.autoClose || definition?.autoClose || '',
    level: ({CRITICAL:'critical', URGENT:'critical', HIGH:'high', MEDIUM:'medium', LOW:'info', INFO:'info'})[String(alert.severity || definition?.severity || '').toUpperCase()] || 'info',
    status: ({CLOSE:'resolved', CLOSED:'resolved', DONE:'resolved', RESOLVED:'resolved', DISMISSED:'ignored', IGNORED:'ignored', SNOOZED:'snoozed', IN_PROGRESS:'task', TASK_CREATED:'task'})[status] || (taskIds.length ? 'task' : 'pending'),
    entity: entity.name || '', entityData: {...entity, kind:entity.kind || definition?.entityKind},
    code: entity.code || (entity.id != null ? String(entity.id) : ''),
    category: alert.typeLabel || group.typeLabel || definition?.stage || '',
    rule: rule.name || definition?.title || '', ruleData: rule,
    triggerCondition: rule.description || definition?.condition || '',
    defaultParameters: definition?.parameters === '—' ? '' : definition?.parameters || '',
    conditions: (Array.isArray(rule.conditions) ? rule.conditions : []).map(item => [item.label, String(item.actual ?? '')]),
    context: Array.isArray(context) ? context : [],
    amount: '', owner: alert.ownerName || 'Chưa có thông tin',
    suggestion: suggestion.label || getActionLabel(suggestion.code || definition?.action),
    suggestedAction: {...suggestion, code:suggestion.code || definition?.action, label:suggestion.label || getActionLabel(suggestion.code || definition?.action)},
    dueAt: date(alert.dueAt), createdAt,
    snoozedUntil: date(alert.snoozedUntil), reminders: Number(alert.snoozeCount || 0),
    escalated: Boolean(parse(alert.escalatedTo ?? alert.escalatedToJson, null)),
    read: alert.read ?? alert.isRead ?? false,
    taskIds,
    history: createdAt ? [{text:'Hệ thống kích hoạt cảnh báo', at:createdAt}] : [],
  };
}

export function normalizeNotificationSummary(data) {
  const alerts = new Map();
  // severityHight is the field name returned by the backend.
  for (const group of [...(data?.severityHight ?? data?.severityHigh ?? []), ...(data?.statusClose ?? [])]) {
    for (const alert of group.alerts || []) {
      if (alert.id != null) alerts.set(String(alert.id), normalizeNotification(alert, group));
    }
  }
  return [...alerts.values()];
}

export async function fetchNotifications() {
  const response = await RequestUtils.Get(NOTIFICATION_SUMMARY_API);
  if (response?.success !== true && Number(response?.errorCode) !== 200) {
    throw new Error(response?.message || 'Không tải được danh sách cảnh báo.');
  }
  return normalizeNotificationSummary(response.data);
}

const unwrapAction = response => {
  if (response?.success !== true && Number(response?.errorCode) !== 200) throw new Error(response?.message || 'Không thực hiện được thao tác cảnh báo.');
  return response.data;
};
const versionOf = alert => {
  if (alert?.version == null) throw new Error('Cảnh báo chưa có version. Vui lòng tải lại dữ liệu từ BE.');
  return alert.version;
};
export async function createAlertTask(alert, task) {
  if (!task?.title?.trim() || task.ownerId == null || task.ownerId === '') throw new Error('Tên việc và người phụ trách là bắt buộc.');
  if (!(new Date(task.dueAt) > new Date())) throw new Error('Hạn công việc phải trong tương lai.');
  return unwrapAction(await RequestUtils.Post('/calendar/alert-task', {
    alertId:alert.id, expectedVersion:versionOf(alert),
    task:{title:task.title.trim(),ownerId:String(task.ownerId),dueAt:task.dueAt,priority:String(task.priority || 'HIGH').toUpperCase(),description:task.description || ''},
  }));
}
export async function notificationAction(alert, action, reason) {
  return unwrapAction(await RequestUtils.Post('/notification/action', {
    alertId:alert.id, expectedVersion:versionOf(alert), action,
    ...(reason?.trim() ? {reason:reason.trim()} : {}),
  }));
}
export async function fetchAlertTasks(alertId) {
  const data=unwrapAction(await RequestUtils.Get(`/alert-task/${encodeURIComponent(alertId)}`));
  const rows=Array.isArray(data)?data:data?.content ?? data?.embedded ?? data?.tasks;
  if (!Array.isArray(rows)) throw new Error('Response danh sách công việc cảnh báo không hợp lệ.');
  return rows.map(task=>({...task,alertId:task.alertId ?? alertId,_remote:true,title:task.title ?? task.name ?? '',owner:task.ownerName ?? task.owner?.fullName ?? String(task.ownerId ?? ''),entity:typeof task.entity==='object'?(task.entity?.name || ''):(task.entity || ''),priority:String(task.priority || 'HIGH').toLowerCase(),status:['DONE','COMPLETED','CLOSED'].includes(String(task.status).toUpperCase())?'done':'pending'}));
}
