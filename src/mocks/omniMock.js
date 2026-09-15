/**************************************************************************/
/*  @/mocks/omniMock.js                                                   */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Dữ liệu giả lập cho module Omni-Channel.                               */
/* Khi BE xong: đổi import trong omniService.js, KHÔNG sửa component.     */
/**************************************************************************/

import { CHANNEL_TYPE, CONVERSATION_STATUS, DIRECTION, MSG_TYPE, REF_TYPE } from '@/store/omniStore'

/* Nhân viên đang đăng nhập — dùng cho tab "Của tôi" */
const CURRENT_USER_ID = 31

/* Trễ giả lập để thấy được skeleton / loading state */
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms))

const now = Date.now()
const ago = (minutes) => new Date(now - minutes * 60_000).toISOString()

/* ======================================================================
 * Kênh đã kết nối
 * ==================================================================== */

export const MOCK_CHANNELS = [
  {
    id: 5,
    channelType: CHANNEL_TYPE.ZALO_OA,
    externalId: 'oa_388120',
    name: 'Flast Dệt May',
    avatar: '',
    status: 1,
    tokenExpireAt: new Date(now + 40 * 60_000).toISOString(),
  },
  {
    id: 6,
    channelType: CHANNEL_TYPE.ZALO_OA,
    externalId: 'oa_412009',
    name: 'Flast Đồng Phục',
    avatar: '',
    status: 1,
    tokenExpireAt: new Date(now + 55 * 60_000).toISOString(),
  },
  {
    /* Kênh lỗi token — để test badge đỏ cảnh báo admin */
    id: 7,
    channelType: CHANNEL_TYPE.FACEBOOK,
    externalId: '10215540',
    name: 'Flast Solution',
    avatar: '',
    status: 2,
    tokenExpireAt: ago(120),
  },
]

/* ======================================================================
 * Danh sách hội thoại — phủ đủ các trạng thái cột phải
 * ==================================================================== */

export const MOCK_CONVERSATIONS = [
  {
    /* Chưa gắn customer — cột phải hiện nút Tạo Lead */
    id: 1001,
    channelAccountId: 5,
    channelType: CHANNEL_TYPE.ZALO_OA,
    identityId: 81,
    displayName: 'Bé Bống',
    channelAccountName: 'Flast Dệt May',
    avatar: '',
    lastMessageAt: ago(2),
    lastMessageSnippet: 'Shop ơi áo thun cotton 2 chiều còn hàng không ạ',
    lastInboundAt: ago(2),
    lastDirection: DIRECTION.INBOUND,
    unreadCount: 3,
    status: CONVERSATION_STATUS.NEW,
    assignedUserId: 42,
    assignedUserName: 'Hạnh',
    customerId: null,
  },
  {
    /* Đã gắn customer, có timeline đầy đủ */
    id: 1042,
    channelAccountId: 5,
    channelType: CHANNEL_TYPE.ZALO_OA,
    identityId: 88,
    displayName: 'Chị Lan',
    avatar: '',
    lastMessageAt: ago(25),
    lastMessageSnippet: 'Chị xem lại tiến độ lô 1200 cái giúp em với',
    lastInboundAt: ago(25),
    lastDirection: DIRECTION.INBOUND,
    unreadCount: 1,
    status: CONVERSATION_STATUS.PROCESSING,
    assignedUserId: 31,
    assignedUserName: 'Ngọc',
    customerId: 5567,
  },
  {
    /* Cùng khách Lan nhưng kênh Facebook — test siblingIdentities */
    id: 1187,
    channelAccountId: 7,
    channelType: CHANNEL_TYPE.FACEBOOK,
    identityId: 91,
    displayName: 'Chị Lan',
    avatar: '',
    lastMessageAt: ago(180),
    lastMessageSnippet: 'Em gửi lại bảng size nhé chị',
    lastInboundAt: ago(400),
    lastDirection: DIRECTION.OUTBOUND,
    unreadCount: 0,
    status: CONVERSATION_STATUS.PROCESSING,
    assignedUserId: 31,
    assignedUserName: 'Ngọc',
    customerId: 5567,
  },
  {
    /* Đã gắn customer nhưng chưa có lead/cơ hội/đơn — timeline rỗng */
    id: 1205,
    channelAccountId: 6,
    channelType: CHANNEL_TYPE.ZALO_OA,
    identityId: 95,
    displayName: 'Trần Minh Hải',
    avatar: '',
    lastMessageAt: ago(320),
    lastMessageSnippet: 'Cảm ơn em nhé',
    lastInboundAt: ago(320),
    lastDirection: DIRECTION.INBOUND,
    unreadCount: 0,
    status: CONVERSATION_STATUS.DONE,
    assignedUserId: 42,
    assignedUserName: 'Hạnh',
    customerId: 6102,
  },
  {
    /* Cửa sổ trả lời ĐÃ ĐÓNG — Zalo 48h, tin cuối của khách 60h trước.
     * Dùng để test khoá ô nhập. */
    id: 1260,
    channelAccountId: 6,
    channelType: CHANNEL_TYPE.ZALO_OA,
    identityId: 99,
    displayName: 'Xưởng may Đại Phát',
    avatar: '',
    lastMessageAt: ago(60 * 60),
    lastMessageSnippet: 'Bên em báo giá giúp 300 bộ bảo hộ',
    lastInboundAt: ago(60 * 60),
    lastDirection: DIRECTION.INBOUND,
    unreadCount: 0,
    status: CONVERSATION_STATUS.NEW,
    assignedUserId: null,
    assignedUserName: null,
    customerId: null,
  },
]

/* ======================================================================
 * Tin nhắn theo từng hội thoại (cũ -> mới)
 * ==================================================================== */

const buildMessages = (conversationId, rows) =>
  rows.map((r, i) => ({
    id: conversationId * 100 + i,
    externalId: `mid_${conversationId}_${i}`,
    conversationId,
    direction: r.d,
    msgType: r.type || MSG_TYPE.TEXT,
    content: r.c,
    attachments: r.att || null,
    senderUserId: r.d === DIRECTION.OUTBOUND ? (r.by || 31) : null,
    senderName: r.d === DIRECTION.OUTBOUND ? (r.byName || 'Trần Văn B') : null,
    sentAt: ago(r.m),
    sendState: r.state || (r.d === DIRECTION.OUTBOUND ? 'read' : 'sent'),
  }))

export const MOCK_MESSAGES = {
  1001: buildMessages(1001, [
    { d: DIRECTION.INBOUND, c: 'Alo shop', m: 8 },
    { d: DIRECTION.INBOUND, c: 'Shop ơi áo thun cotton 2 chiều còn hàng không ạ', m: 2 },
  ]),

  1042: buildMessages(1042, [
    { d: DIRECTION.INBOUND, c: 'Em ơi báo giá 500 bộ đồng phục kỹ thuật, vải pangrim', m: 1400 },
    { d: DIRECTION.OUTBOUND, c: 'Dạ em gửi chị báo giá, size S–XXL, thêu logo ngực trái', m: 1382 },
    { d: DIRECTION.INBOUND, c: 'Em ơi cho chị hỏi lô áo thun đợt trước', m: 600 },
    { d: DIRECTION.OUTBOUND, c: 'Dạ chị Lan, lô 1200 cái đang ở khâu in ạ', m: 595 },
    {
      d: DIRECTION.OUTBOUND,
      c: '',
      type: MSG_TYPE.IMAGE,
      m: 594,
      att: [{ url: 'https://picsum.photos/seed/lo1/400/300', name: 'tien-do.jpg', localUrl: null, state: 'pending' }],
    },
    { d: DIRECTION.INBOUND, c: 'Ok em, khi nào xong báo chị nhé', m: 590 },
    { d: DIRECTION.INBOUND, c: 'Giá này gồm thêu chưa em? Bên chị cần thêm 20 bộ mẫu trước', m: 130 },
    { d: DIRECTION.OUTBOUND, c: 'Dạ em gửi lại báo giá đã cập nhật rồi ạ, gồm thêu và 20 bộ mẫu', m: 123 },
    {
      d: DIRECTION.OUTBOUND,
      type: MSG_TYPE.SYSTEM,
      c: 'Tuấn đã gắn đơn DH-7788 vào hội thoại',
      m: 122,
    },
    { d: DIRECTION.INBOUND, c: 'Chị xem lại tiến độ lô 1200 cái giúp em với', m: 25 },
  ]),

  1187: buildMessages(1187, [
    { d: DIRECTION.INBOUND, c: 'Bên em có size 3XL không', m: 400 },
    { d: DIRECTION.OUTBOUND, c: 'Em gửi lại bảng size nhé chị', m: 180, byName: 'Lê Thị C', by: 42 },
  ]),

  1205: buildMessages(1205, [
    { d: DIRECTION.OUTBOUND, c: 'Dạ đơn của anh đã giao thành công ạ', m: 325 },
    { d: DIRECTION.INBOUND, c: 'Cảm ơn em nhé', m: 320 },
  ]),

  1260: buildMessages(1260, [
    { d: DIRECTION.INBOUND, c: 'Bên em báo giá giúp 300 bộ bảo hộ', m: 60 * 60 },
  ]),
}

/* ======================================================================
 * Context cột phải — khớp omni-context-contract.md
 * ==================================================================== */

const CUSTOMER_LAN = {
  id: 5567,
  code: 'KH-1042',
  name: 'Chị Lan',
  mobile: '0912345678',
  email: 'lan@detkimphutho.vn',
  type: 2,
  companyName: 'Dệt Kim Phú Thọ',
  ownerUserId: 31,
  ownerName: 'Tuấn',
  priceGroup: 'Sỉ cấp 2',
  source: 'Zalo OA',
  debtAmount: 12500000,
  overdueInvoiceCount: 2,
  totalOrderCount: 7,
  totalOrderValue: 486000000,
  lastOrderCode: 'DH-7788',
  lastOrderAt: ago(60 * 24 * 4),
  createdAt: ago(60 * 24 * 300),
  detailUrl: '/customer/enterprise/5567',
}

const TIMELINE_LAN = [
  {
    refType: REF_TYPE.ORDER,
    refId: 7788,
    code: 'DH-7788',
    title: '200 áo thun cotton 2 chiều',
    statusCode: 5,
    statusName: 'Đang may',
    subNote: 'giao 20/09',
    amount: 8400000,
    createdAt: ago(60 * 24 * 26),
    ownerName: 'Trần Văn B',
    detailUrl: '/sale/order/progress/7788',
  },
  {
    refType: REF_TYPE.COHOI,
    refId: 4410,
    code: 'CH-4410',
    title: 'Đồng phục kỹ thuật 500 bộ',
    statusCode: 2,
    statusName: 'Đang báo giá',
    amount: 62000000,
    createdAt: ago(60 * 24 * 31),
    ownerName: 'Trần Văn B',
    detailUrl: '/sale/co-hoi/4410',
  },
  {
    refType: REF_TYPE.LEAD,
    refId: 9021,
    code: 'LEAD-9021',
    title: 'Hỏi báo giá áo thun cotton',
    statusCode: 3,
    statusName: 'Đã tiếp nhận',
    amount: null,
    createdAt: ago(60 * 24 * 44),
    ownerName: 'Trần Văn B',
    detailUrl: '/lead/9021',
  },
]

export const MOCK_CONTEXT = {
  /* Chưa gắn — customer null, timeline rỗng */
  1001: {
    conversationId: 1001,
    identity: {
      id: 81,
      channelType: CHANNEL_TYPE.ZALO_OA,
      channelAccountId: 5,
      channelAccountName: 'Flast Dệt May',
      externalUserId: 'zl_8812003',
      displayName: 'Bé Bống',
      avatar: '',
      firstMessageAt: ago(60 * 24 * 2),
      lastInboundAt: ago(2),
      referralLabel: null,
      linked: false,
      linkedAt: null,
      linkedByName: null,
    },
    customer: null,
    siblingIdentities: [],
    timeline: [],
  },

  /* Đã gắn + có timeline + có identity kênh khác */
  1042: {
    conversationId: 1042,
    identity: {
      id: 88,
      channelType: CHANNEL_TYPE.ZALO_OA,
      channelAccountId: 5,
      channelAccountName: 'Flast Dệt May',
      externalUserId: 'zl_3891042',
      displayName: 'Lan Nguyen',
      avatar: '',
      firstMessageAt: ago(60 * 24 * 60),
      lastInboundAt: ago(25),
      referralLabel: 'Đồng phục kỹ thuật',
      linked: true,
      linkedAt: ago(60 * 24 * 5),
      linkedByName: 'Trần Văn B',
    },
    customer: CUSTOMER_LAN,
    siblingIdentities: [
      {
        identityId: 91,
        conversationId: 1187,
        channelType: CHANNEL_TYPE.FACEBOOK,
        channelAccountName: 'Flast Solution',
        displayName: 'Lan Nguyen',
        lastMessageAt: ago(180),
        lastInboundAt: ago(400),
        unreadCount: 0,
      },
    ],
    timeline: TIMELINE_LAN,
  },

  /* Cùng khách Lan, nhìn từ phía Facebook */
  1187: {
    conversationId: 1187,
    identity: {
      id: 91,
      channelType: CHANNEL_TYPE.FACEBOOK,
      channelAccountId: 7,
      channelAccountName: 'Flast Solution',
      externalUserId: '7712900341',
      displayName: 'Lan Nguyen',
      avatar: '',
      firstMessageAt: ago(60 * 24 * 20),
      lastInboundAt: ago(400),
      referralLabel: 'Vải cotton 4 chiều',
      linked: true,
      linkedAt: ago(60 * 24 * 3),
      linkedByName: 'Lê Thị C',
    },
    customer: CUSTOMER_LAN,
    siblingIdentities: [
      {
        identityId: 88,
        conversationId: 1042,
        channelType: CHANNEL_TYPE.ZALO_OA,
        channelAccountName: 'Flast Dệt May',
        displayName: 'Lan Nguyen',
        lastMessageAt: ago(25),
        lastInboundAt: ago(25),
        unreadCount: 1,
      },
    ],
    timeline: TIMELINE_LAN,
  },

  /* Đã gắn nhưng timeline rỗng */
  1205: {
    conversationId: 1205,
    identity: {
      id: 95,
      channelType: CHANNEL_TYPE.ZALO_OA,
      channelAccountId: 6,
      channelAccountName: 'Flast Đồng Phục',
      externalUserId: 'zl_5520091',
      displayName: 'Trần Minh Hải',
      avatar: '',
      firstMessageAt: ago(60 * 24 * 30),
      lastInboundAt: ago(320),
      referralLabel: null,
      linked: true,
      linkedAt: ago(60 * 24 * 12),
      linkedByName: 'Lê Thị C',
    },
    customer: {
      id: 6102,
      code: 'KH-1187',
      name: 'Trần Minh Hải',
      mobile: '0988112004',
      email: null,
      type: 1,
      companyName: 'Shop áo thun Bình Tân',
      ownerUserId: 42,
      ownerName: 'Hạnh',
      priceGroup: null,
      source: 'Zalo OA',
      debtAmount: 0,
      overdueInvoiceCount: 0,
      totalOrderCount: 0,
      totalOrderValue: 0,
      lastOrderCode: null,
      lastOrderAt: null,
      createdAt: ago(60 * 24 * 2),
      detailUrl: '/sale/m-customer/6102',
    },
    siblingIdentities: [],
    timeline: [],
  },

  /* Chưa gắn, cửa sổ đã đóng */
  1260: {
    conversationId: 1260,
    identity: {
      id: 99,
      channelType: CHANNEL_TYPE.ZALO_OA,
      channelAccountId: 6,
      channelAccountName: 'Flast Đồng Phục',
      externalUserId: 'zl_7781200',
      displayName: 'Xưởng may Đại Phát',
      avatar: '',
      firstMessageAt: ago(60 * 70),
      lastInboundAt: ago(60 * 60),
      referralLabel: 'Bảo hộ lao động',
      linked: false,
      linkedAt: null,
      linkedByName: null,
    },
    customer: null,
    siblingIdentities: [],
    timeline: [],
  },
}

/* Khách hàng có sẵn để test kiểm trùng SĐT lúc tạo lead */
const EXISTING_CUSTOMERS = [CUSTOMER_LAN]

/* ======================================================================
 * Mock service — CÙNG chữ ký với omniService.js thật
 * ==================================================================== */

export const omniMockApi = {
  async fetchChannels() {
    await delay(200)
    return MOCK_CHANNELS
  },

  /* Lọc + phân trang giả lập ngay trên mảng mock */
  async fetchConversations({ filters = {}, cursor = null } = {}) {
    await delay()
    let items = [...MOCK_CONVERSATIONS]

    if (filters.channelAccountId) {
      items = items.filter((c) => c.channelAccountId === filters.channelAccountId)
    }
    if (filters.scope === 'unreplied') {
      items = items.filter((c) => c.lastDirection === DIRECTION.INBOUND)
    }
    if (filters.scope === 'mine') {
      items = items.filter((c) => c.assignedUserId === CURRENT_USER_ID)
    }
    if (filters.status !== null && filters.status !== undefined) {
      items = items.filter((c) => c.status === filters.status)
    }
    if (filters.unrepliedOnly) {
      items = items.filter((c) => c.lastDirection === DIRECTION.INBOUND)
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      items = items.filter(
        (c) =>
          c.displayName.toLowerCase().includes(kw) ||
          c.lastMessageSnippet.toLowerCase().includes(kw)
      )
    }

    items.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))

    const counts = {
      unreplied: MOCK_CONVERSATIONS.filter((c) => c.lastDirection === DIRECTION.INBOUND).length,
      mine: MOCK_CONVERSATIONS.filter((c) => c.assignedUserId === CURRENT_USER_ID).length,
      all: MOCK_CONVERSATIONS.length,
    }

    /* Mock chỉ có 1 trang */
    return { items: cursor ? [] : items, nextCursor: null, counts }
  },

  async fetchMessages(conversationId, { cursor } = {}) {
    await delay(250)
    if (cursor) return { items: [], nextCursor: null }
    return { items: MOCK_MESSAGES[conversationId] || [], nextCursor: null }
  },

  async fetchContext(conversationId) {
    await delay(300)
    const payload = MOCK_CONTEXT[conversationId]
    if (!payload) throw new Error('Không tìm thấy ngữ cảnh hội thoại')
    return payload
  },

  async sendMessage(conversationId, { content, attachments }) {
    await delay(400)
    /* Giả lập lỗi để test nút gửi lại */
    if (content?.trim() === 'test-fail') {
      throw new Error('Gửi thất bại')
    }
    const seq = (MOCK_MESSAGES[conversationId] || []).length
    return {
      id: conversationId * 100 + seq + 50,
      externalId: `mid_${conversationId}_${Date.now()}`,
      conversationId,
      direction: DIRECTION.OUTBOUND,
      msgType: attachments?.length ? MSG_TYPE.IMAGE : MSG_TYPE.TEXT,
      content,
      attachments: attachments || null,
      senderUserId: 31,
      senderName: 'Trần Văn B',
      sentAt: new Date().toISOString(),
      sendState: 'sent',
    }
  },

  /* Tìm khách cũ theo tên hoặc SĐT — phục vụ nút "Tìm khách cũ" */
  async searchCustomers(keyword) {
    await delay(300)
    const kw = String(keyword || '').toLowerCase().trim()
    if (!kw) return []
    return EXISTING_CUSTOMERS.filter(
      (c) => c.name.toLowerCase().includes(kw) || c.mobile.includes(kw)
    )
  },

  async linkCustomer(identityId, customerId) {
    await delay(300)
    const found = EXISTING_CUSTOMERS.find((c) => c.id === customerId)
    if (!found) throw new Error('Không tìm thấy khách hàng')
    return found
  },

  /* Điểm kiểm trùng DUY NHẤT của module.
   * mobile do sale tự nhập sau khi tư vấn lấy được. */
  async createLead(conversationId, { fullName, mobile, note, customerId }) {
    await delay(500)

    if (!customerId) {
      const duplicated = EXISTING_CUSTOMERS.filter((c) => c.mobile === mobile)
      if (duplicated.length) {
        const err = new Error('DUPLICATED_MOBILE')
        err.errorCode = 4090
        err.duplicated = duplicated
        throw err
      }
    }

    const customer = customerId
      ? EXISTING_CUSTOMERS.find((c) => c.id === customerId)
      : {
          id: Math.floor(Math.random() * 9000) + 7000,
          name: fullName,
          mobile,
          email: null,
          type: 1,
          companyName: null,
          ownerUserId: 31,
          ownerName: 'Trần Văn B',
          debtAmount: 0,
          totalOrderCount: 0,
          totalOrderValue: 0,
          detailUrl: '/sale/m-customer/new',
        }

    const leadId = Math.floor(Math.random() * 9000) + 9000
    return {
      customer,
      timelineItem: {
        refType: REF_TYPE.LEAD,
        refId: leadId,
        code: `LEAD-${leadId}`,
        title: note || 'Lead từ hội thoại',
        statusCode: 1,
        statusName: 'Mới',
        amount: null,
        createdAt: new Date().toISOString(),
        ownerName: 'Trần Văn B',
        detailUrl: `/lead/${leadId}`,
      },
    }
  },
}

/* ======================================================================
 * Giả lập realtime — thay cho SSE khi BE chưa có
 * ==================================================================== */

const INCOMING_SAMPLES = [
  { conversationId: 1001, content: 'Shop còn màu be không ạ' },
  { conversationId: 1042, content: 'Em ơi cho chị xin ảnh mẫu in nhé' },
  { conversationId: 1205, content: 'Cho anh hỏi thêm cái này' },
]

/* Trả về hàm dừng. Mỗi `intervalMs` bắn 1 tin của khách vào
 * một hội thoại ngẫu nhiên — để test badge, sắp xếp lại, append. */
export const startMockRealtime = (onMessage, intervalMs = 12000) => {
  let i = 0
  const timer = setInterval(() => {
    const sample = INCOMING_SAMPLES[i % INCOMING_SAMPLES.length]
    i += 1
    const conversation = MOCK_CONVERSATIONS.find((c) => c.id === sample.conversationId)
    if (!conversation) return

    const sentAt = new Date().toISOString()
    onMessage({
      conversation: { ...conversation, lastMessageSnippet: sample.content },
      message: {
        id: Date.now(),
        externalId: `mid_rt_${Date.now()}`,
        conversationId: sample.conversationId,
        direction: DIRECTION.INBOUND,
        msgType: MSG_TYPE.TEXT,
        content: sample.content,
        attachments: null,
        senderUserId: null,
        senderName: null,
        sentAt,
        sendState: 'sent',
      },
    })
  }, intervalMs)

  return () => clearInterval(timer)
}
