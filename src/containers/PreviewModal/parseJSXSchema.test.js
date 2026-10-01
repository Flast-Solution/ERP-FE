import { parseJsxToSchema } from './parseJSXSchema'

describe('parseJsxToSchema', () => {
  it('parses component props containing nested JSX', () => {
    const code = `
      const OPTIONS = [
        { value: 'YES', label: 'Có' },
        { value: 'NO', label: 'Không' },
      ]

      const Example = () => (
        <div>
          <FormRadioGroup
            name="need_clarity"
            label={(
              <FieldLabel
                number="1"
                label="Khách có nhu cầu rõ ràng?"
                code="need_clarity"
                required
              />
            )}
            required
            options={OPTIONS}
          />
          <FormTextArea
            name="notes"
            label={<FieldLabel number="4" label="Ghi chú" code="notes" />}
          />
        </div>
      )
    `

    const result = parseJsxToSchema(code)

    expect(result.fields.map(field => [field.fieldKey, field.inputType])).toEqual([
      ['need_clarity', 'radio'],
      ['notes', 'textarea'],
    ])
  })
})

it('stores Form.List as one root value instead of required dynamic child keys', () => {
  const schema = parseJsxToSchema(`
    <Form>
      <FormInput name={'notes'} label="Ghi chú" />
      <Form.List name="lots">
        {(fields) => fields.map(field => (
          <Col span={12}>
            <FormInput name={[field.name, 'code_lot']} label="Mã lot" required />
            <FormSelectAPI name={['lots', field.name, 'nguoi_nhap']} required />
          </Col>
        ))}
      </Form.List>
    </Form>
  `)
  expect(schema.fields.map(field => field.fieldKey)).toEqual(['notes', 'lots'])
  expect(schema.fields[1]).toMatchObject({ inputType: 'block', isRequired: false, children: [] })
})

it('rejects unresolved runtime names outside a list instead of creating literal keys', () => {
  expect(() => parseJsxToSchema(`<FormInput name={[field.name, 'code_lot']} required />`))
    .toThrow('Mã field phải là chuỗi cố định')
})

it('keeps nested lists within their outer root value', () => {
  const schema = parseJsxToSchema(`<Form.List name="lots">
    <Form.List name={[field.name, 'checks']}><FormInput name={[item.name, 'value']} /></Form.List>
  </Form.List>`)
  expect(schema.fields.map(field => field.fieldKey)).toEqual(['lots'])
})
