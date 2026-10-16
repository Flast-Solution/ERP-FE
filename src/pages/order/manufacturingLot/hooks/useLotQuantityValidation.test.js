import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useLotQuantityValidation } from './useLotQuantityValidation'

test('allows lots above ordered quantity and cumulative quantity, but rejects invalid numbers', async () => {
  let validation
  const Harness = () => {
    validation = useLotQuantityValidation({ orderDetails: [{ key: 'line', quantity: 10 }],
      createdLots: [{ quantity: 10 }], form: { getFieldValue: () => [{ quantity: 20 }] } })
    return null
  }
  renderToStaticMarkup(<Harness />)
  const validate = validation.validateLotQuantity(0)
  await expect(validate(null, 20)).resolves.toBeUndefined()
  await expect(validate(null, 0.5)).resolves.toBeUndefined()
  for (const value of [0, -1, Infinity, 'invalid']) {
    await expect(validate(null, value)).rejects.toThrow('phải lớn hơn 0')
  }
  expect(validation.getSelectedDetail('line').quantity).toBe(10)
})
