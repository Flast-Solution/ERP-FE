import React from 'react'
import { parseOrderLine } from '../../orderLine'
import { normalizeOrderSkuDetails } from '../../orderSku'

const ProductAttributesTooltip = ({ detail, orderLineTitle = 'Thông tin đơn con' }) => {
  const attributes = [detail?.mSkuDetails, detail?.skuDetails].reduce((result, candidate) => {
    if (result.length) return result
    let sku = candidate
    if (typeof sku === 'string') {
      try { sku = JSON.parse(sku) } catch (_) { sku = [] }
    }
    return normalizeOrderSkuDetails(sku)
  }, [])
  const orderLine = Object.entries(parseOrderLine(detail?.orderLine))
  return (
    <div style={{ lineHeight: 1.6, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
      {attributes.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <strong>SKU</strong>
          {attributes.map((attribute, index) => (
            <div key={index}>
              <strong>{attribute.text}: </strong>
              {(attribute.values ?? []).map(value => value?.text ?? value?.value).filter(value => value != null).join(', ')}
            </div>
          ))}
        </div>
      )}
      {orderLine.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <strong>{orderLineTitle}</strong>
          {orderLine.map(([label, value]) => (
            <div key={label}>
              <strong>{label}: </strong>
              {value != null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductAttributesTooltip
