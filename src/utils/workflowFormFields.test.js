import { collectWorkflowValueFields } from './workflowFormFields'

describe('workflow source fields', () => {
  test('preserves flat controls and their metadata', () => {
    const fields = [{ fieldKey: 'note', inputType: 'textarea', config: { rows: 3 } }]
    expect(collectWorkflowValueFields(fields)).toEqual(fields)
    expect(collectWorkflowValueFields(fields)[0]).toBe(fields[0])
  })

  test('exposes controls inside nested blocks with their submitted keys', () => {
    const fields = [
      { fieldKey: 'note', inputType: 'text' },
      { fieldKey: 'lots', inputType: 'block', children: [
        { fieldKey: 'lot_number', inputType: 'text' },
        { fieldKey: 'weights', inputType: 'block', children: [
          { fieldKey: 'quantity', inputType: 'decimal' },
        ] },
      ] },
    ]
    expect(collectWorkflowValueFields(fields).map(field => field.fieldKey))
      .toEqual(['note', 'lot_number', 'quantity'])
  })

  test('ignores empty blocks and handles missing or malformed children', () => {
    expect(collectWorkflowValueFields()).toEqual([])
    expect(collectWorkflowValueFields(null)).toEqual([])
    expect(collectWorkflowValueFields([
      null,
      { fieldKey: 'layout', input_type: 'block', children: {} },
      { fieldKey: 'enabled', inputType: 'checkbox', children: null },
    ])).toEqual([{ fieldKey: 'enabled', inputType: 'checkbox', children: null }])
  })

  test('preserves Form.List array values, including legacy schemas', () => {
    const legacy = { fieldKey: 'lots', inputType: 'block', children: [] }
    const list = { ...legacy, config: { valueType: 'array' } }
    expect(collectWorkflowValueFields([legacy])).toEqual([legacy])
    expect(collectWorkflowValueFields([list])).toEqual([list])
  })
})
