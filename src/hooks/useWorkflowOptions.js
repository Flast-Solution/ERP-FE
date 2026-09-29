import { useCallback, useEffect, useRef, useState } from 'react'
import { message } from 'antd'
import { RequestUtils } from '@flast-erp/core/utils'

// Same paginated workflow catalogue used by the Lead form.
export const useWorkflowOptions = () => {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(false)
  const state = useRef({ offset: 0, loading: false, more: true })
  const mounted = useRef(false)
  const loadMore = useCallback(async () => {
    if (state.current.loading || !state.current.more) return
    state.current.loading = true
    setLoading(true)
    try {
      const response = await RequestUtils.Get('/workflow/process/filter', {
        limit: '50', offset: String(state.current.offset),
      })
      if (!mounted.current) return
      if (response?.success === false || (response?.errorCode != null && Number(response.errorCode) !== 200)) {
        throw new Error(response?.message)
      }
      const items = response?.data?.embedded ?? []
      const total = Number(response?.data?.page?.totalElements ?? 0)
      state.current.offset += items.length
      state.current.more = items.length > 0 && (total > 0 ? state.current.offset < total : items.length === 50)
      setWorkflows(current => [...new Map([...current, ...items].map(item => [String(item.id), item])).values()])
    } catch {
      if (mounted.current) message.error('Không tải được danh sách workflow. Vui lòng mở lại danh sách để thử lại.')
    } finally {
      state.current.loading = false
      if (mounted.current) setLoading(false)
    }
  }, [])
  useEffect(() => {
    mounted.current = true
    loadMore()
    return () => { mounted.current = false }
  }, [loadMore])
  return { workflows, loading, loadMore }
}
