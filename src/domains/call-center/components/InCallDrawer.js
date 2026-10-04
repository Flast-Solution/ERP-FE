import { useNavigate } from 'react-router-dom';
import {
  AudioMutedOutlined,
  FileAddOutlined,
  MessageOutlined,
  NumberOutlined,
  PauseOutlined,
  PhoneOutlined,
  SwapOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useCallCenterStore } from '../store/useCallCenterStore';
import { useCallDuration } from '../hooks';
import { CALL_DIRECTION, IN_CALL_TABS } from '../constants';
import { formatDuration, formatPhone } from '../utils/format';
import {
  CustomerAvatar,
  CustomerHero,
  CustomerKpi,
  CustomerOpenItems,
  CustomerTimeline,
} from './CustomerSummary';
import { Button, EmptyBox, SectionTitle } from '../styles/shared.styles';
import {
  CallBar,
  CallControl,
  InCallPanel,
  NoteArea,
  OrderRow,
  PanelBody,
  PanelFooter,
  Scrim,
  Tabs,
} from '../styles/call.styles';

const HANGUP_STYLE = { transform: 'rotate(135deg)' };

const NoteBox = () => {
  const note = useCallCenterStore(state => state.call.note);
  const setNote = useCallCenterStore(state => state.setNote);

  return (
    <div>
      <SectionTitle style={{ marginBottom: 6 }}>Ghi chú cuộc gọi</SectionTitle>
      <NoteArea
        value={note}
        placeholder="Ghi lại nội dung trao đổi với khách…"
        onChange={event => setNote(event.target.value)}
      />
    </div>
  );
};

const TabContent = ({ tab, customer }) => {
  if (!customer) {
    return (
      <>
        <EmptyBox>
          <b>Số này chưa có trong hệ thống</b>
          Sau cuộc gọi bạn có thể tạo lead hoặc tạo đơn.
        </EmptyBox>
        <NoteBox />
      </>
    );
  }
  if (tab === 'alerts') {
    return <CustomerOpenItems items={customer.openItems} actionable />;
  }
  if (tab === 'orders') {
    return (
      <>
        <SectionTitle>Đơn hàng</SectionTitle>
        {(customer.orders || []).map(order => (
          <OrderRow key={order.code}>
            <div>
              {order.code}
              <small>{order.date} · {order.status}</small>
            </div>
            <b>{order.total}</b>
          </OrderRow>
        ))}
      </>
    );
  }
  if (tab === 'history') {
    return <CustomerTimeline events={customer.timeline} limit={20} />;
  }
  return (
    <>
      <CustomerHero customer={customer} size={44} />
      <CustomerKpi kpi={customer.kpi} />
      <CustomerOpenItems items={customer.openItems} actionable />
      <NoteBox />
      <CustomerTimeline events={customer.timeline} limit={3} />
    </>
  );
};

/* Drawer chi tiết khách hàng khi đang trong cuộc gọi */
const InCallDrawer = () => {
  const navigate = useNavigate();
  const call = useCallCenterStore(state => state.call);
  const activeTab = useCallCenterStore(state => state.activeTab);
  const setActiveTab = useCallCenterStore(state => state.setActiveTab);
  const toggleMute = useCallCenterStore(state => state.toggleMute);
  const toggleHold = useCallCenterStore(state => state.toggleHold);
  const hangup = useCallCenterStore(state => state.hangup);
  const duration = useCallDuration(call.startedAt);
  const { customer } = call;

  const alertCount = customer?.openItems?.length || 0;
  const directionLabel = call.direction === CALL_DIRECTION.OUT ? 'Gọi đi' : 'Gọi đến';

  return (
    <>
      <Scrim />
      <InCallPanel role="dialog" aria-label="Đang trong cuộc gọi">
        <CallBar>
          <CustomerAvatar name={customer?.name} size={36} />
          <div>
            <b>{customer?.name || formatPhone(call.phone)}</b>
            <small>{formatPhone(call.phone)} · {directionLabel}</small>
          </div>
          <span className="timer"><i />{formatDuration(duration)}</span>
          <span className="sp" />
          <CallControl type="button" title="Tắt mic" $on={call.isMuted} onClick={toggleMute}>
            <AudioMutedOutlined />
          </CallControl>
          <CallControl type="button" title="Giữ máy" $on={call.isOnHold} onClick={toggleHold}>
            <PauseOutlined />
          </CallControl>
          <CallControl type="button" title="Chuyển máy">
            <SwapOutlined />
          </CallControl>
          <CallControl type="button" title="Bàn phím">
            <NumberOutlined />
          </CallControl>
          <CallControl type="button" title="Kết thúc" $end onClick={hangup}>
            <PhoneOutlined style={HANGUP_STYLE} />
          </CallControl>
        </CallBar>

        <Tabs>
          {IN_CALL_TABS.map(tab => (
            <button
              type="button"
              key={tab.key}
              className={activeTab === tab.key ? 'on' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key === 'alerts' && alertCount > 0 && <em>{alertCount}</em>}
            </button>
          ))}
        </Tabs>

        <PanelBody>
          <TabContent tab={activeTab} customer={customer} />
        </PanelBody>

        <PanelFooter>
          <Button
            type="button"
            disabled={!customer?.id}
            onClick={() => navigate(`/customer/${customer.id}`)}
          >
            <UserOutlined /> Mở hồ sơ
          </Button>
          <Button type="button">
            <MessageOutlined /> Mở hội thoại
          </Button>
          <span className="sp" />
          <Button type="button" onClick={() => navigate('/lead')}>
            <UserAddOutlined /> Tạo lead
          </Button>
          <Button type="button" $primary onClick={() => navigate('/sale/ban-hang')}>
            <FileAddOutlined /> Tạo đơn
          </Button>
        </PanelFooter>
      </InCallPanel>
    </>
  );
};

export default InCallDrawer;
