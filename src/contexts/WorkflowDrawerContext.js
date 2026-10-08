import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

import TenantPage from '@/components/TenantPage'
import useWorkflowProgressDrawer from '@/containers/Order/List/hooks/useWorkflowProgressDrawer'

const LocalWorkflowProgressDrawer = React.lazy(() => import('@/containers/Order/List/components/WorkflowProgressDrawer'))

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
      {drawer.workflowProgressDrawerOpen && <TenantPage page="WorkflowDrawer" local={LocalWorkflowProgressDrawer}
        open={drawer.workflowProgressDrawerOpen}
        loading={drawer.workflowProgressDrawerLoading}
        order={drawer.workflowProgressOrder}
        orderDetail={drawer.workflowProgressOrderDetail}
        workflowInstances={drawer.workflowProgressInstances}
        onClose={closeWorkflowDrawer}
        entityLabel={options.entityLabel}
        entityType={options.entityType}
        formOnly={options.formOnly}
        leadMode={options.leadMode}
      />}
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
