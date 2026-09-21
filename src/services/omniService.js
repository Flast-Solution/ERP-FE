/**************************************************************************/
/*  @/services/omniService.js                                             */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Lớp trung gian giữa component và nguồn dữ liệu.                        */
/*                                                                        */
/* REST  -> hành động (gửi tin, gắn khách, tạo lead) — cần mã lỗi rõ.     */
/* WS    -> realtime hai chiều (tin đến, đang gõ, đã xem, kênh lỗi).      */
/*                                                                        */
/* Đổi USE_MOCK = false khi BE xong. Component KHÔNG cần sửa.             */
/**************************************************************************/

import { CHANNEL_TYPE } from '@/store/omniStore'
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import { omniMockApi } from '@/mocks/omniMock'
import { WS_COMMAND, WS_EVENT } from './socketEvents'

const USE_MOCK_API    = false
export { WS_EVENT, WS_COMMAND, WS_TOPIC } from './socketEvents'

export const buildWsUrl = () => {
  const explicit = process.env.REACT_APP_OMNI_WS_URL
  if (explicit) {
    return explicit;
  }
  throw Error("Chưa cấu hình REACT_APP_OMNI_WS_URL !");
}

/* ======================================================================
 * Chuẩn hoá thời gian
 * ==================================================================== */

/* BE trả thời gian dạng epoch GIÂY (1789632120), JS lại tính theo
 * mili giây — new Date(1789632120) ra năm 1970.
 *
 * Chuẩn hoá tại ĐÚNG MỘT CHỖ này, ngay biên vào dữ liệu. Store và
 * component chỉ làm việc với chuỗi ISO, không cần biết BE gửi kiểu gì.
 * Mai BE đổi sang mili giây hay ISO thì chỉ sửa hàm dưới. */

/* Tên trường thời gian: mọi key kết thúc bằng At/_at, cộng vài ngoại lệ */
const isTimeKey = (key) =>
  /(At|_at)$/.test(key) || key === 'timestamp' || key === 'time'

/* 10 chữ số = giây, 13 chữ số = mili giây. Mốc 10^11 nằm giữa hai
 * khoảng nên phân biệt được mà không cần BE nói trước. */
const toISO = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  if (typeof value === 'string') {
    /* Chuỗi số thuần cũng gặp: "1789632120" */
    if (/^\d{10}$/.test(value)) {
      return new Date(Number(value) * 1000).toISOString()
    }
    if (/^\d{13}$/.test(value)) {
      return new Date(Number(value)).toISOString()
    }
    return value
  }
  if (typeof value === 'number') {
    const ms = value < 1e11 ? value * 1000 : value
    return new Date(ms).toISOString()
  }
  return value
}

/* Đi đệ quy qua payload, chỉ đụng vào trường thời gian.
 * Giữ nguyên mảng, object lồng nhau và mọi kiểu dữ liệu khác. */
export const normalizeTimes = (input) => {
  if (Array.isArray(input)) {
    return input.map(normalizeTimes)
  }
  if (input === null || typeof input !== 'object') {
    return input
  }
  /* Date, File, FormData... không phải object dữ liệu thuần */
  if (input instanceof Date || input instanceof Blob) {
    return input
  }

  const out = {}
  Object.keys(input).forEach((key) => {
    const value = input[key]
    if (isTimeKey(key)) {
      out[key] = toISO(value)
      return
    }
    out[key] = normalizeTimes(value)
  })
  return out
}

/* ======================================================================
 * REST
 * ==================================================================== */

/* Bóc vỏ response chuẩn của hệ thống, ném lỗi kèm errorCode để
 * caller phân biệt được các nhánh nghiệp vụ (vd: trùng SĐT). */
const unwrap = (res) => {
  const { data, errorCode, message } = res || {}
  if (errorCode === SUCCESS_CODE) {
    return normalizeTimes(data)
  }
  const err = new Error(message || 'Có lỗi xảy ra')
  err.errorCode = errorCode
  err.payload = data
  throw err
}

const realApi = {
  fetchChannels: () =>
    RequestUtils.Get('/omni/channel-account').then(unwrap),

  fetchConversations: ({ filters = {}, cursor = null } = {}) =>
    RequestUtils.Get('/omni/conversation', { ...filters, cursor }).then(unwrap),

  fetchMessages: (conversationId, { cursor } = {}) =>
    RequestUtils.Get(`/omni/conversation/${conversationId}/messages`, { cursor }).then(unwrap),

  fetchContext: (conversationId) =>
    RequestUtils.Get(`/omni/conversation/${conversationId}/context`).then(unwrap),

  sendMessage: (conversationId, body) =>
    RequestUtils.Post(`/omni/conversation/${conversationId}/send`, body).then(unwrap),

  linkCustomer: (identityId, customerId) =>
    RequestUtils.Post(`/omni/identity/${identityId}/link`, { customerId }).then(unwrap),

  /* Gọi SAU khi API tạo lead sẵn có của ERP đã trả về Data.
   * Omni KHÔNG tự tạo lead: việc kiểm trùng SĐT, gán sale, tạo
   * customer_personal đều nằm trong lead service của ERP rồi.
   * Ở đây chỉ nối Data đó vào hội thoại. */
  attachLead: (conversationId, dataId) =>
    RequestUtils.Post(`/omni/conversation/${conversationId}/attach-lead`, { dataId }).then(unwrap),

  assignUser: (conversationId, assignedUserId) =>
    RequestUtils.Post(`/omni/conversation/${conversationId}/assign`, { assignedUserId }).then(unwrap),

  changeStatus: (conversationId, status) =>
    RequestUtils.Post(`/omni/conversation/${conversationId}/status`, { status }).then(unwrap),

  startConnect: async (channelType) => {
    const path = channelType === CHANNEL_TYPE.ZALO_OA ? 'zalo' : 'fb'
    return RequestUtils.Get(`/omni/oauth/${path}/authorize-url`).then(unwrap)
  },

  disconnectChannel: (channelAccountId) =>
    RequestUtils.Post(`/omni/channel-account/${channelAccountId}/disconnect`).then(unwrap),

  deleteChannel: (channelAccountId) =>
    RequestUtils.Delete(`/omni/channel-account/${channelAccountId}`).then(unwrap),

  searchCustomers: (keyword) =>
    RequestUtils.Get('/omni/customer/search', { keyword }).then(unwrap),

  /* Upload trước, lấy về danh sách file đã lưu, rồi mới gửi tin */
  uploadAttachment: (file) => {
    const form = new FormData()
    form.append('file', file)
    return RequestUtils.Post('/omni/attachment/upload', form).then(unwrap)
  },
};

export const omniApi = USE_MOCK_API ? omniMockApi : realApi

/* ======================================================================
 * WebSocket
 * ==================================================================== */

const PING_INTERVAL = 30_000
const ACK_TIMEOUT = 10_000
const MAX_BACKOFF = 30_000

/* Ping do chính client quản lý, KHÔNG đặt trong React component —
 * component unmount/remount sẽ làm hỏng chu kỳ ping. */
export class OmniSocket {

  constructor({ url, token, bizId }) {
    this.url = url
    this.token = token
    this.bizId = bizId

    this.ws = null
    this.handlers = new Map()      /* event -> Set<fn> */
    this.pending = new Map()       /* requestId -> { resolve, reject, timer } */
    this.subscribed = new Set()    /* conversationId đang theo dõi */

    this.pingTimer = null
    this.retry = 0
    this.closedByUser = false
    this.authed = false
    this.seq = 0

    /** 
     * Máy ngủ dậy hoặc mạng có lại: nối ngay thay vì đợi hết backoff. 
     * Sale gập laptop buổi trưa, mở ra là phải thấy tin mới luôn. 
     */
    this._onWake = () => {
      if (this.closedByUser) {
        return
      }
      if (this.ws?.readyState === WebSocket.OPEN) {
        return
      }
      this.retry = 0
      this.connect()
    }

    this._onVisible = () => {
      if (document.visibilityState === 'visible') {
        this._onWake()
      }
    }
    window.addEventListener('online', this._onWake)
    document.addEventListener('visibilitychange', this._onVisible)
  }

  /* ---------------- vòng đời ---------------- */

  connect() {
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) {
      return
    }

    this.closedByUser = false
    const qs = `?token=${encodeURIComponent(this.token)}&bizId=${this.bizId}`
    this.ws = new WebSocket(`${this.url}${qs}`)

    this.ws.onopen = () => {
      this.retry = 0
      this._raw(WS_COMMAND.AUTH, { token: this.token, bizId: this.bizId })
      this._startPing()
    }

    this.ws.onmessage = (evt) => {
      let payload
      try {
        payload = JSON.parse(evt.data)
      } catch {
        return
      }
      this._dispatch(payload)
    }

    this.ws.onclose = () => {
      this.authed = false
      this._stopPing()
      this._emit(WS_EVENT.STATE, { connected: false })
      this._rejectAllPending(new Error('Mất kết nối'))
      if (!this.closedByUser) {
        this._scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      /* onclose luôn chạy sau onerror, xử lý reconnect ở đó cho gọn */
    }
  }

  close() {
    document.removeEventListener('visibilitychange', this._onVisible)
    this.closedByUser = true
    this.authed = false
    window.removeEventListener('online', this._onWake)
    this._stopPing()
    this.subscribed.clear()
    this._rejectAllPending(new Error('Đã đóng kết nối'))
    this.ws?.close()
    this.ws = null
  }

  /* Backoff tăng dần, trần 30s. Không retry vô hạn tức thì —
   * nhiều tab cùng reconnect sẽ đấm sập gateway. */
  _scheduleReconnect() {
    this.retry += 1
    const base = Math.min(1000 * 2 ** (this.retry - 1), MAX_BACKOFF)
    const wait = base * (0.5 + Math.random() * 0.5)
    setTimeout(() => this.connect(), wait)
  }

  _startPing() {
    this._stopPing()
    this.pingTimer = setInterval(() => {
      this._raw(WS_COMMAND.PING, {})
    }, PING_INTERVAL)
  }

  _stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
    }
    this.pingTimer = null
  }

  /* ---------------- đăng ký sự kiện ---------------- */

  on(event, fn) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event).add(fn)
    return () => this.handlers.get(event)?.delete(fn)
  }

  _emit(event, payload) {
    this.handlers.get(event)?.forEach((fn) => fn(payload))
  }

  _dispatch(payload) {

    if (payload.event === WS_EVENT.READY) {
      this.authed = true
      this._emit(WS_EVENT.STATE, { connected: true })
      this.subscribed.forEach((key) => {
        const [topic, id] = key.split(':')
        this._raw(WS_COMMAND.SUBSCRIBE, { topic, id })
      })
      return
    }

    /* Token hỏng. */
    if (payload.event === WS_EVENT.UNAUTHORIZED) {
      this.closedByUser = true
      this._emit(WS_EVENT.UNAUTHORIZED, payload.data)
      this.ws?.close()
      return
    }

    /* Phản hồi cho lệnh có requestId -> giải quyết promise đang chờ */
    if (payload.event === WS_EVENT.ACK && payload.requestId) {
      const entry = this.pending.get(payload.requestId)
      if (entry) {
        clearTimeout(entry.timer)
        this.pending.delete(payload.requestId)
        payload.ok ? entry.resolve(payload.data) : entry.reject(new Error(payload.message))
      }
      return
    }
    /* Sự kiện WS đi qua cùng một bộ chuẩn hoá thời gian với REST */
    this._emit(payload.event, normalizeTimes(payload.data))
  }

  /* ---------------- gửi lệnh ---------------- */

  _raw(command, data, requestId) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return false
    }
    this.ws.send(JSON.stringify({ command, data, requestId }))
    return true
  }

  /* Bắn đi không cần phản hồi — typing, read, subscribe */
  emit(command, data) {
    return this._raw(command, data)
  }

  /* Gửi kèm chờ ack. Dùng cho lệnh cần biết kết quả. */
  request(command, data) {
    return new Promise((resolve, reject) => {
      this.seq += 1
      const requestId = `r${Date.now()}_${this.seq}`

      const timer = setTimeout(() => {
        this.pending.delete(requestId)
        reject(new Error('Hết thời gian chờ phản hồi'))
      }, ACK_TIMEOUT)

      this.pending.set(requestId, { resolve, reject, timer })

      if (!this._raw(command, data, requestId)) {
        clearTimeout(timer)
        this.pending.delete(requestId)
        reject(new Error('Chưa kết nối'))
      }
    })
  }

  _rejectAllPending(err) {
    this.pending.forEach(({ reject, timer }) => {
      clearTimeout(timer)
      reject(err)
    })
    this.pending.clear()
  }

  /* ---------------- API tiện dụng ---------------- */

  /* Chỉ theo dõi chi tiết hội thoại đang mở. Danh sách bên trái
   * luôn nhận được message.new ở mức tóm tắt, không cần subscribe.
  */
  subscribe(topic, id) {
    const key = `${topic}:${id}`
    if (this.subscribed.has(key)) {
      return
    }
    this.subscribed.add(key)
    if (this.authed) {
      this.emit(WS_COMMAND.SUBSCRIBE, { topic, id })
    }
  }

  unsubscribe(topic, id) {
    const key = `${topic}:${id}`
    if (!this.subscribed.delete(key)) {
      return
    }
    this.emit(WS_COMMAND.UNSUBSCRIBE, { topic, id })
  }

  /* Helper riêng của omni, giữ ở đây cho gọn lời gọi */
  sendTyping(conversationId) {
    this.emit(WS_COMMAND.OMNI_TYPING, { conversationId })
  }

  markRead(conversationId, lastMessageId) {
    this.emit(WS_COMMAND.OMNI_READ, { conversationId, lastMessageId })
  }
}

/* ======================================================================
 * Singleton — một kết nối cho cả ứng dụng
 * ==================================================================== */

let socketInstance = null

/* Kết nối dùng chung toàn app. KHÔNG màn hình nào được tự đóng. */
export const getAppSocket = ({ url, token, bizId } = {}) => {
  if (!socketInstance) {
    socketInstance = new OmniSocket({ url: url || buildWsUrl(), token, bizId })
  }
  return socketInstance
}

/* Chỉ gọi khi ĐĂNG XUẤT hoặc đổi doanh nghiệp. */
export const destroyAppSocket = () => {
  socketInstance?.close()
  socketInstance = null
}
