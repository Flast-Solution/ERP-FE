import { getActiveDocumentTemplates, parseDocumentTemplateData, resolveDocumentTemplateType } from '../../services/DocumentTemplateService'
import { buildQuotationPayload, restoreDocumentManualValues } from './List/utils/quotationMappers'

export const getInvoiceTemplates = records => getActiveDocumentTemplates(records, 'invoice', 'Mẫu hoá đơn')

export const parseInvoiceTemplate = record => {
  const template = parseDocumentTemplateData(record.data, 'Mẫu hoá đơn không hợp lệ')
  return { ...template, name: record.name || template.name, documentType: resolveDocumentTemplateType(record) }
}

export const createInvoiceOrder = ({ customerOrder = {}, customer, details }) => {
  const originalDetails = Array.isArray(customerOrder.details) ? customerOrder.details : []
  const detailsById = new Map(originalDetails.map(detail => [String(detail.id), detail]))
  return {
    ...customerOrder,
    details: Array.isArray(details) && details.length
      ? details.map(detail => {
        // view-on-edit uses detailId/key/totalPrice while the order entity uses
        // id/code/total. Merge by the actual detail ID and keep the canonical
        // discounted total used by document bindings (`details.total`).
        const id = detail.id ?? detail.detailId
        const original = detailsById.get(String(id))
        const calculatedTotal = detail.totalPrice == null
          ? undefined
          : Number(detail.totalPrice) - Number(detail.discountAmount ?? 0)
        return {
          ...original,
          ...detail,
          id: id ?? original?.id,
          code: detail.code ?? original?.code ?? detail.key ?? null,
          name: detail.name ?? original?.name ?? detail.orderName ?? null,
          total: detail.total ?? original?.total ?? calculatedTotal,
          priceOff: detail.priceOff ?? original?.priceOff ?? detail.discountAmount ?? 0,
          quoteConfig: detail.quoteConfig ?? original?.quoteConfig ?? null,
        }
      })
      : originalDetails,
    customer: {
      ...customerOrder.customer,
      ...customer,
    },
  }
}

export const createInvoiceData = (source, template) => {
  const customerOrder = createInvoiceOrder(source)
  return restoreDocumentManualValues({
    customerOrder,
    customer: {
      id: customerOrder.customerId,
      name: customerOrder.customerReceiverName,
      address: customerOrder.customerAddress,
      mobile: customerOrder.customerMobilePhone,
      email: customerOrder.customerEmail,
      ...customerOrder.customer,
    },
  }, template)
}

export const buildInvoicePayload = (data, template, originalOrder, approverId, approvalStatus) => (
  buildQuotationPayload(data, template, originalOrder, approverId, approvalStatus, 'invoice')
)
