import useFormBuilderStore from './useFormBuilderStore'
// The builder's default configs contain JSON values; jsdom lacks structuredClone.
beforeAll(() => { global.structuredClone = value => JSON.parse(JSON.stringify(value)) })
afterAll(() => { delete global.structuredClone })

jest.mock('@/utils/fieldTypes', () => require('../utils/fieldTypes'), { virtual: true })
jest.mock('@/utils/slugify', () => ({ slugifyFieldKey: value => value }), { virtual: true })
jest.mock('@/utils/formSubmitButton', () => require('../utils/formSubmitButton'), { virtual: true })

test('saves dynamic tables as supported block type and restores the editor type', () => {
  useFormBuilderStore.getState().reset()
  useFormBuilderStore.getState().addField('dynamic_table')
  const field = useFormBuilderStore.getState().fields[0]
  useFormBuilderStore.getState().updateField(field._id, { fieldKey: 'lots', label: 'Lots' })
  const payload = useFormBuilderStore.getState().toPayload()
  expect(payload.fields[0]).toMatchObject({ inputType: 'block', fieldKey: 'lots', isIndexed: false,
    config: { widget: 'dynamic_table', columns: expect.any(Array), allowAddRows: true } })
  useFormBuilderStore.getState().importGeneratedTemplate({ ...payload, provenance: { source: 'user' } })
  const { __provenance, ...savedConfig } = payload.fields[0].config
  expect(useFormBuilderStore.getState().fields[0]).toMatchObject({ inputType: 'dynamic_table', fieldKey: 'lots', config: savedConfig })
  useFormBuilderStore.getState().reset()
})
