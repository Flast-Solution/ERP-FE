import { useCallback, useState } from 'react'
import { Modal, message } from 'antd'
import { RequestUtils } from '@flast-erp/core/utils'
import { MANUFACTURE_SAVE_API } from '../constants'
import { buildManufacturePayload } from '../utils'

export const useProductionOrderFlow = ({
  resetWaitingOrders,
  reloadWaitingOrders,
  onSaved,
}) => {
  const [open, setOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('create')
  const [step, setStep] = useState(1)
  const [pendingOrder, setPendingOrder] = useState(null)
  const [savingOrder, setSavingOrder] = useState(false)

  const openFlow = useCallback(() => {
    setDrawerMode('create')
    resetWaitingOrders([])
    reloadWaitingOrders()
    setPendingOrder(null)
    setStep(1)
    setOpen(true)
  }, [reloadWaitingOrders, resetWaitingOrders])

  const openExistingOrder = useCallback((record, mode) => {
    setDrawerMode(mode)
    setPendingOrder(record)
    setStep(1)
    resetWaitingOrders(record?.order ? [record.order] : [])
    setOpen(true)

    if (mode === 'edit') {
      reloadWaitingOrders()
    }
  }, [reloadWaitingOrders, resetWaitingOrders])

  const closeFlow = useCallback(() => {
    setOpen(false)
    setDrawerMode('create')
    setStep(1)
    setPendingOrder(null)
  }, [])

  const cancelOrder = useCallback(() => {
    Modal.confirm({
      title: 'Hủy lệnh sản xuất?',
      content: 'Thông tin lệnh và xác nhận vật tư đang nhập sẽ bị hủy.',
      okText: 'Hủy lệnh',
      okButtonProps: { danger: true },
      cancelText: 'Tiếp tục xác nhận',
      onOk: closeFlow,
    })
  }, [closeFlow])

  const goToConfirmation = useCallback((values) => {
    setPendingOrder(values)
    setStep(2)
  }, [])

  const backToCreate = useCallback(() => setStep(1), [])

  const finishFlow = useCallback(async ({ productionOrder, materialConfirmation }) => {
    const isEdit = drawerMode === 'edit'
    const payload = buildManufacturePayload({ productionOrder, materialConfirmation, isEdit })

    setSavingOrder(true)
    try {
      const response = await RequestUtils.Post(MANUFACTURE_SAVE_API, payload)
      const isSuccess = response?.errorCode === 200 || response?.success
      if (!isSuccess) {
        message.error(response?.message || (isEdit
          ? 'Cập nhật lệnh sản xuất thất bại.'
          : 'Tạo lệnh sản xuất thất bại.'))
        return
      }

      message.success(response?.message || (isEdit
        ? 'Đã cập nhật lệnh sản xuất.'
        : 'Đã tạo lệnh sản xuất.'))
      closeFlow()
      await onSaved?.()
    } catch (error) {
      message.error(error?.message || (isEdit
        ? 'Cập nhật lệnh sản xuất thất bại.'
        : 'Tạo lệnh sản xuất thất bại.'))
    } finally {
      setSavingOrder(false)
    }
  }, [closeFlow, drawerMode, onSaved])

  return {
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
  }
}
