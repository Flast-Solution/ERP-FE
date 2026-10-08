/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Table } from 'antd'
import OrderDetailLots from './OrderDetailLots'

jest.mock('antd', () => ({ Table: jest.fn(() => null), Alert: () => null, Button: () => null, Checkbox: () => null }))
jest.mock('../utils/orderDetailLots', () => ({ fetchOrderDetailLots: jest.fn() }))

test('shows only the LOT data table, including template fields and a pinned LOT test column', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  const container = document.createElement('div')
  const root = createRoot(container)
  const lots = ['1', '2'].map((code, index) => ({ code_lot: code, so_luong: 10, _source: 'nhap_lot',
    _rowKey: `lot-${index}`, _instanceId: 120, _stepName: 'Nhập', _lotTable: { tests: {} },
    danh_gia: { quality: 'OK', lotTest: true }, _criteria: [
      { id: 'lotTest', name: 'LOT test', type: 'boolean' }, { id: 'quality', name: 'Chất lượng', type: 'text' },
    ] }))
  try {
    await act(async () => root.render(<OrderDetailLots detailId={2} lots={lots} unit="m" />))
    const props = Table.mock.calls.at(-1)[0]
    expect(props.dataSource).toEqual(lots)
    expect(props.columns.map(column => column.title)).toEqual(['Mã LOT', 'Số lượng', 'Chất lượng', 'LOT test'])
    expect(props.columns.at(-1).fixed).toBe('right')
    expect(props.columns[1].render(10)).toBe('10 m')
    expect(container.textContent).not.toMatch(/Workflow|1\. Nhập LOT|Bảng động|House|Third party|master/)
  } finally {
    await act(async () => root.unmount())
    delete global.IS_REACT_ACT_ENVIRONMENT
  }
})
