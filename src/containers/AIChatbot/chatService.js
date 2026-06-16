/**
 * chatService.js
 *
 * Protocol (theo chat_client.py):
 *   1. GET  /chat/stream?session_id=xxx  → SSE stream liên tục (1 connection/session)
 *   2. POST /chat { session_id, message, use_orchestrator } → trigger AI response cho turn hiện tại
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

function parseEventData(eventData) {
  try {
    return JSON.parse(eventData)
  } catch {
    return eventData
  }
}

function extractChunkText(payload) {
  if (payload === null || payload === undefined) {
    return ''
  }

  if (typeof payload === 'string') {
    return payload
  }

  if (typeof payload !== 'object') {
    return String(payload)
  }

  const candidates = [
    payload.body,
    payload.content,
    payload.text,
    payload.message,
    payload.delta,
    payload.answer,
    payload.response,
    payload.output,
  ]

  for (const candidate of candidates) {
    const text = extractChunkText(candidate)
    if (text) {
      return text
    }
  }

  const nestedText = extractChunkText(payload.data)
  if (nestedText) {
    return nestedText
  }

  if (payload.event || payload.config || payload.code || payload.jsx_code || payload.data) {
    return JSON.stringify(payload)
  }

  return ''
}

function stripAnswerPrefix(text = '') {
  return text.replace(/^\s*\[ANSWER\]\s*/i, '')
}

export class ChatSession {
  constructor(sessionId) {
    this.sessionId       = sessionId
    this._abortCtrl      = new AbortController()
    this._onChunk        = null
    this._onCore         = null
    this._onDone         = null
    this._onBuild        = null
    this._onError        = null
    this._onClose        = null
    this._onHistoryLoaded = null
    this._connected      = false
    this._pingTimer      = null
    this._connectPromise = null
    this._llmsBuffer     = ''
    this._answerStarted  = false
    this._hasThinkMarker = false
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  connect({ onChunk, onCore, onDone, onBuild, onError, onClose, onHistoryLoaded }) {
    this._onChunk         = onChunk
    this._onCore          = onCore
    this._onDone          = onDone
    this._onBuild         = onBuild
    this._onError         = onError
    this._onClose         = onClose
    this._onHistoryLoaded = onHistoryLoaded

    this._connectPromise = this._openSSE()
    return this._connectPromise
  }

  async send(message) {
    this._resetAnswerStream()
    const res = await fetch(`${BASE_URL}/chat`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        session_id: this.sessionId,
        message,
        use_orchestrator: true,
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

  _resetAnswerStream() {
    this._llmsBuffer     = ''
    this._answerStarted  = false
    this._hasThinkMarker = false
  }

  _extractDisplayChunk(text = '') {
    if (!text) {
      return ''
    }

    if (this._answerStarted) {
      return stripAnswerPrefix(text)
    }

    this._llmsBuffer += text

    if (this._llmsBuffer.includes('[THINK]')) {
      this._hasThinkMarker = true
    }

    const answerIndex = this._llmsBuffer.indexOf('[ANSWER]')
    if (answerIndex !== -1) {
      this._answerStarted = true
      const displayText = this._llmsBuffer.slice(answerIndex + '[ANSWER]'.length)
      this._llmsBuffer = ''
      return displayText.replace(/^\s+/, '')
    }

    if (this._hasThinkMarker) {
      return ''
    }

    if (this._llmsBuffer.length > 64) {
      this._answerStarted = true
      const displayText = this._llmsBuffer
      this._llmsBuffer = ''
      return displayText
    }

    return ''
  }

  async sendSchemaUpdate({ schema, jsxCode }) {
    try {
      let content = "Đây là FormTemplate mà bạn cần thay đổi theo yêu cầu: \n";
      content += JSON.stringify({ fields: schema.fields, jsx_code: jsxCode});
      content += "\n";
      content += "Sau khi chỉnh sửa xong, hãy lưu schema và jsx_code đã chỉnh sửa.";
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
    const dataLines = []

    for (const line of part.split('\n')) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim())
      }
    }

    const eventData = dataLines.join('\n')
    const payload = parseEventData(eventData)

    // console.log('[ChatSession] SSE event response', {
    //   eventName,
    //   raw: eventData,
    //   payload,
    // })

    switch (eventName) {
      case 'llms': {
        const text = this._extractDisplayChunk(extractChunkText(payload))
        if (text) {
          this._onChunk?.(text)
        } else {
          // console.log('[ChatSession] ignored non-display llms payload', payload)
        }
        break
      }

      case 'core': {
        this._onCore?.(payload)
        break
      }

      case 'done': {
        this._onDone?.()
        break
      }

      case 'build': {
        this._onBuild?.(payload)
        break
      }

      case 'message': {
        const text = extractChunkText(payload)
        if (text) {
          this._onChunk?.(text)
        }
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
