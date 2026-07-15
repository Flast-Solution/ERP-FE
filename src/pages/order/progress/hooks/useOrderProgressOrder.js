import { useEffect, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'

import OrderService from '@/services/OrderService'
import { getValue } from '../workflowHelpers'

export const useOrderProgressOrder = () => {
  const location = useLocation()
  const params = useParams()
  const [searchParams] = useSearchParams()

  const [order, setOrder] = useState(null)
  const [loadingOrder, setLoadingOrder] = useState(false)

  const orderId = getValue(
    params.orderId,
    searchParams.get('orderId'),
    searchParams.get('id'),
    location.state?.order?.id,
  )

  useEffect(() => {
    if (!orderId) return undefined

    let mounted = true

    setLoadingOrder(true)

    OrderService.getOrderOnEdit(orderId)
      .then((response) => {
        if (!mounted) return

        setOrder({
          ...(response?.order ?? {}),
          customer: response?.customer ?? null,
          details: Array.isArray(response?.data) ? response.data : [],
        })
      })
      .finally(() => {
        if (mounted) {
          setLoadingOrder(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [orderId])

  return {
    order,
    orderId,
    loadingOrder,
  }
}
