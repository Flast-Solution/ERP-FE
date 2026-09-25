import { useCallback, useContext, useEffect, useState } from 'react'
import { DataContext } from '@flast-erp/core/components'
import { useUpdateEffect } from '@flast-erp/core/hooks'
import { RequestUtils } from '@flast-erp/core/utils'
import { normalizeTrackingResponse } from '../utils/orderTracking'

const FILTER_CONFIG = {
  code: { source: 'ORDER', field: 'code', operator: 'CONTAINS' },
  customerMobile: { source: 'ORDER', field: 'customerMobilePhone', operator: 'CONTAINS' },
  productName: { source: 'ORDER_DETAIL', field: 'productName', operator: 'CONTAINS' },
  userCreatedId: { source: 'ORDER', field: 'userCreateId', operator: 'EQUALS' },
  from: { source: 'ORDER', field: 'createdAt', operator: 'GREATER_THAN_OR_EQUALS' },
  to: { source: 'ORDER', field: 'createdAt', operator: 'LESS_THAN_OR_EQUALS' },
  workflowDataKeyword: { source: 'WORKFLOW_DATA', field: 'value', operator: 'CONTAINS' },
}

const createRequestBody = queryParams => {
  const dynamicFilters = Object.entries(FILTER_CONFIG).reduce((result, [key, config]) => {
    const value = queryParams?.[key]
    if (value === undefined || value === null || value === '') return result
    return [...result, { ...config, value: String(value) }]
  }, [])

  return {
    filters: [
      {
        field: 'type',
        operator: 'EQUALS',
        value: 'order',
      },
      ...dynamicFilters,
    ],
    page: 0,
    limit: Number(queryParams?.limit ?? 10),
    sort: {
      field: 'createdAt',
      descending: true,
    },
  }
}

const useOrderTrackingList = ({ queryParams, onData = value => value }) => {
  const { f5List: refreshList } = useContext(DataContext)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ embedded: [], page: {} })

  const fetchResource = useCallback(async (params) => {
    setLoading(true)
    try {
      const response = await RequestUtils.Post(
        '/erp/order-tracking/search',
        createRequestBody(params)
      )

      if (response?.errorCode !== 200 && response?.success !== true) {
        console.error('[OrderTracking]', response?.message)
        setData({ embedded: [], page: {} })
        return
      }

      const normalized = normalizeTrackingResponse(response?.data)
      setData(await Promise.resolve(onData(normalized)))
    } catch (error) {
      console.error('[OrderTracking]', error)
      setData({ embedded: [], page: {} })
    } finally {
      setLoading(false)
    }
  }, [onData])

  useEffect(() => {
    fetchResource(queryParams)
  }, [fetchResource, queryParams])

  useUpdateEffect(() => {
    if (refreshList?.apiPath === queryParams?.apiPath) {
      fetchResource(queryParams)
    }
  }, [refreshList, queryParams, fetchResource])

  return { data, loading }
}

export default useOrderTrackingList
