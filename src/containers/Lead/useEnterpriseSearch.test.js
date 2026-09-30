import { RequestUtils } from '@flast-erp/core/utils'
import { fetchEnterprises } from './useEnterpriseSearch'

jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Get: jest.fn() } }), { virtual: true })

test('searches by name and keeps same-name enterprises independently selectable', async () => {
  RequestUtils.Get.mockResolvedValue({ errorCode: 200, success: true, data: {
    embedded: [{ id: 53, companyName: 'fpt', taxCode: 'fpt' }, { id: 52, companyName: 'fpt', taxCode: 'MST-12345' }],
    page: { totalElements: 2 },
  } })
  const result = await fetchEnterprises({ name: 'fpt', page: 1, limit: 20 })
  expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/customer/fetch-customer-enterprise', { name: 'fpt', page: 1, limit: 20 })
  expect(result.embedded.map(item => item.selectionValue)).toEqual(['enterprise:53', 'enterprise:52'])
  expect(result.embedded[1].taxCode).toBe('MST-12345')
})

test('handles no matching enterprise without creating a suggestion', async () => {
  RequestUtils.Get.mockResolvedValue({ errorCode: 200, data: { embedded: [], page: {} } })
  expect((await fetchEnterprises({ name: 'New company' })).embedded).toEqual([])
})
