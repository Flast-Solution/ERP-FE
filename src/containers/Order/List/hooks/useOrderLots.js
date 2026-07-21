import { useCallback, useState } from 'react'
import { message } from 'antd'
import { fetchLotsWithWorkflow } from '../services/lotApi'

const useOrderLots = () => {
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [lotsByOrderId, setLotsByOrderId] = useState({})
  const [loadingLotsByOrderId, setLoadingLotsByOrderId] = useState({})

  const fetchLotsByOrder = useCallback(async (order) => {
    const entityId = order?.id
    if (!entityId || lotsByOrderId[entityId] || loadingLotsByOrderId[entityId]) {
      return
    }

    setLoadingLotsByOrderId(prev => ({ ...prev, [entityId]: true }))
    try {
      const lots = await fetchLotsWithWorkflow(entityId)
      setLotsByOrderId(prev => ({
        ...prev,
        [entityId]: lots,
      }))
    } catch (error) {
      message.error('Không tải được danh sách lô của đơn hàng.')
      setLotsByOrderId(prev => ({ ...prev, [entityId]: [] }))
    } finally {
      setLoadingLotsByOrderId(prev => ({ ...prev, [entityId]: false }))
    }
  }, [loadingLotsByOrderId, lotsByOrderId])

  const handleExpand = useCallback((expanded, record) => {
    const recordId = record?.id
    setExpandedRowKeys(prev => (
      expanded
        ? Array.from(new Set([...prev, recordId]))
        : prev.filter(key => key !== recordId)
    ))
    if (expanded) {
      fetchLotsByOrder(record)
    }
  }, [fetchLotsByOrder])

  return {
    expandedRowKeys,
    lotsByOrderId,
    loadingLotsByOrderId,
    setLotsByOrderId,
    fetchLotsByOrder,
    handleExpand,
  }
}

export default useOrderLots
