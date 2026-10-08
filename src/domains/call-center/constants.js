/* Trạng thái của một cuộc gọi */
export const CALL_STATUS = {
  IDLE: 'idle',
  INCOMING: 'incoming',
  IN_CALL: 'in_call',
};

/* Trạng thái đăng ký máy nhánh với SBC */
export const CONNECTION = {
  OFFLINE: 'offline',
  CONNECTING: 'connecting',
  ONLINE: 'online',
  ERROR: 'error',
};

export const CALL_DIRECTION = {
  IN: 'in',
  OUT: 'out',
  MISSED: 'missed',
};

/* Event để tích hợp tổng đài bắn cuộc gọi đến: InAppEvent.emit(CALL_CENTER_INCOMING, { phone }) */
export const CALL_CENTER_INCOMING = 'CALL_CENTER_INCOMING';
export const CALL_CENTER_ENDED = 'CALL_CENTER_ENDED';
export const HOTLINE = process.env.REACT_APP_CALL_CENTER_HOTLINE || '19001900';

/* Máy nhánh mặc định khi tài khoản chưa có field máy nhánh (vd: acme_1001) */
export const DEFAULT_EXT = process.env.REACT_APP_CALL_CENTER_EXT || '';

export const DIAL_KEYS = [
  ['1', ''], 
  ['2', 'ABC'], 
  ['3', 'DEF'],
  ['4', 'GHI'], 
  ['5', 'JKL'], 
  ['6', 'MNO'],
  ['7', 'PQRS'], 
  ['8', 'TUV'], 
  ['9', 'WXYZ'],
  ['*', ''], 
  ['0', '+'], 
  ['#', '']
];

export const IN_CALL_TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'alerts', label: 'Cảnh báo & việc' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'history', label: 'Lịch sử' },
];
