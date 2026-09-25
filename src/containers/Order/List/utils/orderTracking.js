const asArray = value => Array.isArray(value) ? value : []

const asNumber = value => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const sumBy = (items, selector) => asArray(items).reduce(
  (total, item) => total + asNumber(selector(item)),
  0
)

export const getOrderDetails = record => asArray(
  record?.orderDetails?.length ? record.orderDetails : record?.details
)

export const getWarehouseHistory = record => asArray(record?.warehouseHistory)

export const getWarehouseProducts = record => asArray(record?.warehouseProducts)

export const getShippingHistory = record => asArray(record?.shippingHistory)

export const getConfirmedShippingHistory = record => getShippingHistory(record)
  .filter(item => item?.submitType !== 'draft')

export const getOrderTrackingMetrics = record => {
  const details = getOrderDetails(record)
  const warehouseHistory = getWarehouseHistory(record)
  const warehouseProducts = getWarehouseProducts(record)
  const confirmedShipping = getConfirmedShippingHistory(record)
  const orderedQuantity = sumBy(details, item => item?.quantity)
  const receivedQuantity = sumBy(warehouseHistory, item => item?.quantity)
  // Backend quy ước `total` trên warehouseProducts là số lượng tồn hiện tại.
  const onHandQuantity = sumBy(warehouseProducts, item => item?.total)
  const outboundQuantity = sumBy(
    confirmedShipping,
    item => sumBy(item?.lots, lot => lot?.quantity)
  )
  const outboundVariance = outboundQuantity - orderedQuantity
  const remainingOutboundQuantity = Math.max(orderedQuantity - outboundQuantity, 0)
  const progress = orderedQuantity > 0
    ? Math.min(Math.round((outboundQuantity / orderedQuantity) * 100), 100)
    : 0

  return {
    detailCount: details.length,
    orderedQuantity,
    receivedQuantity,
    onHandQuantity,
    receiptCount: warehouseHistory.length,
    outboundCount: confirmedShipping.length,
    outboundQuantity,
    outboundVariance,
    remainingOutboundQuantity,
    progress,
  }
}

export const getLatestShipping = record => {
  const shippingHistory = getShippingHistory(record)
  if (shippingHistory.length === 0) return undefined

  return [...shippingHistory].sort((left, right) => (
    new Date(right.outboundDate).getTime() - new Date(left.outboundDate).getTime()
  ))[0]
}

export const getOrderUnit = record => {
  const units = Array.from(new Set(
    getOrderDetails(record).map(item => item?.unit).filter(Boolean)
  ))
  return units.length === 1 ? units[0] : ''
}

export const formatQuantity = (value, unit) => {
  const number = asNumber(value)
  const formatted = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 2,
  }).format(number)
  return unit ? `${formatted} ${unit}` : formatted
}

export const getSkuText = detail => asArray(detail?.skuDetails)
  .map(attribute => {
    const values = asArray(attribute?.values)
      .map(value => value?.text ?? value?.value)
      .filter(Boolean)
      .join(', ')
    return [attribute?.text, values].filter(Boolean).join(': ')
  })
  .filter(Boolean)
  .join(' · ')

export const getProductSummary = record => {
  const details = getOrderDetails(record)
  if (details.length === 0) return 'Chưa có sản phẩm'
  const first = details[0]
  const firstLabel = [first?.productName, first?.productCode].filter(Boolean).join(' - ')
  return details.length > 1 ? `${firstLabel} (+${details.length - 1})` : firstLabel
}

export const normalizeTrackingResponse = payload => {
  const content = asArray(payload?.content)
  const pageInfo = payload?.pageInfo ?? {}

  return {
    embedded: content.map((item, index) => {
      const order = item?.order ?? {}
      const details = asArray(item?.orderDetails?.length
        ? item.orderDetails
        : order?.orderDetails ?? order?.details)

      return {
        ...order,
        details,
        orderDetails: details,
        warehouseHistory: asArray(item?.warehouseHistory),
        warehouseProducts: asArray(item?.warehouseProducts),
        warehouseParcels: asArray(item?.warehouseParcels),
        shippingHistory: asArray(item?.shippingHistory),
        _trackingRowKey: `${order?.id ?? order?.code ?? 'order'}-${index}`,
      }
    }),
    page: {
      totalElements: asNumber(pageInfo?.total ?? pageInfo?.totalElements),
      total: asNumber(pageInfo?.totalPages),
      pageSize: asNumber(pageInfo?.limit),
    },
  }
}
