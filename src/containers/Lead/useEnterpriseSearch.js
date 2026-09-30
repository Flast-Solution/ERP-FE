import { useCallback, useEffect, useRef, useState } from 'react'
import { RequestUtils } from '@flast-erp/core/utils'

export const fetchEnterprises = async (params) => {
  const response = await RequestUtils.Get('/erp/customer/fetch-customer-enterprise', params)
  if (response?.success === false || response?.errorCode !== 200) throw new Error('Không tải được doanh nghiệp')
  return {
    ...response.data,
    embedded: (response.data?.embedded ?? []).map(item => ({
      ...item,
      selectionValue: `enterprise:${item.id}`,
    })),
  }
}

export default function useEnterpriseSearch({ queryParams, onCompleted }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({ embedded: [], page: {} })
  const completedRef = useRef(onCompleted)
  completedRef.current = onCompleted
  const sequence = useRef(0)
  const refetch = useCallback(async params => {
    const request = ++sequence.current
    setLoading(true)
    let result
    try {
      result = await fetchEnterprises(params)
    } catch (_) {
      result = { embedded: [], page: {} }
    }
    if (request === sequence.current) {
      setData(result)
      completedRef.current(result)
      setLoading(false)
    }
    return result
  }, [])
  useEffect(() => {
    refetch(queryParams)
    return () => { sequence.current += 1 }
  }, [queryParams, refetch])
  const fetchMore = useCallback(async ({ filterField, defaultValue }) => {
    try {
      return await fetchEnterprises({ [filterField]: defaultValue })
    } catch (_) {
      return { embedded: [], page: {} }
    }
  }, [])
  return { loading, data, refetch, fetchMore }
}
