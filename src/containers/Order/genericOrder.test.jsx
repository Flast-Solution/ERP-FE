/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Table } from 'antd'
import GenericOrder from './index'
import GenericOrderService from '@/services/GenericOrderService'
import { RequestUtils, InAppEvent } from '@flast-erp/core/utils'

jest.mock('antd', () => {
  const React = require('react')
  return { Table: jest.fn(() => null),
    Button: ({ children, onClick, disabled }) => <button onClick={onClick} disabled={disabled}>{children}</button>,
    InputNumber: () => null, Select: () => null, Typography: { Text: ({ children }) => <span>{children}</span> },
    message: { info: jest.fn() },
  }
})
jest.mock('@ant-design/icons', () => new Proxy({}, { get: () => () => null }))
jest.mock('@/containers/Product/SkuView', () => ({ ShowSkuDetail: () => null }))
jest.mock('@/services/GenericOrderService', () => ({ __esModule: true,
  default: { getOrderOnEdit: jest.fn() }, getWarehouseByProduct: () => [],
}))
jest.mock('@flast-erp/core/utils', () => ({
  arrayEmpty: value => !value?.length, arrayNotEmpty: value => !!value?.length,
  formatMoney: value => String(value ?? 0), formatterInputNumber: value => value, parserInputNumber: value => value,
  RequestUtils: { Get: jest.fn(), Post: jest.fn() }, InAppEvent: { emit: jest.fn() },
}))
jest.mock('@flast-erp/core/hooks', () => ({ useEffectAsync: (callback, deps) => {
  const React = require('react')
  React.useEffect(() => { callback(true) }, deps)
} }))

const currentTable = () => Table.mock.calls.filter(([props]) => props.columns.some(column => column.dataIndex === 'skuDetailCode')).at(-1)[0]
let root, container
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  Table.mockClear(); RequestUtils.Get.mockReset(); RequestUtils.Post.mockReset(); InAppEvent.emit.mockReset()
  GenericOrderService.getOrderOnEdit.mockResolvedValue({ customer: { id: 5, fullName: 'Customer' },
    order: { id: 12, subtotal: 200, vat: 0, total: 200, paid: 0 },
    data: [{ key: 'a', detailId: 20, productId: 7, skuDetailCode: '9', price: 100, quantity: 2,
      totalPrice: 200, discountAmount: 0, discountRate: 0 }],
  })
  container = document.createElement('div'); root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  delete global.IS_REACT_ACT_ENVIRONMENT
})

test('generic editor shows original unit price fields without Hatenko formula or USD/VND UI', async () => {
  await act(async () => root.render(<GenericOrder orderId={12} />))
  const titles = currentTable().columns.map(column => column.title)
  expect(titles).toContain('Đơn giá')
  expect(titles).toContain('CK (%)')
  expect(titles).not.toEqual(expect.arrayContaining(['Giá mua (USD)', 'Giá bán (USD)', 'Lợi nhuận (%)']))
  expect(container.textContent).not.toMatch(/Công thức|Chọn \/ Tạo công thức/)
  expect(RequestUtils.Get).not.toHaveBeenCalled()
})

test('updates quantity and discount using original pricing then saves the original payload', async () => {
  RequestUtils.Post.mockResolvedValue({ errorCode: 200, data: { id: 12 } })
  await act(async () => root.render(<GenericOrder orderId={12} />))
  let table = currentTable()
  await act(async () => table.columns.find(column => column.key === 'operation').render(null, table.dataSource[0]).props.onEdit())
  table = currentTable()
  await act(async () => table.columns.find(column => column.key === 'quantity').render(2, table.dataSource[0]).props.onChange(3))
  table = currentTable()
  expect(table.dataSource[0].totalPrice).toBe(300)
  await act(async () => table.columns.find(column => column.key === 'discountRate').render(0, table.dataSource[0]).props.onChange(10))
  expect(currentTable().dataSource[0].discountAmount).toBe(30)
  await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Lưu đơn hàng').click())
  expect(RequestUtils.Post).toHaveBeenCalledWith('/order/save', expect.objectContaining({
    id: 12, customer: expect.objectContaining({ id: 5 }),
    details: [expect.objectContaining({ quantity: 3, price: 100, totalPrice: 300, discountAmount: 30 })],
  }))
  expect(Object.keys(RequestUtils.Post.mock.calls[0][1]).sort()).toEqual(['customer', 'details', 'id'])
})

test('opens SKU selection through the current drawer and keeps payment/invoice data contracts', async () => {
  await act(async () => root.render(<GenericOrder orderId={12} />))
  const click = label => [...container.querySelectorAll('button')].find(button => button.textContent === label).click()
  await act(async () => click('Thêm sản phẩm'))
  expect(InAppEvent.emit).toHaveBeenLastCalledWith('#modal', expect.objectContaining({ hash: 'sku.add', data: expect.objectContaining({ onSave: expect.any(Function) }) }))
  await act(async () => click('VAT + K.Mãi + Thanh toán'))
  expect(InAppEvent.emit).toHaveBeenLastCalledWith('#modal', expect.objectContaining({ hash: '#order.payment', data: expect.objectContaining({ customerOrder: expect.objectContaining({ id: 12 }) }) }))
  await act(async () => click('In hóa đơn'))
  expect(InAppEvent.emit).toHaveBeenLastCalledWith('#modal', expect.objectContaining({ hash: '#order.invoice', data: expect.objectContaining({ customer: expect.objectContaining({ id: 5 }) }) }))
})
