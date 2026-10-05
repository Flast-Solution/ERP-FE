import { getTableErpFields, projectTableErpValues } from './dynamicTableErp'
import { collectWorkflowValueFields } from './workflowFormFields'

const field = { fieldKey: 'nhap_lot', label: 'Nhập lot', inputType: 'block', config: { widget: 'dynamic_table', columns: [
  { key: 'code', label: 'Mã lot', type: 'text', erpExport: true },
  { key: 'quantity', label: 'Số lượng', type: 'number', erpExport: true },
  { key: 'passed', label: 'Chất lượng', type: 'boolean', erpExport: true },
  { key: 'user', label: 'Người nhập', type: 'text' },
] } }

test('exposes only checked columns with stable keys and readable labels', () => {
  expect(getTableErpFields(field).map(item => item.fieldKey)).toEqual(['nhap_lot__code', 'nhap_lot__quantity', 'nhap_lot__passed'])
  const options = collectWorkflowValueFields([field])
  expect(options[1].label).toBe('Nhập lot → Mã lot')
  expect(options[3].inputType).toBe('checkbox')
})

test('exports selected row values preserving zero and false, and does not mutate the table', () => {
  const values = { nhap_lot: { rows: [{ code: 'A', quantity: 100 }, { code: 'B', quantity: 0, passed: false }], selectedRowIndex: 1 },
    nhap_lot__code: 'stale' }
  const result = projectTableErpValues(values, [field])
  expect(result).toMatchObject({ nhap_lot__code: 'B', nhap_lot__quantity: 0, nhap_lot__passed: false })
  expect(values.nhap_lot__code).toBe('stale')
  expect(result.nhap_lot).toBe(values.nhap_lot)
  expect(result).not.toHaveProperty('nhap_lot__user')
})

test.each([null, -1, 3])('does not pick the first row when selection %s is invalid', selectedRowIndex => {
  const result = projectTableErpValues({ nhap_lot: { rows: [{ code: 'A' }], selectedRowIndex } }, [field])
  expect(result.nhap_lot__code).toBeNull()
})

test('supports tables inside layout blocks and leaves ordinary fields intact', () => {
  expect(projectTableErpValues({ note: 'keep', nhap_lot: { rows: [{ code: 'A' }], selectedRowIndex: 0 } },
    [{ fieldKey: 'layout', children: [field] }])).toMatchObject({ note: 'keep', nhap_lot__code: 'A' })
})
