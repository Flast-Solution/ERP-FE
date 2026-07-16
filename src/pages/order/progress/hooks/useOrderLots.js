import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'

import { RequestUtils } from '@flast-erp/core/utils'
import { ORDER_LOTS_FIND_API } from '../constants'
import { resolveOrderLots } from '../workflowHelpers'

export const useOrderLots = (orderId) => {
  const [lots, setLots] = useState([])
  const [selectedLot, setSelectedLot] = useState(null)
  const [loadingLots, setLoadingLots] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setLots([])
      setSelectedLot(null)
      return undefined
    }

    let mounted = true
    setLoadingLots(true)

    const loadLots = async () => {
      try {
        const response = await RequestUtils.Get(ORDER_LOTS_FIND_API, {
          entity: 'ORDER',
          entityId: orderId,
        })

        const orderLots = resolveOrderLots(response)
        if (!mounted) return
        setLots(orderLots)
        setSelectedLot(orderLots[0] ?? null)
      } catch (error) {
        if (!mounted) return
        setLots([])
        setSelectedLot(null)
        message.error(error?.message || 'Không tải được danh sách lô hàng.')
      } finally {
        if (mounted) {
          setLoadingLots(false)
        }
      }
    }

    loadLots()

    return () => {
      mounted = false
    }
  }, [orderId])

  const selectLot = useCallback((lot) => {
    setSelectedLot(lot)
    return true
  }, [])

  return {
    lots,
    selectedLot,
    loadingLots,
    selectLot,
  }
}
