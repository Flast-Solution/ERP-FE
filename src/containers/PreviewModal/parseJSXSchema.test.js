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
