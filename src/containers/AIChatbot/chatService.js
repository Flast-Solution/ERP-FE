/**
 * chatService.js
 *
 * Protocol (theo chat_client.py):
 *   1. GET  /chat/stream?session_id=xxx  → SSE stream liên tục (1 connection/session)
 *   2. POST /chat { session_id, message } → trigger AI response cho turn hiện tại
 *
 * SSE events:
 *   event: llms  data: "text chunk"     — stream text từ LLM
 *   event: core  data: {...}            — tool call info (hiển thị phụ)
 *   event: done  data: ""               — kết thúc 1 turn
 *   event: close data: ""               — server đóng session (idle timeout)
 */

const BASE_URL     = 'https://ai.flast.vn'
const PING_INTERVAL_MS = 60_000

function stripServerPrefix(text = '') {
  return text.replace(/^\[[A-Z_]+\]\n?/g, '').trim()
}

export class ChatSession {
  constructor(sessionId) {
    this.sessionId       = sessionId
    this._abortCtrl      = new AbortController()
    this._onChunk        = null
    this._onCore         = null
    this._onDone         = null
    this._onError        = null
    this._onClose        = null
    this._onHistoryLoaded = null
    this._connected      = false
    this._pingTimer      = null
    this._connectPromise = null
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  connect({ onChunk, onCore, onDone, onError, onClose, onHistoryLoaded }) {
    this._onChunk         = onChunk
    this._onCore          = onCore
    this._onDone          = onDone
    this._onError         = onError
    this._onClose         = onClose
    this._onHistoryLoaded = onHistoryLoaded

    this._connectPromise = this._openSSE()
    return this._connectPromise
  }

  async send(message) {
    const res = await fetch(`${BASE_URL}/chat`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        session_id: this.sessionId,
        message,
      }),
    })

    if (res.status === 409) {
      throw new Error('SSE chưa kết nối. Vui lòng thử lại.')
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message ?? `Server error ${res.status}`)
    }
  }

  async sendSchemaUpdate({ schema, jsxCode }) {
    try {
      let content = "Đây là FormView mà bạn cần thay đổi theo yêu cầu: \n";
      content += JSON.stringify({ fields: schema.fields, jsx_code: jsxCode});
      content += "\n";
      content += "Sau khi chỉnh sửa xong, hãy lưu code với config là fields và code là jsx_code đã chỉnh sửa.";
      content += "\n";

      await fetch(`${BASE_URL}/session/form-context`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          session_id: this.sessionId,
          form_context: content
        }),
      })
    } catch {
      /* silent — schema update không critical */
    }
  }

  destroy() {
    this._stopPing()
    this._abortCtrl.abort()
    this._connected = false
  }

  get isConnected() {
    return this._connected
  }

  // ─── Ping (internal) ───────────────────────────────────────────────────────

  _startPing() {
    this._stopPing()
    this._pingTimer = setInterval(() => this._doPing(), PING_INTERVAL_MS)
  }

  _stopPing() {
    clearInterval(this._pingTimer)
    this._pingTimer = null
  }

  async _doPing() {
    try {
      const res = await fetch(
        `${BASE_URL}/ping?session_id=${this.sessionId}`,
        { method: 'POST' }
      )
      if (res.status === 404) {
        /* Session đã bị xóa — cleanup */
        this._stopPing()
        this._abortCtrl.abort()
        this._connected = false
        this._onClose?.()
      }
    } catch {
      /* network lỗi tạm thời — bỏ qua, reconnect sẽ tự xử lý */
    }
  }

  // ─── SSE ───────────────────────────────────────────────────────────────────

  async _openSSE() {
    const url = `${BASE_URL}/chat/stream?session_id=${this.sessionId}`

    try {
      const res = await fetch(url, {
        method : 'GET',
        headers: { 'Accept': 'text/event-stream' },
        signal : this._abortCtrl.signal,
      })

      if (!res.ok) {
        throw new Error(`SSE connect failed: ${res.status}`)
      }

      this._connected = true
      this._startPing()
      this._fetchAndEmitHistory()

      await this._readStream(res.body)
      if (!this._abortCtrl.signal.aborted) {
        this._reconnect()
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return
      }
      this._onError?.(err)
      if (!this._abortCtrl.signal.aborted) {
        this._reconnect()
      }
    }
  }

  _reconnect(delay = 1500) {
    if (this._abortCtrl.signal.aborted) {
      return
    }
    this._stopPing()
    this._connected = false
    setTimeout(() => {
      if (!this._abortCtrl.signal.aborted) {
        this._openSSE()
      }
    }, delay)
  }

  async _readStream(body) {
    const reader  = body.getReader()
    const decoder = new TextDecoder()
    let   buffer  = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          this._handleSSEPart(part.trim())
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') this._onError?.(err)
    } finally {
      reader.releaseLock()
      this._connected = false
    }
  }

  _handleSSEPart(part) {
    if (!part) {
      return
    }

    let eventName = 'message'
    let eventData = ''

    for (const line of part.split('\n')) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        eventData = line.slice(5).trim()
      }
    }

    switch (eventName) {
      case 'llms': {
        let text = eventData
        try { text = JSON.parse(eventData) } catch {}
        this._onChunk?.(String(text))
        break
      }

      case 'core': {
        let payload = eventData
        try { payload = JSON.parse(eventData) } catch {}
        this._onCore?.(payload)
        break
      }

      case 'done': {
        this._onDone?.()
        break
      }

      case 'close': {
        /* Server idle-timeout → stop ping, reconnect */
        this._stopPing()
        this._connected = false
        this._onClose?.()
        if (!this._abortCtrl.signal.aborted) {
          this._reconnect()
        }
        break
      }

      default:
        break
    }
  }

  // ─── History ───────────────────────────────────────────────────────────────

  async _fetchAndEmitHistory() {
    if (!this._onHistoryLoaded) {
      return
    }
    try {
      const res = await fetch(`${BASE_URL}/history?session_id=${this.sessionId}`)
      if (!res.ok) return
      const data     = await res.json()
      const messages = (data.messages ?? []).map(msg => ({
        ...msg,
        content: stripServerPrefix(msg.content),
      }))
      if (messages.length) this._onHistoryLoaded(messages)
    } catch {
      /* history không quan trọng, bỏ qua lỗi */
    }
  }
}
