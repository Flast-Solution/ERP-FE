import { useEffect, useState } from 'react';
import { InAppEvent } from '@flast-erp/core/utils';
import { CALL_CENTER_INCOMING, CALL_CENTER_ENDED } from './constants';
import { useCallCenterStore } from './store/useCallCenterStore';

/* Số giây kể từ startedAt, cập nhật mỗi giây */
export const useCallDuration = (startedAt) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startedAt) {
      return undefined;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  if (!startedAt) {
    return 0;
  }
  return (now - startedAt) / 1000;
};

/* Lắng nghe sự kiện từ tổng đài và đẩy vào store */
export const useCallCenterEvents = () => {
  const receiveIncoming = useCallCenterStore(state => state.receiveIncoming);
  const hangup = useCallCenterStore(state => state.hangup);

  useEffect(() => {
    const onIncoming = (payload = {}) => receiveIncoming(payload.phone);
    const onEnded = () => hangup();
    InAppEvent.addEventListener(CALL_CENTER_INCOMING, onIncoming);
    InAppEvent.addEventListener(CALL_CENTER_ENDED, onEnded);
    return () => {
      InAppEvent.removeListener(CALL_CENTER_INCOMING, onIncoming);
      InAppEvent.removeListener(CALL_CENTER_ENDED, onEnded);
    };
  }, [receiveIncoming, hangup]);
};
