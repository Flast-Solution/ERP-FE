import { useCallback } from 'react'

import { lotMatchesOrderDetail } from '../helpers'

export const useLotQuantityValidation = ({
  form,
  orderDetails,
  createdLots,
}) => {
  const getSelectedDetail = useCallback((detailKey) => (
    orderDetails.find(detail => String(detail.key) === String(detailKey))
  ), [orderDetails])

  const getCreatedQuantityByDetail = useCallback((detail, currentLotId) => {
    if (!detail) return 0

    return createdLots.reduce((sum, lot) => {
      if (currentLotId && String(lot?.id) === String(currentLotId)) {
        return sum
      }

      if (!lotMatchesOrderDetail(lot, detail)) {
        return sum
      }

      return sum + Number(lot?.total ?? lot?.quantity ?? 0)
    }, 0)
  }, [createdLots])

  const validateLotQuantity = useCallback((fieldIndex) => async (_, value) => {
    const lot = form.getFieldValue(['lots', fieldIndex]) ?? {}
    const detail = getSelectedDetail(lot.orderDetailKey)

    if (!detail) {
      return Promise.resolve()
    }

    const quantity = Number(value ?? 0)
    const detailQuantity = Number(detail.quantity ?? 0)
    if (quantity > detailQuantity) {
      return Promise.reject(new Error(`Số lượng trong lô không được lớn hơn ${detailQuantity}.`))
    }

    const createdQuantity = getCreatedQuantityByDetail(detail, lot.id)

    const draftLots = form.getFieldValue('lots') ?? []
    const draftQuantity = draftLots.reduce((sum, draftLot) => {
      if (String(draftLot?.orderDetailKey ?? '') !== String(lot.orderDetailKey ?? '')) {
        return sum
      }
      return sum + Number(draftLot?.quantity ?? 0)
    }, 0)

    const totalQuantity = createdQuantity + draftQuantity

    if (totalQuantity > detailQuantity) {
      const remainingQuantity = Math.max(detailQuantity - createdQuantity, 0)
      return Promise.reject(new Error(
        `Sản phẩm này còn lại ${remainingQuantity}. Tổng số lượng tạo lô không được lớn hơn ${detailQuantity}.`,
      ))
    }

    return Promise.resolve()
  }, [form, getCreatedQuantityByDetail, getSelectedDetail])

  return {
    getSelectedDetail,
    validateLotQuantity,
  }
}
