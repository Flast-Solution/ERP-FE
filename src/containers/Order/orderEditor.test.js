import dayjs from 'dayjs';
/* These tests use React DOM directly, not Testing Library render/act helpers. */
/* eslint-disable testing-library/no-render-in-setup, testing-library/no-unnecessary-act */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Table, Input, InputNumber, Select } from 'antd';
import { RequestUtils } from '@flast-erp/core/utils';
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
    require('react').useEffect(() => { callback(() => true); }, dependencies);
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
const totalsTable = () => Table.mock.calls.map(call => call[0]).filter(props => props.showHeader === false).at(-1);
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
    data: [{ key: 'line', productId: 3, productPrice: 100, price: 2500000, quantity: 2, profit: 0, discountAmount: 0, totalPrice: 5000000 }],
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

test('keeps row prices and summary in sync as rate, profit and order shipping change', async () => {
  await act(async () => root.render(<OrderEditor orderId={2} />));
  expect(mainTable().columns.find(col => col.key === 'dayQuote').title).toBe('Ngày D.kiến');
  expect(mainTable().columns.some(col => col.key === 'shippingCost')).toBe(false);
  const rateInput = InputNumber.mock.calls.map(call => call[0]).filter(props => props.style?.width === 170).at(-1);
  await act(async () => rateInput.onChange(26000));
  expect(mainTable().dataSource[0].totalPrice).toBe(5200000);
  expect(totalsTable().dataSource[0].leftValue).toBe('$200');
  expect(mainTable().columns.find(col => col.key === 'salePrice').render(null, mainTable().dataSource[0]).props.value).toBe(100);
  expect(mainTable().columns.find(col => col.key === 'lineAmount').render(null, mainTable().dataSource[0]).props.children).toBe('$200');
  expect(mainTable().columns.find(col => col.key === 'vatAmount').render(null, mainTable().dataSource[0]).props.children).toBe('$0');
  const profitColumn = mainTable().columns.find(col => col.key === 'profit');
  await act(async () => profitColumn.render(null, mainTable().dataSource[0]).props.onChange(20));
  expect(mainTable().dataSource[0].totalPrice).toBe(6500000);
  const shippingInput = InputNumber.mock.calls.map(call => call[0]).filter(props => props.id === 'order-shipping-cost').at(-1);
  await act(async () => shippingInput.onChange(10));
  expect(mainTable().dataSource[0].totalPrice).toBe(6825000);
  expect(totalsTable().dataSource[1].rightValue).toBe('$272.5');
  const currencySelect = Select.mock.calls.map(call => call[0]).filter(props => props.options?.some(option => option.value === 'USD')).at(-1);
  expect(currencySelect.options).toEqual([{ label: 'USD', value: 'USD' }]);
  await act(async () => mainTable().columns.find(col => col.key === 'operation').render(null, mainTable().dataSource[0]).props.onEdit());
  await act(async () => mainTable().columns.find(col => col.key === 'quantity').render(2, mainTable().dataSource[0]).props.onChange(3));
  await act(async () => mainTable().columns.find(col => col.key === 'productPrice').render(100, mainTable().dataSource[0]).props.onChange(200));
  expect(mainTable().dataSource[0].totalPrice).toBe(19825000);
  expect(totalsTable().dataSource[1].rightValue).toBe('$772.5');
  const saveButton = Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Lưu đơn hàng');
  await act(async () => saveButton.click());
  expect(RequestUtils.Post).toHaveBeenCalledWith('/order/save', expect.objectContaining({
    currency: 'USD', exchangeRate: 26000, shippingCost: 10,
    details: [expect.objectContaining({ productPrice: 200, quantity: 3, totalPrice: 19825000, total: 19825000, price: 19825000 / 3 })],
  }));
});


test('allows opportunity code and sale price edits and recalculates after rate changes', async () => {
  await act(async () => root.render(<OrderEditor orderId={2} />));
  const codeInput = Input.mock.calls.map(call => call[0]).filter(props => props.id === 'order-code').at(-1);
  expect(codeInput.disabled).toBeFalsy();
  await act(async () => codeInput.onChange({ target: { value: 'CH-123' } }));
  const saleInput = mainTable().columns.find(col => col.key === 'salePrice').render(null, mainTable().dataSource[0]).props;
  const select = jest.fn();
  saleInput.onFocus({ target: { select } });
  expect(select).toHaveBeenCalledTimes(1);
  await act(async () => saleInput.onChange(120));
  expect(mainTable().dataSource[0].totalPrice).toBe(6000000);
  expect(totalsTable().dataSource[0].leftValue).toBe('$240');
  const termsInput = Select.mock.calls.map(call => call[0]).filter(props => props.id === 'order-payment-terms').at(-1);
  const percentInput = InputNumber.mock.calls.map(call => call[0]).filter(props => props.id === 'order-payment-percent').at(-1);
  expect(percentInput.min).toBe(0);
  expect(percentInput.max).toBe(100);
  await act(async () => termsInput.onChange('DEPOSIT'));
  await act(async () => percentInput.onChange(30));
  await act(async () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Lưu đơn hàng').click());
  const payload = RequestUtils.Post.mock.calls.find(([url]) => url === '/order/save')[1];
  expect(payload.code).toBe('CH-123');
  expect(payload.paymentTerms).toBe('DEPOSIT');
  expect(payload.paymentPercent).toBe(30);
  expect(payload.details[0].totalPrice).toBe(6000000);
  expect(payload.details[0].price).toBe(3000000);
  expect(payload.details[0]).not.toHaveProperty('manualSalePrice');
  expect(payload.details[0]).not.toHaveProperty('salePrice');
  expect(payload.details[0].productPrice).toBe(100);
  const rateInput = InputNumber.mock.calls.map(call => call[0]).filter(props => props.style?.width === 170).at(-1);
  await act(async () => rateInput.onChange(26000));
  expect(mainTable().dataSource[0].totalPrice).toBe(5200000);
});


test('preserves fractional sale price in the controlled input, save payload and reload', async () => {
  await act(async () => root.render(<OrderEditor orderId={2} />));
  const saleInput = () => mainTable().columns.find(col => col.key === 'salePrice')
    .render(null, mainTable().dataSource[0]).props;
  await act(async () => saleInput().onChange(123451.313 / 25000));
  expect(saleInput().value).toBeCloseTo(123451.313 / 25000);
  expect(mainTable().dataSource[0].totalPrice).toBe(246903);
  OrderService.getOrderOnEdit.mockResolvedValue({
    customer: { id: 1 },
    order: { id: 2, type: 'opportunity', currency: 'VND', exchangeRate: 1 },
    data: [{ key: 'line', productPrice: 100, quantity: 2, price: 123451.313, totalPrice: 246903 }],
  });
  await act(async () => Array.from(container.querySelectorAll('button'))
    .find(button => button.textContent === 'Lưu đơn hàng').click());
  const payload = RequestUtils.Post.mock.calls.find(([url]) => url === '/order/save')[1];
  expect(payload.details[0].price).toBeCloseTo(123451.313, 8);
  expect(saleInput().value).toBe(123451.313);
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
  expect(row().price).toBe(2500000);
  expect(row().totalPrice).toBe(7500000);
});


test('saves dayQuote as a full timestamp and preserves its time', async () => {
  await act(async () => root.render(<OrderEditor orderId={2} />));
  const dateColumn = mainTable().columns.find(column => column.key === 'dayQuote');
  await act(async () => dateColumn.render(null, mainTable().dataSource[0]).props.onChange(dayjs('2026-09-21 08:32:28')));
  await act(async () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Lưu đơn hàng').click());
  const payload = RequestUtils.Post.mock.calls.find(([url]) => url === '/order/save')[1];
  expect(payload.details[0].dayQuote).toBe('2026-09-21 08:32:28');
});

test('prioritizes manual VND price across USD and exchange rate changes, including zero', async () => {
  await act(async () => root.render(<OrderEditor orderId={2} />));
  const row = () => mainTable().dataSource[0];
  const input = key => mainTable().columns.find(column => column.key === key).render(null, row()).props;
  await act(async () => input('salePrice').onChange(120));
  expect(input('salePriceVnd').value).toBe(3000000);
  await act(async () => input('salePriceVnd').onChange(2800000));
  await act(async () => input('salePrice').onChange(130));
  const rate = InputNumber.mock.calls.map(call => call[0]).filter(props => props.style?.width === 170).at(-1);
  await act(async () => rate.onChange(26000));
  expect(input('salePrice').value).toBe(130);
  expect(input('salePriceVnd').value).toBe(2800000);
  expect(row().totalPrice).toBe(5600000);
  await act(async () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Lưu đơn hàng').click());
  const payload = RequestUtils.Post.mock.calls.find(([url]) => url === '/order/save')[1];
  expect(payload.details[0].price).toBe(2800000);
  expect(payload.details[0]).not.toHaveProperty('manualSalePriceVnd');
});

test('clearing manual VND returns to USD times rate and manual zero stays zero', async () => {
  await act(async () => root.render(<OrderEditor orderId={2} />));
  const input = key => mainTable().columns.find(column => column.key === key).render(null, mainTable().dataSource[0]).props;
  await act(async () => input('salePrice').onChange(120));
  await act(async () => input('salePriceVnd').onChange(0));
  expect(mainTable().dataSource[0].totalPrice).toBe(0);
  await act(async () => input('salePriceVnd').onChange(null));
  expect(input('salePriceVnd').value).toBe(3000000);
  expect(mainTable().dataSource[0].totalPrice).toBe(6000000);
});

test('converts legacy VND inputs to USD using the saved exchange rate', async () => {
  OrderService.getOrderOnEdit.mockResolvedValue({
    customer: { id: 1 }, order: { id: 2, currency: 'VND', exchangeRate: 25000, shippingCost: 50000 },
    data: [{ key: 'line', quantity: 2, productPrice: 2500000, discountAmount: 25000, price: 3000000 }],
  });
  await act(async () => root.render(<OrderEditor orderId={2} />));
  expect(mainTable().dataSource[0]).toMatchObject({ currency: 'USD', productPrice: 100, discountAmount: 1, price: 3000000 });
  expect(mainTable().columns.find(column => column.key === 'salePrice').render(null, mainTable().dataSource[0]).props.value).toBe(120);
});

test('preserves a saved USD sale price when the rate changes from 1 to 20000', async () => {
  OrderService.getOrderOnEdit.mockResolvedValue({
    customer: { id: 1 }, order: { id: 2, currency: 'USD', exchangeRate: 1 },
    data: [{ key: 'line', quantity: 1, productPrice: 1.48, price: 1, discountAmount: 0 }],
  });
  await act(async () => root.render(<OrderEditor orderId={2} />));
  const input = key => mainTable().columns.find(column => column.key === key).render(null, mainTable().dataSource[0]).props;
  expect(input('salePrice').value).toBe(1);
  const rate = InputNumber.mock.calls.map(call => call[0]).filter(props => props.style?.width === 170).at(-1);
  await act(async () => rate.onChange(20000));
  expect(input('salePrice').value).toBe(1);
  expect(input('salePriceVnd').value).toBe(20000);
  expect(mainTable().dataSource[0].totalPrice).toBe(20000);
});
