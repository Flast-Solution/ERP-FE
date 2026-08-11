import React from 'react'
import { Helmet } from 'react-helmet'
import { Pagination } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { BreadcrumbCustom, CustomButton } from '@flast-erp/core/components'
import { ProductionOrderListShell } from './styles'
import ProductionOrderFilters from './production-order-list/components/ProductionOrderFilters'
import ProductionOrderTable from './production-order-list/components/ProductionOrderTable'
import ProductionOrderDrawer from './production-order-list/components/ProductionOrderDrawer'
import { useProductionOrders } from './production-order-list/hooks/useProductionOrders'
import { useWaitingOrders } from './production-order-list/hooks/useWaitingOrders'
import { useProductionOrderFlow } from './production-order-list/hooks/useProductionOrderFlow'

const ProductionOrderList = () => {
  const {
    orders,
    ordersLoading,
    pagination,
    filters,
    updateFilter,
    applyFilters,
    clearFilters,
    changePage,
    reloadCurrentPage,
  } = useProductionOrders()

  const {
    waitingOrders,
    waitingOrderLoading,
    resetWaitingOrders,
    reloadWaitingOrders,
    searchWaitingOrders,
    loadMoreWaitingOrders,
  } = useWaitingOrders()

  const {
    open,
    drawerMode,
    step,
    pendingOrder,
    savingOrder,
    openFlow,
    openExistingOrder,
    closeFlow,
    cancelOrder,
    goToConfirmation,
    backToCreate,
    finishFlow,
  } = useProductionOrderFlow({
    resetWaitingOrders,
    reloadWaitingOrders,
    onSaved: reloadCurrentPage,
  })

  const paginationProps = {
    ...pagination,
    showSizeChanger: false,
    showTotal: (total, range) => `${range[0]}-${range[1]}/${total}`,
    onChange: changePage,
  }

  return (
    <>
      <Helmet><title>Lệnh sản xuất</title></Helmet>
      <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title: 'Lệnh sản xuất' }]} />
      <ProductionOrderListShell>
        <ProductionOrderFilters
          filters={filters}
          loading={ordersLoading}
          onUpdateFilter={updateFilter}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        <div className="production-list-top-actions">
          <Pagination {...paginationProps} />
          <CustomButton
            title="Tạo mới"
            type="primary"
            icon={<PlusOutlined />}
            inRigth={false}
            onClick={openFlow}
          />
        </div>

        <ProductionOrderTable
          orders={orders}
          loading={ordersLoading}
          onView={record => openExistingOrder(record, 'view')}
          onEdit={record => openExistingOrder(record, 'edit')}
        />

        <div className="production-list-pagination-bottom">
          <Pagination {...paginationProps} />
        </div>
      </ProductionOrderListShell>
      <ProductionOrderDrawer
        open={open}
        drawerMode={drawerMode}
        step={step}
        pendingOrder={pendingOrder}
        savingOrder={savingOrder}
        waitingOrders={waitingOrders}
        waitingOrderLoading={waitingOrderLoading}
        onSearchWaitingOrders={searchWaitingOrders}
        onLoadMoreWaitingOrders={loadMoreWaitingOrders}
        onClose={closeFlow}
        onCancelOrder={cancelOrder}
        onNext={goToConfirmation}
        onBack={backToCreate}
        onConfirm={finishFlow}
      />
    </>
  )
}

export default ProductionOrderList
