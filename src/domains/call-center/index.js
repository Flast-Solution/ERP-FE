import PhoneHeaderButton from './components/PhoneHeaderButton';
import CallCenterLayer from './components/CallCenterLayer';

/* Điểm gắn call-center vào header */
const CallCenter = () => (
  <>
    <PhoneHeaderButton />
    <CallCenterLayer />
  </>
);

export { useCallCenterStore } from './store/useCallCenterStore';
export { CALL_CENTER_INCOMING, CALL_CENTER_ENDED } from './constants';
export default CallCenter;
