/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Form } from 'antd'
import { FormSelect, FormSelectInfiniteProduct } from '@flast-erp/core/components'
import { RequestUtils } from '@flast-erp/core/utils'
import AddSKU from './ModalAddSKU'
import OrderPayment from './OrderPayment'

jest.mock('antd', () => {
  const React = require('react')
  const form = { setFieldValue: jest.fn(), resetFields: jest.fn() }
  const Form = jest.fn(({ children }) => <div>{children}</div>)
  Form.useForm = () => [form]
  Form.useWatch = () => 0
  const Wrapper = ({ children }) => <div>{children}</div>
  return { Form, Row: Wrapper, Col: Wrapper, message: { info: jest.fn() } }
})
jest.mock('@flast-erp/core/components', () => ({
  FormSelectInfiniteProduct: jest.fn(() => null), FormSelect: jest.fn(() => null),
  FormInputNumber: () => null, FormDatePicker: () => null, BtnSubmit: () => null,
  FormAutoComplete: () => null, FormTextArea: () => null,
}))
jest.mock('@flast-erp/core/utils', () => ({
  arrayNotEmpty: value => !!value?.length, createMSkuDetails: value => value,
  formatMoney: value => String(value ?? 0), RequestUtils: { Get: jest.fn(), Post: jest.fn() },
}))
jest.mock('@flast-erp/core/hooks', () => ({ useEffectAsync: (callback, deps) => {
  const React = require('react')
  React.useEffect(() => { callback() }, deps)
} }))
jest.mock('@/containers/WareHouse/InStockTable', () => ({ __esModule: true, default: () => <span>Tồn kho</span> }))
jest.mock('@/containers/Product/SkuView', () => ({ ShowSkuDetail: () => null }))
jest.mock('@/services/GenericOrderService', () => ({ __esModule: true, default: { getListOrderName: () => [] } }))
jest.mock('./OrderTextTableOnly', () => ({ __esModule: true, default: () => null }))

let root, container
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div'); root = createRoot(container)
  Form.mockImplementation(({ children }) => <div>{children}</div>)
  FormSelect.mockClear(); FormSelectInfiniteProduct.mockClear()
})
afterEach(async () => {
  await act(async () => root.unmount())
  delete global.IS_REACT_ACT_ENVIRONMENT
})

test('generic SKU picker accepts current drawer data, keeps stock UI, and returns original product selection', async () => {
  const onSave = jest.fn(), close = jest.fn()
  await act(async () => root.render(<AddSKU data={{ onSave }} closeModalAfterSubmit={close} />))
  expect(container.textContent).toContain('Tồn kho')
  const product = { id: 7, name: 'Product', skus: [{ id: 9, name: 'SKU' }], warehouses: [] }
  await act(async () => FormSelectInfiniteProduct.mock.calls.at(-1)[0].onChangeGetSelectedItem(7, product))
  const skuSelect = FormSelect.mock.calls.filter(([props]) => props.name === 'skuId').at(-1)[0]
  const skuDetails = [{ text: 'Color', values: [{ text: 'White' }] }]
  await act(async () => skuSelect.onChangeGetSelectedItem(9, { id: 9, skuDetails }))
  await act(async () => Form.mock.calls.at(-1)[0].onFinish({ productId: 7, skuId: 9, quantity: 2 }))
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ productId: 7, skuId: 9, quantity: 2, mProduct: product, mSkuDetails: skuDetails }))
  expect(close).toHaveBeenCalledTimes(1)
})

test('generic payment keeps the original manual-payment endpoint and callback', async () => {
  const onSave = jest.fn()
  RequestUtils.Post.mockResolvedValue({ errorCode: 200, data: { id: 50 }, message: 'success' })
  await act(async () => root.render(<OrderPayment data={{ customerOrder: { id: 12, subtotal: 200, paid: 0 }, details: [], onSave }} />))
  const values = { vat: 10, shippingCost: 5, amount: 100 }
  await act(async () => Form.mock.calls.at(-1)[0].onFinish(values))
  expect(RequestUtils.Post).toHaveBeenCalledWith('/pay/manual', { orderId: 12, ...values })
  expect(onSave).toHaveBeenCalledWith({ id: 50 })
})
