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

// manualValues is a path -> JSON value map. Order keys are absolute document
// bindings; detail keys are relative to that row (moq, mcq, date, etc.).
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
  const defaults = getHtmlManualDefaults(template, data)
  getManualPaths(template, data).forEach(path => {
    const { detail, key } = getFieldOwner(data, path)
    const config = parseQuoteConfig((detail ?? data.customerOrder)?.quoteConfig)
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

const writeManualValue = (owner, key, value) => {
  const config = parseQuoteConfig(owner.quoteConfig)
  owner.quoteConfig = {
    ...config,
    manualValues: {
      ...(isObject(config.manualValues) ? config.manualValues : {}),
      [key]: cloneDeep(value),
    },
  }
}

export const buildQuotationPayload = (data, template, originalOrder, approverId, approvalStatus = QUOTATION_APPROVAL_STATUS.PENDING) => {
  // The viewer overlays manual values on bindings for rendering/formulas. Start
  // from the API snapshot so those overlays never overwrite business fields.
  const order = cloneDeep(originalOrder)
  const details = Array.isArray(order.details) ? order.details : []
  const detailsById = new Map(details.filter(detail => detail.id != null).map(detail => [String(detail.id), detail]))

  getManualPaths(template, data).forEach(path => {
    const value = get(data, path)
    if (value === undefined) return
    const { detail, key } = getFieldOwner(data, path)
    const owner = detail === null ? order : detailsById.get(String(detail?.id))
    if (owner) writeManualValue(owner, key, value)
  })

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
    details,
    ...(approverId != null ? {
      aproval: { status: approvalStatus, type: 'quote', userApproval: Number(approverId) },
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
      return {
        ...previous,
        ...detail,
        quoteConfig: mergeQuoteConfig(previous?.quoteConfig, detail.quoteConfig),
      }
    }),
  }
}
