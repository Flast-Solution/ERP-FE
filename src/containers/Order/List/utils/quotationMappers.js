import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import set from 'lodash/set'
import { QUOTATION_APPROVAL_STATUS } from '../constants'
import { getHtmlManualDefaults, getHtmlManualPaths } from '../../../../components/DocumentTemplateEditor/html/model'

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

const parseQuoteConfig = value => {
  if (typeof value === 'string') {
    try {
      return parseQuoteConfig(JSON.parse(value))
    } catch {
      return {}
    }
  }
  return isObject(value) ? value : {}
}

const isSafePath = path => path && !path.split('.').some(
  key => ['__proto__', 'constructor', 'prototype'].includes(key),
)

// Use the same bindings as the viewer, including fields inside nested containers.
const getManualPaths = (template, data) => {
  const paths = new Set(getHtmlManualPaths(template, data))
  const visit = nodes => (nodes ?? []).forEach(node => {
    if (node.type === 'dynamicTable') {
      const rows = get(data, node.source)
      if (Array.isArray(rows)) {
        rows.forEach((row, index) => (node.columns ?? []).forEach(column => {
          if (column.inputMode === 'manual' && column.binding) {
            paths.add(`${node.source}.${index}.${column.binding}`)
          }
        }))
      }
    }
    if (node.type === 'richText') {
      const tokens = String(node.content ?? '').matchAll(/{{\s*input(?:-list)?:([^{}]+?)\s*}}/g)
      for (const token of tokens) paths.add(token[1].trim())
    }
    visit(node.children)
  })
  visit(template?.nodes)
  return [...paths].filter(isSafePath)
}

const getFieldOwner = (data, path) => {
  const detailMatch = path.match(/^customerOrder\.details\.(\d+)\.(.+)$/)
  if (detailMatch) {
    return { detail: data.customerOrder?.details?.[Number(detailMatch[1])], key: detailMatch[2] }
  }
  return { detail: null, key: path }
}

// manualValues is a path -> JSON value map. Detail configs are stored by detail
// ID inside the order-level quoteConfig so details[] never needs quoteConfig.
export const createQuotationData = (customerOrder, template) => {
  const data = cloneDeep({
    customerOrder,
    customer: {
      name: customerOrder?.customerReceiverName,
      address: customerOrder?.customerAddress,
      mobile: customerOrder?.customerMobilePhone,
      email: customerOrder?.customerEmail,
      ...customerOrder?.customer,
    },
  })
  return restoreDocumentManualValues(data, template)
}

export const restoreDocumentManualValues = (source, template) => {
  const data = cloneDeep(source)
  const orderConfig = parseQuoteConfig(data.customerOrder?.quoteConfig)
  if (isObject(orderConfig.sheetTables)) data.sheetTables = cloneDeep(orderConfig.sheetTables)
  const defaults = getHtmlManualDefaults(template, data)
  getManualPaths(template, data).forEach(path => {
    const { detail, key } = getFieldOwner(data, path)
    const detailId = detail?.id == null ? null : String(detail.id)
    const hasOrderDetailConfig = detailId !== null && isObject(orderConfig.details)
      && hasOwn(orderConfig.details, detailId)
    const config = detail === null
      ? orderConfig
      : hasOrderDetailConfig
        ? parseQuoteConfig(orderConfig.details[detailId])
        : parseQuoteConfig(detail?.quoteConfig)
    // hasOwn preserves explicit clearing ("", null), 0 and false. Missing saved
    // values fall back to the original data for older orders.
    if (isObject(config.manualValues) && hasOwn(config.manualValues, key)) {
      set(data, path, cloneDeep(config.manualValues[key]))
    } else if (get(data, path) === undefined && hasOwn(defaults, path)) {
      set(data, path, cloneDeep(defaults[path]))
    }
  })
  return data
}

const writeManualValue = (config, key, value) => ({
    ...config,
    manualValues: {
      ...(isObject(config.manualValues) ? config.manualValues : {}),
      [key]: cloneDeep(value),
    },
})

export const buildQuotationPayload = (
  data,
  template,
  originalOrder,
  approverId,
  approvalStatus = QUOTATION_APPROVAL_STATUS.PENDING,
  approvalType = 'quote',
) => {
  // The viewer overlays manual values on bindings for rendering/formulas. Start
  // from the API snapshot so those overlays never overwrite business fields.
  const order = cloneDeep(originalOrder)
  const details = Array.isArray(order.details) ? order.details : []
  let orderConfig = parseQuoteConfig(order.quoteConfig)

  // Migrate legacy detail.quoteConfig values into the order-level config.
  details.forEach(detail => {
    if (detail.id == null) return
    const id = String(detail.id)
    const legacyConfig = parseQuoteConfig(detail.quoteConfig)
    if (!Object.keys(legacyConfig).length || (isObject(orderConfig.details) && hasOwn(orderConfig.details, id))) return
    orderConfig = {
      ...orderConfig,
      details: { ...(isObject(orderConfig.details) ? orderConfig.details : {}), [id]: legacyConfig },
    }
  })

  if (isObject(data?.sheetTables)) {
    orderConfig = { ...orderConfig, sheetTables: cloneDeep(data.sheetTables) }
  }

  getManualPaths(template, data).forEach(path => {
    const value = get(data, path)
    if (value === undefined) return
    const { detail, key } = getFieldOwner(data, path)
    if (detail === null) {
      orderConfig = writeManualValue(orderConfig, key, value)
      return
    }
    if (detail.id == null) return
    const id = String(detail.id)
    const detailConfig = parseQuoteConfig(orderConfig.details?.[id])
    orderConfig = {
      ...orderConfig,
      details: {
        ...(isObject(orderConfig.details) ? orderConfig.details : {}),
        [id]: writeManualValue(detailConfig, key, value),
      },
    }
  })

  order.quoteConfig = Object.keys(orderConfig).length ? orderConfig : null
  const payloadDetails = details.map(({ quoteConfig, ...detail }) => detail)

  return {
    id: order.id,
    dataId: order.dataId ?? null,
    customer: {
      id: order.customerId ?? null,
      name: order.customerReceiverName ?? null,
      mobile: order.customerMobilePhone ?? null,
      email: order.customerEmail ?? null,
      address: order.customerAddress ?? null,
    },
    details: payloadDetails,
    ...(approverId != null ? {
      aproval: { status: approvalStatus, type: approvalType, userApproval: Number(approverId) },
    } : {}),
    shippingCost: order.shippingCost ?? null,
    customerNote: order.customerNote ?? null,
    quoteConfig: order.quoteConfig ?? null,
  }
}

const mergeQuoteConfig = (previous, incoming) => {
  const previousConfig = parseQuoteConfig(previous)
  const incomingConfig = parseQuoteConfig(incoming)
  const merged = { ...previousConfig, ...incomingConfig }
  if (isObject(previousConfig.manualValues) || isObject(incomingConfig.manualValues)) {
    merged.manualValues = { ...previousConfig.manualValues, ...incomingConfig.manualValues }
  }
  ;['invoiceTemplates', 'details'].forEach(collection => {
    if (!isObject(previousConfig[collection]) && !isObject(incomingConfig[collection])) return
    const ids = new Set([
      ...Object.keys(previousConfig[collection] || {}),
      ...Object.keys(incomingConfig[collection] || {}),
    ])
    merged[collection] = Object.fromEntries([...ids].map(id => [
      id,
      mergeQuoteConfig(previousConfig[collection]?.[id], incomingConfig[collection]?.[id]),
    ]))
  })
  return Object.keys(merged).length ? merged : (incoming ?? previous ?? null)
}

// Save endpoints may return a partial order. Preserve the submitted config when
// it is omitted, and match detail responses by ID rather than product/SKU/index.
export const mergeSavedQuotationOrder = (originalOrder, payload, responseData) => {
  const saved = isObject(responseData) ? responseData : {}
  const detailsById = new Map(payload.details.map(detail => [String(detail.id), detail]))
  const details = Array.isArray(saved.details) ? saved.details : payload.details
  return {
    ...originalOrder,
    ...(payload.aproval ? { aproval: payload.aproval } : {}),
    ...saved,
    quoteConfig: mergeQuoteConfig(payload.quoteConfig, saved.quoteConfig),
    details: details.map(detail => {
      const previous = detailsById.get(String(detail.id))
      const mergedDetail = {
        ...previous,
        ...detail,
      }
      delete mergedDetail.quoteConfig
      return mergedDetail
    }),
  }
}
