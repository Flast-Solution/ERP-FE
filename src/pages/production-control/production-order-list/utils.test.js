import { buildManufacturePayload, mapManufactureOrder } from './utils'

const productionOrder = {
  productionOrderCode: 'LSX-1', salesOrderCode: 'ORDER-1',
  orderDetails: [{ id: 101, productId: 7 }, { id: 102, productId: 7 }],
  productDetails: {
    101: { target: 10, providerId: 5, workflowProcessIds: [1, '1', 2] },
    102: { target: 20, workflowProcessIds: [3] },
  },
}

test('sends independent workflow selections for each child even with the same product', () => {
  const payload = buildManufacturePayload({ productionOrder })
  expect(payload.manufactureProduct.details).toEqual([
    expect.objectContaining({ orderDetailId: 101, productId: 7, workflowProcessIds: [1, 2], target: 10 }),
    expect.objectContaining({ orderDetailId: 102, productId: 7, workflowProcessIds: [3], target: 20 }),
  ])
})

test('material confirmation preserves selected workflows', () => {
  const payload = buildManufacturePayload({ productionOrder, materialConfirmation: { bomSelections: { 101: { bomProductId: 8 } } } })
  expect(payload.manufactureProduct.details[0]).toMatchObject({ bomProductId: 8, workflowProcessIds: [1, 2] })
})

test('maps and saves edited workflows against exact child IDs, not product position', () => {
  const record = {
    id: 9, code: 'LSX-1', order: { id: 1, details: [
      { id: 101, productId: 7, code: 'CHILD-1' },
      { id: 102, productId: 7, code: 'CHILD-2' },
    ] },
    details: [
      { id: 21, orderDetailId: 102, productId: 7, workflowProcessIds: [3] },
      { id: 22, orderDetailId: 101, productId: 7, workflowProcessIds: [1, 2] },
    ],
  }
  const mapped = mapManufactureOrder(record)
  expect(mapped.orderDetails.map(detail => detail.code)).toEqual(['CHILD-2', 'CHILD-1'])
  expect(mapped.productDetails['101'].workflowProcessIds).toEqual([1, 2])
  const payload = buildManufacturePayload({ productionOrder: mapped, isEdit: true })
  expect(payload.manufactureProduct.details[0]).toMatchObject({ id: 21, orderDetailId: 102, workflowProcessIds: [3] })
})

test('supports no workflows and keeps a child identity when the order detail is not embedded', () => {
  const mapped = mapManufactureOrder({ id: 9, details: [{ id: 21, orderDetailId: 102, productId: 7 }] })
  expect(mapped.orderDetails[0].id).toBe(102)
  expect(buildManufacturePayload({ productionOrder: mapped, isEdit: true }).manufactureProduct.details[0])
    .toMatchObject({ id: 21, orderDetailId: 102, workflowProcessIds: [] })
})

test('round trips production and individual child descriptions', () => {
  const record = {
    id: 9, code: 'LSX-1', description: 'Ghi chú lệnh',
    order: { id: 1, details: [{ id: 101, productId: 7 }, { id: 102, productId: 7 }] },
    details: [
      { id: 11, orderDetailId: 101, productId: 7, description: 'Đơn con A', target: 10 },
      { id: 12, orderDetailId: 102, productId: 7, description: 'Đơn con B', target: 20 },
    ],
  }
  const mapped = mapManufactureOrder(record)
  mapped.productDetails['102'].description = ''
  const payload = buildManufacturePayload({ productionOrder: mapped, isEdit: true })
  expect(payload.manufactureProduct.description).toBe('Ghi chú lệnh')
  expect(payload.manufactureProduct.details.map(detail => detail.description)).toEqual(['Đơn con A', ''])
})
