import { useCallback, useEffect, useRef, useState } from 'react';
import useGetMe from '@/hooks/useGetMe';
import { PhoneOutlined } from '@ant-design/icons';
import { useCallCenterStore } from '../store/useCallCenterStore';
import { useCallDuration } from '../hooks';
import { CALL_STATUS, CONNECTION } from '../constants';
import { color } from '../styles/tokens';
import { formatDuration } from '../utils/format';
import { PhoneTrigger, PhoneTriggerWrap } from '../styles/dialer.styles';
import Dialer from './Dialer';

const CLOSE_DELAY = 200;

/* Icon điện thoại trên header, hover để mở bàn phím quay số */
const PhoneHeaderButton = () => {
  const { user } = useGetMe();
  const hasExtension = Boolean(String(user?.sipExt ?? '').trim());
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);
  const connection = useCallCenterStore((state) => state.connection);
  const call = useCallCenterStore((state) => state.call);
  const duration = useCallDuration(call.startedAt);

  const isInCall = call.status === CALL_STATUS.IN_CALL;

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const onEnter = useCallback(() => {
    if (!hasExtension) return;
    cancelClose();
    setOpen(true);
  }, [cancelClose, hasExtension]);

  const onLeave = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  /* Đóng bàn phím khi bắt đầu có cuộc gọi */
  useEffect(() => {
    if (!hasExtension || call.status !== CALL_STATUS.IDLE) {
      setOpen(false);
    }
  }, [call.status, hasExtension]);

  const isOnline = hasExtension && connection === CONNECTION.ONLINE;
  let label = isOnline ? 'Sẵn sàng' : 'Tạm nghỉ';
  let dotColor = isOnline ? color.success : color.ink3;
  if (connection === CONNECTION.CONNECTING) {
    label = 'Đang kết nối…';
  }
  if (connection === CONNECTION.ERROR) {
    label = 'Mất kết nối';
    dotColor = color.danger;
  }
  if (isInCall) {
    label = call.startedAt ? `Đang gọi ${formatDuration(duration)}` : 'Đang đổ chuông';
    dotColor = color.danger;
  }

  if (!hasExtension) return null;

  return (
    <PhoneTriggerWrap onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <PhoneTrigger type="button" $active={open || isInCall} $dot={dotColor}>
        <PhoneOutlined />
        <i className="dot" />
        {label}
      </PhoneTrigger>
      {hasExtension && open && !isInCall && <Dialer />}
    </PhoneTriggerWrap>
  );
};

export default PhoneHeaderButton;
