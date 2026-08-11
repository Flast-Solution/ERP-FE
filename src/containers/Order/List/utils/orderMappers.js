export const clonePlainData = (value) => {
  if (value === undefined || value === null) {
    return value
  }

  try {
    return JSON.parse(JSON.stringify(value))
  } catch (error) {
    return null
  }
}

export const mapOrderDetailsForLotPage = (order) => (
  (order?.details || []).map(detail => ({
    orderDetailCode: detail.code,
    orderDetailId: detail.id,
    productId: detail.productId,
    productCode: detail.productCode || detail.product?.code,
    productName: detail.productName,
    name: detail.name,
    quantity: detail.quantity,
    skuId: detail.skuId,
    customerOrder: order,
  }))
)
