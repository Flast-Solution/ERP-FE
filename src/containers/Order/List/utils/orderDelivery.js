export const groupOrderDeliveryStock = (order, history = []) => {
  const details = order?.orderDetails?.length ? order.orderDetails : order?.details ?? []
  const groups = new Map()
  history.forEach(item => {
    const detail = details.find(candidate => String(candidate.id ?? candidate.detailId) === String(item.orderDetailId))
    if (!detail || String(item.orderId) !== String(order.id) || item.warehouserProductId == null
      || item.stockId == null || !(Number(item.total) > 0) || String(item.productId) !== String(detail.productId)) return
    if (detail.skuId != null && String(item.skuId) !== String(detail.skuId)) return
    const key = [item.orderDetailId, item.productId, item.skuId, item.stockId, item.warehouserProductId].join(':')
    if (!groups.has(key)) groups.set(key, {
      key, orderDetailId: item.orderDetailId,
      detailCode: detail.code ?? detail.detailCode,
      productName: detail.productName,
      stockName: item.stockName,
      quantity: 0,
      inStocks: [],
      itemInStock: {
        id: item.warehouserProductId, orderId: order.id, skuId: item.skuId,
        product: { id: item.productId, name: detail.productName, code: detail.productCode, unit: detail.unit },
      },
    })
    const group = groups.get(key)
    group.inStocks.push(item)
    group.quantity += Number(item.total)
    group.itemInStock.total = group.quantity
  })
  return Array.from(groups.values())
}
