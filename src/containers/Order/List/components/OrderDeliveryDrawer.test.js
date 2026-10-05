/* Uses React DOM directly to check the drawer request and modal handoff. */
/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { InAppEvent, RequestUtils } from '@flast-erp/core/utils'
import OrderDeliveryDrawer from './OrderDeliveryDrawer'

jest.mock('antd', () => {
  const React = require('react')
  return {
    Drawer: ({ open, children }) => open ? <div>{children}</div> : null,
    Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
    Alert: ({ message, action }) => <div>{message}{action}</div>,
    Table: ({ dataSource, columns, locale }) => <div>{dataSource.length ? dataSource.map(row => (
      <div key={row.key}>{columns.at(-1).render(null, row)}</div>
    )) : locale.emptyText}</div>,
  }
})
jest.mock('@flast-erp/core/utils', () => ({
  InAppEvent: { emit: jest.fn() }, RequestUtils: { Get: jest.fn() },
}), { virtual: true })
jest.mock('@/configs', () => ({ HASH_MODAL: 'modal' }), { virtual: true })

let root
let container
beforeEach(() => {
  jest.clearAllMocks()
  global.IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  delete global.IS_REACT_ACT_ENVIRONMENT
})

test('fetches fresh order inventory and hands only selected detail stock to the delivery modal', async () => {
  const lot = { id: 10, orderId: 1, orderDetailId: 2, productId: 3, skuId: 4,
    stockId: 5, warehouserProductId: 6, total: 7 }
  RequestUtils.Get.mockResolvedValue({ errorCode: 200, data: { embedded: [lot] } })
  const onClose = jest.fn()
  const onSaved = jest.fn()
  await act(async () => root.render(<OrderDeliveryDrawer
    order={{ id: 1, code: 'TO', details: [{ id: 2, productId: 3, skuId: 4 }] }}
    onClose={onClose} onSaved={onSaved} />))
  expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/warehouse/fetch-history', { orderId: 1, isFull: 'True' })
  await act(async () => container.querySelector('button').click())
  expect(onClose).toHaveBeenCalledTimes(1)
  expect(InAppEvent.emit).toHaveBeenCalledWith('modal', expect.objectContaining({
    hash: '#warehouse.delivery', data: expect.objectContaining({
      orderDetailId: 2, inStocks: [lot], onSaved,
      itemInStock: expect.objectContaining({ id: 6, total: 7, skuId: 4 }),
    }),
  }))
})

test('shows an API error without opening a delivery modal', async () => {
  RequestUtils.Get.mockResolvedValue({ success: false, message: 'Không có quyền xem tồn kho' })
  await act(async () => root.render(<OrderDeliveryDrawer order={{ id: 1 }} onClose={jest.fn()} />))
  expect(container.textContent).toContain('Không có quyền xem tồn kho')
  expect(InAppEvent.emit).not.toHaveBeenCalled()
})
