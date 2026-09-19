/**************************************************************************/
/*  @/hooks/useAppSocket.js                                               */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* WebSocket dùng chung toàn app.                                         */
/*                                                                        */
/* useAppSocketProvider -> gọi ĐÚNG MỘT LẦN ở PrivateLayout. Sở hữu kết   */
/*                         nối: mở khi đăng nhập, đóng khi đăng xuất.     */
/* useSocketEvents      -> mọi tính năng dùng cái này để nghe.            */
/* useSocketTopic       -> theo dõi một thực thể, tự huỷ khi rời.         */
/*                                                                        */
/* KHÔNG màn hình nào được gọi destroyAppSocket — rời một màn hình mà     */
/* đóng kết nối thì tính năng khác đang nghe sẽ chết theo.                */
/**************************************************************************/

import { useEffect, useRef } from 'react'
import { message } from 'antd'
import { jwtService } from '@flast-erp/core/utils'
import { useStore } from '@flast-erp/core/components'
import { WS_URL } from '@/configs'
import { getAppSocket, destroyAppSocket } from '@/services/omniService'
import { WS_EVENT } from '@/services/socketEvents'

/* Nghe nhiều sự kiện trong MỘT useEffect.
 *
 * handlersRef giữ map mới nhất nên handler đổi tham chiếu mỗi render
 * cũng không phải đăng ký lại. Dependency là danh sách TÊN sự kiện,
 * không phải object — object literal đổi tham chiếu mỗi lần render. */
export const useSocketEvents = (handlers, enabled = true) => {

  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const eventKey = Object.keys(handlers).sort().join('|')
  useEffect(() => {
    if (!enabled || !eventKey) {
      return undefined
    }
    const socket = getAppSocket()
    const offs = Object.keys(handlersRef.current).map((event) =>
      socket.on(event, (payload) => handlersRef.current[event]?.(payload))
    )
    return () => {
      offs.forEach((off) => off())
    }
  }, [eventKey, enabled])
}

/* Theo dõi một thực thể (hội thoại, đơn hàng...). Tự unsubscribe khi
 * id đổi hoặc component unmount, nên nơi gọi không phải nhớ dọn. */
export const useSocketTopic = (topic, id) => {
  useEffect(() => {
    if (!topic || id == null) {
      return undefined
    }
    const socket = getAppSocket()
    socket.subscribe(topic, id)
    return () => {
      socket.unsubscribe(topic, id)
    }
  }, [topic, id])
}

/* Gửi lệnh tuỳ ý lên server */
export const useSocketEmit = () => (command, data) => getAppSocket().emit(command, data)

/* Chủ sở hữu kết nối. Gọi một lần duy nhất ở tầng layout. */
export const useAppSocketProvider = () => {

  const { user } = useStore()
  const bizId = user?.bizId

  useEffect(() => {
    if (!bizId) {
      return undefined
    }
    
    getAppSocket({
      url: WS_URL,
      token: jwtService.getAccessToken(),
      bizId,
    }).connect()

    /* Đóng khi đăng xuất hoặc đổi doanh nghiệp */
    return () => {
      destroyAppSocket()
    }
  }, [bizId])

  /* Lỗi phiên là việc của cả app, không riêng màn hình nào */
  useSocketEvents({
    [WS_EVENT.UNAUTHORIZED]: () => {
      message.error('Phiên làm việc hết hạn, tải lại trang để tiếp tục')
    }
  })
};
