import { create } from 'zustand';
import { CALL_DIRECTION, CALL_STATUS, CONNECTION } from '../constants';
import { MOCK_RECENT_CALLS } from '../mocks/customers';
import { findCustomerByPhone } from '../services/callCenterService';
import Softphone, { GW_STATE } from '../softphone/Softphone';
import { formatClock, sanitizePhone } from '../utils/format';

const MAX_RECENT = 10;

const initialCall = {
  status: CALL_STATUS.IDLE,
  direction: null,
  phone: '',
  customer: null,
  isLookingUp: false,
  /* null khi đang đổ chuông, có giá trị khi hai bên đã kết nối */
  startedAt: null,
  isEarly: false,
  isMuted: false,
  isOnHold: false,
  note: '',
};

let softphone = null;

export const useCallCenterStore = create((set, get) => {

  const getSoftphone = () => {
    if (!softphone) {
      softphone = new Softphone({
        onState: status => get().onGatewayState(status),
        onError: error => set({ error: error.message }),
      });
    }
    return softphone;
  };

  const runCommand = async (fn) => {
    try {
      await fn(getSoftphone());
      return true;
    } catch (error) {
      set({ error: error.message });
      return false;
    }
  };

  return {
    ext: null,
    connection: CONNECTION.OFFLINE,
    error: null,
    isReady: false,
    dialNumber: '',
    recentCalls: MOCK_RECENT_CALLS,
    call: initialCall,
    activeTab: 'overview',

    /* Đăng ký trình duyệt làm máy nhánh của SBC */
    connect: async (ext) => {
      const target = ext || get().ext;
      if (!target) {
        set({ error: 'Tài khoản chưa được gán máy nhánh' });
        return;
      }
      set({ ext: target, connection: CONNECTION.CONNECTING, error: null });
      try {
        await getSoftphone().connect(target);
        set({ connection: CONNECTION.ONLINE, isReady: true });
      } catch (error) {
        set({ connection: CONNECTION.ERROR, isReady: false, error: error.message });
      }
    },

    disconnect: async () => {
      if (softphone) {
        await softphone.disconnect();
      }
      set({ connection: CONNECTION.OFFLINE, isReady: false });
    },

    toggleReady: () => {
      if (get().call.status !== CALL_STATUS.IDLE) {
        return;
      }
      if (get().isReady) {
        get().disconnect();
        return;
      }
      get().connect();
    },

    clearError: () => set({ error: null }),

    setDialNumber: (value) => set({ dialNumber: sanitizePhone(value) }),
    pressKey: (key) => set(state => ({ dialNumber: `${state.dialNumber}${key}` })),
    backspace: () => set(state => ({ dialNumber: state.dialNumber.slice(0, -1) })),

    setActiveTab: (activeTab) => set({ activeTab }),
    setNote: (note) => set(state => ({ call: { ...state.call, note } })),
    toggleHold: () => set(state => ({ call: { ...state.call, isOnHold: !state.call.isOnHold } })),

    toggleMute: () => {
      const isMuted = !get().call.isMuted;
      getSoftphone().setMuted(isMuted);
      set(state => ({ call: { ...state.call, isMuted } }));
    },

    /* Gửi DTMF (vd: nhập PIN khi gọi số cần PIN) */
    sendDtmf: (digits) => runCommand(phone => phone.dtmf(digits)),

    lookupCustomer: async (phone) => {
      set(state => ({ call: { ...state.call, isLookingUp: true } }));
      const customer = await findCustomerByPhone(phone);
      /* Bỏ kết quả nếu cuộc gọi đã đổi */
      if (get().call.phone !== phone) {
        return;
      }
      set(state => ({ call: { ...state.call, customer, isLookingUp: false } }));
    },

    /* Gọi ra qua SBC */
    dial: async (phone) => {
      const target = sanitizePhone(phone || get().dialNumber);
      const { call, connection } = get();
      if (!target || call.status !== CALL_STATUS.IDLE || connection !== CONNECTION.ONLINE) {
        return;
      }
      set({
        call: {
          ...initialCall,
          status: CALL_STATUS.IN_CALL,
          direction: CALL_DIRECTION.OUT,
          phone: target,
        },
        activeTab: 'overview',
        error: null,
      });
      get().lookupCustomer(target);
      const ok = await runCommand(sp => sp.dial(target));
      if (!ok) {
        set({ call: initialCall });
      }
    },

    /* Có cuộc gọi đến (SBC báo incoming) */
    receiveIncoming: (phone) => {
      const target = sanitizePhone(phone);
      if (get().call.status !== CALL_STATUS.IDLE) {
        return;
      }
      set({
        call: {
          ...initialCall,
          status: CALL_STATUS.INCOMING,
          direction: CALL_DIRECTION.IN,
          phone: target,
        },
      });
      if (target) {
        get().lookupCustomer(target);
      }
    },

    answer: async () => {
      const { call } = get();
      if (call.status !== CALL_STATUS.INCOMING) {
        return;
      }
      set({
        call: { ...call, status: CALL_STATUS.IN_CALL },
        activeTab: 'overview',
      });
      const ok = await runCommand(sp => sp.answer());
      if (!ok) {
        get().finishCall();
      }
    },

    reject: async () => {
      if (get().call.status !== CALL_STATUS.INCOMING) {
        return;
      }
      await runCommand(sp => sp.hangup());
      get().finishCall();
    },

    hangup: async () => {
      if (get().call.status === CALL_STATUS.IDLE) {
        return;
      }
      await runCommand(sp => sp.hangup());
      get().finishCall();
    },

    /* Kết thúc cuộc gọi phía client, ghi vào danh sách gần đây */
    finishCall: () => {
      const { call } = get();
      if (call.status === CALL_STATUS.IDLE) {
        return;
      }
      const isMissed = call.status === CALL_STATUS.INCOMING;
      const duration = call.startedAt ? (Date.now() - call.startedAt) / 1000 : 0;
      get().pushRecent(
        isMissed ? { ...call, direction: CALL_DIRECTION.MISSED } : call,
        duration
      );
      getSoftphone().setMuted(false);
      set({ call: initialCall, dialNumber: '' });
    },

    /* Đồng bộ trạng thái từ webrtc_gw */
    onGatewayState: ({ state, peer }) => {
      const { call } = get();
      if (state === GW_STATE.INCOMING) {
        get().receiveIncoming(peer);
        return;
      }
      if (state === GW_STATE.EARLY) {
        set({ call: { ...call, isEarly: true } });
        return;
      }
      if (state === GW_STATE.CONNECTED) {
        if (call.status === CALL_STATUS.IDLE) {
          return;
        }
        set({
          call: {
            ...call,
            status: CALL_STATUS.IN_CALL,
            isEarly: false,
            startedAt: call.startedAt || Date.now(),
          },
        });
        return;
      }
      if (state === GW_STATE.ENDED || state === GW_STATE.IDLE) {
        get().finishCall();
      }
    },

    pushRecent: (call, duration) => set(state => ({
      recentCalls: [
        {
          id: Date.now(),
          direction: call.direction,
          phone: call.phone,
          name: call.customer?.name || '',
          time: formatClock(),
          duration,
        },
        ...state.recentCalls,
      ].slice(0, MAX_RECENT),
    })),
  };
});

export default useCallCenterStore;
