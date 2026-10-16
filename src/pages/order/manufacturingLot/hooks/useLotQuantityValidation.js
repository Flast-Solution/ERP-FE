import { useCallback } from 'react'

export const useLotQuantityValidation = ({
  orderDetails,
}) => {
  const getSelectedDetail = useCallback((detailKey) => (
    orderDetails.find(detail => String(detail.key) === String(detailKey))
  ), [orderDetails])

  const validateLotQuantity = useCallback(() => async (_, value) => {
    if (value == null || value === '') return
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
      throw new Error('Số lượng trong lô phải lớn hơn 0.')
    }
  }, [])

  return {
    getSelectedDetail,
    validateLotQuantity,
  }
}
