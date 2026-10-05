import { createRequestBody } from './useOrderTrackingList'
jest.mock('@flast-erp/core/components', () => ({ DataContext: {} }), { virtual: true })
jest.mock('@flast-erp/core/hooks', () => ({ useUpdateEffect: jest.fn() }), { virtual: true })
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: {} }), { virtual: true })

test.each(['cohoi', 'order'])('sends the correct tracking type for %s', type => {
  const body = createRequestBody({ type, code: 'ABC', limit: 20 })
  expect(body.filters[0]).toEqual({ field: 'type', operator: 'EQUALS', value: type })
  expect(body.filters[1]).toEqual({ field: 'code', operator: 'LIKE', value: 'ABC' })
  expect(body.limit).toBe(20)
})


test('omits source from every filter while retaining fields and operators', () => {
  const body = createRequestBody({
    type: 'order', code: 'ABC', customerMobile: '090', productName: 'Vải',
    userCreatedId: 12, from: '2026-10-01', to: '2026-10-05', workflowDataKeyword: 'LOT',
  })
  expect(body.filters).toEqual([
    { field: 'type', operator: 'EQUALS', value: 'order' },
    { field: 'code', operator: 'LIKE', value: 'ABC' },
    { field: 'customerMobilePhone', operator: 'CONTAINS', value: '090' },
    { field: 'productName', operator: 'CONTAINS', value: 'Vải' },
    { field: 'userCreateId', operator: 'EQUALS', value: '12' },
    { field: 'createdAt', operator: 'GREATER_THAN_OR_EQUALS', value: '2026-10-01' },
    { field: 'createdAt', operator: 'LESS_THAN_OR_EQUALS', value: '2026-10-05' },
    { field: 'value', operator: 'CONTAINS', value: 'LOT' },
  ])
  body.filters.forEach(filter => expect(filter).not.toHaveProperty('source'))
})
