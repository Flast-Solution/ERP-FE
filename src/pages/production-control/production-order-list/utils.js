import dayjs from 'dayjs'
import { MANUFACTURE_STATUS_MAP, PRODUCTION_PAGE_SIZE } from './constants'

export const formatListDate = (value) => {
  if (!value) return '-'
  if (typeof value?.format === 'function') return value.format('DD/MM/YYYY')
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('vi-VN')
}

export const formatManufactureDate = (value) => {
  if (!value) return undefined
  if (typeof value?.format === 'function') return value.format('YYYY-MM-DD HH:mm:ss')
  return value
}

export const buildProductionOrderQuery = (searchFilters = {}, page = 1) => {
  const params = new URLSearchParams({
    limit: String(PRODUCTION_PAGE_SIZE),
    page: String(page),
  })

  const code = String(searchFilters.code ?? '').trim()
  const orderCode = String(searchFilters.orderCode ?? '').trim()
  if (code) params.set('code', code)
  if (orderCode) params.set('orderCode', orderCode)
  if (searchFilters.status !== undefined && searchFilters.status !== null) {
    params.set('status', String(searchFilters.status))
  }

  const [dateStart, dateEnd] = searchFilters.dateRange ?? []
  if (dateStart) params.set('dateStart', dateStart.startOf('day').format('YYYY-MM-DD HH:mm:ss'))
  if (dateEnd) params.set('dateEnd', dateEnd.endOf('day').format('YYYY-MM-DD HH:mm:ss'))

  return params
}

export const buildManufacturePayload = ({ productionOrder = {}, materialConfirmation = {}, isEdit }) => {
  const productDetails = productionOrder.productDetails ?? {}
  const orderDetails = productionOrder.orderDetails ?? []
  const deadlines = Object.values(productDetails)
    .map(detail => detail?.deadline)
    .filter(Boolean)
  const latestDeadline = deadlines
    .map(deadline => ({ raw: deadline, time: new Date(formatManufactureDate(deadline)).getTime() }))
    .sort((left, right) => right.time - left.time)[0]?.raw

  const code = productionOrder.productionOrderCode ?? productionOrder.code
  const details = orderDetails.map((product, index) => {
    const detailKey = String(product.id ?? index)
    const detailValues = productDetails[detailKey] ?? {}
    const target = Number(detailValues.target ?? product.target ?? 0)
    const unitPrice = Number(product.unitPrice ?? product.price ?? 0)

    return {
      productId: product.productId,
      target,
      unitPrice,
      totalPrice: Number(detailValues.totalPrice ?? (target * unitPrice)),
    }
  })

  return {
    manufactureProduct: {
      ...(isEdit ? { id: productionOrder.id } : {}),
      code,
      orderCode: productionOrder.salesOrderCode ?? productionOrder.orderCode,
      typeOrder: productionOrder.typeOrder ?? 'PRODUCTION',
      dateStart: formatManufactureDate(productionOrder.dateStart) ?? null,
      dateEnd: formatManufactureDate(productionOrder.dateEnd ?? latestDeadline) ?? null,
      note: productionOrder.note ?? null,
      status: productionOrder.manufactureStatus
        ?? (typeof productionOrder.status === 'number' ? productionOrder.status : 0),
      priceStandard: productionOrder.priceStandard ?? null,
      priceReal: productionOrder.priceReal ?? null,
      material: productionOrder.material ?? null,
      confirmedBy: materialConfirmation.confirmedBy ?? productionOrder.confirmedBy ?? null,
      details,
    },
    materialOutbounds: (materialConfirmation.allocations ?? []).map(allocation => ({
      warehouseId: allocation.warehouseId,
      manufactureCode: code,
      materialId: allocation.materialId,
      quantity: Number(allocation.quantity ?? 0),
      width: Number(allocation.width ?? 0),
      height: Number(allocation.height ?? 0),
    })),
  }
}

export const mapManufactureOrder = (record) => {
  const order = record?.order
  const orderDetails = Array.isArray(order?.details) ? order.details : []
  const manufactureDetails = Array.isArray(record?.details) ? record.details : []
  const usedOrderDetailIds = new Set()
  const editingOrderDetails = manufactureDetails.map((detail, index) => {
    const orderDetail = orderDetails.find(item => (
      !usedOrderDetailIds.has(String(item.id))
      && String(item.productId) === String(detail.productId)
    ))
    if (orderDetail?.id != null) usedOrderDetailIds.add(String(orderDetail.id))

    const target = detail.target ?? 0
    const unitPrice = detail.unitPrice ?? orderDetail?.price ?? 0

    return {
      ...orderDetail,
      id: orderDetail?.id ?? `manufacture-${detail.id ?? index}`,
      manufactureDetailId: detail.id,
      productId: detail.productId,
      productName: orderDetail?.productName ?? `Sản phẩm #${detail.productId}`,
      skuId: detail.skuId ?? orderDetail?.skuId ?? null,
      skuDetails: detail.skuDetails ?? orderDetail?.skuDetails ?? [],
      target: Number(target),
      price: Number(unitPrice),
      total: Number(detail.totalPrice ?? orderDetail?.total ?? (Number(target) * Number(unitPrice))),
      bomProductId: detail.bomProductId,
      bomProduct: detail.bomProduct,
    }
  })
  const effectiveOrderDetails = manufactureDetails.length > 0 ? editingOrderDetails : orderDetails
  const editDeadline = record?.dateEnd && dayjs(record.dateEnd).isValid()
    ? dayjs(record.dateEnd)
    : undefined

  return {
    ...record,
    productionOrderCode: record?.code,
    salesOrderCode: record?.orderCode,
    salesOrderId: order?.id,
    customerName: order?.customerReceiverName,
    createdAt: record?.createdDate,
    dateStart: record?.dateStart && dayjs(record.dateStart).isValid() ? dayjs(record.dateStart) : undefined,
    dateEnd: editDeadline,
    orderDetails: effectiveOrderDetails,
    manufactureDetails,
    productDetails: Object.fromEntries(effectiveOrderDetails.map(detail => [
      String(detail?.id),
      {
        target: detail?.target ?? 0,
        deadline: editDeadline,
      },
    ])),
    manufactureStatus: record?.status,
    confirmedBy: record?.confirmedBy ?? null,
    status: MANUFACTURE_STATUS_MAP[record?.status] ?? 'new',
  }
}

export const getProductionQuantity = (record) => Object.values(record?.productDetails ?? {})
  .reduce((total, detail) => total + Number(detail?.target ?? 0), 0)

export const getProductionDeadline = (record) => Object.values(record?.productDetails ?? {})
  .map(detail => detail?.deadline)
  .find(Boolean)

export const getBomVersions = (record) => [...new Set(
  (record?.manufactureDetails ?? record?.details ?? [])
    .map(detail => detail?.bomProduct?.version)
    .filter(Boolean),
)]

export const getProductLabel = (record) => {
  const productNames = [...new Set((record?.orderDetails ?? [])
    .map(detail => detail?.productName)
    .filter(Boolean))]
  if (productNames.length === 0) return '-'
  return productNames.length === 1
    ? productNames[0]
    : `${productNames[0]} +${productNames.length - 1}`
}
