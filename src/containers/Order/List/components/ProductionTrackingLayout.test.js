/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { Table } from 'antd'
import createOrderTrackingColumns from '../columns/createOrderTrackingColumns'
import OrderTrackingExpandedRow from './OrderTrackingExpandedRow'
import { getOrderTrackingMetrics } from '../utils/orderTracking'

jest.mock('@flast-erp/core/utils', () => ({ formatTime: value => value }), { virtual: true })
jest.mock('./OrderActions', () => () => null)
jest.mock('./OrderDetailLots', () => () => null)
jest.mock('./ProductionWorkflowActions', () => () => null)
jest.mock('antd', () => ({
  Table: jest.fn(() => null), Typography: { Text: () => null },
  Tag: () => null, Tooltip: () => null, Progress: () => null, Space: () => null,
}))

const record = {
  id: 1, details: [{ id: 2, quantity: 10 }],
  manufactureProduct: [{ id: 3, code: 'LSX-3', details: [{ orderDetailId: 2, target: 10 }] }],
  shippingHistory: [{ orderDetailId: 2 }, { orderDetailId: 2 }],
}

test('production layout hides requested columns without changing the overview columns', () => {
  expect(createOrderTrackingColumns({ productionOverview: true }).map(column => column.title))
    .toEqual(['Mã đơn', 'Sản phẩm / SKU', 'Đơn hàng', 'Sản xuất', 'Kho', 'Action'])
  expect(createOrderTrackingColumns({}).map(column => column.title))
    .toEqual(['Mã đơn', 'Khách hàng', 'Sản phẩm / SKU', 'Đơn hàng', 'Sản xuất', 'Kho', 'Xuất kho & giao hàng', 'Tài chính', 'Action'])
})

test('production expansion shows production and receipts with manufacture API data', () => {
  renderToStaticMarkup(<OrderTrackingExpandedRow record={record} productionOverview />)
  const props = Table.mock.calls.at(-1)[0]
  expect(props.columns.map(column => column.key)).toEqual(['detail', 'production', 'inbound', 'productionActions'])
  const codeColumn = props.columns[0].children.find(column => column.key === 'productionCode')
  expect(codeColumn.title).toBe('Mã lệnh sản xuất')
  expect(codeColumn.render(props.dataSource[0]._manufactureProduct)).toBe('LSX-3')
  expect(props.dataSource).toHaveLength(1)
  expect(props.dataSource[0]._manufactureProduct.manufactureProduct.code).toBe('LSX-3')
  expect(getOrderTrackingMetrics(record).plannedProductionQuantity).toBe(10)
})

test('regular overview keeps all expanded groups and shipping rows', () => {
  renderToStaticMarkup(<OrderTrackingExpandedRow record={record} />)
  const props = Table.mock.calls.at(-1)[0]
  expect(props.columns.map(column => column.key)).toEqual(['detail', 'production', 'inbound', 'outbound'])
  expect(props.dataSource).toHaveLength(2)
})


test('opening lots removes row spans so the expanded row spans the whole table', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  global.IS_REACT_ACT_ENVIRONMENT = true
  try {
    await act(async () => root.render(<OrderTrackingExpandedRow record={record} />))
    let props = Table.mock.calls.at(-1)[0]
    expect(props.columns[0].children[0].onCell(props.dataSource[0]).rowSpan).toBe(2)
    expect(props.columns[0].children[0].onCell(props.dataSource[1]).rowSpan).toBe(0)
    await act(async () => props.onRow(props.dataSource[0]).onClick())
    props = Table.mock.calls.at(-1)[0]
    expect(props.expandable.expandedRowKeys).toEqual(['2-0'])
    props.columns[0].children.filter(column => column.onCell).forEach(column => {
      props.dataSource.forEach(row => expect(column.onCell(row).rowSpan).toBe(1))
    })
    await act(async () => props.onRow(props.dataSource[0]).onClick())
    props = Table.mock.calls.at(-1)[0]
    expect(props.columns[0].children[0].onCell(props.dataSource[0]).rowSpan).toBe(2)
  } finally {
    await act(async () => root.unmount())
    delete global.IS_REACT_ACT_ENVIRONMENT
  }
})

test('production rollup columns show parent and detail quantities and reuse loaded lot rows', () => {
  const lots = [{ code_lot: 'L1', so_luong: 6, _criteria: [] }]
  const enriched = { ...record, _productionMetrics: { producedQuantity: 6, remainingProductionQuantity: 4 },
    details: [{ ...record.details[0], _productionLots: lots,
      _productionMetrics: { producedQuantity: 6, remainingProductionQuantity: 4 } }] }
  const columns = createOrderTrackingColumns({ productionOverview: true })
  const parent = columns.find(column => column.title === 'Sản xuất').children
  expect(parent.find(column => column.key === 'producedQuantity').render(null, enriched).props.children).toBe('6')
  expect(parent.find(column => column.key === 'remainingProductionQuantity').render(null, enriched).props.children).toBe('4')
  renderToStaticMarkup(<OrderTrackingExpandedRow record={enriched} productionOverview />)
  const props = Table.mock.calls.at(-1)[0]
  const child = props.columns.find(column => column.key === 'production').children
  expect(child.find(column => column.key === 'producedQuantity').render(null, props.dataSource[0])).toBe('6')
  expect(child.find(column => column.key === 'remainingProductionQuantity').render(null, props.dataSource[0])).toBe('4')
  expect(props.expandable.expandedRowRender(props.dataSource[0]).props.lots).toBe(lots)
})


test('production workflow belongs to the child once across multiple commands', () => {
  const multi = { ...record, manufactureProduct: [...record.manufactureProduct,
    { id: 4, code: 'LSX-4', details: [{ orderDetailId: 2, target: 5 }] }] }
  renderToStaticMarkup(<OrderTrackingExpandedRow record={multi} productionOverview canAttachProductionWorkflow />)
  const props = Table.mock.calls.at(-1)[0]
  const column = props.columns.find(group => group.key === 'productionActions').children.find(item => item.key === 'productionWorkflow')
  expect(column.onCell(props.dataSource[0]).rowSpan).toBe(2)
  expect(column.onCell(props.dataSource[1]).rowSpan).toBe(0)
  const view = column.render(null, props.dataSource[0])
  expect(view.props.detail.id).toBe(2)
  expect(view.props.manufactureCodes).toEqual(['LSX-3', 'LSX-4'])
  expect(view.props.canAttach).toBe(true)
  expect(column.render(null, props.dataSource[1])).toBeNull()
  const empty = { ...record, manufactureProduct: [] }
  renderToStaticMarkup(<OrderTrackingExpandedRow record={empty} productionOverview />)
  const emptyProps = Table.mock.calls.at(-1)[0]
  const emptyColumn = emptyProps.columns.find(group => group.key === 'productionActions').children.find(item => item.key === 'productionWorkflow')
  expect(emptyColumn.render(null, emptyProps.dataSource[0])).toBe('—')
})
