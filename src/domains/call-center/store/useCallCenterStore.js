import { create } from 'zustand';
import { CALL_DIRECTION, CALL_STATUS } from '../constants';
import { MOCK_RECENT_CALLS } from '../mocks/customers';
import { findCustomerByPhone } from '../services/callCenterService';
import { formatClock, sanitizePhone } from '../utils/format';

const MAX_RECENT = 10;

const initialCall = {
  status: CALL_STATUS.IDLE,
  direction: null,
  phone: '',
  customer: null,
  isLookingUp: false,
  startedAt: null,
  isMuted: false,
  isOnHold: false,
  note: '',
};

export const useCallCenterStore = create((set, get) => ({
  /* Trạng thái tổng đài viên */
  isReady: true,
  dialNumber: '',
  recentCalls: MOCK_RECENT_CALLS,
  call: initialCall,
  activeTab: 'overview',

  toggleReady: () => set(state => ({ isReady: !state.isReady })),

  setDialNumber: (value) => set({ dialNumber: sanitizePhone(value) }),
  pressKey: (key) => set(state => ({ dialNumber: `${state.dialNumber}${key}` })),
  backspace: () => set(state => ({ dialNumber: state.dialNumber.slice(0, -1) })),

  setActiveTab: (activeTab) => set({ activeTab }),
  setNote: (note) => set(state => ({ call: { ...state.call, note } })),
  toggleMute: () => set(state => ({ call: { ...state.call, isMuted: !state.call.isMuted } })),
  toggleHold: () => set(state => ({ call: { ...state.call, isOnHold: !state.call.isOnHold } })),

  lookupCustomer: async (phone) => {
    set(state => ({ call: { ...state.call, isLookingUp: true } }));
    const customer = await findCustomerByPhone(phone);
    /* Bỏ kết quả nếu cuộc gọi đã đổi */
    if (get().call.phone !== phone) {
      return;
    }
    set(state => ({ call: { ...state.call, customer, isLookingUp: false } }));
  },

  /* Gọi đi */
  dial: (phone) => {
    const target = sanitizePhone(phone || get().dialNumber);
    if (!target || get().call.status !== CALL_STATUS.IDLE) {
      return;
    }
    set({
      call: {
        ...initialCall,
        status: CALL_STATUS.IN_CALL,
        direction: CALL_DIRECTION.OUT,
        phone: target,
        startedAt: Date.now(),
      },
      activeTab: 'overview',
    });
    get().lookupCustomer(target);
  },

  /* Có cuộc gọi đến (từ tổng đài) */
  receiveIncoming: (phone) => {
    const target = sanitizePhone(phone);
    if (!target || get().call.status !== CALL_STATUS.IDLE) {
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
    get().lookupCustomer(target);
  },

  answer: () => {
    const { call } = get();
    if (call.status !== CALL_STATUS.INCOMING) {
      return;
    }
    set({
      call: { ...call, status: CALL_STATUS.IN_CALL, startedAt: Date.now() },
      activeTab: 'overview',
    });
  },

  reject: () => {
    const { call } = get();
    if (call.status !== CALL_STATUS.INCOMING) {
      return;
    }
    get().pushRecent({ ...call, direction: CALL_DIRECTION.MISSED }, 0);
    set({ call: initialCall });
  },

  hangup: () => {
    const { call } = get();
    if (call.status === CALL_STATUS.IDLE) {
      return;
    }
    const duration = call.startedAt ? (Date.now() - call.startedAt) / 1000 : 0;
    get().pushRecent(call, duration);
    set({ call: initialCall, dialNumber: '' });
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
}));

export default useCallCenterStore;
