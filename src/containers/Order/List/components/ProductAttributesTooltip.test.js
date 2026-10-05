import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ProductAttributesTooltip from './ProductAttributesTooltip'

test('shows SKU and order line from JSON strings returned by order APIs', () => {
  const markup = renderToStaticMarkup(<ProductAttributesTooltip detail={{
    skuDetails: JSON.stringify([{ text: 'Width', values: [{ text: '62' }] }]),
    orderLine: JSON.stringify({ Color: 'Wine', Approved: false }),
  }} orderLineTitle="Order line" />)
  expect(markup).toContain('Width')
  expect(markup).toContain('62')
  expect(markup).toContain('Color')
  expect(markup).toContain('Wine')
  expect(markup).toContain('false')
})

test('uses mSkuDetails and safely handles invalid order line data', () => {
  const markup = renderToStaticMarkup(<ProductAttributesTooltip detail={{
    mSkuDetails: [{ name: 'Composition', value: 'Polyester' }], orderLine: 'invalid JSON',
  }} />)
  expect(markup).toContain('Composition')
  expect(markup).toContain('Polyester')
  expect(markup).not.toContain('Thông tin đơn con')
})
