/**************************************************************************/
/*  @/store/omniStore.js                                                  */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/**************************************************************************/

import { create } from 'zustand'

/* ======================================================================
 * Hằng số dùng chung — khớp với giá trị lưu ở DB
 * ==================================================================== */

export const CHANNEL_TYPE = {
  ZALO_OA: 1,
  FACEBOOK: 2,
}

/* Ánh xạ sang CHANNEL_SOURCE của ERP.
 *
 * CẨN THẬN: hai bảng mã NGƯỢC NHAU.
 *   omni  : 1 = Zalo OA,  2 = Facebook
 *   ERP   : 1 = Facebook, 2 = Zalo
 * Truyền thẳng channelType sang lead là ghi sai nguồn mà không có
 * lỗi nào báo. Luôn đi qua bảng này. */

export const CHANNEL_TYPE_TO_ERP_SOURCE = {
  [CHANNEL_TYPE.ZALO_OA]: 2,   /* Zalo OA  -> ERP source "Zalo" */
  [CHANNEL_TYPE.FACEBOOK]: 1,   /* Facebook -> ERP source "Facebook" */
}

export const CHANNEL_LABEL = {
  [CHANNEL_TYPE.ZALO_OA]: 'Zalo OA',
  [CHANNEL_TYPE.FACEBOOK]: 'Facebook',
}

/* Trạng thái kênh đã nối. Không viết số trực tiếp ở bất kỳ đâu. */
export const CHANNEL_STATUS = {
  DISCONNECTED: 0,   /* admin chủ động ngắt — giữ lịch sử, nối lại được */
  ACTIVE: 1,
  TOKEN_ERROR: 2,    /* token hỏng/hết hạn — cần nối lại */
}

export const CONVERSATION_STATUS = {
  NEW: 0,
  PROCESSING: 1,
  DONE: 2,
}

export const DIRECTION = {
  INBOUND: 1,
  OUTBOUND: 2,
}

export const MSG_TYPE = {
  TEXT: 1,
  IMAGE: 2,
  FILE: 3,
  STICKER: 4,
  /* Tin do hệ thống sinh, không gửi ra kênh: gắn đơn, đổi người
     phụ trách, đổi trạng thái. Render dạng dòng giữa, không bong bóng. */
  SYSTEM: 5,
}

/* Trạng thái gửi của tin outbound — hiển thị bằng dấu tick */
export const SEND_STATE = {
  SENDING: 'sending',
  SENT: 'sent',        /* đã tới nền tảng */
  READ: 'read',        /* khách đã xem */
  FAILED: 'failed',
}

/* Loại mục trong timeline cột phải — chỉ để hiển thị, thuần đọc */
export const REF_TYPE = {
  LEAD: 1,
  COHOI: 2,
  ORDER: 3,
}

/* Cửa sổ trả lời — tính từ tin cuối cùng của khách */
const REPLY_WINDOW_HOURS = {
  [CHANNEL_TYPE.ZALO_OA]: 48,
  [CHANNEL_TYPE.FACEBOOK]: 24,
}

const PAGE_SIZE = 30

/* ======================================================================
 * Helper thuần — tách khỏi store để test được độc lập
 * ==================================================================== */

/* Còn bao nhiêu mili-giây trong cửa sổ trả lời; <= 0 nghĩa là đã đóng */
export const getWindowRemaining = (conversation) => {
  if (!conversation?.lastInboundAt) return 0
  const hours = REPLY_WINDOW_HOURS[conversation.channelType] ?? 24
  const deadline = new Date(conversation.lastInboundAt).getTime() + hours * 3600_000
  return deadline - Date.now()
}

export const isWindowOpen = (conversation) => getWindowRemaining(conversation) > 0

/* Sắp xếp lại danh sách theo tin mới nhất — dùng sau mỗi lần có tin realtime */
const sortByRecent = (list) =>
  [...list].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  )

/* Hội thoại có lọt qua bộ lọc hiện tại không.
 * Dùng khi tin realtime tới: nếu không khớp filter thì không chèn vào list. */
/* BE đã lọc theo quyền, FE KHÔNG lọc lại theo người phụ trách —
 * hai bộ luật lệch nhau một chút là hội thoại biến mất không rõ lý do.
 * Hàm này chỉ trả lời một câu: tin realtime vừa tới có thuộc tab
 * đang mở hay không. */
const matchFilters = (conversation, filters, me) => {
  if (filters.channelAccountId && conversation.channelAccountId !== filters.channelAccountId) {
    return false
  }
  if (filters.status !== null && conversation.status !== filters.status) {
    return false
  }
  if (filters.scope === SCOPE.UNREPLIED && conversation.lastDirection !== DIRECTION.INBOUND) {
    return false
  }
  /* Hàng chờ: chỉ hội thoại chưa ai nhận */
  if (filters.scope === SCOPE.QUEUE && conversation.assignedUserId != null) {
    return false
  }
  /* Của tôi: so với chính mình, không phải lọc quyền */
  if (filters.scope === SCOPE.MINE && conversation.assignedUserId !== me?.userId) {
    return false
  }
  return true
}

/* Tab phạm vi ở đầu cột trái — tách khỏi bộ lọc dropdown vì
 * nó đổi cả tập dữ liệu, không chỉ lọc trên tập hiện có */
export const SCOPE = {
  QUEUE: 'queue',          /* chưa ai nhận — chỉ user có quyền mới thấy tab này */
  UNREPLIED: 'unreplied',
  MINE: 'mine',
  ALL: 'all',
}

/* Cách sắp xếp danh sách */
export const SORT_MODE = {
  URGENT: 'urgent',    /* gấp nhất trước — theo thời gian còn lại */
  RECENT: 'recent',    /* mới nhất trước */
}

const DEFAULT_FILTERS = {
  scope: SCOPE.UNREPLIED,
  channelAccountId: null,
  status: null,
  keyword: '',
}

/* ======================================================================
 * Store
 * ==================================================================== */

export const useOmniStore = create((set, get) => ({
  /* -------------------------------------------------- *
   * Slice: kênh đã kết nối (ít đổi, nạp 1 lần khi vào)  *
   * -------------------------------------------------- */
  channels: [],
  channelsLoading: false,

  setChannels: (channels) => set({ channels }),
  setChannelsLoading: (channelsLoading) => set({ channelsLoading }),

  /* Đánh dấu kênh lỗi token — badge đỏ cho admin tenant */
  markChannelError: (channelAccountId) =>
    set((s) => ({
      channels: s.channels.map((c) =>
        c.id === channelAccountId ? { ...c, status: CHANNEL_STATUS.TOKEN_ERROR } : c
      ),
    })),

  /* -------------------------------------------------- *
   * Slice: cột trái — danh sách hội thoại               *
   * -------------------------------------------------- */
  conversations: [],
  conversationsLoading: false,
  hasMore: true,
  cursor: null,
  filters: { ...DEFAULT_FILTERS },
  sortMode: SORT_MODE.URGENT,

  /* Số đếm trên tab, BE trả về cùng trang đầu */
  counts: { queue: 0, unreplied: 0, mine: 0, all: 0 },

  /* Người đang đăng nhập. Đặt trong store thay vì truyền tham số qua
   * từng hàm — receiveMessage và applyConversationUpdate đều cần,
   * mà chúng nằm sâu trong chuỗi gọi. */
  me: { userId: null, isManager: false },
  setMe: (me) => set({ me }),

  setSortMode: (sortMode) => set({ sortMode }),
  setCounts: (counts) => set({ counts }),

  setFilter: (patch) => {
    set((s) => ({ filters: { ...s.filters, ...patch } }))
    get().resetConversations()
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } })
    get().resetConversations()
  },

  /* Xoá sạch để nạp lại từ đầu — gọi khi đổi filter */
  resetConversations: () =>
    set({ conversations: [], cursor: null, hasMore: true }),

  /* Nối thêm trang mới (cuộn vô hạn), khử trùng theo id */
  appendConversations: ({ items, nextCursor, counts }) =>
    set((s) => {
      const seen = new Set(s.conversations.map((c) => c.id))
      const fresh = items.filter((c) => !seen.has(c.id))
      return {
        conversations: [...s.conversations, ...fresh],
        counts: counts || s.counts,
        cursor: nextCursor,
        hasMore: items.length >= PAGE_SIZE && Boolean(nextCursor),
        conversationsLoading: false,
      }
    }),

  setConversationsLoading: (conversationsLoading) => set({ conversationsLoading }),

  /* Cập nhật một phần của 1 hội thoại, giữ nguyên các mục khác */
  patchConversation: (conversationId, patch) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, ...patch } : c
      ),
    })),

  /* -------------------------------------------------- *
   * Slice: hội thoại đang mở                            *
   * -------------------------------------------------- */
  activeId: null,

  /* Đổi hội thoại: KHÔNG dùng router để tránh remount cả 3 cột.
   * Việc đồng bộ query param do component tự làm bằng replaceState. */
  openConversation: (conversationId) => {
    if (get().activeId === conversationId) {
      return
    }
    set({ activeId: conversationId, contextError: null, handoffNotice: null })
    get().clearUnread(conversationId)
  },

  closeConversation: () => set({ activeId: null }),

  clearUnread: (conversationId) =>
    get().patchConversation(conversationId, { unreadCount: 0 }),

  assignUser: (conversationId, assignedUserId) =>
    get().patchConversation(conversationId, { assignedUserId }),

  changeStatus: (conversationId, status) =>
    get().patchConversation(conversationId, { status }),

  /* -------------------------------------------------- *
   * Slice: cột giữa — tin nhắn, gom theo conversationId *
   * -------------------------------------------------- *
   * Tách map riêng để tin mới KHÔNG khiến cột trái và   *
   * cột phải re-render.                                 */
  messages: {},        /* { [conversationId]: Message[] } — cũ -> mới */
  messagesMeta: {},    /* { [conversationId]: { loading, hasMore, cursor } } */

  setMessagesMeta: (conversationId, patch) =>
    set((s) => ({
      messagesMeta: {
        ...s.messagesMeta,
        [conversationId]: { ...(s.messagesMeta[conversationId] || {}), ...patch },
      },
    })),

  /* Nạp trang lịch sử cũ hơn — chèn lên ĐẦU mảng */
  prependMessages: (conversationId, { items, nextCursor }) =>
    set((s) => {
      const current = s.messages[conversationId] || []
      const seen = new Set(current.map((m) => m.id))
      const older = items.filter((m) => !seen.has(m.id))
      return {
        messages: { ...s.messages, [conversationId]: [...older, ...current] },
        messagesMeta: {
          ...s.messagesMeta,
          [conversationId]: {
            ...(s.messagesMeta[conversationId] || {}),
            loading: false,
            cursor: nextCursor,
            hasMore: Boolean(nextCursor),
          },
        },
      }
    }),

  /* Thêm 1 tin vào cuối. Khử trùng theo externalId vì webhook
   * có thể bắn lại, và tin mình gửi sẽ quay về qua message_echoes. */
  pushMessage: (conversationId, message) =>
    set((s) => {
      const current = s.messages[conversationId] || []
      const duplicated = message.externalId
        && current.some((m) => m.externalId === message.externalId)
      if (duplicated) return s

      /* Tin thật về thì thay thế bản optimistic cùng tempId */
      const replaced = message.tempId
        && current.some((m) => m.id === message.tempId)

      const next = replaced
        ? current.map((m) => (m.id === message.tempId ? message : m))
        : [...current, message]

      return { messages: { ...s.messages, [conversationId]: next } }
    }),

  /* Khách đã xem tới tin nào -> mọi tin outbound trước đó thành 'read'.
     Nền tảng chỉ báo mốc cuối, không báo từng tin. */
  markMessagesRead: (conversationId, lastMessageId) =>
    set((s) => {
      const current = s.messages[conversationId]
      if (!current) return s
      let reached = false
      const next = current.map((m) => {
        if (reached) return m
        if (m.id === lastMessageId) reached = true
        return m.direction === DIRECTION.OUTBOUND && m.sendState === SEND_STATE.SENT
          ? { ...m, sendState: SEND_STATE.READ }
          : m
      })
      return { messages: { ...s.messages, [conversationId]: next } }
    }),

  /* Đánh dấu tin optimistic gửi lỗi để hiện nút gửi lại */
  markMessageFailed: (conversationId, tempId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] || []).map((m) =>
          m.id === tempId ? { ...m, sendState: 'failed' } : m
        ),
      },
    })),

  /* Giải phóng bộ nhớ: chỉ giữ tin của vài hội thoại gần nhất.
   * Lịch sử lưu hết ở DB nên bỏ khỏi RAM là an toàn. */
  pruneMessages: (keepIds) =>
    set((s) => {
      const keep = new Set(keepIds)
      const messages = {}
      const messagesMeta = {}
      Object.keys(s.messages).forEach((id) => {
        if (keep.has(Number(id)) || keep.has(id)) {
          messages[id] = s.messages[id]
          messagesMeta[id] = s.messagesMeta[id]
        }
      })
      return { messages, messagesMeta }
    }),

  /* -------------------------------------------------- *
   * Slice: cột phải — ngữ cảnh khách hàng               *
   * -------------------------------------------------- *
   * Nạp bằng MỘT API tổng hợp theo conversationId để    *
   * cột phải không nhấp nháy khi đổi hội thoại.         */
  context: {},          /* { [conversationId]: ContextPayload } */
  contextLoading: false,
  contextError: null,

  setContext: (conversationId, payload) =>
    set((s) => ({
      context: { ...s.context, [conversationId]: payload },
      contextLoading: false,
      contextError: null,
    })),

  setContextLoading: (contextLoading) => set({ contextLoading }),
  setContextError: (contextError) => set({ contextError, contextLoading: false }),

  /* Sau khi gắn identity vào customer: cập nhật cả context lẫn
   * tên hiển thị ở cột trái (ưu tiên tên khách hàng thật). */
  linkCustomer: (conversationId, customer) =>
    set((s) => {
      const prev = s.context[conversationId] || {}
      return {
        context: {
          ...s.context,
          [conversationId]: {
            ...prev,
            customer,
            identity: { ...prev.identity, linked: true },
          },
        },
        conversations: s.conversations.map((c) =>
          c.id === conversationId ? { ...c, displayName: customer.name } : c
        ),
      }
    }),

  /* -------------------------------------------------- *
   * Chuyển giao hội thoại                               *
   * -------------------------------------------------- *
   * Hội thoại đang mở bị chuyển cho người khác: KHÔNG đóng đột ngột.
   * Sale có thể đang gõ dở một đoạn dài, đóng là mất trắng. Thay vào
   * đó khoá ô nhập, hiện băng báo, để họ tự quyết lúc nào rời đi. */
  handoffNotice: null,

  clearHandoffNotice: () => set({ handoffNotice: null }),

  /* Xử lý conversation.updated từ WS.
   *
   * Hai việc TÁCH RIÊNG, vì trả lời hai câu hỏi khác nhau:
   *   1. Còn thuộc tab đang xem không   -> gỡ khỏi danh sách
   *   2. Hội thoại đang mở còn của mình -> khoá ô nhập
   * Gỡ khỏi danh sách mà vẫn giữ activeId là có chủ đích: người dùng
   * vẫn đọc được hội thoại đang mở cho tới khi tự đóng. */
  applyConversationUpdate: (update) =>
    set((s) => {
      const current = s.conversations.find((c) => c.id === update.id)
      const merged = { ...(current || {}), ...update }
      const next = {}

      if (current && !matchFilters(merged, s.filters, s.me)) {
        next.conversations = s.conversations.filter((c) => c.id !== update.id)
      } else if (current) {
        next.conversations = s.conversations.map((c) =>
          c.id === update.id ? merged : c
        )
      }

      const isActive = s.activeId === update.id
      const hasOwner = merged.assignedUserId != null
      const isMine = merged.assignedUserId === s.me?.userId
      const canStillReply = s.me?.isManager || !hasOwner || isMine

      if (isActive && !canStillReply) {
        next.handoffNotice = {
          conversationId: update.id,
          assignedUserName: merged.assignedUserName || null,
        }
      } else if (isActive && canStillReply && s.handoffNotice) {
        next.handoffNotice = null
      }

      return next
    }),

  /* Chèn lead/cơ hội/đơn vừa tạo vào lịch sử giao dịch của cột phải,
   * khỏi phải gọi lại cả context. Mục mới nhất lên đầu. */
  addTimelineItem: (conversationId, item) =>
    set((s) => {
      const prev = s.context[conversationId]
      if (!prev) {
        return s
      }
      const timeline = prev.timeline || []
      const existed = timeline.some(
        (t) => t.refType === item.refType && t.refId === item.refId
      )
      if (existed) {
        return s
      }
      return {
        context: {
          ...s.context,
          [conversationId]: { ...prev, timeline: [item, ...timeline] },
        },
      }
    }),

  /* -------------------------------------------------- *
   * Realtime                                            *
   * -------------------------------------------------- */
  connected: false,
  setConnected: (connected) => set({ connected }),

  /* Điểm vào duy nhất cho tin đẩy từ SSE.
   * Quy tắc: tin của hội thoại ĐANG MỞ -> append vào cột giữa;
   * tin của hội thoại khác -> chỉ tăng badge, KHÔNG tự nhảy sang. */
  receiveMessage: ({ conversation, message }) => {
    const { activeId, conversations, filters } = get()
    const isActive = conversation.id === activeId

    /* Chỉ giữ tin trong RAM nếu hội thoại đó đang được xem
     * hoặc đã từng mở (đã có mảng tin). */
    if (isActive || get().messages[conversation.id]) {
      get().pushMessage(conversation.id, message)
    }

    const existed = conversations.some((c) => c.id === conversation.id)
    const patch = {
      lastMessageAt: message.sentAt,
      lastMessageSnippet: conversation.lastMessageSnippet,
      lastDirection: message.direction,
      ...(message.direction === DIRECTION.INBOUND
        ? { lastInboundAt: message.sentAt }
        : {}),
    }

    const updateConversation = (c, conversation, patch, isActive, message) => {
      if (c.id !== conversation.id) {
        return c;
      }
      const shouldKeepUnread = isActive || message.direction === DIRECTION.OUTBOUND;
      return {
        ...c,
        ...patch,
        unreadCount: shouldKeepUnread
          ? c.unreadCount
          : (c.unreadCount || 0) + 1
      };
    }

    if (existed) {
      set((s) => ({
        conversations: sortByRecent(s.conversations.map((c) =>
          updateConversation(c, conversation, patch, isActive, message)
        ))
      }))
      return
    }

    /* Hội thoại mới hoàn toàn — chỉ chèn nếu khớp bộ lọc đang bật */
    if (matchFilters({ ...conversation, ...patch }, filters, get().me)) {
      set((s) => ({
        conversations: sortByRecent([{ ...conversation, ...patch }, ...s.conversations]),
      }))
    }
  },

  /* Dọn toàn bộ khi rời màn hình inbox */
  reset: () =>
    set({
      conversations: [],
      activeId: null,
      messages: {},
      messagesMeta: {},
      context: {},
      cursor: null,
      hasMore: true,
      filters: { ...DEFAULT_FILTERS },
      contextError: null,
    })
}))

/* ======================================================================
 * Selector — component subscribe HẸP để tránh re-render thừa.
 * Không dùng useOmniStore() trần trong component.
 * ==================================================================== */

/* Hằng số cho nhánh "rỗng".
 * BẮT BUỘC: selector KHÔNG được tạo [] hay {} mới bên trong.
 * Zustand so sánh snapshot bằng Object.is — tham chiếu mới ở mỗi lần
 * render gây vòng lặp "Maximum update depth exceeded". */
const EMPTY_LIST = []

export const useConversationList = () => useOmniStore((s) => s.conversations)
export const useActiveId = () => useOmniStore((s) => s.activeId)

export const useActiveConversation = () =>
  useOmniStore((s) =>
    s.activeId ? s.conversations.find((c) => c.id === s.activeId) ?? null : null
  )

export const useActiveMessages = () =>
  useOmniStore((s) => (s.activeId ? s.messages[s.activeId] ?? EMPTY_LIST : EMPTY_LIST))

export const useActiveContext = () =>
  useOmniStore((s) => (s.activeId ? s.context[s.activeId] ?? null : null))

export const useFilters = () => useOmniStore((s) => s.filters)
export const useCounts = () => useOmniStore((s) => s.counts)
export const useMe = () => useOmniStore((s) => s.me)

/* Băng báo chỉ hiện cho đúng hội thoại đang mở */
export const useHandoffNotice = () =>
  useOmniStore((s) =>
    s.handoffNotice && s.handoffNotice.conversationId === s.activeId
      ? s.handoffNotice
      : null
  )

/* Tab "Hàng chờ" chỉ hiện khi user có quyền nhận trên ít nhất một kênh */
export const useCanSeeQueue = () =>
  useOmniStore((s) => s.channels.some((c) => c.queueAccess))
export const useSortMode = () => useOmniStore((s) => s.sortMode)
export const useChannels = () => useOmniStore((s) => s.channels)
