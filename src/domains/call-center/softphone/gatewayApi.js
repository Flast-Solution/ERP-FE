import { RequestUtils } from '@flast-erp/core/utils';
import { RTC_URL, GATEWAY, SUCCESS_CODE } from '@/configs';
/*
 * Cầu nối HTTP tới SBC webrtc_gw.
 * Backend ERP proxy mỗi endpoint sang lệnh DI tương ứng (UDP 5040) hoặc API token,
 * trả nguyên chuỗi kết quả DI trong field `result` (vd: "[0, 'incoming', '0987654321']").
 *
 *   POST call-center/token      { ext }              -> { token, expires }
 *   POST api/webrtc/create      {}                   -> DI webrtc_gw create   -> [0, '<id>', '<sdp offer>']
 *   POST api/webrtc/register    { id, ext, token }   -> DI webrtc_gw register
 *   POST api/webrtc/unregister  { id }               -> DI webrtc_gw unregister
 *   POST api/webrtc/status      { id }               -> DI webrtc_gw status
 *   POST api/webrtc/answer      { id }               -> DI webrtc_gw answer
 *   POST api/webrtc/dial        { id, number }       -> DI webrtc_gw dial
 *   POST api/webrtc/dtmf        { id, digits }       -> DI webrtc_gw dtmf
 *   POST api/webrtc/hangup      { id }               -> DI webrtc_gw hangup
 */

const BASE_RTC  = `${RTC_URL}/api/webrtc`;
const API_TOKEN = `${GATEWAY}/call-center/token`;

export const GW_STATE = {
  IDLE: 'idle',
  INCOMING: 'incoming',
  EARLY: 'early',
  CONNECTED: 'connected',
  ENDED: 'ended',
};

const KNOWN_STATES = Object.values(GW_STATE);

const unwrap = (response) => {
  const { errorCode, data } = response;
  if(errorCode === SUCCESS_CODE) {
    return data;
  }
  return null;
};

/* Mã kết quả đầu chuỗi DI: "[403, ...]" -> 403 */
export const parseCode = (result) => {
  const match = String(result ?? '').match(/^\[(\d+)/);
  return match ? parseInt(match[1], 10) : NaN;
};

/* "[0, 'id', 'v=0...']" -> { id, offer } */
export const parseCreate = (result) => {
  const match = String(result ?? '').match(/^\[0, '([^']+)', '([\s\S]*)'\]$/);
  if (!match) {
    return null;
  }
  return {
    id: match[1],
    offer: match[2].replace(/\\r/g, '\r').replace(/\\n/g, '\n'),
  };
};

/* Trạng thái và số đối phương trong kết quả status */
export const parseStatus = (result) => {
  const text = String(result ?? '');
  const quoted = [...text.matchAll(/'([^']*)'/g)].map(item => item[1]);
  const state = quoted.find(item => KNOWN_STATES.includes(item)) || null;
  const peer = quoted.find(item => /^\+?\d{6,}$/.test(item)) || '';
  return { state, peer, raw: text };
};

const post = async (action, body = {}) => {
  const response = await RequestUtils.Post(`${BASE_RTC}/${action}`, body);
  return unwrap(response);
};

const take_token = async (action, body = {}) => {
  const response = await RequestUtils.Post(`${API_TOKEN}/${action}`, body);
  return unwrap(response);
};

export const gatewayApi = {
  token: (ext) => take_token('token', { ext }),
  create: () => post('create'),
  register: (id, ext, token) => post('register', { id, ext, token }),
  unregister: (id) => post('unregister', { id }),
  status: (id) => post('status', { id }),
  answer: (id) => post('answer', { id }),
  dial: (id, number) => post('dial', { id, number }),
  dtmf: (id, digits) => post('dtmf', { id, digits }),
  hangup: (id) => post('hangup', { id }),
};
