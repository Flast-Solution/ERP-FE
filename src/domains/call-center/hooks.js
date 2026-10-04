import { useEffect, useState } from 'react';
import { InAppEvent } from '@flast-erp/core/utils';
import { CALL_CENTER_INCOMING, CALL_CENTER_ENDED, DEFAULT_EXT } from './constants';
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

/* Đăng ký máy nhánh khi vào app, huỷ đăng ký khi rời trang */
export const useSoftphoneConnection = (ext) => {
  const connect = useCallCenterStore(state => state.connect);
  const disconnect = useCallCenterStore(state => state.disconnect);
  const target = ext || DEFAULT_EXT;

  useEffect(() => {
    if (!target) {
      return undefined;
    }
    connect(target);
    const onUnload = () => disconnect();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      disconnect();
    };
  }, [target, connect, disconnect]);
};
