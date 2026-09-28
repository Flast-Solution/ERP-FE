import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Table, InputNumber, Select } from 'antd';
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
    Input: () => null, DatePicker: () => null,
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
    data: [{ key: 'line', productId: 3, price: 100, quantity: 2, profit: 0, discountAmount: 0, totalPrice: 5000000 }],
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
  expect(totalsTable().dataSource[0].leftValue).toBe('5200000');
  const profitColumn = mainTable().columns.find(col => col.key === 'profit');
  await act(async () => profitColumn.render(null, mainTable().dataSource[0]).props.onChange(20));
  expect(mainTable().dataSource[0].totalPrice).toBe(6500000);
  const shippingInput = InputNumber.mock.calls.map(call => call[0]).filter(props => props.id === 'order-shipping-cost').at(-1);
  await act(async () => shippingInput.onChange(10));
  expect(mainTable().dataSource[0].totalPrice).toBe(6825000);
  expect(totalsTable().dataSource[1].rightValue).toBe('7085000');
  const currencySelect = Select.mock.calls.map(call => call[0]).filter(props => props.options?.some(option => option.value === 'USD')).at(-1);
  await act(async () => currencySelect.onChange('VND'));
  expect(mainTable().dataSource[0].totalPrice).toBe(263);
  expect(totalsTable().dataSource[1].rightValue).toBe('273');
  await act(async () => mainTable().columns.find(col => col.key === 'operation').render(null, mainTable().dataSource[0]).props.onEdit());
  await act(async () => mainTable().columns.find(col => col.key === 'quantity').render(2, mainTable().dataSource[0]).props.onChange(3));
  await act(async () => mainTable().columns.find(col => col.key === 'price').render(100, mainTable().dataSource[0]).props.onChange(200));
  expect(mainTable().dataSource[0].totalPrice).toBe(763);
  expect(totalsTable().dataSource[1].rightValue).toBe('773');
  const saveButton = Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Lưu đơn hàng');
  await act(async () => saveButton.click());
  expect(RequestUtils.Post).toHaveBeenCalledWith('/order/save', expect.objectContaining({
    currency: 'VND', exchangeRate: 1, shippingCost: 10,
    details: [expect.objectContaining({ price: 200, quantity: 3, totalPrice: 763, total: 763 })],
  }));
});
