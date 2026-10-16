import { applyTenantMenuOrder } from './menuOrder';

const config = { remotes: [{ id: 'business', scope: 'hatenko' }], routes: [{ remoteId: 'business', enabled: true }] };

test('orders the twelve Hatenko sections without losing existing links or extra entries', () => {
  const children = [{ key: 'delivery', label: 'Giao hàng' }];
  const keys = ['home', 'project_list', 'tong_lead', 'co_hoi', 'order_solve', 'business_flow', 'need_solve', 'client', 'warehouse', 'Kpi', 'bot_data', 'product_list', 'san_xuat', 'web', 'tai_khoan', 'quan_ly_hanh_chinh'];
  const items = keys.map(key => ({ key, label: key, ...(key === 'warehouse' ? { children } : {}) }));
  const result = applyTenantMenuOrder(items, config);
  expect(result.map(item => item.key)).toEqual(['home', 'product_list', 'tong_lead', 'client', 'co_hoi', 'order_solve', 'san_xuat', 'warehouse', 'need_solve', 'business_flow', 'project_list', 'tai_khoan', 'Kpi', 'bot_data', 'web', 'quan_ly_hanh_chinh']);
  expect(result.find(item => item.key === 'warehouse')).toMatchObject({ label: 'Giao hàng', children });
  expect(result.find(item => item.key === 'business_flow').label).toBe('Quy trình');
  expect(items.map(item => item.key)).toEqual(keys);
});

test('leaves other tenants and disabled remote configurations unchanged', () => {
  const items = [{ key: 'project_list' }, { key: 'home' }];
  expect(applyTenantMenuOrder(items)).toBe(items);
  expect(applyTenantMenuOrder(items, { ...config, remotes: [{ id: 'business', scope: 'other' }] })).toBe(items);
  expect(applyTenantMenuOrder(items, { ...config, routes: [{ remoteId: 'business', enabled: false }] })).toBe(items);
});

test('does not recreate menu entries removed by permissions', () => {
  expect(applyTenantMenuOrder([{ key: 'tai_khoan' }, { key: 'client' }, { key: 'home' }], config).map(item => item.key)).toEqual(['home', 'client', 'tai_khoan']);
});
