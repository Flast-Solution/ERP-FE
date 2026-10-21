import { InAppEvent } from '@flast-erp/core/utils';
import { OPEN_BUSINESS_ALERT, findEntityAlerts } from '@/features/Alerts/entrypoint';
import BusinessAlertDetails from '@/features/Alerts/components/BusinessAlertDetails';
import useBusinessAlertActions from '@/features/Alerts/components/useBusinessAlertActions';
import { getBusinessScenario, businessActions } from '@/features/Alerts/businessModel';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Spin,
  Badge,
  Button,
  Checkbox,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  Modal,
  Popover,
  Radio,
  Select,
  Space,
  Tag,
  Timeline,
  Upload,
  message,
  notification,
} from 'antd';
import {
  ArrowRightOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  MessageOutlined,
  PaperClipOutlined,
  PhoneOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { LEVELS, STATUSES, groups, isClosed, urgent } from '@/features/Alerts/model';
import '@/features/Alerts/alerts.css';
import { findSystemUsers } from '@/pages/userPermissions/service';

const format = (value) =>
  value == null
    ? '—'
    : new Date(value).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      });

const localDate = (value) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const future = (hours) => localDate(Date.now() + hours * 3600000);

const icon = (level) =>
  level === 'critical' ? (
    <ExclamationCircleOutlined />
  ) : level === 'high' ? (
    <WarningOutlined />
  ) : (
    <InfoCircleOutlined />
  );

const levelColor = {
  critical: 'red',
  high: 'orange',
  medium: 'gold',
  info: 'blue',
};

const FILTERS = [
  ['urgent', 'Cần xử lý'],
  ['high', 'Mức cao'],
  ['watch', 'Đang theo dõi'],
  ['closed', 'Đã xử lý'],
];

function Status({ alert }) {
  return (
    <Tag color={isClosed(alert) ? 'green' : alert.status === 'task' ? 'blue' : undefined}>
      {alert.escalated && !isClosed(alert) ? 'Đã nâng cấp' : STATUSES[alert.status]}
    </Tag>
  );
}

export default function NotificationDropdown({
  notifications = [],
  tasks = [],
  onMarkRead,
  onMarkAllRead,
  onAction,
  acting = false,
  onLoadTasks,
  onUndoIgnore,
  onReset,
  onRefresh,
  loading = false,
  error,
}) {
  const [pendingOpen, setPendingOpen] = useState(null);
  const [entryReady, setEntryReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('high');
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('detail');
  const [popover, setPopover] = useState(null);
  const [center, setCenter] = useState(false);
  const [tasksLoadingId, setTasksLoadingId] = useState(null);
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState('');
  const [other, setOther] = useState('');
  const [owners, setOwners] = useState([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [remind, setRemind] = useState('1');
  const [custom, setCustom] = useState('');
  const [processing, setProcessing] = useState(false);
  const [files, setFiles] = useState([]);
  const [recording, setRecording] = useState(false);
  const [assignment] = Form.useForm();
  const [resolution] = Form.useForm();
  const a = notifications.find((item) => item.id === selectedId);
  const scenario = getBusinessScenario(a);
  const businessAction = useBusinessAlertActions(a, scenario, onRefresh, () => {
    setSelectedId(null);
    setMode('detail');
    setPopover(null);
  });
  const customerAlert = ['LEAD', 'CUSTOMER', 'DEAL', 'QUOTE'].includes(a?.entityData?.kind);
  const activityOptions = customerAlert
    ? [
        ...new Set(
          [
            a?.suggestion,
            'Gọi hỏi thăm khách',
            'Nhắn tin qua Zalo',
            'Gửi lại báo giá',
            'Hẹn gặp trực tiếp',
            'Cách khác',
          ].filter(Boolean),
        ),
      ]
    : [
        ...new Set(
          [a?.suggestion, 'Kiểm tra thông tin', 'Trao đổi với người phụ trách', 'Cách khác'].filter(
            Boolean,
          ),
        ),
      ];
  const resultOptions = customerAlert
    ? ['Vẫn quan tâm', 'Hẹn lúc khác', 'Chưa liên lạc được', 'Không còn nhu cầu']
    : ['Đã hoàn thành', 'Cần theo dõi tiếp', 'Chưa xử lý được'];
  const buckets = groups(notifications);
  const list = buckets[filter]
    .filter((item) =>
      `${item.title} ${item.entity} ${item.code}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((x, y) => Number(urgent(y)) - Number(urgent(x)));

  const initialActivity = a?.suggestion;
  useEffect(() => {
    resolution.resetFields();
    if (selectedId != null)
      resolution.setFieldsValue({
        activity: initialActivity,
        result: customerAlert ? 'Vẫn quan tâm' : 'Đã hoàn thành',
      });
  }, [selectedId, initialActivity, customerAlert, resolution]);

  const select = useCallback(
    (item) => {
      setMode('detail');
      setPopover(null);
      setReason('');
      setOther('');
      setRemind('1');
      setFiles([]);
      setRecording(false);
      setProcessing(false);
      onMarkRead?.(item);
      setTasksLoadingId(item.id);
      Promise.resolve(onLoadTasks?.(item.id))
        .catch((error) => message.error(error.message))
        .finally(() => setTasksLoadingId((current) => (current === item.id ? null : current)));
      setSelectedId(item.id);
      setOpen(false);
    },
    [onMarkRead, onLoadTasks],
  );

  useEffect(() => {
    const handler = (target) => {
      setPendingOpen(target);
      setEntryReady(false);
      Promise.resolve(onRefresh?.())
        .catch(() => {})
        .finally(() => setEntryReady(true));
    };
    InAppEvent.addEventListener(OPEN_BUSINESS_ALERT, handler);
    return () => InAppEvent.removeListener(OPEN_BUSINESS_ALERT, handler);
  }, [onRefresh]);
  useEffect(() => {
    if (!pendingOpen || !entryReady || loading) return;
    const matches = findEntityAlerts(notifications, pendingOpen);
    setPendingOpen(null);
    const next = matches.find((item) => !isClosed(item)) || matches[0];
    if (next) select(next);
    else message.info('Chưa có cảnh báo của đối tượng trong danh sách được cấp quyền.');
  }, [pendingOpen, entryReady, loading, notifications, select]);

  const run = async (action, payload) => {
    try {
      await onAction?.(a.id, action, payload);
      return true;
    } catch (error) {
      message.error(error.message);
      return false;
    }
  };

  const beginAssign = async () => {
    setOwnersLoading(true);
    try {
      const users = await findSystemUsers();
      setOwners(
        users.map((user) => ({
          value: String(user.id ?? user.userId),
          label: user.fullName || user.ssoId || String(user.id),
        })),
      );
    } catch (error) {
      message.error(error.message);
    } finally {
      setOwnersLoading(false);
    }
    assignment.setFieldsValue({
      title: a.suggestion,
      ownerId: a.ownerId != null ? String(a.ownerId) : undefined,
      dueAt: future(1),
      priority: a.level,
    });
    setMode('assign');
    setPopover(null);
  };

  const ignore = async () => {
    const why = reason === 'Lý do khác' ? other.trim() : reason;
    const before = { ...a };
    if (!(await run('ignore', { reason: why }))) return;
    setPopover(null);
    const key = `undo-${a.id}`;
    notification.open({
      key,
      message: 'Đã bỏ qua cảnh báo',
      description: why,
      duration: 5,
      btn: (
        <Button
          onClick={async () => {
            try {
              await onUndoIgnore?.(before.id);
              notification.destroy(key);
            } catch (error) {
              message.error(error.message);
            }
          }}
        >
          Hoàn tác
        </Button>
      ),
    });
  };

  const until = () => {
    if (remind === 'custom') return new Date(custom).toISOString();
    const d = new Date();
    if (remind === '1') d.setHours(d.getHours() + 1);
    if (remind === 'afternoon') {
      d.setHours(14, 0, 0, 0);
      if (d <= new Date()) d.setDate(d.getDate() + 1);
    }
    if (remind === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
    }
    if (remind === 'monday') {
      d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
      d.setHours(8, 0, 0, 0);
    }
    return d.toISOString();
  };

  const snooze = async () => {
    try {
      if (await run('snooze', { until: until() })) {
        setPopover(null);
        message.success('Đã đặt giờ nhắc lại');
      }
    } catch {
      message.warning('Chọn thời gian nhắc lại hợp lệ');
    }
  };

  const row = (item) => (
    <div
      className="alert-row"
      role="button"
      tabIndex={0}
      key={item.id}
      onClick={() => select(item)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && ['Enter', ' '].includes(e.key)) {
          e.preventDefault();
          select(item);
        }
      }}
    >
      <span className={`alert-icon ${item.level}`}>{icon(item.level)}</span>
      <div className="alert-content">
        <strong>{item.title}</strong>
        <p>{[item.entity, item.amount].filter(Boolean).join(' · ')}</p>
        <div className="alert-meta">
          <Tag color={levelColor[item.level]}>{LEVELS[item.level]}</Tag>
          {!isClosed(item) && (
            <span>
              <ClockCircleOutlined />{' '}
              {item.status === 'snoozed' ? `Nhắc ${format(item.snoozedUntil)}` : format(item.dueAt)}
            </span>
          )}
          <Status alert={item} />
        </div>
      </div>
      {!item.read && <span className="alert-dot" aria-label="Chưa xem" />}
      {!isClosed(item) && (
        <div className="alert-row-actions">
          <Button
            size="small"
            aria-label={`Xử lý ${item.id}`}
            icon={<FlagOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              select(item);
              setProcessing(true);
            }}
          />
          <Button
            size="small"
            aria-label={`Nhắc lại ${item.id}`}
            icon={<ClockCircleOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              select(item);
              setPopover('snooze');
            }}
          />
        </div>
      )}
    </div>
  );

  const tabs = (
    <div className="alert-tabs" role="tablist">
      {FILTERS.map(([key, label]) => (
        <button
          key={key}
          role="tab"
          aria-selected={filter === key}
          className={filter === key ? 'active' : ''}
          onClick={() => setFilter(key)}
        >
          {label} {buckets[key].length}
        </button>
      ))}
    </div>
  );

  const panel = (
    <div className="alert-panel">
      <div className="alert-head">
        <h3>Cảnh báo</h3>
        <Button type="link" onClick={onMarkAllRead}>
          Đánh dấu đã xem
        </Button>
      </div>
      <div className="alert-summary">
        {FILTERS.map(([key, label]) => (
          <button
            className={filter === key ? 'active' : ''}
            key={key}
            onClick={() => setFilter(key)}
          >
            <strong>{buckets[key].length}</strong>
            <small>{label}</small>
          </button>
        ))}
      </div>
      {tabs}
      {error && (
        <Alert
          type="error"
          message={error}
          action={
            <Button size="small" onClick={onRefresh}>
              Thử lại
            </Button>
          }
        />
      )}
      {loading && <Spin style={{ display: 'block', padding: 12 }} />}
      <div className="alert-list">
        {list.length ? (
          <>
            <div className="alert-group">
              {FILTERS.find(([key]) => key === filter)[1].toUpperCase()}
            </div>
            {list.map(row)}
          </>
        ) : (
          <Empty
            description="Không có cảnh báo trong nhóm này"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
      <div className="alert-foot">
        <span>Chấm xanh = chưa xem</span>
        <Button
          type="link"
          onClick={() => {
            setCenter(true);
            setOpen(false);
          }}
        >
          Trung tâm cảnh báo <ArrowRightOutlined />
        </Button>
      </div>
    </div>
  );

  const ignorePanel = (
    <div className="alert-popover">
      <h3>Bỏ qua cảnh báo này?</h3>
      <p>Vẫn xem lại được trong Đã xử lý.</p>
      <Radio.Group value={reason} onChange={(e) => setReason(e.target.value)}>
        {[
          'Mình đã xử lý ở chỗ khác',
          customerAlert ? 'Khách không còn nhu cầu' : 'Không còn cần xử lý',
          'Cảnh báo chưa đúng / bị trùng',
          'Lý do khác',
        ].map((text) => (
          <Radio key={text} value={text}>
            {text}
          </Radio>
        ))}
      </Radio.Group>
      {reason === 'Lý do khác' && (
        <Input.TextArea
          aria-label="Lý do bỏ qua"
          value={other}
          onChange={(e) => setOther(e.target.value)}
          placeholder="Nhập lý do"
        />
      )}

      <Space style={{ marginTop: 16 }}>
        <Button onClick={() => setPopover(null)}>Huỷ</Button>
        <Button danger type="primary" loading={acting} onClick={ignore}>
          Bỏ qua
        </Button>
      </Space>
    </div>
  );

  const reminderPanel = (
    <div className="alert-popover">
      <h3>Nhắc lại khi nào?</h3>
      <Radio.Group value={remind} onChange={(e) => setRemind(e.target.value)}>
        {[
          ['1', '1 giờ nữa'],
          ['afternoon', '14:00 gần nhất'],
          ['tomorrow', 'Sáng mai 08:00'],
          ['monday', 'Thứ 2 tuần sau 08:00'],
          ['custom', 'Chọn giờ khác'],
        ].map(([value, label]) => (
          <Radio key={value} value={value}>
            {label}
          </Radio>
        ))}
      </Radio.Group>
      {remind === 'custom' && (
        <Input type="datetime-local" value={custom} onChange={(e) => setCustom(e.target.value)} />
      )}
      <p>Đã hoãn {a?.reminders || 0} lần. Từ lần thứ 3, quản lý cùng theo dõi.</p>
      <Space>
        <Button onClick={() => setPopover(null)}>Huỷ</Button>
        <Button type="primary" onClick={snooze}>
          Nhắc lại
        </Button>
      </Space>
    </div>
  );

  const footer =
    a &&
    (mode === 'assign' ? (
      <div className="alert-footer">
        <Button onClick={() => setMode('detail')}>Quay lại</Button>
        <Button
          type="primary"
          loading={acting}
          disabled={ownersLoading}
          onClick={() => assignment.submit()}
        >
          Giao việc
        </Button>
      </div>
    ) : (
      !isClosed(a) && (
        <div className={`alert-footer ${scenario ? 'business-alert-footer' : ''}`}>
          <Popover
            trigger="click"
            placement="topLeft"
            open={popover === 'ignore'}
            onOpenChange={(value) => setPopover(value ? 'ignore' : null)}
            content={ignorePanel}
          >
            <Button danger disabled={acting}>
              Bỏ qua
            </Button>
          </Popover>
          <Popover
            trigger="click"
            placement="topLeft"
            open={popover === 'snooze'}
            onOpenChange={(value) => setPopover(value ? 'snooze' : null)}
            content={reminderPanel}
          >
            <Button icon={<ClockCircleOutlined />}>Nhắc lại</Button>
          </Popover>
          {!scenario && (
            <Button
              loading={acting}
              onClick={async () => {
                if (await run('approve')) message.success('Đã phê duyệt cảnh báo');
              }}
            >
              Phê duyệt
            </Button>
          )}
          <Button
            onClick={beginAssign}
            disabled={tasks.some((t) => t.alertId === a.id && t.status === 'pending')}
          >
            Giao việc
          </Button>
          {scenario && <span className="business-alert-footer-spacer" />}
          {scenario && businessAction.visible && (
            <Button
              disabled={acting || businessAction.disabled}
              icon={
                ['lead', 'production'].includes(scenario) ? (
                  <PhoneOutlined />
                ) : scenario === 'pod' ? (
                  <PaperClipOutlined />
                ) : (
                  <ArrowRightOutlined />
                )
              }
              onClick={() => businessAction.open('primary')}
            >
              {businessActions[scenario]}
            </Button>
          )}
          <Button
            type="primary"
            icon={<FlagOutlined />}
            onClick={() => {
              setProcessing(true);
              setPopover(null);
            }}
          >
            Xử lý
          </Button>
        </div>
      )
    ));

  return (
    <>
      <Dropdown
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (value) onRefresh?.();
        }}
        trigger={['hover', 'click']}
        placement="bottomRight"
        dropdownRender={() => panel}
      >
        <button
          type="button"
          className="notification-trigger"
          aria-label="Cảnh báo"
          aria-expanded={open}
        >
          <Badge count={buckets.urgent.length} size="small">
            <BellOutlined />
          </Badge>
        </button>
      </Dropdown>
      <Drawer
        title={
          <span>
            <BellOutlined /> Chi tiết cảnh báo <small style={{ color: '#667085' }}>#{a?.id}</small>
          </span>
        }
        width={scenario ? 'min(880px, 100vw)' : 560}
        rootClassName={scenario ? 'business-alert-drawer' : undefined}
        extra={
          scenario ? (
            <Button
              type="text"
              icon={<LinkOutlined />}
              aria-label="Mở đối tượng liên quan"
              onClick={() =>
                businessAction.open(
                  { lead: 'lead', opportunity: 'opportunity', pod: 'shipping' }[scenario] ||
                    'order',
                )
              }
            />
          ) : undefined
        }
        open={Boolean(a)}
        onClose={() => {
          setSelectedId(null);
          setProcessing(false);
          setPopover(null);
        }}
        footer={footer}
      >
        {a &&
          (scenario && mode === 'detail' ? (
            <BusinessAlertDetails
              key={a.id}
              alert={a}
              scenario={scenario}
              onOpen={businessAction.open}
            />
          ) : (
            <div className="alert-detail">
              <Space>
                <Tag color={levelColor[a.level]}>{LEVELS[a.level]}</Tag>
                <span>{a.category}</span>
                {a.blocksBusiness && <Tag color="orange">Có chặn nghiệp vụ</Tag>}
                <Status alert={a} />
              </Space>
              <h2>{a.title}</h2>
              <p>{a.description}</p>
              <div className="alert-facts">
                {[
                  ['Đối tượng', `${a.entity} · ${a.code}`],
                  ['Mức độ', LEVELS[a.level]],
                  ['Phụ trách', a.owner],
                  ['Hạn xử lý', format(a.dueAt)],
                  ['Giá trị', a.amount],
                  ['Nhắc lại', `${a.reminders} lần`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <section className="alert-section">
                <h4>LỊCH SỬ GIAO VIỆC</h4>
                {tasksLoadingId === a.id ? (
                  <Spin size="small" />
                ) : tasks.filter((task) => String(task.alertId) === String(a.id)).length ? (
                  tasks
                    .filter((task) => String(task.alertId) === String(a.id))
                    .map((task) => (
                      <div key={task.id} className="alert-section">
                        <strong>{task.title}</strong>
                        {task.description && <p>{task.description}</p>}
                        <div className="alert-task-facts">
                          {[
                            ['Phụ trách', task.owner || 'Chưa có thông tin'],
                            ['Người giao', task.assignedBy],
                            ['Ngày giao', task.assignedAt && format(task.assignedAt)],
                            ['Bắt đầu', task.startAt && format(task.startAt)],
                            ['Hạn', format(task.dueAt)],
                            [
                              'Ưu tiên',
                              {
                                high: 'Cao',
                                critical: 'Khẩn cấp',
                                medium: 'Trung bình',
                                low: 'Thấp',
                                info: 'Thấp',
                              }[task.priority] || task.priority,
                            ],
                            ['Địa điểm', task.location],
                          ]
                            .filter(([, value]) => value)
                            .map(([label, value]) => (
                              <div key={label}>
                                <small>{label}</small>
                                <div>{value}</div>
                              </div>
                            ))}
                        </div>
                        <Tag color={task.status === 'done' ? 'green' : 'blue'}>
                          {task.status === 'done' ? 'Hoàn thành' : 'Đang mở'}
                        </Tag>
                      </div>
                    ))
                ) : (
                  <p>Chưa có lịch sử giao việc</p>
                )}
              </section>
              {mode === 'assign' ? (
                <div className="alert-assignment">
                  <h3>Giao việc cho ai đó</h3>
                  <Form
                    form={assignment}
                    layout="vertical"
                    onFinish={async (values) => {
                      if (
                        await run('assign', {
                          ...values,
                          dueAt: new Date(values.dueAt).toISOString(),
                        })
                      ) {
                        setMode('detail');
                        message.success('Đã tạo việc từ cảnh báo');
                      }
                    }}
                  >
                    <Form.Item
                      name="title"
                      label="Tên công việc"
                      rules={[{ required: true, whitespace: true, message: 'Nhập tên công việc' }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="ownerId"
                      label="Người phụ trách"
                      rules={[{ required: true, message: 'Chọn người phụ trách' }]}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        loading={ownersLoading}
                        options={owners}
                      />
                    </Form.Item>
                    <Form.Item
                      name="dueAt"
                      label="Hạn"
                      rules={[{ required: true, message: 'Chọn hạn' }]}
                    >
                      <Input type="datetime-local" />
                    </Form.Item>
                    <Form.Item name="priority" label="Ưu tiên">
                      <Select
                        options={Object.entries(LEVELS).map(([value, label]) => ({ value, label }))}
                      />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <p>Liên quan: {a.entity}</p>
                    <p>
                      {scenario
                        ? 'Hoàn thành việc sẽ được ghi nhận. Cảnh báo chỉ đóng khi điều kiện nghiệp vụ được giải quyết.'
                        : 'Khi việc xong, cảnh báo sẽ tự đóng.'}
                    </p>
                  </Form>
                </div>
              ) : (
                <>
                  <section className="alert-section">
                    <h4>VÌ SAO BẠN NHẬN CẢNH BÁO NÀY</h4>
                    <strong>Rule: {a.rule}</strong>
                    {a.triggerCondition && <p>{a.triggerCondition}</p>}
                    {!a.conditions.length && a.defaultParameters && (
                      <p>Tham số tham khảo: {a.defaultParameters}</p>
                    )}
                    {a.recipientGroup && <p>Nhóm nhận cảnh báo: {a.recipientGroup}</p>}
                    {a.autoClose && <p>Tự đóng khi: {a.autoClose}</p>}
                    {a.blocksBusiness && <p>Cảnh báo này có quy định chặn nghiệp vụ.</p>}
                    {a.context?.map((item, index) => (
                      <div key={`context-${index}`} className="alert-condition">
                        <span>{item.label || item.key}</span>
                        <strong>
                          {item.format === 'date'
                            ? format(
                                typeof item.value === 'number'
                                  ? item.value * (item.value < 1e12 ? 1000 : 1)
                                  : item.value,
                              )
                            : String(item.value ?? '—')}
                        </strong>
                      </div>
                    ))}
                    {a.conditions.map(([label, value]) => (
                      <div key={label} className="alert-condition">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </section>
                  <section className="alert-section">
                    <h4>GỢI Ý CHO BẠN</h4>
                    <div className="alert-suggestion">{a.suggestion}</div>
                  </section>
                  <section className="alert-section">
                    <h4>LỊCH SỬ</h4>
                    <Timeline
                      items={a.history.map((entry, index) => ({
                        key: index,
                        children: (
                          <div className="alert-history">
                            <strong>{entry.text}</strong>
                            {format(entry.at)}
                          </div>
                        ),
                      }))}
                    />
                  </section>
                </>
              )}
            </div>
          ))}
      </Drawer>
      <Modal
        className="alert-resolution-modal"
        title={null}
        width={680}
        open={processing && Boolean(a)}
        onCancel={() => setProcessing(false)}
        onOk={() => resolution.submit()}
        okText="Xong, lưu lại"
        cancelText="Huỷ"
        destroyOnClose={false}
        footer={
          <div className="alert-resolution-footer">
            <span>Ghi chú được lưu trong bản demo.</span>
            <Space>
              <Button onClick={() => setProcessing(false)}>Huỷ</Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => resolution.submit()}
              >
                Xong, lưu lại
              </Button>
            </Space>
          </div>
        }
      >
        {a && (
          <>
            <div className="alert-resolution-heading">
              <span className={`alert-icon ${a.level}`}>{icon(a.level)}</span>
              <div>
                <div className="alert-resolution-eyebrow">
                  <Tag color={levelColor[a.level]} icon={icon(a.level)}>
                    {LEVELS[a.level]}
                  </Tag>
                  <span>
                    #{a.id} · {a.category}
                  </span>
                </div>
                <h2>{a.title}</h2>
                <p>{a.description} Ghi lại nội dung và kết quả xử lý.</p>
              </div>
            </div>
            <div className="alert-resolution-body">
              <div className="alert-context">
                <span>
                  <ClockCircleOutlined /> Hạn <strong>{format(a.dueAt)}</strong>
                </span>
                <span>
                  <TeamOutlined /> Phụ trách <strong>{a.owner}</strong>
                </span>
                <span>
                  <ThunderboltOutlined /> Rule <strong>{a.rule}</strong>
                </span>
              </div>
              <div
                className="alert-shortcuts"
                style={customerAlert ? undefined : { display: 'none' }}
              >
                <Button
                  onClick={() =>
                    Modal.info({
                      title: `Hội thoại · ${a.entity}`,
                      content: 'Hội thoại demo: Khách đã xem báo giá và muốn được tư vấn thêm.',
                    })
                  }
                >
                  <span className="alert-shortcut-icon">
                    <MessageOutlined />
                  </span>
                  <span>
                    <strong>Nhắn tin cho khách</strong>
                    <small>Mở hội thoại Zalo · dữ liệu demo</small>
                  </span>
                  <LinkOutlined />
                </Button>
                <Button
                  onClick={() =>
                    Modal.info({
                      title: `Hồ sơ · ${a.entity}`,
                      content: (
                        <p>
                          {a.code}
                          <br />
                          Giá trị {a.amount}
                          <br />
                          Phụ trách {a.owner}
                        </p>
                      ),
                    })
                  }
                >
                  <span className="alert-shortcut-icon">
                    <UserOutlined />
                  </span>
                  <span>
                    <strong>Xem hồ sơ khách</strong>
                    <small>Lịch sử mua, đơn, công nợ</small>
                  </span>
                  <LinkOutlined />
                </Button>
              </div>
              <Form
                layout="vertical"
                form={resolution}
                initialValues={{
                  activity: a.suggestion,
                  result: customerAlert ? 'Vẫn quan tâm' : 'Đã hoàn thành',
                }}
                onFinish={async (values) => {
                  if (
                    await run(scenario ? 'record' : 'resolve', {
                      ...values,
                      attachments: files.map((f) => ({ name: f.name, size: f.size })),
                      recording,
                      followUp: values.schedule
                        ? new Date(values.followUp).toISOString()
                        : undefined,
                    })
                  ) {
                    setProcessing(false);
                    message.success(
                      scenario
                        ? 'Đã ghi nhận trong phiên. Trạng thái cảnh báo vẫn theo dữ liệu nghiệp vụ.'
                        : 'Đã lưu kết quả xử lý (demo)',
                    );
                  }
                }}
              >
                <Form.Item name="activity" label="Gợi ý cần làm" rules={[{ required: true }]}>
                  <Radio.Group
                    className="alert-choice-group"
                    optionType="button"
                    options={activityOptions}
                  />
                </Form.Item>
                <Form.Item
                  name="result"
                  label={customerAlert ? 'Khách phản hồi thế nào?' : 'Kết quả xử lý'}
                  rules={[{ required: true }]}
                >
                  <Radio.Group
                    className="alert-choice-group"
                    optionType="button"
                    options={resultOptions}
                  />
                </Form.Item>
                <Form.Item
                  name="notes"
                  label="Ghi chú của bạn"
                  rules={[{ required: true, whitespace: true, message: 'Nhập chi tiết xử lý' }]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder={
                      customerAlert
                        ? 'Ghi lại việc đã làm và phản hồi của khách'
                        : 'Ghi lại việc đã làm và kết quả xử lý'
                    }
                  />
                </Form.Item>
                <div className="alert-attachment">
                  <Button
                    className={recording ? 'recording-selected' : ''}
                    style={customerAlert ? undefined : { display: 'none' }}
                    icon={<PhoneOutlined />}
                    aria-pressed={recording}
                    onClick={() => setRecording(!recording)}
                  >
                    Kèm ghi âm cuộc gọi gần nhất
                  </Button>
                  <Upload
                    beforeUpload={() => false}
                    fileList={files}
                    onChange={({ fileList }) => setFiles(fileList)}
                  >
                    <Button type="dashed" icon={<PaperClipOutlined />}>
                      Thêm tệp
                    </Button>
                  </Upload>
                </div>
                <small className="alert-mock-hint">
                  Thao tác xử lý đang mô phỏng · tệp và ghi âm chưa được tải lên server.
                </small>
                <div className="alert-follow-up">
                  <Form.Item name="schedule" valuePropName="checked" noStyle>
                    <Checkbox>
                      {customerAlert ? 'Nhắc mình gọi lại vào' : 'Nhắc mình theo dõi vào'}
                    </Checkbox>
                  </Form.Item>
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) => (
                      <Form.Item
                        name="followUp"
                        className="alert-follow-up-date"
                        rules={
                          getFieldValue('schedule')
                            ? [{ required: true, message: 'Chọn thời gian theo dõi' }]
                            : []
                        }
                      >
                        <Input
                          type="datetime-local"
                          aria-label="Hẹn theo dõi"
                          disabled={!getFieldValue('schedule')}
                        />
                      </Form.Item>
                    )}
                  </Form.Item>
                </div>
              </Form>
            </div>
          </>
        )}
      </Modal>
      <Drawer
        title="Trung tâm cảnh báo"
        width={800}
        open={center}
        onClose={() => {
          setCenter(false);
          setQuery('');
        }}
      >
        <div className="alert-center-tools">
          <Input.Search
            placeholder="Tìm tiêu đề, đối tượng, mã"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button onClick={onMarkAllRead}>Đánh dấu đã xem</Button>
          <Button onClick={onReset}>Tải lại</Button>
        </div>
        {tabs}
        {list.length ? list.map(row) : <Empty description="Không có cảnh báo" />}
      </Drawer>
    </>
  );
}
