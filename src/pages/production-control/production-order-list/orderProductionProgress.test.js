import { getOrderProductionProgress } from './orderProductionProgress'

const details = [{ id: 1, productId: 10 }, { id: 2, productId: 10 }, { id: 3, productId: 20 }]
test('counts distinct children with production orders and retains pending children', () => {
  const order = { details, manufactureProduct: [{ details: [{ orderDetailId: 1 }, { orderDetailId: 1 }, { orderDetailId: 2 }] }] }
  expect(getOrderProductionProgress(order)).toEqual({ total: 3, planned: 2, pendingDetails: [details[2]] })
})
test('orders without production have all children pending', () => {
  expect(getOrderProductionProgress({ details, manufactureProduct: [] }).planned).toBe(0)
})
test('fully planned orders have no pending children', () => {
  expect(getOrderProductionProgress({ details, manufactureProduct: [{ details: details.map(item => ({ orderDetailId: item.id })) }] }).pendingDetails).toEqual([])
})
test('legacy matching only counts unique product candidates', () => {
  expect(getOrderProductionProgress({ details, manufactureProduct: [{ details: [{ productId: 10 }, { productId: 20 }] }] })).toEqual({ total: 3, planned: 1, pendingDetails: details.slice(0, 2) })
})
