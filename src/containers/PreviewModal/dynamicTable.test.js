/* Tests controlled inputs with React DOM directly. */
/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { buildJSX } from './buildJSX'
import { parseJsxToSchema } from './parseJSXSchema'
import { createDynamicTableComponents } from './DynamicTableField'
import { DYNAMIC_TABLE_FACTORY_SOURCE } from './dynamicTableRuntimeSource'
import { prepareJsxForRemoteBuild } from './buildService'
import { transformSync } from '@babel/core'

const config = { widget: 'dynamic_table', allowAddRows: true, allowAddColumns: true, columns: [
  { key: 'code', label: 'Mã lot', type: 'text', required: true },
  { key: 'quantity', label: 'Số lượng', type: 'number' },
] }

test('generated JSX keeps table config and parser restores columns and types', () => {
  const source = buildJSX({ meta: { name: 'Lot' }, fields: [{ inputType: 'dynamic_table', fieldKey: 'lots', label: 'Lots', config }] }).plain
  expect(source).toContain("import * as DynamicTableUI from 'antd'")
  expect(source).not.toMatch(/import \{[^\n]*FormDynamicTableField[^\n]*from '@flast/)
  expect(source).toContain('disabled={readOnly}')
  const field = parseJsxToSchema(source).fields[0]
  expect(field).toMatchObject({ inputType: 'dynamic_table', fieldKey: 'lots', config })
  expect(() => transformSync(prepareJsxForRemoteBuild(source), {
    presets: ['@babel/preset-react'], configFile: false, babelrc: false,
  })).not.toThrow()
})

test('embedded helper contains a complete factory with no compiler-generated dependencies', () => {
  expect(DYNAMIC_TABLE_FACTORY_SOURCE).toContain('function createDynamicTableComponents(React, UI)')
  expect(DYNAMIC_TABLE_FACTORY_SOURCE).not.toMatch(/_react|_objectSpread|_jsxRuntime/)
})

test('validates required table rows and fixed cells while accepting numeric zero', async () => {
  const { FormDynamicTableField } = createDynamicTableComponents(React, { Form: { Item: () => null } })
  const field = FormDynamicTableField({ name: 'lots', required: true, tableConfig: config })
  const validate = field.props.rules[0].validator
  await expect(validate(null, { rows: [] })).rejects.toThrow('ít nhất một dòng')
  await expect(validate(null, { rows: [{ quantity: 0 }] })).rejects.toThrow('Mã lot')
  await expect(validate(null, { rows: [{ code: 'LOT', quantity: 0 }] })).resolves.toBeUndefined()
})

test('requires a selected row when a column is enabled for ERP updates', async () => {
  const { FormDynamicTableField } = createDynamicTableComponents(React, { Form: { Item: () => null } })
  const tableConfig = { ...config, columns: config.columns.map(column => ({ ...column, erpExport: true })) }
  const validate = FormDynamicTableField({ name: 'lots', tableConfig }).props.rules[0].validator
  await expect(validate(null, { rows: [{ code: 'LOT' }] })).rejects.toThrow('chọn dòng')
  await expect(validate(null, { rows: [{ code: 'LOT' }], selectedRowIndex: 0 })).resolves.toBeUndefined()
})

test('keeps the selected lot when an earlier row is removed and clears selection when that lot is deleted', async () => {
  const Table = jest.fn(() => null)
  const UI = { Table, Space: ({ children }) => <div>{children}</div>,
    Button: ({ children }) => <button>{children}</button>, Input: () => null, Select: () => null,
    Popconfirm: ({ children }) => children }
  const { DynamicTableControl } = createDynamicTableComponents(React, UI)
  const tableConfig = { allowAddColumns: false, columns: [{ key: 'code', label: 'Mã', type: 'text', erpExport: true }] }
  let lastValue
  const Harness = () => {
    const [value, setValue] = React.useState({ rows: [{ code: 'A' }, { code: 'B' }], columns: [] })
    return <DynamicTableControl tableConfig={tableConfig} value={value} onChange={next => { lastValue = next; setValue(next) }} />
  }
  const root = createRoot(document.createElement('div'))
  global.IS_REACT_ACT_ENVIRONMENT = true
  try {
    await act(async () => root.render(<Harness />))
    await act(async () => Table.mock.calls.at(-1)[0].rowSelection.onChange(['1']))
    expect(lastValue.selectedRowIndex).toBe(1)
    await act(async () => Table.mock.calls.at(-1)[0].columns.at(-1).render(null, {}, 0).props.onConfirm())
    expect(lastValue).toMatchObject({ rows: [{ code: 'B' }], selectedRowIndex: 0 })
    await act(async () => Table.mock.calls.at(-1)[0].columns.at(-1).render(null, {}, 0).props.onConfirm())
    expect(lastValue).toMatchObject({ rows: [], selectedRowIndex: null })
  } finally {
    await act(async () => root.unmount())
    delete global.IS_REACT_ACT_ENVIRONMENT
  }
})

test('adds rows and typed columns without overwriting entered values', async () => {
  const Table = jest.fn(() => null)
  const Input = jest.fn(() => null)
  const Select = jest.fn(() => null)
  const UI = { Table, Input, Select, Space: ({ children }) => <div>{children}</div>,
    Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
    Checkbox: () => null, InputNumber: () => null, Popconfirm: ({ children }) => children,
    message: { warning: jest.fn() } }
  const { DynamicTableControl } = createDynamicTableComponents(React, UI)
  let lastValue
  const Harness = () => {
    const [value, setValue] = React.useState({ rows: [{ code: 'LOT', quantity: 0 }], columns: [] })
    return <DynamicTableControl tableConfig={config} value={value} onChange={next => { lastValue = next; setValue(next) }} />
  }
  const container = document.createElement('div')
  const root = createRoot(container)
  global.IS_REACT_ACT_ENVIRONMENT = true
  try {
    await act(async () => root.render(<Harness />))
    await act(async () => container.querySelector('button').click())
    expect(lastValue.rows).toEqual([{ code: 'LOT', quantity: 0 }, {}])
    await act(async () => Input.mock.calls.at(-1)[0].onChange({ target: { value: 'Chất lượng' } }))
    await act(async () => Select.mock.calls.at(-1)[0].onChange('boolean'))
    await act(async () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === '+ Thêm cột').click())
    expect(lastValue.columns[0]).toMatchObject({ label: 'Chất lượng', type: 'boolean' })
    expect(lastValue.rows[0]).toEqual({ code: 'LOT', quantity: 0 })
    expect(Table.mock.calls.at(-1)[0].columns).toHaveLength(4)
  } finally {
    await act(async () => root.unmount())
    delete global.IS_REACT_ACT_ENVIRONMENT
  }
})
