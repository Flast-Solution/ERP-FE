import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BusinessAlertDetails from './components/BusinessAlertDetails';
import { createBusinessReader, getBusinessScenario } from './businessModel';
import { applyAction } from './model';
import { normalizeNotification } from './service';
jest.mock('antd', () => ({
  Alert: ({ message }) => <div>{message}</div>,
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  Popover: ({ children }) => <>{children}</>,
  Spin: () => null,
  Tag: ({ children }) => <span>{children}</span>,
}));
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Get: jest.fn() } }));
const alert = {
  id: 1,
  title: 'Cảnh báo mẫu',
  type: 'ORDER_NOT_PLANNED',
  level: 'high',
  status: 'pending',
  entityData: {},
  code: 'ORDER-1',
  category: 'Đơn hàng',
  context: [],
  conditions: [],
  history: [],
};
test.each([false, true])(
  'maps flat shipment entity and entityJson to POD fields (%s)',
  (jsonOnly) => {
    const entity = {
      kind: 'SHIPMENT',
      id: 39,
      name: 'GDN-DEMO',
      deliveryCode: 'GDN-DEMO',
      orderId: 75,
      orderCode: 'ORDER-DEMO',
      createdDate: '2026-10-13 15:06:14',
      outboundDate: '2026-10-13 22:07:45',
      attachments: [],
      requiredDocuments: [],
      delivery: {
        recipientName: 'Người nhận mẫu',
        recipientPhone: '0900000001',
        address: 'Địa chỉ giao mẫu',
        carrier: 'Đơn vị vận chuyển mẫu',
        trackingCode: 'TRACK-DEMO',
        scheduledAt: '2026-10-15 00:00:00',
        vehiclePlate: '30A-DEMO',
        driverName: 'Tài xế mẫu',
      },
    };
    const normalized = normalizeNotification({
      id: 'pod',
      type: 'DELIVERY_NO_POD',
      severity: 'HIGH',
      status: 'OPEN',
      ...(jsonOnly ? { entityJson: JSON.stringify(entity) } : { entity }),
      context: [{ key: 'requiredHours', value: 48 }],
      description: 'Đã giao quá 48 giờ, cần bổ sung POD.',
    });
    expect(normalized.code).toBe('GDN-DEMO');
    expect(createBusinessReader(normalized)('shipping')).toEqual(entity);
    const html = renderToStaticMarkup(
      <BusinessAlertDetails alert={normalized} scenario="pod" onOpen={() => {}} />,
    );
    for (const text of [
      'GDN-DEMO',
      'ORDER-DEMO',
      'Người nhận mẫu',
      '0900000001',
      'Địa chỉ giao mẫu',
      'Đơn vị vận chuyển mẫu',
      'TRACK-DEMO',
      '30A-DEMO',
      'Tài xế mẫu',
      '48 giờ',
      'Chưa có tệp POD',
    ])
      expect(html).toContain(text);
    expect(html).toContain('13/10/2026');
    expect(html).toContain('15/10/2026');
    expect(html).not.toContain('Trạng thái #0');
  },
);
test.each([
  ['LEAD_STALE', 'lead'],
  ['DEAL_STAGE_STUCK', 'opportunity'],
  ['ORDER_NOT_PLANNED', 'unplanned'],
  ['INVOICE_OVERDUE', 'debt'],
  ['PRODUCTION_DUE_SOON', 'production'],
  ['DELIVERY_NO_POD', 'pod'],
])('renders the %s business view without fixture data', (type, scenario) => {
  expect(getBusinessScenario({ ...alert, type })).toBe(scenario);
  const html = renderToStaticMarkup(
    <BusinessAlertDetails alert={{ ...alert, type }} scenario={scenario} onOpen={() => {}} />,
  );
  expect(html).toContain(`business-alert-${scenario}`);
  expect(html).not.toContain('Phạm Minh Đức');
  expect(html).not.toContain('980.000');
});
test('reads live business fields and object context without throwing away zero amounts', () => {
  const read = createBusinessReader({
    ...alert,
    context: [{ key: 'order', value: { total: 0, paid: 0, currency: 'USD' } }],
  });
  expect(read('order.total')).toBe(0);
  expect(read('order.currency')).toBe('USD');
  expect(createBusinessReader(alert, { order: { code: 'LIVE' } })('order.code')).toBe('LIVE');
});
test('unknown interactions are not presented as confirmed inactivity', () => {
  const html = renderToStaticMarkup(
    <BusinessAlertDetails alert={alert} scenario="lead" onOpen={() => {}} />,
  );
  expect(html).toContain('Chưa có dữ liệu tương tác đầy đủ');
  expect(html).not.toContain('Không ghi nhận tương tác trong khoảng thời gian này.');
});
test('debt view keeps currency, computes outstanding amount and payment ratio', () => {
  const data = { ...alert, businessData: { order: { total: 1000, paid: 250, currency: 'USD' } } };
  const html = renderToStaticMarkup(
    <BusinessAlertDetails alert={data} scenario="debt" onOpen={() => {}} />,
  );
  expect(html).toContain('750 USD');
  expect(html).toContain('aria-valuenow="25"');
});
test('recording an activity does not close an unresolved business alert', () => {
  const state = { alerts: [{ ...alert, history: [] }], tasks: [] };
  const next = applyAction(state, 1, 'record', {
    activity: 'Gọi khách',
    notes: 'Đã liên hệ, vẫn đang chờ thanh toán',
  });
  expect(next.alerts[0].status).toBe('pending');
  expect(next.alerts[0].history.at(-1).text).toContain('Đã liên hệ');
});

test('banner hides entity ID fallback while retaining a real business code', () => {
  const lead = { ...alert, type: 'LEAD_STALE', entityData: { id: 59, kind: 'LEAD' }, code: '59' };
  const hidden = renderToStaticMarkup(
    <BusinessAlertDetails alert={lead} scenario="lead" onOpen={() => {}} />,
  );
  expect(hidden).not.toContain('<small>59</small>');
  const visible = renderToStaticMarkup(
    <BusinessAlertDetails
      alert={{ ...lead, entityData: { ...lead.entityData, code: 'LEAD-059' }, code: 'LEAD-059' }}
      scenario="lead"
      onOpen={() => {}}
    />,
  );
  expect(visible).toContain('<small>LEAD-059</small>');
});

test.each([
  [2, 'Đang sản xuất'],
  [3, 'Xuất hàng'],
  [4, 'Hoàn thành'],
])('debt drawer maps order.status=%s and reads sibling entity.data products', (status, label) => {
  const entity = {
    id: 101,
    kind: 'INVOICE',
    name: 'DEMO-DEBT-01',
    order: {
      id: 101,
      code: 'DEMO-DEBT-01',
      status,
      total: 1000,
      paid: 250,
      currency: 'VND',
      details: null,
    },
    data: [{ detailId: 102, productName: 'Vải API', quantity: 1, unit: 'm' }],
    customer: { name: 'API customer', mobile: '0900001234' },
  };
  const normalized = normalizeNotification({
    id: 'debt',
    type: 'INVOICE_OVERDUE',
    severity: 'CRITICAL',
    status: 'OPEN',
    entityJson: JSON.stringify(entity),
  });
  const html = renderToStaticMarkup(
    <BusinessAlertDetails alert={normalized} scenario="debt" onOpen={() => {}} />,
  );
  expect(html).toContain(label);
  expect(html).toContain('Vải API');
  expect(html).toContain('API customer');
  expect(html).toContain('750 đ');
});
