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
  const drawerTitle = drawerMode === 'view'
    ? 'Chi tiết lệnh sản xuất'
    : drawerMode === 'edit'
      ? 'Chỉnh sửa lệnh sản xuất'
      : 'Tạo lệnh sản xuất'
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
    title={<h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{drawerTitle}</h1>}
    placement="right"
    width="min(750px, calc(100vw - 16px))"
    destroyOnHidden
    onClose={requestClose}
    styles={{
      header: { minHeight: 56, padding: '10px 16px' },
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
