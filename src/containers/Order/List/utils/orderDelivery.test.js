import { groupOrderDeliveryStock } from './orderDelivery'

const order = { id: 34046, orderDetails: [
  { id: 34169, code: 'SAME', productId: 790, productName: 'Vải', skuId: 35 },
  { id: 34172, code: 'SAME', productId: 790, productName: 'Vải', skuId: 35 },
] }
const lot = { id: 1, orderId: 34046, orderDetailId: 34169, productId: 790, skuId: 35,
  stockId: 5, stockName: 'Kho A', warehouserProductId: 99, total: 10 }

test('groups remaining inventory by detail, SKU, warehouse and warehouse product', () => {
  const rows = groupOrderDeliveryStock(order, [lot, { ...lot, id: 2, total: 3 },
    { ...lot, id: 3, orderDetailId: 34172 }, { ...lot, id: 4, stockId: 6 }])
  expect(rows).toHaveLength(3)
  expect(rows[0].quantity).toBe(13)
  expect(rows[0].itemInStock).toMatchObject({ id: 99, total: 13, skuId: 35 })
  expect(rows[0].inStocks.map(item => item.id)).toEqual([1, 2])
  expect(rows[1].orderDetailId).toBe(34172)
})

test('excludes unrelated, depleted and mismatched inventory', () => {
  expect(groupOrderDeliveryStock(order, [
    { ...lot, orderId: 1 }, { ...lot, orderDetailId: 1 }, { ...lot, productId: 1 },
    { ...lot, skuId: 1 }, { ...lot, total: 0 }, { ...lot, total: -1 },
    { ...lot, stockId: null }, { ...lot, warehouserProductId: null },
  ])).toEqual([])
})

test('supports legacy detailId and empty stock', () => {
  expect(groupOrderDeliveryStock({ ...order, orderDetails: [], details: [{ detailId: 34169, productId: 790, skuId: 35 }] }, [lot])).toHaveLength(1)
  expect(groupOrderDeliveryStock(order)).toEqual([])
})
