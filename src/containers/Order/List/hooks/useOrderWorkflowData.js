import { useCallback } from 'react'
import OrderService from '@/services/OrderService'
import { enrichOrdersWithWorkflowData } from '../services/workflowApi'

const useOrderWorkflowData = (isOrderList) => {
  const onData = useCallback(async (response) => {
    const tableData = await OrderService.viewInTable(response)

    if (isOrderList) {
      return enrichOrdersWithWorkflowData(tableData)
    }

    return tableData
  }, [isOrderList])

  return { onData }
}

export default useOrderWorkflowData
