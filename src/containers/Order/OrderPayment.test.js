import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import OrderPayment from './OrderPayment'

jest.mock('antd', () => {
  const React = require('react')
  const Wrapper = ({ children }) => <div>{children}</div>
  const Form = Wrapper
  Form.Item = ({ label, children }) => <div>{label}{children}</div>
  Form.useForm = () => [{}]
  const Descriptions = Wrapper
  Descriptions.Item = Wrapper
  const Input = Wrapper
  Input.TextArea = Wrapper
  return { Form, Descriptions, Button: Wrapper, Checkbox: Wrapper, Col: Wrapper, Row: Wrapper,
    Input, Modal: {}, message: {} }
})
jest.mock('@flast-erp/core/components', () => {
  const React = require('react')
  const Field = ({ label }) => <div>{label}</div>
  return { FormDatePicker: Field, FormInputNumber: Field, FormSelect: Field, FormAutoComplete: Field,
    BtnSubmit: () => <button>Hoàn thành</button> }
}, { virtual: true })
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: {} }), { virtual: true })
jest.mock('@/hooks/useGetMe', () => () => ({ hasPermission: () => false }), { virtual: true })
jest.mock('@/configs', () => ({ SUCCESS_CODE: 200 }), { virtual: true })
jest.mock('./OrderTextTableOnly', () => () => null)

const renderMarkup = paid => renderToStaticMarkup(<OrderPayment data={{
  customerOrder: { id: 1, type: 'order', currency: 'VND', total: 100000, paid },
  customer: {}, details: [],
}} />)

test.each([100000, 120000])('hides new-payment inputs when paid is %s', paid => {
  const view = renderMarkup(paid)
  expect(view).not.toContain('Hình thức')
  expect(view).not.toContain('Số tiền (VND)')
  expect(view).not.toContain('Hoàn thành')
  expect(view).toContain('Đã thanh toán')
})
test('keeps payment controls when there is an outstanding balance', () => {
  const view = renderMarkup(50000)
  expect(view).toContain('Hình thức')
  expect(view).toContain('Số tiền (VND)')
  expect(view).toContain('Hoàn thành')
})
