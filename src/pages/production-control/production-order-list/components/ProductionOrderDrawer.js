import React from 'react'
import { Drawer } from 'antd'
import CreateOrder from '../../CreateOrder'
import BomConfirmation from '../../BomConfirmation'

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
  onCancelOrder,
  onNext,
  onBack,
  onConfirm,
}) => (
  <Drawer
    open={open}
    title={null}
    placement="right"
    width={step === 1 ? 920 : 'min(1200px, 96vw)'}
    destroyOnHidden
    onClose={step === 2 && drawerMode !== 'view' ? onCancelOrder : onClose}
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
        onCancel={onClose}
        onNext={onNext}
      />
    ) : (
      <BomConfirmation
        productionOrder={pendingOrder}
        mode={drawerMode}
        submitting={savingOrder}
        onBack={onBack}
        onCancel={onCancelOrder}
        onConfirm={onConfirm}
      />
    )}
  </Drawer>
)

export default ProductionOrderDrawer
