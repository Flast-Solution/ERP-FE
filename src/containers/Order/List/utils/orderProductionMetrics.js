import { getOrderDetails, getManufactureProducts } from './orderTracking'
import { matchesProductionDetail } from './productionDetailMatch'
import { buildLotDetailRows } from './orderDetailLots'

const number = value => Number.isFinite(Number(value)) ? Number(value) : 0

export const getUniqueProductionLots = rows => {
  const lots = new Map()
  rows.forEach(row => {
    const code = String(row.code_lot ?? '').trim()
    const key = code ? `${row._instanceId}:${code}` : row._rowKey
    const previous = lots.get(key)
    const time = new Date(row._submittedAt).getTime() || 0
    const previousTime = new Date(previous?._submittedAt).getTime() || 0
    if (!previous || time > previousTime || (time === previousTime && number(row._submissionId) >= number(previous._submissionId))) {
      lots.set(key, row)
    }
  })
  return [...lots.values()]
}

export const attachOrderProductionMetrics = (order, productionInstances, previews, error = '') => {
  const details = Array.isArray(order.details) ? order.details : getOrderDetails(order)
  const productionDetails = getManufactureProducts(order).flatMap(product => product.details || [])
  const enrichedDetails = details.map(detail => {
    const id = detail.id ?? detail.detailId
    const instances = productionInstances.filter(instance => String(instance.entityId) === String(id))
    const missing = error || id == null || instances.some(instance => !previews.has(String(instance.id)))
    const lots = missing ? undefined : getUniqueProductionLots(instances.flatMap(instance => (
      buildLotDetailRows(previews.get(String(instance.id)), instance.id)
    )))
    const plannedProductionQuantity = productionDetails.filter(production => matchesProductionDetail(production, detail, details))
      .reduce((sum, production) => sum + number(production.target), 0)
    const producedQuantity = lots?.reduce((sum, lot) => sum + Math.max(number(lot.so_luong), 0), 0)
    return { ...detail, productionWorkflowInstances: instances, _productionLots: lots,
      _productionMetrics: { plannedProductionQuantity, producedQuantity,
        remainingProductionQuantity: producedQuantity == null ? undefined : plannedProductionQuantity - producedQuantity,
        error: missing ? error || 'Chưa tải được dữ liệu lot sản xuất.' : '' } }
  })
  const available = enrichedDetails.every(detail => detail._productionMetrics.producedQuantity != null)
  const producedQuantity = available ? enrichedDetails.reduce((sum, detail) => sum + detail._productionMetrics.producedQuantity, 0) : undefined
  const planned = productionDetails.reduce((sum, detail) => sum + number(detail.target), 0)
  return { ...order, details: enrichedDetails, ...(order.orderDetails ? { orderDetails: enrichedDetails } : {}),
    _productionMetrics: { producedQuantity, remainingProductionQuantity: producedQuantity == null ? undefined : planned - producedQuantity,
      error: available ? '' : error || 'Chưa tải được dữ liệu lot sản xuất.' } }
}
