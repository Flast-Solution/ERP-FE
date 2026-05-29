/*
 * chatService.js
 *
 * Giao tiếp với server Qwen-agent qua SSE.
 *
 * API contract:
 *   POST /api/ai-agent/chat
 *   body: {
 *     mode     : string       — "form_builder" | "workflow" | "product" | ...
 *     message  : string       — tin nhắn hiện tại
 *     history  : Message[]    — toàn bộ thread (không gồm message hiện tại)
 *     context? : object       — chỉ gửi khi isFirstMessage = true
 *   }
 *
 *   Response: SSE stream
 *   Mỗi event có thể là:
 *     data: {"type":"chunk",  "text":"..."}          — text chunk
 *     data: {"type":"diff",   "diff":{...}}           — diff card data
 *     data: {"type":"done"}                           — stream kết thúc
 *     data: {"type":"error",  "message":"..."}        — lỗi từ server
 */

/*
 * sendMessage
 *
 * @param {object}   params
 * @param {string}   params.mode
 * @param {string}   params.message
 * @param {array}    params.history       — Message[] từ store (role + text)
 * @param {object}   [params.context]     — truyền khi isFirstMessage = true
 * @param {boolean}  params.isFirstMessage
 * @param {function} params.onChunk       — (text: string) => void
 * @param {function} params.onDiff        — (diff: object) => void
 * @param {function} params.onDone        — () => void
 * @param {function} params.onError       — (error: Error) => void
 * @returns {AbortController}             — gọi .abort() để cancel stream
 */
export function sendMessage({
  mode,
  message,
  history,
  context,
  isFirstMessage,
  onChunk,
  onDiff,
  onDone,
  onError,
}) {
  const controller = new AbortController()

  const body = {
    mode,
    message,
    history: history.map(m => ({ role: m.role, text: m.text })),
    ...(isFirstMessage && context ? { context } : {}),
  }

  fetch('/api/ai-agent/chat', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(body),
    signal : controller.signal,
  })
    .then(res => {
      if (!res.ok) {
        return res.json()
          .catch(() => ({}))
          .then(err => { throw new Error(err.message ?? `Server error ${res.status}`) })
      }
      return readSSEStream(res.body, { onChunk, onDiff, onDone, onError })
    })
    .catch(err => {
      if (err.name === 'AbortError') return
      onError?.(err)
    })

  return controller
}

/* ── SSE stream reader ───────────────────────────────────────────────────── */

async function readSSEStream(readableBody, { onChunk, onDiff, onDone, onError }) {
  const reader  = readableBody.getReader()
  const decoder = new TextDecoder()
  let   buffer  = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      /* SSE events được phân tách bằng \n\n */
      const parts = buffer.split('\n\n')
      buffer = parts.pop() ?? ''

      for (const part of parts) {
        const line = part.trim()
        if (!line.startsWith('data:')) continue

        const raw = line.slice(5).trim()
        if (raw === '[DONE]') {
          onDone?.()
          return
        }

        let event
        try {
          event = JSON.parse(raw)
        } catch {
          continue
        }

        if (event.type === 'chunk') {
          onChunk?.(event.text ?? '')
        } else if (event.type === 'diff') {
          onDiff?.(event.diff)
        } else if (event.type === 'done') {
          onDone?.()
          return
        } else if (event.type === 'error') {
          onError?.(new Error(event.message ?? 'Unknown server error'))
          return
        }
      }
    }

    onDone?.()
  } catch (err) {
    if (err.name !== 'AbortError') onError?.(err)
  } finally {
    reader.releaseLock()
  }
}