/* Trạng thái của một cuộc gọi */
export const CALL_STATUS = {
  IDLE: 'idle',
  INCOMING: 'incoming',
  IN_CALL: 'in_call',
};

export const CALL_DIRECTION = {
  IN: 'in',
  OUT: 'out',
  MISSED: 'missed',
};

/* Event để tích hợp tổng đài bắn cuộc gọi đến: InAppEvent.emit(CALL_CENTER_INCOMING, { phone }) */
export const CALL_CENTER_INCOMING = 'CALL_CENTER_INCOMING';
export const CALL_CENTER_ENDED = 'CALL_CENTER_ENDED';

export const HOTLINE = '1900 6868';
export const EXTENSION = '102';

export const DIAL_KEYS = [
  ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
  ['*', ''], ['0', '+'], ['#', ''],
];

export const IN_CALL_TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'alerts', label: 'Cảnh báo & việc' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'history', label: 'Lịch sử' },
];
