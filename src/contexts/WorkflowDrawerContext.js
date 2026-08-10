import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

import WorkflowProgressDrawer from '@/containers/Order/List/components/WorkflowProgressDrawer'
import useWorkflowProgressDrawer from '@/containers/Order/List/hooks/useWorkflowProgressDrawer'

const WorkflowDrawerContext = createContext(null)

export const WorkflowDrawerProvider = ({ children }) => {
  const drawer = useWorkflowProgressDrawer()
  const {
    openWorkflowProgressDrawer,
    closeWorkflowProgressDrawer,
  } = drawer
  const [options, setOptions] = useState({})

  const openWorkflowDrawer = useCallback((order, detail, nextOptions = {}) => {
    setOptions(nextOptions)
    return openWorkflowProgressDrawer(order, detail, nextOptions)
  }, [openWorkflowProgressDrawer])

  const closeWorkflowDrawer = useCallback(() => {
    closeWorkflowProgressDrawer()
    setOptions({})
  }, [closeWorkflowProgressDrawer])

  const value = useMemo(() => ({
    openWorkflowDrawer,
    closeWorkflowDrawer,
  }), [closeWorkflowDrawer, openWorkflowDrawer])

  return (
    <WorkflowDrawerContext.Provider value={value}>
      {children}
      <WorkflowProgressDrawer
        open={drawer.workflowProgressDrawerOpen}
        loading={drawer.workflowProgressDrawerLoading}
        order={drawer.workflowProgressOrder}
        orderDetail={drawer.workflowProgressOrderDetail}
        workflowInstances={drawer.workflowProgressInstances}
        onClose={closeWorkflowDrawer}
        entityLabel={options.entityLabel}
        entityType={options.entityType}
        formOnly={options.formOnly}
      />
    </WorkflowDrawerContext.Provider>
  )
}

export const useWorkflowDrawer = () => {
  const context = useContext(WorkflowDrawerContext)
  if (!context) {
    throw new Error('useWorkflowDrawer phải được sử dụng trong WorkflowDrawerProvider')
  }
  return context
}
