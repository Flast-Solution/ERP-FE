import React, { useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Modal, Table, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { BreadcrumbCustom, CustomButton } from '@flast-erp/core/components'
import { RequestUtils } from '@flast-erp/core/utils'
import CreateOrder from './CreateOrder'
import BomConfirmation from './BomConfirmation'

const columns = [
  { title: 'Mã lệnh SX', dataIndex: 'productionOrderCode', key: 'productionOrderCode' },
  { title: 'Đơn hàng', dataIndex: 'salesOrderId', key: 'salesOrderId' },
  { title: 'Khách hàng', dataIndex: 'customerName', key: 'customerName' },
  { title: 'Loại vải', dataIndex: 'fabricType', key: 'fabricType' },
  { title: 'Số mét cần SX', dataIndex: 'quantityMeters', key: 'quantityMeters', align: 'right' },
  { title: 'Trạng thái', dataIndex: 'statusLabel', key: 'statusLabel' },
]

const ProductionOrderList = () => {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [pendingOrder, setPendingOrder] = useState(null)
  const [orders, setOrders] = useState([])
  const [waitingOrders, setWaitingOrders] = useState([])
  const [waitingOrderTotal, setWaitingOrderTotal] = useState(0)
  const [waitingOrderLoading, setWaitingOrderLoading] = useState(false)
  const waitingOrderLoadingRef = useRef(false)

  const fetchWaitingOrders = async ({ page = 1, reset = false } = {}) => {
    if (waitingOrderLoadingRef.current) return

    waitingOrderLoadingRef.current = true
    setWaitingOrderLoading(true)
    try {
      const response = await RequestUtils.Get('/erp/order/fetch', {
        limit: 10,
        page,
        type: 'cohoi',
        code: 'OVGY1326FJM',
      })
      const embedded = response?.data?.embedded ?? []
      const totalElements = Number(response?.data?.page?.totalElements ?? embedded.length)
      setWaitingOrders(current => reset ? embedded : [
        ...current,
        ...embedded.filter(item => !current.some(existing => String(existing.id) === String(item.id))),
      ])
      setWaitingOrderTotal(totalElements)
    } finally {
      waitingOrderLoadingRef.current = false
      setWaitingOrderLoading(false)
    }
  }

  const openFlow = () => {
    setWaitingOrders([])
    setWaitingOrderTotal(0)
    fetchWaitingOrders({ page: 1, reset: true }).catch(() => undefined)
    setPendingOrder(null)
    setStep(1)
    setOpen(true)
  }

  const closeFlow = () => {
    setOpen(false)
    setStep(1)
    setPendingOrder(null)
  }

  const cancelOrder = () => {
    Modal.confirm({
      title: 'Hủy lệnh sản xuất?',
      content: 'Thông tin lệnh và xác nhận vật tư đang nhập sẽ bị hủy.',
      okText: 'Hủy lệnh',
      okButtonProps: { danger: true },
      cancelText: 'Tiếp tục xác nhận',
      onOk: closeFlow,
    })
  }

  const finishFlow = ({ productionOrder }) => {
    setOrders(current => [
      { ...productionOrder, id: Date.now(), statusLabel: 'Đã xác nhận vật tư' },
      ...current,
    ])
    message.success('Đã tạo lệnh sản xuất và xác nhận vật tư.')
    closeFlow()
  }

  return (
    <>
      <Helmet><title>Lệnh sản xuất</title></Helmet>
      <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title: 'Sản xuất' }, { title: 'Lệnh sản xuất' }]} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <CustomButton title="Tạo lệnh sản xuất" type="primary" icon={<PlusOutlined />} inRigth={false} onClick={openFlow} />
      </div>
      <Table
        bordered
        rowKey="id"
        columns={columns}
        dataSource={orders}
        locale={{ emptyText: 'Chưa có lệnh sản xuất' }}
        scroll={{ x: 900 }}
      />
      <Modal
        open={open}
        title={null}
        footer={null}
        width="100vw"
        style={{ top: 0, maxWidth: '100vw', paddingBottom: 0 }}
        destroyOnHidden
        onCancel={step === 2 ? cancelOrder : closeFlow}
        styles={{
          content: { minHeight: '100vh', borderRadius: 0, padding: 0 },
          body: { height: '100vh', padding: 0, overflowY: 'auto' },
        }}
      >
        {step === 1 ? (
          <CreateOrder
            initialValues={pendingOrder}
            waitingOrders={waitingOrders}
            waitingOrderLoading={waitingOrderLoading}
            onLoadMoreWaitingOrders={() => {
              if (waitingOrders.length < waitingOrderTotal) {
                fetchWaitingOrders({ page: Math.floor(waitingOrders.length / 10) + 1 }).catch(() => undefined)
              }
            }}
            onCancel={closeFlow}
            onNext={(values) => {
              setPendingOrder(values)
              setStep(2)
            }}
          />
        ) : (
          <BomConfirmation
            productionOrder={pendingOrder}
            onBack={() => setStep(1)}
            onCancel={cancelOrder}
            onConfirm={finishFlow}
          />
        )}
      </Modal>
    </>
  )
}

export default ProductionOrderList
