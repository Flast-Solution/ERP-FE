/*
 * useChatStore.js
 *
 * Zustand store cho AIChatbot.
 * Thread được persist theo mode — quay lại cùng mode thì còn lịch sử.
 * User tự clear bằng clearThread(mode).
 *
 * Shape của 1 message:
 * {
 *   id      : string       — nanoid
 *   role    : 'user' | 'assistant'
 *   text    : string       — nội dung hiển thị
 *   diff    : object|null  — diff card data (chỉ assistant)
 *   ts      : number       — timestamp
 * }
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid'

const SESSION_STORAGE_KEY = 'flast_chat_sessions'

/** Lưu sessions map vào localStorage */
function persistSessions(sessions) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions))
  } catch {}
}

/** Đọc sessions map từ localStorage */
function loadPersistedSessions() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const useChatStore = create(
  immer((set, get) => ({

    /*
     * threads: { [mode]: Message[] }
     * Mỗi mode giữ thread riêng.
     */
    threads: {},

    /* mode đang active (được set khi mở chatbot) */
    activeMode: 'default',

    /*
     * sessionId: mỗi mode có 1 session riêng.
     * sessions: { [mode]: string (uuid) }
     * Thay đổi sessionId = bắt đầu session mới với server.
     */
    sessions: loadPersistedSessions(),

    /* đang stream response từ server */
    streaming: false,

    /* text đang được stream vào bubble assistant cuối */
    streamingText: '',

    /* ── Thread helpers ──────────────────────────────────────────────────── */

    getThread(mode) {
      return get().threads[mode] ?? []
    },

    /* Thêm message vào thread */
    pushMessage(mode, message) {
      set(state => {
        if (!state.threads[mode]) state.threads[mode] = []
        state.threads[mode].push({
          diff: null,
          ...message,
          id  : message.id ?? nanoid(),
          ts  : message.ts ?? Date.now(),
        })
      })
    },

    /* Cập nhật message cuối cùng (dùng khi stream xong để set diff) */
    updateLastAssistant(mode, patch) {
      set(state => {
        const thread = state.threads[mode]
        if (!thread?.length) return
        const last = thread.findLast(m => m.role === 'assistant')
        if (last) Object.assign(last, patch)
      })
    },

    /* Xóa thread của một mode — user bấm clear */
    clearThread(mode) {
      set(state => {
        state.threads[mode] = []
      })
    },

    /* ── Streaming ───────────────────────────────────────────────────────── */

    startStreaming(mode) {
      set(state => {
        state.streaming     = true
        state.streamingText = ''
        /* Push placeholder bubble assistant ngay để hiện typing indicator */
        if (!state.threads[mode]) state.threads[mode] = []
        state.threads[mode].push({
          id  : nanoid(),
          role: 'assistant',
          text: '',
          diff: null,
          ts  : Date.now(),
          streaming: true,
        })
      })
    },

    appendStreamChunk(mode, chunk) {
      set(state => {
        state.streamingText += chunk
        const thread = state.threads[mode]
        if (!thread?.length) return
        const last = thread.findLast(m => m.role === 'assistant')
        if (last) {
          last.text      = state.streamingText
          last.streaming = true
        }
      })
    },

    finishStreaming(mode, diff = null) {
      set(state => {
        state.streaming     = false
        state.streamingText = ''
        const thread = state.threads[mode]
        if (!thread?.length) return
        const last = thread.findLast(m => m.role === 'assistant')
        if (last) {
          last.streaming = false
          if (diff) last.diff = diff
        }
      })
    },

    abortStreaming(mode) {
      set(state => {
        state.streaming     = false
        state.streamingText = ''
        const thread = state.threads[mode]
        if (!thread?.length) return
        /* Xóa bubble streaming dang dở nếu text rỗng */
        const lastIdx = thread.findLastIndex(m => m.role === 'assistant' && m.streaming)
        if (lastIdx !== -1 && !thread[lastIdx].text) {
          thread.splice(lastIdx, 1)
        } else if (lastIdx !== -1) {
          thread[lastIdx].streaming = false
        }
      })
    },

    /* ── Session management ─────────────────────────────────────────────────── */

    /* Lấy sessionId của mode, tự tạo nếu chưa có */
    getSessionId(mode) {
      const existing = get().sessions[mode]
      if (existing) return existing
      const id = nanoid()
      set(state => { state.sessions[mode] = id })
      persistSessions({ ...get().sessions, [mode]: id })
      return id
    },

    /* Tạo session mới — clear thread + thay sessionId mới */
    newSession(mode) {
      const id = nanoid()
      set(state => {
        state.sessions[mode] = id
        state.threads[mode]  = []
      })
      persistSessions({ ...get().sessions, [mode]: id })
      return id
    },

    /* ── Active mode ─────────────────────────────────────────────────────── */

    setActiveMode(mode) {
      set(state => { state.activeMode = mode })
    },
  }))
)

export default useChatStore