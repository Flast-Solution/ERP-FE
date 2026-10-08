import { buildManufacturePayload, mapManufactureOrder } from './utils';

test('sends root id and unique orderIds beside materialOutbounds when editing', () => {
  const payload = buildManufacturePayload({ isEdit: true,
    productionOrder: { id: 9, orderIds: [11, 22, 11], productionOrderCode: 'LSX-9',
      orderDetails: [{ id: 101, productId: 1 }, { id: 202, productId: 2 }],
      productDetails: { 101: { target: 3 }, 202: { target: 4 } } },
    materialConfirmation: { allocations: [{ warehouseId: 1, materialId: 2, quantity: 5 }] },
  });
  expect(payload).toMatchObject({ id: 9, orderIds: [11, 22], materialOutbounds: [{ warehouseId: 1, materialId: 2, quantity: 5 }] });
  expect(payload.manufactureProduct).not.toHaveProperty('id');
  expect(payload.manufactureProduct).not.toHaveProperty('orderIds');
  expect(payload.manufactureProduct.details.map(detail => detail.orderDetailId)).toEqual([101, 202]);
});

test('sends a null root id for creation and an explicit empty orderIds list', () => {
  expect(buildManufacturePayload({ productionOrder: { orderIds: [] } }))
    .toMatchObject({ id: null, orderIds: [], materialOutbounds: [] });
});

test('supports legacy single-order records and keeps the selected id type', () => {
  expect(buildManufacturePayload({ productionOrder: { salesOrderId: 11 } }).orderIds).toEqual([11]);
  expect(buildManufacturePayload({ productionOrder: { orderIds: [11, '11', null, '', '22'] } }).orderIds).toEqual(['11', '22']);
  const mapped = mapManufactureOrder({ id: 9, order: { id: 11, code: 'TO-11', details: [{ id: 101, productId: 1 }] } });
  expect(mapped.orderIds).toEqual([11]);
  expect(mapped.orders).toHaveLength(1);
});

test('restores children from multiple parent orders using exact child identities', () => {
  const mapped = mapManufactureOrder({ id: 9,
    orders: [
      { id: 11, code: 'TO-11', enterpriseName: 'A', details: [{ id: 101, code: 'CON-101', productId: 1 }] },
      { id: 22, code: 'TO-22', enterpriseName: 'B', details: [{ id: 202, code: 'CON-202', productId: 1 }] },
    ],
    details: [{ id: 2, orderDetailId: 202, productId: 1, target: 4 }, { id: 1, orderDetailId: 101, productId: 1, target: 3 }],
  });
  expect(mapped.orderIds).toEqual([11, 22]);
  expect(mapped.salesOrderCode).toBe('TO-11, TO-22');
  expect(mapped.customerName).toBe('A, B');
  expect(mapped.orderDetails.map(detail => [detail.code, detail.salesOrderId])).toEqual([['CON-202', 22], ['CON-101', 11]]);
  const payload = buildManufacturePayload({ productionOrder: mapped, isEdit: true });
  expect(payload.id).toBe(9);
  expect(payload.orderIds).toEqual([11, 22]);
  expect(payload.manufactureProduct.details.map(detail => detail.id)).toEqual([2, 1]);
});
