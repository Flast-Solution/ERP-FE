import { RequestUtils } from '@flast-erp/core/utils';
import { RTC_URL, SUCCESS_CODE } from '@/configs';

/*
 * Trình duyệt làm máy nhánh (webrtc_gw của http_api), gọi thẳng từ trình duyệt.
 *
 * Loại 1 - xin token qua API của app (RequestUtils kèm token đăng nhập):
 *   POST omni/webrtc/register?ext=                -> { errorCode, data: { token, expires } }
 *
 * Loại 2 - fetch tới http_api với "Authorization: Bearer <token>", trả JSON thuần,
 * lỗi trả mã HTTP != 200 kèm body lỗi:
 *   POST /api/webrtc/sessions                       tạo WebRTC + đăng ký máy nhánh -> { id, sdp, ext }
 *   GET  /api/webrtc/sessions/{id}                  -> { id, ext, state, sip_code, sip_reason, caller, direction }
 *   POST /api/webrtc/sessions/{id}/dial?to=&caller= -> { id, call_id }
 *   POST /api/webrtc/sessions/{id}/dtmf?digits=     -> { id }
 *   POST /api/webrtc/sessions/{id}/answer|reject|hangup|unregister -> { id }
 */

const BASE_RTC = `${RTC_URL}/api/webrtc/sessions`;
const API_TOKEN = '/omni/webrtc/register';

export const GW_STATE = {
  IDLE: 'idle',
  INCOMING: 'incoming',
  EARLY: 'early',
  CONNECTED: 'connected',
  ENDED: 'ended'
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
  expires: 0
};

const TOKEN_REFRESH_MARGIN = 30;
const isTokenValid = () => (
  !!session.token && session.expires - TOKEN_REFRESH_MARGIN > Date.now() / 1000
);

const requestToken = async (ext) => {
  const response = await RequestUtils.Post(
    `${API_TOKEN}?ext=${encodeURIComponent(ext)}`,
    { ext }
  );
  const data = unwrap(response);
  if (!data?.token) {
    throw new Error(`Không lấy được token cho máy nhánh ${ext}`);
  }
  session.ext = ext;
  session.token = data.token;
  session.expires = Number(data.expires) || 0;
  return data;
};

const ensureToken = async () => {
  if (isTokenValid()) {
    return session.token;
  }
  if (!session.ext) {
    throw new Error('Chưa xin token webrtc_gw');
  }
  await requestToken(session.ext);
  return session.token;
};

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
const request = async (method, path = '', query) => {
  const token = await ensureToken();
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const body = await readJson(response);
  if (response.status === 401) {
    session.token = null;
  }
  if (!response.ok) {
    const message = body?.error || body?.message || `HTTP ${response.status}`;
    throw new GatewayError(`webrtc_gw: ${message}`, response.status);
  }
  return body;
};

const sessionPath = (id, cmd) => `/${encodeURIComponent(id)}${cmd ? `/${cmd}` : ''}`;

export const clearGatewayToken = () => {
  session.ext = null;
  session.token = null;
  session.expires = 0;
};

export const gatewayApi = {
  token: (ext) => requestToken(ext),
  createSession: () => request('POST'),
  status: (id) => request('GET', sessionPath(id)),
  dial: (id, to, caller) => request(
    'POST',
    sessionPath(id, 'dial'),
    { to, caller }
  ),
  dtmf: (id, digits) => request(
    'POST',
    sessionPath(id, 'dtmf'),
    { digits }
  ),
  answer: (id) => request('POST', sessionPath(id, 'answer')),
  reject: (id) => request('POST', sessionPath(id, 'reject')),
  hangup: (id) => request('POST', sessionPath(id, 'hangup')),
  unregister: (id) => request('POST', sessionPath(id, 'unregister')),
};
