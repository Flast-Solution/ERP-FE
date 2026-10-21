import { useSipSession } from './authSipSession';
import { SUCCESS_CODE } from '@/configs';
import { getDeviceId } from './deviceId';

/*
 * Trình duyệt làm máy nhánh (webrtc_gw của http_api), gọi thẳng từ trình duyệt.
 *
 * Token lấy từ data.sipToken trong response auth; FE không xin token riêng.
 *
 * Loại 2 - fetch tới http_api với "Authorization: Bearer <token>",
 * reply bọc { errorCode, data } như API của app (các shape dưới là `data`):
 *   POST /api/webrtc/sessions?device=               tạo WebRTC + đăng ký máy nhánh -> { id, sdp, ext }
 *   GET  /api/webrtc/sessions/{id}                  -> { id, ext, state, sip_code, sip_reason, caller, direction }
 *   POST /api/webrtc/sessions/{id}/dial?to=        -> { id, call_id } (header X-Caller-Number)
 *   POST /api/webrtc/sessions/{id}/dtmf?digits=     -> { id }
 *   POST /api/webrtc/sessions/{id}/answer|reject|hangup|unregister -> { id }
 */

const BASE_RTC = `https://ws.flast.vn/webrtc/sessions`;

export const GW_STATE = {
  IDLE: 'idle',
  INCOMING: 'incoming',
  EARLY: 'early',
  CONNECTED: 'connected',
  ENDED: 'ended',
};

/* Lỗi từ http_api, giữ mã HTTP để nơi gọi xử lý (401 hết token, 404 mất phiên) */
export class GatewayError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const unwrap = (response) => {
  const { errorCode, data } = response || {};
  if (errorCode === SUCCESS_CODE) {
    return data;
  }
  return null;
};

/* Token webrtc_gw đang dùng, tách khỏi token đăng nhập của app */
const session = {
  ext: null,
  token: null,
  expires: 0,
};

// SIP credentials come exclusively from auth, including sign-with-token.
const requestToken = async (ext) => {
  const credential = useSipSession.getState().getToken(ext);
  session.ext = ext;
  session.token = credential.token;
  session.expires = credential.expires;
  return credential;
};
const ensureToken = async () => (await requestToken(session.ext)).token;

const readJson = async (response) => {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return { error: text };
  }
};

const buildUrl = (path, query) => {
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  const search = params.toString();
  return `${BASE_RTC}${path}${search ? `?${search}` : ''}`;
};

/* fetch + Bearer token webrtc, không qua axios của app */
const request = async (method, path = '', query, headers = {}) => {
  const token = await ensureToken();
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: { ...headers, Authorization: `Bearer ${token}` },
  });
  const body = await readJson(response);
  if (response.status === 401) {
    useSipSession.getState().invalidate(token);
    session.token = null;
  }
  const data = unwrap(body);
  if (!response.ok || data === null) {
    const message = body?.message || `HTTP ${response.status}`;
    throw new GatewayError(`webrtc_gw: ${message}`, response.status);
  }
  return data;
};

const sessionPath = (id, cmd) => `/${encodeURIComponent(id)}${cmd ? `/${cmd}` : ''}`;

export const clearGatewayToken = () => {
  session.ext = null;
  session.token = null;
  session.expires = 0;
};

export const gatewayApi = {
  token: (ext) => requestToken(ext),
  /* device: mã thiết bị duy nhất theo tài khoản, lưu localStorage */
  createSession: () => request('POST', '', { device: getDeviceId(session.ext) }),
  status: (id) => request('GET', sessionPath(id)),
  /* Số gọi ra (caller) gửi qua header X-Caller-Number */
  dial: (id, to, caller) =>
    request('POST', sessionPath(id, 'dial'), { to }, caller ? { 'X-Caller-Number': caller } : {}),
  dtmf: (id, digits) => request('POST', sessionPath(id, 'dtmf'), { digits }),
  answer: (id) => request('POST', sessionPath(id, 'answer')),
  reject: (id) => request('POST', sessionPath(id, 'reject')),
  hangup: (id) => request('POST', sessionPath(id, 'hangup')),
  unregister: (id) => request('POST', sessionPath(id, 'unregister')),
};
