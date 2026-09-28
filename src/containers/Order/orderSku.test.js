import { normalizeOrderSkuDetails, resolveOrderSkuDetails } from './orderSku';

test('renders raw API attributes and grouped saved attributes identically', () => {
  const raw = [{ id: 1, name: 'Phong cách', value: 'Sang trọng' }, { id: 2, name: 'Kích thước', value: '30x55x30' }];
  const grouped = normalizeOrderSkuDetails(raw);
  expect(grouped).toEqual([
    { text: 'Phong cách', values: [{ id: 1, text: 'Sang trọng' }] },
    { text: 'Kích thước', values: [{ id: 2, text: '30x55x30' }] },
  ]);
  expect(normalizeOrderSkuDetails(grouped)).toEqual(grouped);
});

test('uses the selected SKU when the select callback or saved detail has no attributes', () => {
  const product = { skus: [{ id: 12, skuDetails: [{ name: 'Màu', value: 'Đỏ' }] }] };
  expect(resolveOrderSkuDetails({ skuId: '12', mSkuDetails: [] }, product))
    .toEqual([{ text: 'Màu', values: [{ id: undefined, text: 'Đỏ' }] }]);
  expect(resolveOrderSkuDetails({ skuId: '99' }, product)).toEqual([]);
});
