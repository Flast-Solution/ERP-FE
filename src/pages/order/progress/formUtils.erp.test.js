import { buildWorkflowSubmissionPayload } from './formUtils'

jest.mock('./utils', () => ({ toNumberOrNull: value => value == null ? null : Number(value) }))
jest.mock('./guards', () => ({ coerceGuardValue: value => String(value) }))

test('workflow submission includes checked ERP fields from the chosen table row', () => {
  const payload = buildWorkflowSubmissionPayload({
    values: { nhap_lot: { rows: [{ quantity: 1000 }, { quantity: 500 }], columns: [], selectedRowIndex: 1 } },
    currentForm: { id: 52, fields: [{ fieldKey: 'nhap_lot', inputType: 'block', config: {
      widget: 'dynamic_table', columns: [{ key: 'quantity', label: 'Số lượng', type: 'number', erpExport: true }],
    } }] },
    currentStep: { id: 220, stepCode: 'start' },
    workflowPreview: { processInstance: { id: 113, entityType: 'PRODUCTION', entityId: 34169 } },
  })
  expect(payload.values.nhap_lot__quantity).toBe(500)
  expect(payload.values.nhap_lot.rows).toEqual([{ quantity: 1000 }, { quantity: 500 }])
  expect(payload.values.nhap_lot.selectedRowIndex).toBe(1)
})
