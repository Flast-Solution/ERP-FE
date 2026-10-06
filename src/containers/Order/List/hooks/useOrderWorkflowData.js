import { useCallback } from 'react'
import OrderService from '@/services/OrderService'
import { enrichOrdersWithWorkflowData } from '../services/workflowApi'

const useOrderWorkflowData = (isOrderList, includeProductionLots = false) => {
  const onData = useCallback(async (response) => {
    const tableData = await OrderService.viewInTable(response)

    if (isOrderList) {
      return enrichOrdersWithWorkflowData(tableData, { includeProductionLots })
    }

    return tableData
  }, [isOrderList, includeProductionLots])

  return { onData }
}

export default useOrderWorkflowData
