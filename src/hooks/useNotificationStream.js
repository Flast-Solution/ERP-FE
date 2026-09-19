import { useState } from 'react'

const useNotificationStream = (userId) => {
  /* Tạm thời bỏ hết notify theo phương pháp cũ. Giờ chuyển sang WS, không sử dụng text-stream */
  const [ notifications ] = useState([])
  return notifications
}

export default useNotificationStream
