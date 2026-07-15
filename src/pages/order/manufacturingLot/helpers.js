import moment from 'moment'

import { DEFAULT_LOT_VALUES } from './constants'

export const normalizeOrderDetail = (detail = {}, index) => ({
  ...detail,
  key: detail.orderDetailId ?? detail.id ?? detail.code ?? index,
  orderDetailId: detail.orderDetailId ?? detail.id,
  orderDetailCode: detail.orderDetailCode ?? detail.code,
  productCode: detail.productCode ?? detail.product?.code,
  productName: detail.productName ?? detail.product?.name ?? detail.name,
  quantity: Number(detail.quantity ?? 0),
})

export const normalizeOrderDetails = (details = []) => (
  (details ?? []).map(normalizeOrderDetail)
)

export const getDetailTotal = (detail = {}) => Number(
  detail.totalPrice
  ?? detail.total
  ?? ((Number(detail.price ?? 0) * Number(detail.quantity ?? 0)) - Number(detail.discountAmount ?? 0))
  ?? 0,
)

export const getOrderSubtotal = (order = {}, details = []) => Number(
  order.subtotal
  ?? order.total
  ?? details.reduce((sum, detail) => sum + getDetailTotal(detail), 0),
)

export const buildDetailDescription = (detail = {}) => {
  const skuDetails = detail.mSkuDetails ?? detail.skuDetails ?? []
  if (!Array.isArray(skuDetails) || skuDetails.length === 0) {
    return detail.description || ''
  }

  return skuDetails
    .map(item => `${item.name || item.title || ''}: ${item.value || item.text || ''}`.trim())
    .filter(Boolean)
    .join(' ')
}

export const normalizeCompareText = value => String(value ?? '').trim().toLowerCase()

export const getLotDetailRef = (lot = {}) => lot.orderDetailId

export const lotMatchesOrderDetail = (lot = {}, detail = {}) => {
  const lotRef = getLotDetailRef(lot)
  const detailRefs = [
    detail.key,
    detail.orderDetailId,
    detail.orderDetailCode,
  ].map(value => String(value ?? '')).filter(Boolean)

  if (lotRef && detailRefs.includes(String(lotRef))) {
    return true
  }

  const lotCode = normalizeCompareText(lot.code)
  const detailCode = normalizeCompareText(detail.orderDetailCode)
  if (lotCode && detailCode && (lotCode === detailCode || lotCode.startsWith(detailCode))) {
    return true
  }

  const lotName = normalizeCompareText(lot.name)
  const productName = normalizeCompareText(detail.productName)
  return Boolean(lotName && productName && lotName === productName)
}

export const buildInitialLotValues = (lot, orderDetails = []) => {
  if (!lot?.id && !lot?.code && !lot?.name) {
    return { ...DEFAULT_LOT_VALUES }
  }

  const lotDetailRef = getLotDetailRef(lot)
  const matchedDetail = orderDetails.find(detail => lotMatchesOrderDetail(lot, detail))

  return {
    id: lot.id,
    lotName: lot.name,
    lotCode: lot.code,
    orderDetailKey: matchedDetail?.key ?? lotDetailRef,
    quantity: lot.total,
    prviderId: lot.prviderId,
    workflowProcessId: lot.workflowProcessId ?? lot.processId ?? lot.workflowId ?? lot.process?.id ?? lot.workflowProcess?.id,
    plannedDate: lot.expectedDate ? moment(lot.expectedDate) : undefined,
    lotType: lot.type || DEFAULT_LOT_VALUES.lotType,
    priority: lot.priorityLevel || DEFAULT_LOT_VALUES.priority,
    note: lot.description,
  }
}

export const resolveProviderList = (response) => {
  const payload = response?.data ?? response
  const candidates = [
    payload?.embedded,
    payload?.data?.embedded,
    payload?.data?.content,
    payload?.data?.items,
    payload?.content,
    payload?.items,
    payload?.data,
    payload,
  ]

  return candidates.find(Array.isArray) ?? []
}

export const resolveOrderLots = (response) => {
  const payload = response?.data ?? response
  const candidates = [
    payload?.data,
    payload?.data?.embedded,
    payload?.data?.content,
    payload?.data?.items,
    payload?.embedded,
    payload?.content,
    payload?.items,
    payload,
  ]

  const arrayData = candidates.find(Array.isArray)
  if (arrayData) return arrayData

  const objectData = candidates.find(item => item && typeof item === 'object')
  if (objectData?.id || objectData?.code || objectData?.entityId) {
    return [objectData]
  }

  return []
}

export const resolveWorkflowList = (response) => {
  const payload = response?.data ?? response
  const candidates = [
    payload?.embedded,
    payload?.data?.embedded,
    payload?.data?.content,
    payload?.content,
    payload?.items,
    payload?.data,
    payload,
  ]

  return candidates.find(Array.isArray) ?? []
}

export const buildLotPayload = ({
  lot,
  customerOrder,
  selectedDetail,
}) => {
  const payload = {
    name: lot.lotName,
    code: lot.lotCode || null,
    entity: 'ORDER',
    entityId: customerOrder.id,
    orderDetailId: selectedDetail?.orderDetailId ?? null,
    orderDetailCode: selectedDetail?.orderDetailCode ?? null,
    type: lot.lotType || DEFAULT_LOT_VALUES.lotType,
    total: Number(lot.quantity ?? 0),
    prviderId: lot.prviderId ?? null,
    processId: lot.workflowProcessId ?? null,
    workflowProcessId: lot.workflowProcessId ?? null,
    expectedDate: lot.plannedDate
      ? moment(lot.plannedDate).format('YYYY-MM-DD HH:mm:ss')
      : null,
    priorityLevel: lot.priority || DEFAULT_LOT_VALUES.priority,
    description: lot.note || null,
  }

  if (lot.id) {
    payload.id = lot.id
  }

  return payload
}

export const calculateOrderSummary = (order, details) => {
  const subtotal = getOrderSubtotal(order, details)
  const vatPercent = Number(order?.vat ?? 0)
  const shippingCost = Number(order?.shippingCost ?? 0)
  const priceOff = Number(order?.priceOff ?? 0)
  const paid = Number(order?.paid ?? 0)
  const vatMoney = subtotal * vatPercent / 100
  const grandTotal = subtotal + vatMoney + shippingCost
  const remaining = grandTotal - paid - priceOff

  return {
    subtotal,
    vatPercent,
    shippingCost,
    priceOff,
    paid,
    vatMoney,
    grandTotal,
    remaining,
  }
}
