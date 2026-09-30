import { createRequestBody } from './useOrderTrackingList'
jest.mock('@flast-erp/core/components', () => ({ DataContext: {} }), { virtual: true })
jest.mock('@flast-erp/core/hooks', () => ({ useUpdateEffect: jest.fn() }), { virtual: true })
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: {} }), { virtual: true })

test.each(['cohoi', 'order'])('sends the correct tracking type for %s', type => {
  const body = createRequestBody({ type, code: 'ABC', limit: 20 })
  expect(body.filters[0]).toEqual({ field: 'type', operator: 'EQUALS', value: type })
  expect(body.filters[1]).toEqual({ source: 'ORDER', field: 'code', operator: 'CONTAINS', value: 'ABC' })
  expect(body.limit).toBe(20)
})
