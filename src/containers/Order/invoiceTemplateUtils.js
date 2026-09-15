import { getActiveDocumentTemplates, parseDocumentTemplateData, resolveDocumentTemplateType } from '../../services/DocumentTemplateService'
import { buildQuotationPayload, restoreDocumentManualValues } from './List/utils/quotationMappers'

const object = value => value && typeof value === 'object' && !Array.isArray(value)
const parseConfig = value => {
  if (typeof value === 'string') {
    try {
      return parseConfig(JSON.parse(value))
    } catch {
      return {}
    }
  }
  return object(value) ? value : {}
}
const templateKey = templateId => String(templateId)

const getScopedConfig = (value, templateId) => {
  const config = parseConfig(value)
  if (object(config.invoiceTemplates)) {
    return parseConfig(config.invoiceTemplates[templateKey(templateId)])
  }
  return config
}

const scopeInvoiceOrder = (order, templateId) => ({
  ...order,
  quoteConfig: getScopedConfig(order.quoteConfig, templateId),
  details: (order.details || []).map(detail => ({
    ...detail,
    quoteConfig: getScopedConfig(detail.quoteConfig, templateId),
  })),
})

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

export const createInvoiceOrderFromResponse = (responseData, fallbackSource = {}) => {
  const payload = object(responseData) ? responseData : {}
  const fallbackOrder = createInvoiceOrder(fallbackSource)
  const responseOrder = object(payload.customerOrder)
    ? payload.customerOrder
    : object(payload.order) ? payload.order : {}
  const responseConfig = object(payload.config) ? payload.config : {}
  const responseDetails = Array.isArray(payload.details)
    ? payload.details
    : Array.isArray(payload.data) ? payload.data : undefined

  return createInvoiceOrder({
    customerOrder: {
      ...fallbackOrder,
      ...responseOrder,
      details: Array.isArray(responseOrder.details) ? responseOrder.details : fallbackOrder.details,
      quoteConfig: responseConfig.quoteConfig
        ?? responseOrder.quoteConfig
        ?? fallbackOrder.quoteConfig,
    },
    customer: object(payload.customer) ? payload.customer : fallbackOrder.customer,
    details: responseDetails,
  })
}

export const createInvoiceData = (source, template, templateId) => {
  const order = createInvoiceOrder(source)
  const customerOrder = templateId == null ? order : scopeInvoiceOrder(order, templateId)
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

export const buildInvoiceTemplatePayload = (document, originalOrder, approverId, approvalStatus) => {
  if (!document?.template || document.templateId == null) throw new Error('Mẫu hoá đơn không hợp lệ để lưu')
  const scopedOrder = scopeInvoiceOrder(originalOrder, document.templateId)
  const payload = buildInvoicePayload(document.data, document.template, scopedOrder, approverId, approvalStatus)
  const originalConfig = parseConfig(originalOrder.quoteConfig)
  const otherConfig = { ...originalConfig }
  delete otherConfig.invoiceTemplates
  delete otherConfig.templatesId
  return {
    ...payload,
    templateId: document.templateId,
    quoteConfig: {
      ...otherConfig,
      invoiceTemplates: {
        [templateKey(document.templateId)]: parseConfig(payload.quoteConfig),
      },
    },
  }
}
