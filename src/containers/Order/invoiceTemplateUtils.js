import { getActiveDocumentTemplates, parseDocumentTemplateData, resolveDocumentTemplateType } from '../../services/DocumentTemplateService'

export const getInvoiceTemplates = records => getActiveDocumentTemplates(records, 'invoice', 'Mẫu hoá đơn')

export const parseInvoiceTemplate = record => {
  const template = parseDocumentTemplateData(record.data, 'Mẫu hoá đơn không hợp lệ')
  return { ...template, name: record.name || template.name, documentType: resolveDocumentTemplateType(record) }
}

export const createInvoiceData = ({ customerOrder = {}, customer, details }) => {
  const originalDetails = Array.isArray(customerOrder.details) ? customerOrder.details : []
  const detailsById = new Map(originalDetails.map(detail => [String(detail.id), detail]))
  return {
    customerOrder: {
      ...customerOrder,
      details: Array.isArray(details) && details.length
        ? details.map(detail => ({ ...detailsById.get(String(detail.id)), ...detail }))
        : originalDetails,
    },
    customer: {
      id: customerOrder.customerId,
      name: customerOrder.customerReceiverName,
      address: customerOrder.customerAddress,
      mobile: customerOrder.customerMobilePhone,
      email: customerOrder.customerEmail,
      ...customerOrder.customer,
      ...customer,
    },
  }
}
