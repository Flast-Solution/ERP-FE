import React from 'react'
import { Drawer } from 'antd'
import CreateOrder from '../../CreateOrder'
import BomConfirmation from '../../BomConfirmation'
import useDrawerLeaveGuard from '@/hooks/useDrawerLeaveGuard'

const ProductionOrderDrawer = ({
  open = false,
  drawerMode = 'create',
  step = 1,
  pendingOrder,
  savingOrder = false,
  waitingOrders = [],
  waitingOrderLoading = false,
  onSearchWaitingOrders,
  onLoadMoreWaitingOrders,
  onClose,
  onNext,
  onBack,
  onConfirm,
}) => {
  const {
    markDirty,
    requestClose,
  } = useDrawerLeaveGuard({
    open,
    onClose,
    enabled: drawerMode !== 'view',
    resetKey: drawerMode,
  })

  return (
    <Drawer
    open={open}
    title={null}
    placement="right"
    width="min(750px, calc(100vw - 16px))"
    destroyOnHidden
    onClose={requestClose}
    styles={{
      header: { minHeight: 48, padding: '8px 16px' },
      body: { padding: 0, overflowY: 'auto' },
    }}
  >
    {step === 1 ? (
      <CreateOrder
        initialValues={pendingOrder}
        mode={drawerMode}
        waitingOrders={waitingOrders}
        waitingOrderLoading={waitingOrderLoading}
        onSearchWaitingOrders={onSearchWaitingOrders}
        onLoadMoreWaitingOrders={onLoadMoreWaitingOrders}
        onCancel={drawerMode === 'view' ? onClose : requestClose}
        onValuesChange={markDirty}
        onNext={onNext}
        submitting={savingOrder}
      />
    ) : (
      <BomConfirmation
        productionOrder={pendingOrder}
        mode={drawerMode}
        submitting={savingOrder}
        onBack={onBack}
        onCancel={requestClose}
        onConfirm={onConfirm}
      />
    )}
    </Drawer>
  )
}

export default ProductionOrderDrawer
