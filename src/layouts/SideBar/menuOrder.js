const HATENKO_MENU_ORDER = [
  'home',
  'product_list',
  'tong_lead',
  'client',
  'co_hoi',
  'order_solve',
  'san_xuat',
  'warehouse',
  'need_solve',
  'business_flow',
  'project_list',
  'tai_khoan',
];

export function applyTenantMenuOrder(items, config) {
  const remoteIds = new Set((config?.remotes || [])
    .filter(remote => remote.scope === 'hatenko')
    .map(remote => remote.id));
  if (!(config?.routes || []).some(route => route.enabled && remoteIds.has(route.remoteId))) return items;

  const positions = new Map(HATENKO_MENU_ORDER.map((key, index) => [key, index]));
  const labels = { warehouse: 'Giao hàng', business_flow: 'Quy trình' };
  return items.map((item, index) => ({
    item: labels[item.key] ? { ...item, label: labels[item.key] } : item,
    position: positions.get(item.key) ?? HATENKO_MENU_ORDER.length + index,
  })).sort((left, right) => left.position - right.position).map(entry => entry.item);
}
