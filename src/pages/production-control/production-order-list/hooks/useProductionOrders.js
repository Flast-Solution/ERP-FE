import { useCallback, useEffect, useRef, useState } from 'react'
import { message } from 'antd'
import { RequestUtils } from '@flast-erp/core/utils'
import {
  EMPTY_FILTERS,
  MANUFACTURE_FETCH_API,
  MANUFACTURE_SAVE_API,
  MANUFACTURE_STATUS_MAP,
  MANUFACTURE_STATUS_LIST_API,
  PRODUCTION_PAGE_SIZE,
  USER_LIST_API,
  USER_PAGE_SIZE,
} from '../constants'
import {
  buildManufacturePayload,
  buildProductionOrderQuery,
  mapManufactureOrder,
  mergeManufactureStatuses,
} from '../utils'

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

export const useProductionOrders = (initialOrderCode = '') => {
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: PRODUCTION_PAGE_SIZE,
    total: 0,
  })
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    orderCode: initialOrderCode,
  }))
  const [statusOptions, setStatusOptions] = useState([])
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
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
      let manufactureStatuses = mergeManufactureStatuses()
      const [userResult, statusResult] = await Promise.allSettled([
        fetchUserNameMap(embedded.map(record => record?.createdBy)),
        RequestUtils.Get(MANUFACTURE_STATUS_LIST_API, { type: 'MANUFACTURE' }),
      ])
      if (userResult.status === 'fulfilled') {
        userNameMap = userResult.value
      } else {
        message.warning('Không tải được tên người tạo lệnh.')
      }
      if (statusResult.status === 'fulfilled') {
        manufactureStatuses = mergeManufactureStatuses(statusResult.value?.data ?? [])
      } else {
        message.warning('Không tải được danh mục trạng thái mở rộng.')
      }
      if (requestId !== requestIdRef.current) return
      setStatusOptions(manufactureStatuses.map(status => ({
        value: status.id,
        label: status.name,
        color: status.color,
      })))
      setOrders(embedded.map((record) => ({
        ...mapManufactureOrder(record, manufactureStatuses),
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
    const initialFilters = {
      ...EMPTY_FILTERS,
      orderCode: initialOrderCode,
    }
    setFilters(initialFilters)
    fetchProductionOrders(initialFilters, 1)
  }, [fetchProductionOrders, initialOrderCode])

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

  const updateProductionOrderStatus = useCallback(async (record, nextStatus) => {
    if (!record?.id || String(record.manufactureStatus) === String(nextStatus)) return

    setUpdatingStatusId(record.id)
    try {
      const payload = buildManufacturePayload({
        productionOrder: {
          ...record,
          manufactureStatus: nextStatus,
        },
        materialConfirmation: {
          confirmedBy: record.confirmedBy,
          allocations: Array.isArray(record.outbound) ? record.outbound : [],
        },
        isEdit: true,
      })
      const response = await RequestUtils.Post(MANUFACTURE_SAVE_API, payload)
      const isSuccess = response?.errorCode === 200 || response?.success
      if (!isSuccess) {
        throw new Error(response?.message || 'Cập nhật trạng thái thất bại.')
      }

      const selectedStatus = statusOptions.find(option => (
        String(option.value) === String(nextStatus)
      ))
      setOrders(current => current.map(order => (
        String(order.id) !== String(record.id)
          ? order
          : {
            ...order,
            manufactureStatus: nextStatus,
            manufactureStatusLabel: selectedStatus?.label ?? `Trạng thái #${nextStatus}`,
            manufactureStatusColor: selectedStatus?.color ?? null,
            status: MANUFACTURE_STATUS_MAP[nextStatus] ?? 'custom',
          }
      )))
      message.success(response?.message || 'Đã cập nhật trạng thái lệnh sản xuất.')
    } catch (error) {
      message.error(error?.message || 'Cập nhật trạng thái thất bại.')
    } finally {
      setUpdatingStatusId(null)
    }
  }, [statusOptions])

  return {
    orders,
    ordersLoading,
    pagination,
    filters,
    statusOptions,
    updatingStatusId,
    updateProductionOrderStatus,
    updateFilter,
    applyFilters,
    clearFilters,
    changePage,
    reloadCurrentPage,
  }
}
