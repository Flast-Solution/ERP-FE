/**************************************************************************/
/*  @/services/socketEvents.js                                            */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Danh mục sự kiện WebSocket dùng chung toàn app.                        */
/*                                                                        */
/* Quy ước tên: <miền>.<thực thể>.<hành động>                             */
/* Miền mới thêm một khối mới, KHÔNG dùng tên trống như 'updated' —       */
/* ba tính năng cùng có "updated" sẽ đụng nhau.                           */
/**************************************************************************/

/* ---- Vòng đời kết nối. Không có namespace vì thuộc về chính kênh ---- */
export const WS_SYSTEM = {
  /* Nội bộ client, server KHÔNG gửi: báo trạng thái kết nối cho UI */
  STATE: '__state',

  READY: 'ready',                 /* xác thực xong, mới được coi là đã kết nối */
  UNAUTHORIZED: 'unauthorized',   /* token sai/hết hạn — client dừng nối lại */
  ACK: 'ack',                     /* phản hồi cho lệnh có requestId */
  ERROR: 'error',                 /* lỗi chung từ server */
}

/* ---- Miền Omni-Channel ---- */
export const WS_OMNI = {
  MESSAGE_NEW: 'omni.message.new',
  MESSAGE_READ: 'omni.message.read',          /* khách hoặc đồng nghiệp đã xem */
  CONVERSATION_UPDATED: 'omni.conversation.updated',
  CONVERSATION_TYPING: 'omni.conversation.typing',
  CHANNEL_ERROR: 'omni.channel.error',
}

/* ---- Các loại thông báo từ BE khi gọi Endpoint: /omni/notify ---- */
export const WS_NOTIFICATION = {
  ORDER_APPROVED: 'ORDER_APPROVED',
}

/* ---- Gộp lại cho tiện tra cứu. Dùng WS_EVENT.X ở mọi nơi. ---- */
export const WS_EVENT = {
  ...WS_SYSTEM,
  ...WS_OMNI,
  ...WS_NOTIFICATION,
}

/* ---- Lệnh client -> server ---- */
export const WS_COMMAND = {
  AUTH: 'auth',
  PING: 'ping',

  /* Theo dõi một thực thể. Dùng { topic, id }  */
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',

  OMNI_TYPING: 'omni.typing',
  OMNI_READ: 'omni.read',
}

/* Tên topic cho subscribe/unsubscribe */
export const WS_TOPIC = {
  OMNI_CONVERSATION: 'omni.conversation',
  OMNI_NOTIFYCATION: 'omni.notifycation'
}
