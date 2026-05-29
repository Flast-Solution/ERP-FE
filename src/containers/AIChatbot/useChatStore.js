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

const useChatStore = create(
  immer((set, get) => ({

    /*
     * threads: { [mode]: Message[] }
     * Mỗi mode giữ thread riêng.
     */
    threads: {},

    /* mode đang active (được set khi mở chatbot) */
    activeMode: 'default',

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
          id  : nanoid(),
          ts  : Date.now(),
          diff: null,
          ...message,
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

    /* ── Active mode ─────────────────────────────────────────────────────── */

    setActiveMode(mode) {
      set(state => { state.activeMode = mode })
    },
  }))
)

export default useChatStore