import { useCallback, useRef, useState } from 'react'
import { message } from 'antd'
import { RequestUtils } from '@flast-erp/core/utils'
import { WAITING_ORDER_FETCH_API } from '../constants'
import { getOrderProductionProgress } from '../orderProductionProgress'

export const useWaitingOrders = () => {
  const [waitingOrders, setWaitingOrders] = useState([])
  const [waitingOrderLoading, setWaitingOrderLoading] = useState(false)
  const requestIdRef = useRef(0)

  const resetWaitingOrders = useCallback((initialOrders = []) => {
    ++requestIdRef.current
    setWaitingOrders(initialOrders)
    setWaitingOrderLoading(false)
  }, [])

  const reloadWaitingOrders = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setWaitingOrderLoading(true)
    try {
      const response = await RequestUtils.Get(WAITING_ORDER_FETCH_API, {})
      if (requestId !== requestIdRef.current) return
      if (response?.success === false || !Array.isArray(response?.data)) {
        throw new Error(response?.message || 'Không tải được danh sách đơn hàng to.')
      }
      setWaitingOrders(response.data.filter(order => getOrderProductionProgress(order).pendingDetails.length > 0))
    } catch (error) {
      if (requestId === requestIdRef.current) {
        message.error(error?.message || 'Không tải được danh sách đơn hàng to.')
      }
    } finally {
      if (requestId === requestIdRef.current) setWaitingOrderLoading(false)
    }
  }, [])

  return { waitingOrders, waitingOrderLoading, resetWaitingOrders, reloadWaitingOrders }
}
