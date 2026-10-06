import { attachOrderProductionMetrics } from './orderProductionMetrics'

jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: {} }), { virtual: true })
const order = { id: 1, details: [{ id: 2 }, { id: 3 }], manufactureProducts: [{ details: [
  { orderDetailId: 2, target: 1000 }, { orderDetailId: 2, target: 500 }, { orderDetailId: 3, target: 300 },
] }] }
const instances = [{ id: 10, entityId: 2 }, { id: 11, entityId: 3 }]
const preview = (id, rows) => ({ processInstance: { id }, submissions: [{ id: 1, stepCode: 'start', version: 1,
  valuesJson: { nhap_lot: { rows } } }] })

test('sums lot quantities into each detail and order, preserving negative remaining production', () => {
  const previews = new Map([
    ['10', preview(10, [{ code: 'L1', quantity: 1000 }, { code: 'L2', quantity: 200 }])],
    ['11', preview(11, [{ code: 'L3', quantity: 350 }])],
  ])
  const result = attachOrderProductionMetrics(order, instances, previews)
  expect(result.details[0]._productionMetrics).toMatchObject({ plannedProductionQuantity: 1500, producedQuantity: 1200, remainingProductionQuantity: 300 })
  expect(result.details[1]._productionMetrics).toMatchObject({ producedQuantity: 350, remainingProductionQuantity: -50 })
  expect(result._productionMetrics).toMatchObject({ producedQuantity: 1550, remainingProductionQuantity: 250 })
  expect(result.details[0]._productionLots).toHaveLength(2)
})

test('counts latest versions and does not count the same lot again at another workflow step', () => {
  const previews = new Map([['10', { submissions: [
    { id: 1, stepCode: 'start', version: 1, valuesJson: { nhap_lot: { rows: [{ code: 'L1', quantity: 100 }] } } },
    { id: 2, stepCode: 'start', version: 2, valuesJson: { nhap_lot: { rows: [{ code: 'L1', quantity: 200 }] } } },
    { id: 3, stepCode: 'qc', version: 1, valuesJson: { lots: [{ code_lot: 'L1', so_luong: 200 }] } },
  ] }]])
  const result = attachOrderProductionMetrics(order, [instances[0]], previews)
  expect(result.details[0]._productionMetrics.producedQuantity).toBe(200)
  expect(result._productionMetrics.producedQuantity).toBe(200)
})

test('distinguishes zero production from failed or missing previews', () => {
  expect(attachOrderProductionMetrics(order, [], new Map())._productionMetrics.producedQuantity).toBe(0)
  const result = attachOrderProductionMetrics(order, instances, new Map())
  expect(result._productionMetrics.producedQuantity).toBeUndefined()
  expect(result._productionMetrics.error).toBeTruthy()
  expect(attachOrderProductionMetrics(order, [], new Map(), 'API error')._productionMetrics.producedQuantity).toBeUndefined()
})
