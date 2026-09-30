import { matchesProductionDetail } from './productionDetailMatch'
const details = [{ id: 34169, productId: 790, skuId: 35 }, { id: 34172, productId: 790, skuId: 35 }]
test('maps same-product production records to their own order children', () => {
  const production = [{ id: 86, orderDetailId: 34169, productId: 790 }, { id: 87, orderDetailId: 34172, productId: 790 }]
  expect(details.map(detail => production.filter(item => matchesProductionDetail(item, detail, details)).map(item => item.id)))
    .toEqual([[86], [87]])
})
test('does not fall back from an explicit nonmatching ID', () => {
  expect(matchesProductionDetail({ orderDetailId: 999, productId: 790 }, details[0], [details[0]])).toBe(false)
})
test('legacy matching requires a unique product/SKU candidate', () => {
  expect(matchesProductionDetail({ productId: 790 }, details[0], details)).toBe(false)
  expect(matchesProductionDetail({ productId: 790 }, details[0], [details[0]])).toBe(true)
})
