import React from 'react'
import { parseOrderLine } from '../../orderLine'

const ProductAttributesTooltip = ({ detail }) => {
  let sku = detail?.skuDetails
  if (typeof sku === 'string') {
    try { sku = JSON.parse(sku) } catch (_) { sku = [] }
  }
  const attributes = Array.isArray(sku) ? sku : []
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
          <strong>Thông tin đơn con</strong>
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
