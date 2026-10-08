/* eslint-disable testing-library/no-unnecessary-act, testing-library/no-render-in-setup */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Form, Select, message } from 'antd';
import { RequestUtils } from '@flast-erp/core/utils';
import CreateOrder from './CreateOrder';
import { FormInputNumber } from '@flast-erp/core/components';

jest.mock('antd', () => {
  const React = require('react');
  let values = {};
  const form = {
    getFieldValue: key => values[key],
    getFieldsValue: () => values,
    setFieldsValue: next => { values = { ...values, ...next }; },
    setFieldValue: (path, value) => {
      if (typeof path === 'string') { values[path] = value; return; }
      const [field, key] = path;
      values[field] = { ...values[field], [key]: value };
    },
    resetFields: () => { values = {}; },
    setFields: jest.fn(),
  };
  const Form = jest.fn(({ children }) => <div>{children}</div>);
  Form.Item = ({ children }) => <div>{children}</div>;
  Form.useForm = () => [form];
  Form.useWatch = field => values[field];
  return { Form, Select: jest.fn(() => null), message: { info: jest.fn(), error: jest.fn(), warning: jest.fn(), success: jest.fn() } };
});
jest.mock('@flast-erp/core/components', () => {
  const React = require('react');
  return {
    CustomButton: ({ title, onClick, disabled }) => <button disabled={disabled} onClick={onClick}>{title}</button>,
    CustomButtonIcon: () => null, FormDatePicker: () => null, FormInput: () => null,
    FormInputNumber: jest.fn(() => null), FormTextArea: () => null, FormSelect: () => null, FormSelectAPI: () => null,
  };
}, { virtual: true });
jest.mock('@/containers/Order/orderLine', () => jest.requireActual('../../containers/Order/orderLine'), { virtual: true });
jest.mock('@/utils/snowflake', () => ({ createSnowflakeId: () => '123' }), { virtual: true });
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Get: jest.fn() } }), { virtual: true });

const orders = [
  { id: 11, code: 'TO-11', enterpriseName: 'A', currency: 'VND', details: [{ id: 101, productId: 1, code: 'CON-101', unit: 'm', quantity: 10 }] },
  { id: 22, code: 'TO-22', enterpriseName: 'B', currency: 'VND', details: [{ id: 202, productId: 2, code: 'CON-202', unit: 'm', quantity: 10 }] },
];
let root, container;
const parentSelect = () => Select.mock.calls.map(([props]) => props).filter(props => props.mode === 'multiple').at(-1);
const childSelect = () => Select.mock.calls.map(([props]) => props).filter(props => props.mode !== 'multiple').at(-1);
const clickAdd = async () => {
  await act(async () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Thêm mới').click());
};
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  Form.mockImplementation(({ children }) => <div>{children}</div>);
  Form.useForm()[0].resetFields();
  RequestUtils.Get.mockResolvedValue({ data: { embedded: [] } });
  container = document.createElement('div');
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

test('selects multiple parents, exposes all their children and retains inputs when removing a parent', async () => {
  const onNext = jest.fn();
  await act(async () => root.render(<CreateOrder waitingOrders={orders} onNext={onNext} />));
  await act(async () => parentSelect().onChange([11, 22]));
  await clickAdd();
  expect(childSelect().options.map(option => option.value)).toEqual([101, 202]);
  expect(childSelect().options[0].label).toContain('TO-11');
  await act(async () => childSelect().onChange(101));
  await clickAdd();
  await act(async () => childSelect().onChange(202));
  const form = Form.useForm()[0];
  form.setFieldsValue({ productDetails: { 101: { target: 3 }, 202: { target: 4 } } });
  await act(async () => Form.mock.calls.at(-1)[0].onFinish(form.getFieldsValue()));
  expect(onNext.mock.calls.at(-1)[0]).toMatchObject({ orderIds: [11, 22], salesOrderCode: 'TO-11, TO-22' });
  expect(onNext.mock.calls.at(-1)[0].orderDetails.map(detail => detail.id)).toEqual([101, 202]);
  await act(async () => parentSelect().onChange([22]));
  expect(form.getFieldValue('productDetails')).toEqual({ 202: { target: 4 } });
  await act(async () => Form.mock.calls.at(-1)[0].onFinish(form.getFieldsValue()));
  expect(onNext.mock.calls.at(-1)[0]).toMatchObject({ orderIds: [22], orderDetails: [{ id: 202 }] });
});

test('restores multiple parents and children when returning from material confirmation', async () => {
  const initialValues = { orderIds: [11, 22], orders,
    orderDetails: [orders[1].details[0]], productDetails: { 202: { target: 4 } } };
  const onNext = jest.fn();
  await act(async () => root.render(<CreateOrder initialValues={initialValues} onNext={onNext} waitingOrders={[]} />));
  expect(parentSelect().options.map(option => option.value)).toEqual([11, 22]);
  expect(childSelect().value).toBe(202);
  await act(async () => Form.mock.calls.at(-1)[0].onFinish(Form.useForm()[0].getFieldsValue()));
  expect(onNext.mock.calls[0][0]).toMatchObject({ orderIds: [11, 22], productDetails: { 202: { target: 4 } } });
});


test('rejects mixed currencies and restores the selection without clearing entered child data', async () => {
  const foreignOrder = { id: 33, code: 'TO-USD', currency: 'USD', details: [{ id: 303, unit: 'm' }] };
  await act(async () => root.render(<CreateOrder waitingOrders={[...orders, foreignOrder]} />));
  expect(parentSelect().options.map(option => option.label)).toEqual([
    expect.stringContaining('VND'), expect.stringContaining('VND'), expect.stringContaining('USD'),
  ]);
  await act(async () => parentSelect().onChange([11]));
  await clickAdd();
  await act(async () => childSelect().onChange(101));
  const form = Form.useForm()[0];
  form.setFieldsValue({ orderIds: [11, 33], productDetails: { 101: { target: 2.5 } } });
  await act(async () => parentSelect().onChange([11, 33]));
  expect(message.error).toHaveBeenCalledWith(expect.stringContaining('khác loại tiền tệ'));
  expect(form.getFieldValue('orderIds')).toEqual([11]);
  expect(form.getFieldValue('productDetails')).toEqual({ 101: { target: 2.5 } });
  expect(childSelect().value).toBe(101);
});

test('uses USD for totals and displays quantities in their units without adding unlike units', async () => {
  const usdOrders = [
    { ...orders[0], currency: 'USD', total: 12.5 },
    { ...orders[1], currency: 'USD', total: 4, details: [{ ...orders[1].details[0], unit: 'kg' }] },
  ];
  const initialValues = { orderIds: [11, 22], orders: usdOrders,
    orderDetails: [usdOrders[0].details[0], usdOrders[1].details[0]],
    productDetails: { 101: { target: 2.5 }, 202: { target: 3 } } };
  const onNext = jest.fn();
  await act(async () => root.render(<CreateOrder initialValues={initialValues} waitingOrders={usdOrders} onNext={onNext} />));
  expect(container.textContent).toContain('Tổng giá trị đơn hàng (USD)');
  expect(container.textContent).toContain('$16.5');
  expect(container.textContent).toContain('2,5 m · 3 kg');
  expect(container.querySelector('.production-create-summary').textContent).not.toContain('sản phẩm');
  await act(async () => Form.mock.calls.at(-1)[0].onFinish(Form.useForm()[0].getFieldsValue()));
  expect(onNext.mock.calls[0][0].currency).toBe('USD');
});

test('uses the available product unit for zero quantity rather than a fixed product label', async () => {
  await act(async () => root.render(<CreateOrder waitingOrders={orders} />));
  await act(async () => parentSelect().onChange([11]));
  expect(container.textContent).toContain('0 m');
  expect(container.textContent).not.toContain('0 sản phẩm');
});

test('blocks submission of a restored legacy selection containing different currencies', async () => {
  const mixedOrders = [orders[0], { ...orders[1], currency: 'USD' }];
  const initialValues = { orderIds: [11, 22], orders: mixedOrders,
    orderDetails: [orders[0].details[0]], productDetails: { 101: { target: 3 } } };
  const onNext = jest.fn();
  await act(async () => root.render(<CreateOrder initialValues={initialValues} onNext={onNext} />));
  await act(async () => Form.mock.calls.at(-1)[0].onFinish(Form.useForm()[0].getFieldsValue()));
  expect(onNext).not.toHaveBeenCalled();
  expect(message.error).toHaveBeenCalledWith(expect.stringContaining('khác loại tiền tệ'));
});


test('rejects production quantities above the child order quantity and accepts the exact limit', async () => {
  const onNext = jest.fn();
  await act(async () => root.render(<CreateOrder waitingOrders={orders} onNext={onNext} />));
  await act(async () => parentSelect().onChange([11]));
  await clickAdd();
  await act(async () => childSelect().onChange(101));
  const quantityInput = FormInputNumber.mock.calls.at(-1)[0];
  expect(quantityInput.max).toBe(10);
  expect(quantityInput.label).toBe('Số lượng sản xuất (m)');
  expect(quantityInput.formItemProps.extra).toBe('Tối đa 10 m');
  await expect(quantityInput.rules[0].validator(null, 11)).rejects.toThrow('không được vượt quá 10 m');
  await expect(quantityInput.rules[0].validator(null, 10)).resolves.toBeUndefined();
  const form = Form.useForm()[0];
  form.setFieldsValue({ productDetails: { 101: { target: 11 } } });
  await act(async () => Form.mock.calls.at(-1)[0].onFinish(form.getFieldsValue()));
  expect(onNext).not.toHaveBeenCalled();
  expect(message.error).toHaveBeenCalledWith(expect.stringContaining('không được vượt quá 10 m'));
  form.setFieldsValue({ productDetails: { 101: { target: 10 } } });
  await act(async () => Form.mock.calls.at(-1)[0].onFinish(form.getFieldsValue()));
  expect(onNext.mock.calls[0][0].productDetails['101'].target).toBe(10);
});

test('uses the child unit and its own quantity limit for each production input', async () => {
  const unitOrders = [{ ...orders[0], details: [
    { ...orders[0].details[0], unit: 'kg', quantity: 2.5 },
  ] }];
  await act(async () => root.render(<CreateOrder waitingOrders={unitOrders} />));
  await act(async () => parentSelect().onChange([11]));
  await clickAdd();
  await act(async () => childSelect().onChange(101));
  const quantityInput = FormInputNumber.mock.calls.at(-1)[0];
  expect(quantityInput.label).toBe('Số lượng sản xuất (kg)');
  expect(quantityInput.max).toBe(2.5);
  await expect(quantityInput.rules[0].validator(null, 2.6)).rejects.toThrow('2,5 kg');
});
