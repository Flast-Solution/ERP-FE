import { useCallback, useEffect, useRef, useState } from 'react'
import { message } from 'antd'
import { RequestUtils } from '@flast-erp/core/utils'
import {
  EMPTY_FILTERS,
  MANUFACTURE_FETCH_API,
  PRODUCTION_PAGE_SIZE,
  USER_LIST_API,
  USER_PAGE_SIZE,
} from '../constants'
import { buildProductionOrderQuery, mapManufactureOrder } from '../utils'

const fetchUserNameMap = async (userIds = []) => {
  const unresolvedIds = new Set(userIds.filter(id => id != null).map(String))
  const userNameMap = new Map()
  let page = 1

  while (unresolvedIds.size > 0 && page <= 100) {
    const response = await RequestUtils.Get(USER_LIST_API, {
      limit: USER_PAGE_SIZE,
      page,
    })
    const users = Array.isArray(response?.data?.embedded) ? response.data.embedded : []
    users.forEach((user) => {
      const id = String(user.id)
      if (!unresolvedIds.has(id)) return
      userNameMap.set(id, user.fullName ?? user.ssoId ?? user.code ?? `#${id}`)
      unresolvedIds.delete(id)
    })

    const pageData = response?.data?.page
    const totalElements = Number(pageData?.totalElements ?? pageData?.total ?? 0)
    const responsePageSize = Number(pageData?.pageSize ?? USER_PAGE_SIZE)
    const loadedAllUsers = users.length === 0
      || (totalElements > 0
        ? page * responsePageSize >= totalElements
        : users.length < USER_PAGE_SIZE)
    if (loadedAllUsers) break
    page += 1
  }

  return userNameMap
}

export const useProductionOrders = () => {
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: PRODUCTION_PAGE_SIZE,
    total: 0,
  })
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const requestIdRef = useRef(0)

  const fetchProductionOrders = useCallback(async (searchFilters = {}, page = 1) => {
    const requestId = ++requestIdRef.current
    const params = buildProductionOrderQuery(searchFilters, page)

    setOrdersLoading(true)
    try {
      const response = await RequestUtils.Get(`${MANUFACTURE_FETCH_API}?${params.toString()}`, {})
      if (requestId !== requestIdRef.current) return
      const embedded = response?.data?.embedded ?? []
      const pageData = response?.data?.page
      let userNameMap = new Map()
      try {
        userNameMap = await fetchUserNameMap(embedded.map(record => record?.createdBy))
      } catch {
        message.warning('Không tải được tên người tạo lệnh.')
      }
      if (requestId !== requestIdRef.current) return
      setOrders(embedded.map((record) => ({
        ...mapManufactureOrder(record),
        createdByName: userNameMap.get(String(record?.createdBy)),
      })))
      setPagination({
        current: page,
        pageSize: Number(pageData?.pageSize ?? PRODUCTION_PAGE_SIZE),
        total: Number(pageData?.totalElements ?? pageData?.total ?? embedded.length),
      })
    } catch (error) {
      if (requestId !== requestIdRef.current) return
      setOrders([])
      message.error(error?.message || 'Không tải được danh sách lệnh sản xuất.')
    } finally {
      if (requestId === requestIdRef.current) {
        setOrdersLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchProductionOrders()
  }, [fetchProductionOrders])

  const updateFilter = useCallback((key, value) => {
    setFilters(current => ({ ...current, [key]: value }))
  }, [])

  const applyFilters = useCallback(() => {
    fetchProductionOrders(filters, 1)
  }, [fetchProductionOrders, filters])

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    fetchProductionOrders(EMPTY_FILTERS, 1)
  }, [fetchProductionOrders])

  const changePage = useCallback((page) => {
    fetchProductionOrders(filters, page)
  }, [fetchProductionOrders, filters])

  const reloadCurrentPage = useCallback(() => (
    fetchProductionOrders(filters, pagination.current)
  ), [fetchProductionOrders, filters, pagination])

  return {
    orders,
    ordersLoading,
    pagination,
    filters,
    updateFilter,
    applyFilters,
    clearFilters,
    changePage,
    reloadCurrentPage,
  }
}
