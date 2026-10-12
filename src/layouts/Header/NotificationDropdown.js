import React, { useEffect, useState } from 'react';
import {
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
  UnorderedListOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  LEVELS,
  OWNERS,
  STATUSES,
  groups,
  isClosed,
  urgent,
} from '@/features/Alerts/model';
import '@/features/Alerts/alerts.css';

const format = value => new Date(value).toLocaleString('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
});

const localDate = value => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const future = hours => localDate(Date.now() + hours * 3600000);

const icon = level => (
  level === 'critical'
    ? <ExclamationCircleOutlined />
    : level === 'high'
      ? <WarningOutlined />
      : <InfoCircleOutlined />
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
  onUndoIgnore,
  onCompleteTask,
  onReset,
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('urgent');
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('detail');
  const [popover, setPopover] = useState(null);
  const [center, setCenter] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState('');
  const [other, setOther] = useState('');
  const [approved, setApproved] = useState(false);
  const [remind, setRemind] = useState('1');
  const [custom, setCustom] = useState('');
  const [processing, setProcessing] = useState(false);
  const [files, setFiles] = useState([]);
  const [recording, setRecording] = useState(false);
  const [assignment] = Form.useForm();
  const [resolution] = Form.useForm();
  const a = notifications.find(item => item.id === selectedId);
  const buckets = groups(notifications);
  const list = buckets[filter]
    .filter(item => `${item.title} ${item.entity} ${item.code}`.toLowerCase().includes(query.toLowerCase()))
    .sort((x, y) => Number(urgent(y)) - Number(urgent(x)));

  useEffect(() => {
    resolution.resetFields();
  }, [selectedId, resolution]);

  const select = item => {
    setMode('detail');
    setPopover(null);
    setReason('');
    setOther('');
    setApproved(false);
    setRemind('1');
    setFiles([]);
    setRecording(false);
    setProcessing(false);
    onMarkRead?.(item);
    setSelectedId(item.id);
    setOpen(false);
  };

  const run = (action, payload) => {
    try {
      onAction?.(a.id, action, payload);
      return true;
    } catch (error) {
      message.error(error.message);
      return false;
    }
  };

  const beginAssign = () => {
    assignment.setFieldsValue({
      title: a.suggestion,
      owner: a.owner,
      dueAt: future(1),
      priority: a.level,
    });
    setMode('assign');
    setPopover(null);
  };

  const ignore = () => {
    const why = reason === 'Lý do khác' ? other.trim() : reason;
    if (!why) {
      message.warning('Vui lòng nhập lý do bỏ qua');
      return;
    }
    const before = { ...a };
    if (!run('ignore', { reason: why, approved })) return;
    setPopover(null);
    const key = `undo-${a.id}`;
    notification.open({
      key,
      message: 'Đã bỏ qua cảnh báo',
      description: why,
      duration: 5,
      btn: (
        <Button
          onClick={() => {
            onUndoIgnore?.(before.id, before);
            notification.destroy(key);
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

  const snooze = () => {
    try {
      if (run('snooze', { until: until() })) {
        setPopover(null);
        message.success('Đã đặt giờ nhắc lại');
      }
    } catch {
      message.warning('Chọn thời gian nhắc lại hợp lệ');
    }
  };

  const row = item => (
    <div
      className="alert-row"
      role="button"
      tabIndex={0}
      key={item.id}
      onClick={() => select(item)}
      onKeyDown={e => {
        if (e.target === e.currentTarget && ['Enter', ' '].includes(e.key)) {
          e.preventDefault();
          select(item);
        }
      }}
    >
      <span className={`alert-icon ${item.level}`}>{icon(item.level)}</span>
      <div className="alert-content">
        <strong>{item.title}</strong>
        <p>{item.entity} · {item.amount}</p>
        <div className="alert-meta">
          <Tag color={levelColor[item.level]}>{LEVELS[item.level]}</Tag>
          {!isClosed(item) && (
            <span>
              <ClockCircleOutlined />
              {' '}
              {item.status === 'snoozed' ? `Nhắc ${format(item.snoozedUntil)}` : format(item.dueAt)}
            </span>
          )}
          <Status alert={item} />
          {item.status === 'task' && (
            <Button
              size="small"
              type="link"
              onClick={e => {
                e.stopPropagation();
                setSelectedTask(tasks.find(t => t.alertId === item.id && t.status === 'pending')?.id);
                setTaskOpen(true);
                setOpen(false);
              }}
            >
              Mở việc
            </Button>
          )}
        </div>
      </div>
      {!item.read && <span className="alert-dot" aria-label="Chưa xem" />}
      {!isClosed(item) && (
        <div className="alert-row-actions">
          <Button
            size="small"
            aria-label={`Xử lý ${item.id}`}
            icon={<FlagOutlined />}
            onClick={e => {
              e.stopPropagation();
              select(item);
              setProcessing(true);
            }}
          />
          <Button
            size="small"
            aria-label={`Nhắc lại ${item.id}`}
            icon={<ClockCircleOutlined />}
            onClick={e => {
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
          {label}
          {' '}
          {buckets[key].length}
        </button>
      ))}
    </div>
  );

  const panel = (
    <div className="alert-panel">
      <div className="alert-head">
        <h3>Cảnh báo</h3>
        <Button type="link" onClick={onMarkAllRead}>Đánh dấu đã xem</Button>
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
      <div className="alert-list">
        {list.length ? (
          <>
            <div className="alert-group">
              {filter === 'urgent' ? 'CẦN XỬ LÝ NGAY' : FILTERS.find(([key]) => key === filter)[1].toUpperCase()}
            </div>
            {list.map(row)}
          </>
        ) : (
          <Empty description="Không có cảnh báo trong nhóm này" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
          Trung tâm cảnh báo
          {' '}
          <ArrowRightOutlined />
        </Button>
      </div>
      <div className="alert-demo-label" style={{ padding: '0 16px 10px' }}>Dữ liệu demo · lưu trên trình duyệt</div>
    </div>
  );

  const ignorePanel = (
    <div className="alert-popover">
      <h3>Bỏ qua cảnh báo này?</h3>
      <p>Vẫn xem lại được trong Đã xử lý.</p>
      <Radio.Group value={reason} onChange={e => setReason(e.target.value)}>
        {['Mình đã xử lý ở chỗ khác', 'Khách không còn nhu cầu', 'Cảnh báo chưa đúng / bị trùng', 'Lý do khác'].map(text => (
          <Radio key={text} value={text}>{text}</Radio>
        ))}
      </Radio.Group>
      {reason === 'Lý do khác' && (
        <Input.TextArea
          aria-label="Lý do bỏ qua"
          value={other}
          onChange={e => setOther(e.target.value)}
          placeholder="Nhập lý do"
        />
      )}
      {a?.level === 'critical' && (
        <Checkbox checked={approved} onChange={e => setApproved(e.target.checked)}>
          Mô phỏng quản lý đồng ý (demo)
        </Checkbox>
      )}
      <Space style={{ marginTop: 16 }}>
        <Button onClick={() => setPopover(null)}>Huỷ</Button>
        <Button danger type="primary" onClick={ignore}>Bỏ qua</Button>
      </Space>
    </div>
  );

  const reminderPanel = (
    <div className="alert-popover">
      <h3>Nhắc lại khi nào?</h3>
      <Radio.Group value={remind} onChange={e => setRemind(e.target.value)}>
        {[
          ['1', '1 giờ nữa'],
          ['afternoon', '14:00 gần nhất'],
          ['tomorrow', 'Sáng mai 08:00'],
          ['monday', 'Thứ 2 tuần sau 08:00'],
          ['custom', 'Chọn giờ khác'],
        ].map(([value, label]) => (
          <Radio key={value} value={value}>{label}</Radio>
        ))}
      </Radio.Group>
      {remind === 'custom' && (
        <Input type="datetime-local" value={custom} onChange={e => setCustom(e.target.value)} />
      )}
      <p>Đã hoãn {a?.reminders || 0} lần. Từ lần thứ 3, quản lý cùng theo dõi.</p>
      <Space>
        <Button onClick={() => setPopover(null)}>Huỷ</Button>
        <Button type="primary" onClick={snooze}>Nhắc lại</Button>
      </Space>
    </div>
  );

  const footer = a && (
    mode === 'assign' ? (
      <div className="alert-footer">
        <Button onClick={() => setMode('detail')}>Quay lại</Button>
        <Button type="primary" onClick={() => assignment.submit()}>Giao việc</Button>
      </div>
    ) : !isClosed(a) && (
      <div className="alert-footer">
        <Popover
          trigger="click"
          placement="topLeft"
          open={popover === 'ignore'}
          onOpenChange={value => setPopover(value ? 'ignore' : null)}
          content={ignorePanel}
        >
          <Button danger>Bỏ qua</Button>
        </Popover>
        <Popover
          trigger="click"
          placement="topLeft"
          open={popover === 'snooze'}
          onOpenChange={value => setPopover(value ? 'snooze' : null)}
          content={reminderPanel}
        >
          <Button icon={<ClockCircleOutlined />}>Nhắc lại</Button>
        </Popover>
        <Button
          onClick={beginAssign}
          disabled={tasks.some(t => t.alertId === a.id && t.status === 'pending')}
        >
          Giao việc
        </Button>
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
  );

  return (
    <>
      <Dropdown
        open={open}
        onOpenChange={setOpen}
        trigger={['hover', 'click']}
        placement="bottomRight"
        dropdownRender={() => panel}
      >
        <button type="button" className="notification-trigger" aria-label="Cảnh báo" aria-expanded={open}>
          <Badge count={buckets.urgent.length} size="small">
            <BellOutlined />
          </Badge>
        </button>
      </Dropdown>
      <button
        type="button"
        className="alert-trigger-task"
        aria-label="Việc từ cảnh báo"
        onClick={() => {
          setTaskOpen(true);
          setSelectedTask(null);
        }}
      >
        <Badge count={tasks.filter(t => t.status === 'pending').length} size="small" color="#b54708">
          <UnorderedListOutlined />
        </Badge>
      </button>
      <Drawer
        title={(
          <span>
            <BellOutlined />
            {' '}
            Cảnh báo
            {' '}
            <small style={{ color: '#667085' }}>#{a?.id}</small>
          </span>
        )}
        width={560}
        open={Boolean(a)}
        onClose={() => {
          setSelectedId(null);
          setProcessing(false);
          setPopover(null);
        }}
        footer={footer}
      >
        {a && (
          <div className="alert-detail">
            <Space>
              <Tag color={levelColor[a.level]}>{LEVELS[a.level]}</Tag>
              <span>{a.category}</span>
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
            {mode === 'assign' ? (
              <div className="alert-assignment">
                <h3>Giao việc cho ai đó</h3>
                <Form
                  form={assignment}
                  layout="vertical"
                  onFinish={values => {
                    if (run('assign', { ...values, dueAt: new Date(values.dueAt).toISOString() })) {
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
                    name="owner"
                    label="Người phụ trách"
                    rules={[{ required: true, message: 'Chọn người phụ trách' }]}
                  >
                    <Select options={OWNERS.map(name => ({ value: name, label: name }))} />
                  </Form.Item>
                  <Form.Item name="dueAt" label="Hạn" rules={[{ required: true, message: 'Chọn hạn' }]}>
                    <Input type="datetime-local" />
                  </Form.Item>
                  <Form.Item name="priority" label="Ưu tiên">
                    <Select options={Object.entries(LEVELS).map(([value, label]) => ({ value, label }))} />
                  </Form.Item>
                  <p>Liên quan: {a.entity}</p>
                  <p>Khi việc xong, cảnh báo sẽ tự đóng.</p>
                </Form>
              </div>
            ) : (
              <>
                <section className="alert-section">
                  <h4>VÌ SAO BẠN NHẬN CẢNH BÁO NÀY</h4>
                  <strong>Rule: {a.rule}</strong>
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
        )}
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
        footer={(
          <div className="alert-resolution-footer">
            <span>Ghi chú được lưu trong bản demo.</span>
            <Space>
              <Button onClick={() => setProcessing(false)}>Huỷ</Button>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => resolution.submit()}>
                Xong, lưu lại
              </Button>
            </Space>
          </div>
        )}
      >
        {a && (
          <>
            <div className="alert-resolution-heading">
              <span className={`alert-icon ${a.level}`}>{icon(a.level)}</span>
              <div>
                <div className="alert-resolution-eyebrow">
                  <Tag color={levelColor[a.level]} icon={icon(a.level)}>{LEVELS[a.level]}</Tag>
                  <span>#{a.id} · {a.category}</span>
                </div>
                <h2>{a.title}</h2>
                <p>{a.description} Ghi lại vài dòng để cả team cùng nắm nhé.</p>
              </div>
            </div>
            <div className="alert-resolution-body">
              <div className="alert-context">
                <span>
                  <ClockCircleOutlined />
                  {' '}
                  Hạn
                  {' '}
                  <strong>{format(a.dueAt)}</strong>
                </span>
                <span>
                  <TeamOutlined />
                  {' '}
                  Phụ trách
                  {' '}
                  <strong>{a.owner}</strong>
                </span>
                <span>
                  <ThunderboltOutlined />
                  {' '}
                  Rule
                  {' '}
                  <strong>{a.rule}</strong>
                </span>
              </div>
              <div className="alert-shortcuts">
                <Button
                  onClick={() => Modal.info({
                    title: `Hội thoại · ${a.entity}`,
                    content: 'Hội thoại demo: Khách đã xem báo giá và muốn được tư vấn thêm.',
                  })}
                >
                  <span className="alert-shortcut-icon"><MessageOutlined /></span>
                  <span>
                    <strong>Nhắn tin cho khách</strong>
                    <small>Mở hội thoại Zalo · dữ liệu demo</small>
                  </span>
                  <LinkOutlined />
                </Button>
                <Button
                  onClick={() => Modal.info({
                    title: `Hồ sơ · ${a.entity}`,
                    content: (
                      <p>
                        {a.code}
                        <br />
                        Giá trị
                        {' '}
                        {a.amount}
                        <br />
                        Phụ trách
                        {' '}
                        {a.owner}
                      </p>
                    ),
                  })}
                >
                  <span className="alert-shortcut-icon"><UserOutlined /></span>
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
                initialValues={{ activity: 'Gọi hỏi thăm khách', result: 'Vẫn quan tâm' }}
                onFinish={values => {
                  if (run('resolve', {
                    ...values,
                    attachments: files.map(f => ({ name: f.name, size: f.size })),
                    recording,
                    followUp: values.schedule ? new Date(values.followUp).toISOString() : undefined,
                  })) {
                    setProcessing(false);
                    message.success('Đã lưu kết quả xử lý (demo)');
                  }
                }}
              >
                <Form.Item name="activity" label="Gợi ý cần làm" rules={[{ required: true }]}>
                  <Radio.Group
                    className="alert-choice-group"
                    optionType="button"
                    options={['Gọi hỏi thăm khách', 'Nhắn tin qua Zalo', 'Gửi lại báo giá', 'Hẹn gặp trực tiếp', 'Cách khác']}
                  />
                </Form.Item>
                <Form.Item name="result" label="Khách phản hồi thế nào?" rules={[{ required: true }]}>
                  <Radio.Group
                    className="alert-choice-group"
                    optionType="button"
                    options={['Vẫn quan tâm', 'Hẹn lúc khác', 'Chưa liên lạc được', 'Không còn nhu cầu']}
                  />
                </Form.Item>
                <Form.Item
                  name="notes"
                  label="Ghi chú của bạn"
                  rules={[{ required: true, whitespace: true, message: 'Nhập chi tiết xử lý' }]}
                >
                  <Input.TextArea rows={4} placeholder="Ghi lại việc đã làm và phản hồi của khách" />
                </Form.Item>
                <div className="alert-attachment">
                  <Button
                    className={recording ? 'recording-selected' : ''}
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
                    <Button type="dashed" icon={<PaperClipOutlined />}>Thêm tệp</Button>
                  </Upload>
                </div>
                <small className="alert-mock-hint">Dữ liệu demo · tệp và ghi âm chưa được tải lên server.</small>
                <div className="alert-follow-up">
                  <Form.Item name="schedule" valuePropName="checked" noStyle>
                    <Checkbox>Nhắc mình gọi lại vào</Checkbox>
                  </Form.Item>
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) => (
                      <Form.Item
                        name="followUp"
                        className="alert-follow-up-date"
                        rules={getFieldValue('schedule') ? [{ required: true, message: 'Chọn thời gian theo dõi' }] : []}
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
            onChange={e => setQuery(e.target.value)}
          />
          <Button onClick={onMarkAllRead}>Đánh dấu đã xem</Button>
          <Button
            onClick={() => Modal.confirm({
              title: 'Khôi phục dữ liệu demo?',
              content: 'Các thay đổi demo hiện tại sẽ bị xoá.',
              onOk: onReset,
            })}
          >
            Khôi phục demo
          </Button>
        </div>
        {tabs}
        {list.length ? list.map(row) : <Empty description="Không có cảnh báo" />}
      </Drawer>
      <Drawer title="Việc từ cảnh báo · Demo" width={520} open={taskOpen} onClose={() => setTaskOpen(false)}>
        {(selectedTask ? tasks.filter(t => t.id === selectedTask) : tasks).map(task => (
          <div key={task.id} className="alert-section">
            <h3>{task.title}</h3>
            <p>{task.entity} · {task.owner}</p>
            <p>Hạn: {format(task.dueAt)}</p>
            <Tag color={task.status === 'done' ? 'green' : 'blue'}>
              {task.status === 'done' ? 'Hoàn thành' : 'Đang mở'}
            </Tag>
            <Space>
              <Button
                onClick={() => {
                  const alert = notifications.find(n => n.id === task.alertId);
                  if (alert) {
                    setTaskOpen(false);
                    select(alert);
                  }
                }}
              >
                Mở cảnh báo
              </Button>
              {task.status === 'pending' && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    onCompleteTask?.(task.id);
                    message.success('Việc hoàn thành');
                  }}
                >
                  Hoàn thành
                </Button>
              )}
            </Space>
          </div>
        ))}
        {!tasks.length && <Empty description="Chưa có việc" />}
      </Drawer>
    </>
  );
}
