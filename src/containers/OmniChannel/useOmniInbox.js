/**************************************************************************/
/*  @/containers/OmniChannel/useOmniInbox.js                              */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Nơi DUY NHẤT nối store <-> service <-> WebSocket.                      */
/* Component chỉ đọc state qua selector và gọi hàm ở đây.                 */
/**************************************************************************/

import { useCallback, useEffect, useRef } from 'react'
import { message as antMessage } from 'antd'
import { useOmniStore } from '@/store/omniStore'
import { omniApi, getOmniSocket, destroyOmniSocket, WS_EVENT } from '@/services/omniService'
import { jwtService} from '@flast-erp/core/utils';
import { useStore } from '@flast-erp/core/components';
import { WS_URL } from '@/configs';

export const useOmniInbox = () => {

  const { user } = useStore();
  const store = useOmniStore
  const socketRef = useRef(null)

  /* ---------- nạp kênh + kết nối WS, chạy 1 lần ---------- */
  useEffect(() => {
    const s = store.getState()
    s.setChannelsLoading(true)
    omniApi
      .fetchChannels()
      .then(s.setChannels)
      .catch(() => antMessage.error('Không tải được danh sách kênh'))
      .finally(() => s.setChannelsLoading(false))

    const socket = getOmniSocket({
      url: WS_URL,
      token: jwtService.getAccessToken(),
      bizId: user.bizId
    })
    socketRef.current = socket

    const offState = socket.on('__state', ({ connected }) =>
      store.getState().setConnected(connected)
    )

    const offMessage = socket.on(WS_EVENT.MESSAGE_NEW, (payload) =>
      store.getState().receiveMessage(payload)
    )
    
    const offUpdated = socket.on(WS_EVENT.CONVERSATION_UPDATED, (c) =>
      store.getState().patchConversation(c.id, c)
    )

    const offChannelError = socket.on(WS_EVENT.CHANNEL_ERROR, ({ channelAccountId, name }) => {
      store.getState().markChannelError(channelAccountId)
      antMessage.warning(`Kênh ${name} mất kết nối, cần kết nối lại`)
    })

    const offUnauthorized = socket.on(WS_EVENT.UNAUTHORIZED, () => {
      antMessage.error('Phiên làm việc hết hạn, tải lại trang để nhận tin mới')
    })

    /* Tin khách đã xem — cập nhật dấu tick đôi */
    const offRead = socket.on(WS_EVENT.READ, ({ conversationId, lastMessageId }) =>
      store.getState().markMessagesRead(conversationId, lastMessageId)
    )

    socket.connect()
    return () => {
      offState()
      offMessage()
      offUpdated()
      offChannelError()
      offUnauthorized()
      offRead()
      destroyOmniSocket()
      store.getState().reset()
    }
  }, [store, user?.bizId])

  /* ---------- cột trái ---------- */

  const loadConversations = useCallback(async () => {
    const s = store.getState()
    if (s.conversationsLoading || !s.hasMore) return
    s.setConversationsLoading(true)
    try {
      const page = await omniApi.fetchConversations({ filters: s.filters, cursor: s.cursor })
      store.getState().appendConversations(page)
    } catch {
      store.getState().setConversationsLoading(false)
      antMessage.error('Không tải được danh sách hội thoại')
    }
  }, [store])

  /* Nạp trang đầu — chỉ 1 lần khi vào màn hình.
   * KHÔNG dùng store.subscribe(selector, cb): cần middleware
   * subscribeWithSelector, chưa bật thì callback bị bỏ qua im lặng. */
  const mountedRef = useRef(false)
  useEffect(() => {
    if (mountedRef.current) {
      return
    }
    mountedRef.current = true
    loadConversations()
  }, [loadConversations])

  /* Đổi bộ lọc: xoá danh sách rồi nạp lại ngay trong cùng một hành động */
  const applyFilter = useCallback(
    (patch) => {
      store.getState().setFilter(patch)
      loadConversations()
    },
    [store, loadConversations]
  )

  /* ---------- mở hội thoại ---------- */

  const openConversation = useCallback(async (conversationId) => {
    const s = store.getState()
    const previous = s.activeId
    if (previous === conversationId) {
      return
    }

    if (previous) {
      socketRef.current?.unsubscribe(previous)
    }
    s.openConversation(conversationId)
    socketRef.current?.subscribe(conversationId)

    /* Đồng bộ URL để sale gửi link cho nhau, KHÔNG dùng router để tránh remount cả ba cột */
    const url = new URL(window.location.href)
    url.searchParams.set('c', conversationId)
    window.history.replaceState({}, '', url)

    /* Tin nhắn: chỉ gọi API nếu chưa có trong bộ nhớ */
    if (!store.getState().messages[conversationId]) {
      store.getState().setMessagesMeta(conversationId, { loading: true })
      try {
        const page = await omniApi.fetchMessages(conversationId)
        store.getState().prependMessages(conversationId, page)
      } catch {
        store.getState().setMessagesMeta(conversationId, { loading: false })
        antMessage.error('Không tải được tin nhắn')
      }
    }

    /* Context: luôn gọi lại vì lead/đơn có thể vừa đổi ở màn khác */
    store.getState().setContextLoading(true)
    try {
      const ctx = await omniApi.fetchContext(conversationId)
      store.getState().setContext(conversationId, ctx)
    } catch (e) {
      store.getState().setContextError(e.message || 'Không tải được thông tin khách')
    }

    /* Báo đã xem cho đồng nghiệp */
    const list = store.getState().messages[conversationId] || []
    const last = list[list.length - 1]
    if (last) {
      socketRef.current?.markRead(conversationId, last.id)
    }

    /* Giữ RAM gọn: chỉ giữ tin của 8 hội thoại gần nhất */
    const opened = Object.keys(store.getState().messages)
    if (opened.length > 8) {
      store.getState().pruneMessages([conversationId, ...opened.slice(-7).map(Number)])
    }
  }, [store])

  /* Tải lại riêng cột phải — cho nút "Thử lại" khi API lỗi */
  const reloadContext = useCallback(async () => {
    const conversationId = store.getState().activeId
    if (!conversationId) {
      return
    }
    store.getState().setContextLoading(true)
    try {
      const ctx = await omniApi.fetchContext(conversationId)
      store.getState().setContext(conversationId, ctx)
    } catch (e) {
      store.getState().setContextError(e.message || 'Không tải được thông tin khách')
    }
  }, [store])

  /* ---------- gửi tin (optimistic) ---------- */

  const sendMessage = useCallback( async ({ content, files = [] }) => {
    const s = store.getState()
    const conversationId = s.activeId
    if (!conversationId) {
      return
    }

    const tempId = `tmp_${Date.now()}`
    s.pushMessage(conversationId, {
      id: tempId,
      externalId: null,
      conversationId,
      direction: 2,
      msgType: files.length ? 2 : 1,
      content,
      attachments: files.length ? files.map((f) => ({ name: f.name, localUrl: f.url })) : null,
      senderUserId: null,
      senderName: 'Bạn',
      sentAt: new Date().toISOString(),
      sendState: 'sending',
    })

    try {
      /* File đi HTTP trước, xong mới gửi tin — WS không hợp để đẩy binary */
      let attachments = null
      if (files.length) {
        attachments = await Promise.all(files.map((f) => omniApi.uploadAttachment(f.raw)))
      }
      const saved = await omniApi.sendMessage(conversationId, { content, attachments })
      store.getState().pushMessage(conversationId, { ...saved, tempId })
      store.getState().patchConversation(conversationId, {
        lastMessageAt: saved.sentAt,
        lastMessageSnippet: content || '[Đính kèm]',
        lastDirection: 2,
      })
    } catch (e) {
      store.getState().markMessageFailed(conversationId, tempId)
      antMessage.error(e.message || 'Gửi tin thất bại')
    }
  }, [store] )

  /* Gõ phím -> báo đồng nghiệp, tiết lưu 2s */
  const typingRef = useRef(0)
  const notifyTyping = useCallback(() => {
    const id = store.getState().activeId
    if (!id) {
      return
    }
    const now = Date.now()
    if (now - typingRef.current < 2000) {
      return
    }
    typingRef.current = now
    socketRef.current?.sendTyping(id)
  }, [store])

  /* ---------- hành động cột phải ---------- */

  const linkCustomer = useCallback(async (identityId, customerId) => {
    const conversationId = store.getState().activeId
    const customer = await omniApi.linkCustomer(identityId, customerId)
    store.getState().linkCustomer(conversationId, customer)
    antMessage.success('Đã gắn vào khách hàng')
    return customer
  }, [store])

  /* Trả về { duplicated } khi trùng SĐT để container mở popup xác nhận */
  const createLead = useCallback(async (body) => {
    const conversationId = store.getState().activeId
    try {
      const res = await omniApi.createLead(conversationId, body)
      store.getState().linkCustomer(conversationId, res.customer)
      antMessage.success('Đã tạo lead')
      return { ok: true, ...res }
    } catch (e) {
      if (e.errorCode === 4090) return { ok: false, duplicated: e.duplicated || e.payload }
      antMessage.error(e.message || 'Tạo lead thất bại')
      return { ok: false }
    }
  }, [store] )

  const assignUser = useCallback( async (conversationId, userId) => {
    store.getState().assignUser(conversationId, userId)
    try {
      await omniApi.assignUser(conversationId, userId)
    } catch {
      antMessage.error('Không đổi được người phụ trách')
    }
  }, [store])

  const changeStatus = useCallback(async (conversationId, status) => {
    store.getState().changeStatus(conversationId, status)
    try {
      await omniApi.changeStatus(conversationId, status)
    } catch {
      antMessage.error('Không đổi được trạng thái')
    }
  }, [store])

  return {
    loadConversations,
    applyFilter,
    reloadContext,
    openConversation,
    sendMessage,
    notifyTyping,
    linkCustomer,
    createLead,
    assignUser,
    changeStatus
  }
};

