import {
  CheckOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  PhoneOutlined,
  ScheduleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Hero,
  KpiGrid,
  OpenRow,
  Pill,
  SectionTitle,
  SeverityTag,
  StatusTag,
  Timeline,
  TimelineIcon,
} from '../styles/shared.styles';
import { formatPhone, getInitials } from '../utils/format';

const SEVERITY_LABEL = {
  critical: 'Nghiêm trọng',
  high: 'Cao',
  task: 'Việc',
};

const TIMELINE_ICON = {
  g: <PhoneOutlined />,
  p: <FileTextOutlined />,
  a: <ExclamationCircleOutlined />,
  t: <ScheduleOutlined />,
};

export const CustomerAvatar = ({ name, size = 40 }) => {
  if (!name) {
    return (
      <Avatar $size={size} $unknown>
        <UserOutlined />
      </Avatar>
    );
  }
  return <Avatar $size={size}>{getInitials(name)}</Avatar>;
};

export const CustomerHero = ({ customer, size = 48 }) => (
  <Hero>
    <CustomerAvatar name={customer.name} size={size} />
    <div className="hero__body">
      <div className="hero__name">{customer.name}</div>
      <div className="hero__meta">
        <StatusTag $status={customer.status}>
          {customer.status === 'customer' ? 'Khách hàng' : 'Lead'}
        </StatusTag>
        {[customer.code, formatPhone(customer.phone), customer.saleName && `Sale ${customer.saleName}`]
          .filter(Boolean)
          .join(' · ')}
      </div>
    </div>
  </Hero>
);

export const CustomerKpi = ({ kpi = {} }) => (
  <KpiGrid>
    <div><b>{kpi.totalPurchase ?? '—'}</b>Tổng mua</div>
    <div className="warn"><b>{kpi.debt ?? '—'}</b>Còn nợ</div>
    <div><b>{kpi.orderCount ?? '—'}</b>Đơn hàng</div>
    <div><b>{kpi.lastContact ?? '—'}</b>Liên hệ cuối</div>
  </KpiGrid>
);

export const CustomerOpenItems = ({ items = [], actionable = false }) => {
  const alertCount = items.filter(item => item.type !== 'task').length;
  const taskCount = items.length - alertCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SectionTitle>
        {`Đang mở · ${alertCount} cảnh báo, ${taskCount} việc`}
        <span className="link">Xem tất cả</span>
      </SectionTitle>
      {items.map((item, index) => (
        <OpenRow key={index} $type={item.type}>
          <SeverityTag $type={item.type}>{SEVERITY_LABEL[item.type]}</SeverityTag>
          <div>
            {item.title}
            <small>{item.sub}</small>
          </div>
          {actionable ? (
            <Button type="button" $small>
              {item.type === 'task' ? <><CheckOutlined /> Xong</> : 'Xử lý'}
            </Button>
          ) : (
            <Pill>{item.status}</Pill>
          )}
        </OpenRow>
      ))}
    </div>
  );
};

export const CustomerTimeline = ({ events = [], limit = 4 }) => (
  <Timeline>
    <SectionTitle>
      Lịch sử gần đây
      <span className="link">Hồ sơ đầy đủ →</span>
    </SectionTitle>
    {events.slice(0, limit).map((event, index) => (
      <div className="tl__row" key={index}>
        <TimelineIcon $tone={event.tone}>{TIMELINE_ICON[event.tone]}</TimelineIcon>
        <div className="tl__body">
          <b>{event.title}</b>
          {event.sub}
        </div>
        <small>{event.time}</small>
      </div>
    ))}
  </Timeline>
);
