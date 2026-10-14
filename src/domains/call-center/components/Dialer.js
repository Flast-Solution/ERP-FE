import { useMemo } from 'react';
import {
  CloseCircleOutlined,
  DownOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useCallCenterStore } from '../store/useCallCenterStore';
import { suggestCustomer } from '../services/callCenterService';
import {
  CALL_DIRECTION,
  CALL_STATUS,
  DIAL_KEYS,
  CONNECTION,
} from '../constants';
import { formatDuration, formatPhone } from '../utils/format';
import { CustomerAvatar } from './CustomerSummary';
import {
  CallButton,
  DevLink,
  CallerSelect,
  DialerFrom,
  DialerHeader,
  DialerInput,
  DialerMatch,
  DialerError,
  DialerPanel,
  DialPad,
  ReadyToggle,
  RecentItem,
  RecentList,
} from '../styles/dialer.styles';

const DIRECTION_ICON_STYLE = {
  [CALL_DIRECTION.IN]: { transform: 'rotate(-135deg)' },
  [CALL_DIRECTION.OUT]: { transform: 'rotate(45deg)' },
  [CALL_DIRECTION.MISSED]: { transform: 'rotate(135deg)' },
};

const READY_LABEL = {
  [CONNECTION.ONLINE]: 'Sẵn sàng',
  [CONNECTION.CONNECTING]: 'Đang kết nối…',
  [CONNECTION.OFFLINE]: 'Tạm nghỉ',
  [CONNECTION.ERROR]: 'Mất kết nối',
};

const describeRecent = (item) => {
  if (item.direction === CALL_DIRECTION.MISSED) {
    return `Nhỡ · ${item.time}`;
  }
  const label = item.direction === CALL_DIRECTION.IN ? 'Gọi đến' : 'Gọi đi';
  return `${label} · ${item.time} · ${formatDuration(item.duration)}`;
};

const Dialer = () => {
  const ext = useCallCenterStore(state => state.ext);
  const callerNumbers = useCallCenterStore(state => state.callerNumbers);
  const callerNumber = useCallCenterStore(state => state.callerNumber);
  const setCallerNumber = useCallCenterStore(state => state.setCallerNumber);
  const connection = useCallCenterStore(state => state.connection);
  const error = useCallCenterStore(state => state.error);
  const dialNumber = useCallCenterStore(state => state.dialNumber);
  const recentCalls = useCallCenterStore(state => state.recentCalls);
  const callStatus = useCallCenterStore(state => state.call.status);
  const toggleReady = useCallCenterStore(state => state.toggleReady);
  const setDialNumber = useCallCenterStore(state => state.setDialNumber);
  const pressKey = useCallCenterStore(state => state.pressKey);
  const backspace = useCallCenterStore(state => state.backspace);
  const dial = useCallCenterStore(state => state.dial);
  const receiveIncoming = useCallCenterStore(state => state.receiveIncoming);

  const match = useMemo(() => suggestCustomer(dialNumber), [dialNumber]);
  const isOnline = connection === CONNECTION.ONLINE;
  const canCall = isOnline && !!dialNumber && callStatus === CALL_STATUS.IDLE;

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && canCall) {
      dial();
    }
  };

  return (
    <DialerPanel>
      <DialerHeader>
        <PhoneOutlined />
        Gọi điện
        <span className="sp" />
        <ReadyToggle type="button" $ready={isOnline}
          disabled={connection === CONNECTION.CONNECTING}
          onClick={toggleReady}>
          <i />
          {READY_LABEL[connection]}
          <DownOutlined style={{ fontSize: 10 }} />
        </ReadyToggle>
      </DialerHeader>

      <DialerFrom>
        Gọi từ
        <CallerSelect
          value={callerNumber}
          disabled={callerNumbers.length < 2}
          onChange={event => setCallerNumber(event.target.value)}
          aria-label="Số gọi ra"
        >
          {callerNumbers.map(item => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </CallerSelect>
        · máy lẻ {ext || '—'}
      </DialerFrom>
      {error && <DialerError>{error}</DialerError>}

      <DialerInput>
        <input
          value={formatPhone(dialNumber)}
          placeholder="Nhập số điện thoại"
          onChange={event => setDialNumber(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {dialNumber && (
          <button type="button" onClick={backspace} aria-label="Xoá">
            <CloseCircleOutlined />
          </button>
        )}
      </DialerInput>

      {match && (
        <DialerMatch>
          <CustomerAvatar name={match.name} size={28} />
          <div style={{ flex: 1 }}>
            <b>{match.name}</b>
            {formatPhone(match.phone)} · Khách cũ
          </div>
        </DialerMatch>
      )}

      <DialPad>
        {DIAL_KEYS.map(([key, letters]) => (
          <button type="button" key={key} onClick={() => pressKey(key)}>
            {key}
            <small>{letters}</small>
          </button>
        ))}
      </DialPad>

      <CallButton type="button" disabled={!canCall} onClick={() => dial()}>
        <PhoneOutlined /> Gọi
      </CallButton>

      {process.env.NODE_ENV === 'development' && (
        <DevLink type="button" onClick={() => receiveIncoming('0912345678')}>
          Giả lập cuộc gọi đến
        </DevLink>
      )}

      <RecentList>
        <h6>Gần đây</h6>
        {recentCalls.slice(0, 5).map(item => (
          <RecentItem key={item.id} $missed={item.direction === CALL_DIRECTION.MISSED}>
            <PhoneOutlined style={DIRECTION_ICON_STYLE[item.direction]} />
            <span className="recent__body">
              {item.name || formatPhone(item.phone)}
              <small>{describeRecent(item)}</small>
            </span>
            <button
              type="button"
              disabled={!isOnline || callStatus !== CALL_STATUS.IDLE}
              onClick={() => dial(item.phone)}
              aria-label="Gọi lại"
            >
              <PhoneOutlined />
            </button>
          </RecentItem>
        ))}
      </RecentList>
    </DialerPanel>
  );
};

export default Dialer;
