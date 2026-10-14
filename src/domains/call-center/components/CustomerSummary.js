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
    <div><b title={kpi.totalPurchaseFull}>{kpi.totalPurchase ?? '—'}</b>Tổng mua</div>
    <div className="warn"><b>{kpi.debt ?? '—'}</b>Còn nợ</div>
    <div><b>{kpi.orderCount ?? '—'}</b>Đơn hàng</div>
    <div><b title={kpi.lastContactHint}>{kpi.lastContact ?? '—'}</b>Tương tác cuối</div>
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

export const CustomerCommercialRecords = ({records=[]}) => (
 <div style={{display:'flex',flexDirection:'column',gap:8}}>
  <SectionTitle>Cơ hội và Đơn hàng <span>{records.length} hồ sơ</span></SectionTitle>
  {records.length===0?<div style={{color:'#64748b'}}>Chưa có cơ hội hoặc đơn hàng.</div>:records.slice(0,5).map(record=>(
   <div key={`${record.kind}:${record.id}`} style={{border:'1px solid #e2e8f0',borderRadius:10,padding:'10px 12px'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'baseline'}}>
     <b>{record.kind==='order'?'Đơn hàng':'Cơ hội'} · {record.code}</b>
     <b style={{whiteSpace:'nowrap'}}>{record.amount}</b>
    </div>
    <div title={`${record.products||'Chưa có thông tin sản phẩm'}${record.quantities?` · SL: ${record.quantities}`:''}`} style={{marginTop:5,color:'#475569',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',minWidth:0}}>{record.products||'Chưa có thông tin sản phẩm'}{record.quantities&&<span> · SL: {record.quantities}</span>}</div>
    <div style={{display:'flex',justifyContent:'space-between',gap:8,marginTop:5,fontSize:11,color:'#64748b'}}>
     <span>{[record.status,record.payment].filter(Boolean).join(' · ')}</span><span>Cập nhật {record.date}</span>
    </div>
   </div>
  ))}
 </div>
);
