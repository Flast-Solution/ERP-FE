import { useCallback, useState } from 'react'
import { message } from 'antd'

import { useEffectAsync } from '@flast-erp/core/hooks'
import { RequestUtils, arrayNotEmpty } from '@flast-erp/core/utils'
import OrderService from '@/services/OrderService'
import {
  ORDER_LOTS_FIND_API,
  PROVIDER_FETCH_API,
  WORKFLOW_FILTER_API,
} from '../constants'
import {
  normalizeOrderDetail,
  resolveOrderLots,
  resolveProviderList,
  resolveWorkflowList,
} from '../helpers'

export const useManufacturingLotData = (orderId) => {
  const [paymentDetails, setPaymentDetails] = useState([])
  const [providerOptions, setProviderOptions] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [createdLots, setCreatedLots] = useState([])

  const [loadingOrderInfo, setLoadingOrderInfo] = useState(false)
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [workflowLoading, setWorkflowLoading] = useState(false)

  const loadCreatedLots = useCallback(async () => {
    if (!orderId) {
      setCreatedLots([])
      return []
    }

    const response = await RequestUtils.Get(ORDER_LOTS_FIND_API, {
      entity: 'ORDER',
      entityId: orderId,
    })

    const lots = resolveOrderLots(response)
    setCreatedLots(lots)
    return lots
  }, [orderId])

  useEffectAsync(async () => {
    if (!orderId) {
      setPaymentDetails([])
      return
    }

    setLoadingOrderInfo(true)
    try {
      const { data } = await OrderService.getOrderOnEdit(orderId)
      if (arrayNotEmpty(data)) {
        setPaymentDetails(data.map(normalizeOrderDetail))
      }
    } finally {
      setLoadingOrderInfo(false)
    }
  }, [orderId])

  useEffectAsync(async () => {
    setLoadingProviders(true)
    try {
      const response = await RequestUtils.Get(PROVIDER_FETCH_API, { limit: 100, offset: 0 })
      setProviderOptions(resolveProviderList(response)
        .map(provider => ({
          label: provider?.name || provider?.code || `Nhà cung cấp #${provider?.id}`,
          value: provider?.id,
        }))
        .filter(option => option.value !== undefined && option.value !== null))
    } catch (error) {
      message.error('Không tải được danh sách nhà cung cấp.')
      setProviderOptions([])
    } finally {
      setLoadingProviders(false)
    }
  }, [])

  useEffectAsync(async () => {
    setWorkflowLoading(true)
    try {
      const response = await RequestUtils.Get(WORKFLOW_FILTER_API, {})
      setWorkflows(resolveWorkflowList(response))
    } catch (error) {
      message.error('Không tải được danh sách workflow.')
      setWorkflows([])
    } finally {
      setWorkflowLoading(false)
    }
  }, [])

  useEffectAsync(async () => {
    if (!orderId) {
      setCreatedLots([])
      return
    }

    try {
      await loadCreatedLots()
    } catch (error) {
      setCreatedLots([])
    }
  }, [orderId, loadCreatedLots])

  return {
    paymentDetails,
    providerOptions,
    workflows,
    createdLots,
    loadingOrderInfo,
    loadingProviders,
    workflowLoading,
    loadCreatedLots,
    setCreatedLots,
  }
}
