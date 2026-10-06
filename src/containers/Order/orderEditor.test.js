import dayjs from 'dayjs';
/* These tests use React DOM directly, not Testing Library render/act helpers. */
/* eslint-disable testing-library/no-render-in-setup, testing-library/no-unnecessary-act */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Table, Input, InputNumber } from 'antd';
import { InAppEvent, RequestUtils } from '@flast-erp/core/utils';
import OrderService from '@/services/OrderService';
import OrderEditor from './index';

jest.mock('antd', () => {
  const React = require('react');
  const Wrapper = ({ children }) => <div>{children}</div>;
  const Table = jest.fn(({ columns, dataSource, summary }) => <div>
    {dataSource.map((row, index) => <div key={row.key}>{columns.map(column => <span key={column.key}>
      {column.render ? column.render(row[column.dataIndex], row, index) : null}
    </span>)}</div>)}
    {summary?.()}
  </div>);
  Table.Summary = { Row: Wrapper, Cell: Wrapper };
  return {
    Table, Typography: { Text: Wrapper }, Space: Wrapper, Tooltip: Wrapper,
    Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
    Input: jest.fn(() => null), DatePicker: () => null,
    InputNumber: jest.fn(() => null), Select: jest.fn(() => null),
    message: { info: jest.fn() },
  };
});
jest.mock('@flast-erp/core/utils', () => ({
  arrayEmpty: items => !items?.length, arrayNotEmpty: items => Boolean(items?.length),
  formatMoney: value => String(value), formatterInputNumber: value => value, parserInputNumber: value => value,
  RequestUtils: { Get: jest.fn(), Post: jest.fn() }, InAppEvent: { emit: jest.fn() },
}), { virtual: true });
jest.mock('@flast-erp/core/hooks', () => ({
  useEffectAsync: (callback, dependencies) => {
    require('react').useEffect(() => { callback(true); }, dependencies);
  },
}), { virtual: true });
jest.mock('@/configs', () => ({ SUCCESS_CODE: 200, HASH_MODAL: 'modal' }), { virtual: true });
jest.mock('@/configs/constant', () => ({ HASH_POPUP: 'popup' }), { virtual: true });
jest.mock('@/containers/Product/SkuView', () => ({ ShowSkuDetail: () => null }), { virtual: true });
jest.mock('@/services/OrderService', () => ({
  __esModule: true, default: { getOrderOnEdit: jest.fn() }, getWarehouseByProduct: () => [],
}), { virtual: true });

let root;
let container;
const mainTable = () => Table.mock.calls.map(call => call[0]).filter(props => props.columns.some(col => col.key === 'quantity')).at(-1);
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  Table.mockImplementation(({ columns, dataSource, summary }) => <div>
    {dataSource.map((row, index) => <div key={row.key}>{columns.map(column => <span key={column.key}>
      {column.render ? column.render(row[column.dataIndex], row, index) : null}
    </span>)}</div>)}
    {summary?.()}
  </div>);
  container = document.createElement('div');
  root = createRoot(container);
  RequestUtils.Post.mockResolvedValue({ errorCode: 200, data: { id: 2, details: [] } });
  RequestUtils.Get.mockResolvedValue({ errorCode: 200, data: [{ key: 'CACULATOR_TOTAL', value: '(price * quantity + shippingCost) / (1 - profit%)' }] });
  OrderService.getOrderOnEdit.mockResolvedValue({
    customer: { id: 1 }, order: { id: 2, type: 'opportunity', currency: 'USD', exchangeRate: 25000, vat: 0, shippingCost: 0, paid: 100 },
    data: [{ key: 'line', productId: 3, productPrice: 100, price: 100, priceV: 2500000, quantity: 2, profit: 0, discountAmount: 0, totalPrice: 200 }],
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

test('formats displayed money while preserving editable backend precision', async () => {
  OrderService.getOrderOnEdit.mockResolvedValue({
    customer: { id: 46 },
    order: { id: 34049, type: 'cohoi', currency: 'VND', exchangeRate: 1, vat: 0 },
    data: [{ key: 'line', productPrice: 100000.222, price: 100.323, quantity: 1, totalPrice: 100, discountAmount: 0 }],
  });
  await act(async () => root.render(<OrderEditor orderId={34049} />));
  const table = mainTable();
  const row = table.dataSource[0];
  const purchase = table.columns.find(col => col.key === 'productPrice');
  expect(purchase.render(row.productPrice, row)).toBe('$100,000.22');
  expect(table.columns.find(col => col.key === 'salePrice').render(null, row).props.value).toBe(100.323);
  expect(row.totalPrice).toBe(100);
});

test('returns through the success callback only after a successful save and hides production edit column', async () => {
  const onSaveSuccess = jest.fn();
  await act(async () => root.render(<OrderEditor orderId={2} onSaveSuccess={onSaveSuccess} hideEditColumn />));
  expect(mainTable().columns.some(column => column.key === 'operation')).toBe(false);
  const save = () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Lưu đơn hàng').click();
  RequestUtils.Post.mockResolvedValueOnce({ errorCode: 400, message: 'Failed' });
  await act(async () => save());
  expect(onSaveSuccess).not.toHaveBeenCalled();
  await act(async () => save());
  expect(onSaveSuccess).toHaveBeenCalledWith({ id: 2, details: [] });
});

test('locks overview order identifiers and prices while allowing quantity and date changes', async () => {
  await act(async () => root.render(<OrderEditor orderId={2} restrictOrderFields />));
  const row = () => mainTable().dataSource[0];
  const cell = key => mainTable().columns.find(column => column.key === key).render(row()[key], row());
  expect(cell('code').props.disabled).toBe(true);
  expect(cell('profit').props.disabled).toBe(true);
  expect(cell('salePrice').props.disabled).toBe(true);
  expect(Input.mock.calls.map(call => call[0]).filter(props => props.id === 'order-code').at(-1).disabled).toBe(true);
  expect(cell('quantity').props.disabled).toBeUndefined();
  expect(cell('dayQuote').props.disabled).toBeUndefined();
  await act(async () => cell('quantity').props.onChange(3));
  expect(row().quantity).toBe(3);
  expect(row().price).toBe(100);
  expect(row().totalPrice).toBe(300);
});

test('saves dayQuote as a full timestamp and preserves its time', async () => {
  await act(async () => root.render(<OrderEditor orderId={2} />));
  const dateColumn = mainTable().columns.find(column => column.key === 'dayQuote');
  await act(async () => dateColumn.render(null, mainTable().dataSource[0]).props.onChange(dayjs('2026-09-21 08:32:28')));
  await act(async () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Lưu đơn hàng').click());
  const payload = RequestUtils.Post.mock.calls.find(([url]) => url === '/order/save')[1];
  expect(payload.details[0].dayQuote).toBe('2026-09-21 08:32:28');
});

const saleInput = key => mainTable().columns.find(column => column.key === key)
  .render(null, mainTable().dataSource[0]).props;
const saveOrder = async () => {
  await act(async () => Array.from(container.querySelectorAll('button'))
    .find(button => button.textContent === 'Lưu đơn hàng').click());
  return RequestUtils.Post.mock.calls.filter(([url]) => url === '/order/save').at(-1)[1];
};

test('preserves independent backend USD, VND and purchase prices when changing the exchange rate and saving', async () => {
  OrderService.getOrderOnEdit.mockResolvedValue({
    customer: { id: 1 }, order: { id: 2, currency: 'USD', exchangeRate: 23000 },
    data: [{ key: 'line', quantity: 1000, productPrice: 1.7, price: 2.123456, priceV: 46000.25, totalPrice: 2123.456 }],
  });
  await act(async () => root.render(<OrderEditor orderId={2} />));
  expect(saleInput('salePrice').value).toBe(2.123456);
  expect(saleInput('salePriceVnd').value).toBe(46000.25);
  const rate = InputNumber.mock.calls.map(call => call[0]).filter(props => props.style?.width === 170).at(-1);
  await act(async () => rate.onChange(26000));
  expect(saleInput('salePrice').value).toBe(2.123456);
  expect(saleInput('salePriceVnd').value).toBe(46000.25);
  expect(mainTable().dataSource[0].totalPrice).toBe(2123.456);
  expect((await saveOrder()).details[0]).toMatchObject({ price: 2.123456, priceV: 46000.25, productPrice: 1.7 });
  await act(async () => saleInput('salePrice').onChange(3.123456));
  expect(saleInput('salePriceVnd').value).toBe(46000.25);
  await act(async () => saleInput('salePriceVnd').onChange(47000.125));
  expect(saleInput('salePrice').value).toBe(3.123456);
  const payload = (await saveOrder()).details[0];
  expect(payload).toMatchObject({ price: 3.123456, priceV: 47000.125, productPrice: 1.7 });
  expect(payload).not.toHaveProperty('_recalculateTotal');
});

test('preserves zero prices and falls back to USD when VND is cleared', async () => {
  OrderService.getOrderOnEdit.mockResolvedValue({
    customer: { id: 1 }, order: { id: 2, currency: 'USD', exchangeRate: 23000 },
    data: [{ key: 'line', quantity: 1, price: 0, priceV: 0, productPrice: 1.48 }],
  });
  await act(async () => root.render(<OrderEditor orderId={2} />));
  expect(saleInput('salePrice').value).toBe(0);
  expect(saleInput('salePriceVnd').value).toBe(0);
  await act(async () => saleInput('salePriceVnd').onChange(null));
  expect(saleInput('salePriceVnd').value).toBe(0);
  expect((await saveOrder()).details[0]).toMatchObject({ price: 0, priceV: 0 });
});

test('derives missing VND from USD and the current rate for display and payload', async () => {
  OrderService.getOrderOnEdit.mockResolvedValue({
    customer: { id: 1 }, order: { id: 2, currency: 'USD', exchangeRate: 23000 },
    data: [{ key: 'line', quantity: 1, price: 2, priceV: null, productPrice: 1.7 }],
  });
  await act(async () => root.render(<OrderEditor orderId={2} />));
  expect(saleInput('salePriceVnd').value).toBe(46000);
  const rate = InputNumber.mock.calls.map(call => call[0]).filter(props => props.style?.width === 170).at(-1);
  await act(async () => rate.onChange(26000));
  expect(saleInput('salePriceVnd').value).toBe(52000);
  await act(async () => saleInput('salePrice').onChange(3));
  expect(saleInput('salePriceVnd').value).toBe(78000);
  expect((await saveOrder()).details[0]).toMatchObject({ price: 3, priceV: 78000 });
  await act(async () => saleInput('salePriceVnd').onChange(0));
  expect(saleInput('salePriceVnd').value).toBe(0);
  await act(async () => saleInput('salePrice').onChange(null));
  await act(async () => saleInput('salePriceVnd').onChange(null));
  expect(saleInput('salePriceVnd').value).toBeNull();
});


test('opening and closing row editing keeps VND fallback responsive to exchange rate changes', async () => {
  OrderService.getOrderOnEdit.mockResolvedValue({
    customer: { id: 1 }, order: { id: 2, currency: 'USD', exchangeRate: 23000 },
    data: [{ key: 'line', price: 2, priceV: null, quantity: 1, totalPrice: 2 }],
  });
  await act(async () => root.render(<OrderEditor orderId={2} />));
  const editButton = () => mainTable().columns.find(column => column.key === 'operation')
    .render(null, mainTable().dataSource[0]).props;
  await act(async () => editButton().onEdit());
  await act(async () => editButton().onClose());
  const rate = InputNumber.mock.calls.map(call => call[0]).filter(props => props.style?.width === 170).at(-1);
  await act(async () => rate.onChange(26000));
  expect(saleInput('salePriceVnd').value).toBe(52000);
  expect((await saveOrder()).details[0]).toMatchObject({ price: 2, priceV: 52000, totalPrice: 2 });
});

test('adds a product through the modal and preserves its SKU, order line and prices in the payload', async () => {
  const onSaveSuccess = jest.fn();
  await act(async () => root.render(<OrderEditor orderId={2} onSaveSuccess={onSaveSuccess} />));
  await act(async () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Thêm sản phẩm').click());
  const modal = InAppEvent.emit.mock.calls.find(([, value]) => value.hash === '#sku.add')[1];
  await act(async () => modal.data.onSave({ quantity: 3, productId: 5, skuId: 6, code: 'CH-2',
    mProduct: { id: 5, name: 'Fabric', unit: 'm', price: 1.7, skus: [] },
    mSkuDetails: [{ text: 'Width', values: [{ id: 7, text: '62' }] }], orderLine: { Width: '62' },
  }));
  expect(mainTable().dataSource).toHaveLength(2);
  const payload = await saveOrder();
  expect(payload.details[1]).toMatchObject({ code: 'CH-2', productId: 5, skuId: '6', productPrice: 1.7,
    quantity: 3, price: 0, priceV: 0, orderLine: { Width: '62' } });
  expect(payload.details[1].skuDetails).toEqual([{ text: 'Width', values: [{ id: 7, text: '62' }] }]);
  expect(onSaveSuccess).toHaveBeenCalled();
});

test('displays CH-DT-1 USD totals directly and keeps VND edits and exchange rate out of the totals', async () => {
  OrderService.getOrderOnEdit.mockResolvedValue({
    customer: { id: 1 }, order: { id: 34068, code: 'CH-DT-1', currency: 'USD', exchangeRate: 23000,
      shippingCost: 100, vat: 0, total: 550, subtotal: 450, paid: 0 },
    data: [
      { key: 'CH-DT-1-1', price: 2, productPrice: 1.48, priceV: null, quantity: 100, totalPrice: 200, discountAmount: 0 },
      { key: 'CH-DT-1-2', price: 2.5, productPrice: 1.7, priceV: null, quantity: 100, totalPrice: 250, discountAmount: 0 },
    ],
  });
  const lineAmount = () => mainTable().columns.find(column => column.key === 'lineAmount')
    .render(null, mainTable().dataSource[0]).props.children;
  const summary = () => Table.mock.calls.map(call => call[0]).filter(props => props.showHeader === false).at(-1).dataSource;
  await act(async () => root.render(<OrderEditor orderId={34068} />));
  expect(lineAmount()).toBe('$200');
  expect(summary()[0].leftValue).toBe('$450');
  expect(summary()[1].rightValue).toBe('$550');
  const rate = InputNumber.mock.calls.map(call => call[0]).filter(props => props.style?.width === 170).at(-1);
  await act(async () => rate.onChange(24000));
  expect(lineAmount()).toBe('$200');
  expect(summary()[1].rightValue).toBe('$550');
  await act(async () => saleInput('salePriceVnd').onChange(99999));
  expect(lineAmount()).toBe('$200');
  await act(async () => mainTable().columns.find(column => column.key === 'operation').render(null, mainTable().dataSource[0]).props.onEdit());
  await act(async () => mainTable().columns.find(column => column.key === 'quantity').render(100, mainTable().dataSource[0]).props.onChange(200));
  expect(lineAmount()).toBe('$400');
  const payload = await saveOrder();
  expect(payload.shippingCost).toBe(100);
  expect(payload.details[0]).toMatchObject({ price: 2, priceV: 99999, totalPrice: 400, total: 400 });
});
