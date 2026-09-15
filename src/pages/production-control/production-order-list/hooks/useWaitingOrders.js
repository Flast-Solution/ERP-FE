import { useCallback, useEffect, useRef, useState } from 'react'
import { RequestUtils } from '@flast-erp/core/utils'
import {
  WAITING_ORDER_FETCH_API,
  WAITING_ORDER_PAGE_SIZE,
  WAITING_ORDER_SEARCH_DEBOUNCE_MS,
} from '../constants'

export const useWaitingOrders = () => {
  const [waitingOrders, setWaitingOrders] = useState([])
  const [waitingOrderTotal, setWaitingOrderTotal] = useState(0)
  const [waitingOrderLoading, setWaitingOrderLoading] = useState(false)
  const loadingRef = useRef(false)
  const requestIdRef = useRef(0)
  const searchRef = useRef('')
  const searchTimerRef = useRef(null)

  const fetchWaitingOrders = useCallback(async ({ page = 1, reset = false, force = false } = {}) => {
    if (loadingRef.current && !force) return

    const requestId = ++requestIdRef.current
    loadingRef.current = true
    setWaitingOrderLoading(true)
    try {
      const response = await RequestUtils.Get(
        `${WAITING_ORDER_FETCH_API}?limit=${WAITING_ORDER_PAGE_SIZE}&page=${page}&type=ORDER`,
        { ...(searchRef.current ? { code: searchRef.current } : {}) },
      )
      const embedded = response?.data?.embedded ?? []
      const totalElements = Number(response?.data?.page?.totalElements ?? embedded.length)
      if (requestId !== requestIdRef.current) return
      setWaitingOrders(current => reset ? embedded : [
        ...current,
        ...embedded.filter(item => !current.some(existing => String(existing.id) === String(item.id))),
      ])
      setWaitingOrderTotal(totalElements)
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false
        setWaitingOrderLoading(false)
      }
    }
  }, [])

  const resetWaitingOrders = useCallback((initialOrders = []) => {
    setWaitingOrders(initialOrders)
    setWaitingOrderTotal(initialOrders.length)
  }, [])

  const reloadWaitingOrders = useCallback(() => {
    searchRef.current = ''
    fetchWaitingOrders({ page: 1, reset: true, force: true }).catch(() => undefined)
  }, [fetchWaitingOrders])

  const searchWaitingOrders = useCallback((code) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
    searchTimerRef.current = setTimeout(() => {
      searchRef.current = String(code ?? '').trim()
      fetchWaitingOrders({ page: 1, reset: true, force: true }).catch(() => undefined)
    }, WAITING_ORDER_SEARCH_DEBOUNCE_MS)
  }, [fetchWaitingOrders])

  const loadMoreWaitingOrders = useCallback(() => {
    if (waitingOrders.length < waitingOrderTotal) {
      fetchWaitingOrders({ page: Math.floor(waitingOrders.length / WAITING_ORDER_PAGE_SIZE) })
        .catch(() => undefined)
    }
  }, [fetchWaitingOrders, waitingOrders.length, waitingOrderTotal])

  useEffect(() => () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
  }, [])

  return {
    waitingOrders,
    waitingOrderLoading,
    resetWaitingOrders,
    reloadWaitingOrders,
    searchWaitingOrders,
    loadMoreWaitingOrders,
  }
}
