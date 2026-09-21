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

import useGetMe from '@/hooks/useGetMe';
import { useCallback, useEffect, useRef } from 'react'
import { message as antMessage } from 'antd'
import { useOmniStore } from '@/store/omniStore'
import { getAppSocket, omniApi } from '@/services/omniService'
import { WS_EVENT, WS_TOPIC } from '@/services/socketEvents'
import { useSocketEvents, useSocketTopic } from '@/hooks/useAppSocket'

export const useOmniInbox = () => {

  const { id: userId, isManager } = useGetMe();
  const store = useOmniStore
  
  useEffect(() => {
    if (userId == null) {
      return
    }
    store.getState().setMe({ userId, isManager: Boolean(isManager) })
  }, [store, userId, isManager])

  useEffect(() => {
    const s = store.getState()
    s.setChannelsLoading(true)
    omniApi
      .fetchChannels()
      .then(s.setChannels)
      .catch(() => antMessage.error('Không tải được danh sách kênh'))
      .finally(() => s.setChannelsLoading(false))

    return () => {
      store.getState().reset()
    }
  }, [store])

  /* Nghe sự kiện — một useEffect cho tất cả */
  useSocketEvents({
    [WS_EVENT.STATE]: ({ connected }) => store.getState().setConnected(connected),
    [WS_EVENT.MESSAGE_NEW]: (payload) => store.getState().receiveMessage(payload),
    [WS_EVENT.CONVERSATION_UPDATED]: (c) => store.getState().applyConversationUpdate(c),
    [WS_EVENT.CHANNEL_ERROR]: ({ channelAccountId, name }) => {
      store.getState().markChannelError(channelAccountId)
      antMessage.warning(`Kênh ${name} mất kết nối, cần kết nối lại`)
    },
    [WS_EVENT.MESSAGE_READ]: ({ conversationId, lastMessageId }) => {
      store.getState().markMessagesRead(conversationId, lastMessageId)
    }
  })

  /* Theo dõi hội thoại đang mở — hook tự subscribe/unsubscribe */
  const activeId = useOmniStore((s) => s.activeId)
  useSocketTopic(WS_TOPIC.OMNI_CONVERSATION, activeId)

  /* ---------- cột trái ---------- */

  const loadConversations = useCallback(async () => {
    const s = store.getState()
    if (s.conversationsLoading || !s.hasMore) {
      return
    }
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
  const applyFilter = useCallback((patch) => {
    store.getState().setFilter(patch)
    loadConversations()
  }, [store, loadConversations])

  /* ---------- mở hội thoại ---------- */

  const openConversation = useCallback(async (conversationId) => {
    const s = store.getState()
    const previous = s.activeId
    if (previous === conversationId) {
      return
    }

    s.openConversation(conversationId)
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
      getAppSocket().markRead(conversationId, last.id)
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
      sendState: 'sending'
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
    getAppSocket().sendTyping(id)
  }, [store])

  /* ---------- hành động cột phải ---------- */

  const linkCustomer = useCallback(async (identityId, customerId) => {
    const conversationId = store.getState().activeId
    const customer = await omniApi.linkCustomer(identityId, customerId)

    /* Cập nhật ngay cho cột phải đổi trạng thái không bị khựng */
    store.getState().linkCustomer(conversationId, customer)
    antMessage.success('Đã gắn vào khách hàng')

    /* Lịch sử giao dịch (lead/cơ hội/đơn) nằm ở API context. Load lại */
    try {
      const ctx = await omniApi.fetchContext(conversationId)
      store.getState().setContext(conversationId, ctx)
    } catch {}

    return customer
  }, [ store ])

  /* Nối Data (lead) vừa tạo bởi form lead của ERP vào hội thoại.
   * Trùng SĐT và gán sale đã do lead service của ERP xử lý xong,
   * nên ở đây không còn nhánh 4090 nào nữa. */
  const attachLead = useCallback(async (dataId) => {
    const conversationId = store.getState().activeId
    if (!conversationId || !dataId) {
      return { ok: false }
    }
    try {
      const res = await omniApi.attachLead(conversationId, dataId)
      store.getState().linkCustomer(conversationId, res.customer)
      if (res.timelineItem) {
        store.getState().addTimelineItem(conversationId, res.timelineItem)
      }
      /* Lead có thể rơi vào tay sale khác — nói rõ để người tạo. */
      if (res.assignedUserId != null) {
        store.getState().patchConversation(conversationId, {
          assignedUserId: res.assignedUserId,
          assignedUserName: res.assignedUserName,
        })
      }
      antMessage.success( res.assignedUserName
        ? `Đã tạo lead · chuyển cho ${res.assignedUserName}`
        : 'Đã tạo lead'
      )
      return { ok: true, ...res }
    } catch (e) {
      antMessage.error(e.message || 'Gắn lead thất bại')
      return { ok: false }
    }
  }, [store])

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
    attachLead,
    assignUser,
    changeStatus
  }
};
