import { createPortal } from 'react-dom';
import { useCallCenterStore } from '../store/useCallCenterStore';
import useGetMe from '@/hooks/useGetMe';
import { useCallCenterEvents, useSoftphoneConnection } from '../hooks';
import { CALL_STATUS } from '../constants';
import IncomingCallPopup from './IncomingCallPopup';
import InCallDrawer from './InCallDrawer';

/* Lớp overlay của tổng đài: popup cuộc gọi đến hoặc drawer đang gọi */
const CallCenterLayer = () => {
  
  const status = useCallCenterStore(state => state.call.status);
  const { user } = useGetMe();
  useSoftphoneConnection(user?.sipExt || "amce_1002");
  useCallCenterEvents();

  if (status === CALL_STATUS.INCOMING) {
    return createPortal(<IncomingCallPopup />, document.body);
  }
  if (status === CALL_STATUS.IN_CALL) {
    return createPortal(<InCallDrawer />, document.body);
  }
  return null;
};

export default CallCenterLayer;
