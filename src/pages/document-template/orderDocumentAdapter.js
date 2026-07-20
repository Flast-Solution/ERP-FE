import { COMPONENT_TYPES } from '@/components/DocumentTemplateEditor/constants'
import { createDocumentNode, createEmptyTemplate } from '@/components/DocumentTemplateEditor'

export const ORDER_DOCUMENT_SCHEMA = [
  { group: 'Đơn hàng', label: 'Mã đơn hàng', path: 'order.code', dataType: 'string' },
  { group: 'Đơn hàng', label: 'Ngày tạo', path: 'order.createdAt', dataType: 'date' },
  { group: 'Đơn hàng', label: 'Tạm tính', path: 'order.subtotal', dataType: 'number' },
  { group: 'Đơn hàng', label: 'Giảm giá', path: 'order.priceOff', dataType: 'number' },
  { group: 'Đơn hàng', label: 'Phí vận chuyển', path: 'order.shippingCost', dataType: 'number' },
  { group: 'Đơn hàng', label: 'Tổng thanh toán', path: 'order.total', dataType: 'number' },
  { group: 'Đơn hàng', label: 'Đã thanh toán', path: 'order.paid', dataType: 'number' },
  { group: 'Khách hàng', label: 'Tên khách hàng', path: 'customer.name', dataType: 'string' },
  { group: 'Khách hàng', label: 'Số điện thoại', path: 'customer.mobile', dataType: 'string' },
  { group: 'Khách hàng', label: 'Email', path: 'customer.email', dataType: 'string' },
  { group: 'Khách hàng', label: 'Địa chỉ', path: 'customer.address', dataType: 'string' },
  { group: 'Chi tiết đơn hàng', label: 'Tên sản phẩm', path: 'items.name', relativePath: 'name', scope: 'items', dataType: 'string' },
  { group: 'Chi tiết đơn hàng', label: 'Mã SKU', path: 'items.skuCode', relativePath: 'skuCode', scope: 'items', dataType: 'string' },
  { group: 'Chi tiết đơn hàng', label: 'Số lượng', path: 'items.quantity', relativePath: 'quantity', scope: 'items', dataType: 'number' },
  { group: 'Chi tiết đơn hàng', label: 'Đơn giá', path: 'items.price', relativePath: 'price', scope: 'items', dataType: 'number' },
  { group: 'Chi tiết đơn hàng', label: 'Thành tiền', path: 'items.total', relativePath: 'total', scope: 'items', dataType: 'number' },
]

const numberOrZero = value => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

/** Maps the order API contract to the stable document data contract. */
export const mapOrderToDocumentData = ({ order = {}, customer = {}, details = [] } = {}) => ({
  order: {
    id: order.id,
    code: order.code ?? '',
    createdAt: order.createdAt ?? null,
    subtotal: numberOrZero(order.subtotal),
    priceOff: numberOrZero(order.priceOff),
    shippingCost: numberOrZero(order.shippingCost),
    total: numberOrZero(order.total),
    paid: numberOrZero(order.paid),
  },
  customer: {
    id: customer.id ?? order.customerId,
    name: customer.name ?? order.customerReceiverName ?? '',
    mobile: customer.mobile ?? order.customerMobilePhone ?? '',
    email: customer.email ?? order.customerEmail ?? '',
    address: customer.address ?? order.customerAddress ?? '',
  },
  items: (Array.isArray(details) ? details : []).map(detail => ({
    id: detail.detailId ?? detail.id ?? detail.key,
    name: detail.productName ?? detail.name ?? '',
    skuCode: detail.skuDetailCode ?? detail.skuCode ?? '',
    quantity: numberOrZero(detail.quantity),
    price: numberOrZero(detail.price),
    total: numberOrZero(detail.totalPrice),
  })),
})

export const createQuotationTemplate = () => {
  const template = createEmptyTemplate({ name: 'Mẫu báo giá', documentType: 'QUOTATION' })
  const title = createDocumentNode(COMPONENT_TYPES.TEXT, ORDER_DOCUMENT_SCHEMA)
  const orderCode = createDocumentNode(COMPONENT_TYPES.DATA_FIELD, ORDER_DOCUMENT_SCHEMA)
  const customerName = createDocumentNode(COMPONENT_TYPES.DATA_FIELD, ORDER_DOCUMENT_SCHEMA)
  const customerAddress = createDocumentNode(COMPONENT_TYPES.DATA_FIELD, ORDER_DOCUMENT_SCHEMA)
  const table = createDocumentNode(COMPONENT_TYPES.TABLE, ORDER_DOCUMENT_SCHEMA)
  const total = createDocumentNode(COMPONENT_TYPES.DATA_FIELD, ORDER_DOCUMENT_SCHEMA)
  const signature = createDocumentNode(COMPONENT_TYPES.SIGNATURE, ORDER_DOCUMENT_SCHEMA)

  return {
    ...template,
    nodes: [
      {
        ...title,
        content: 'BÁO GIÁ',
        style: { ...title.style, fontSize: 26, fontWeight: 700, textAlign: 'center', marginBottom: 24 },
      },
      { ...orderCode, label: 'Mã đơn hàng', binding: 'order.code', layout: { ...orderCode.layout, columnSpan: 6 } },
      { ...customerName, label: 'Khách hàng', binding: 'customer.name', layout: { ...customerName.layout, columnSpan: 6 } },
      { ...customerAddress, label: 'Địa chỉ', binding: 'customer.address' },
      {
        ...table,
        columns: table.columns.map(column => ({
          ...column,
          format: ['price', 'total'].includes(column.binding) ? 'currency' : column.format,
        })),
      },
      {
        ...total,
        label: 'Tổng cộng',
        binding: 'order.total',
        format: 'currency',
        style: { ...total.style, fontSize: 16, fontWeight: 700, textAlign: 'right', marginBottom: 28 },
      },
      signature,
    ],
  }
}

export const resolveOrderDocumentSource = (response, navigationOrder) => {
  if (response?.order) {
    return {
      order: response.order,
      customer: response.customer ?? {},
      details: response.data ?? [],
    }
  }

  return {
    order: navigationOrder ?? {},
    customer: navigationOrder?.customer ?? {},
    details: navigationOrder?.details ?? [],
  }
}
