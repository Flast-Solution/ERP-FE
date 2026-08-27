import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import ImportedTextInspector from './ImportedTextInspector'
import DocumentNodeContent from './DocumentNodeContent'
import { configureImportedText, getImportedManualPath, getImportedSkuContent } from './importedTextBindings'
import { getValueByPath, resolveBindingValue, resolveNodeValue, serializeTemplate } from './utils'
import { buildQuotationPayload, createQuotationData, mergeSavedQuotationOrder } from '../../containers/Order/List/utils/quotationMappers'

jest.mock('@/containers/PreviewModal/uploadUtils', () => ({ resolveRuntimeAssetUrl: value => value }), { virtual: true })
jest.mock('antd', () => {
  const React = require('react')
  const Input = props => React.createElement('input', props)
  Input.TextArea = props => React.createElement('textarea', props)
  return {
    Form: { Item: ({ label, children }) => React.createElement('label', null, label, children) },
    Input,
    InputNumber: ({ precision, onChange, ...props }) => React.createElement('input', { ...props, type: 'number', onChange: event => onChange(Number(event.target.value)) }),
    Select: ({ options, onChange, value, ...props }) => React.createElement('select', {
      value, onChange: event => onChange(event.target.value), 'aria-label': props['aria-label'],
    }, options.map(option => React.createElement('option', { key: option.value, value: option.value }, option.label))),
  }
})

const imported = {
  id: 'pdf-text-1', type: 'richText', importedFromPdf: true, content: 'MOQ: 1000',
  layout: { absolute: { page: 0, x: 70, y: 100, width: 160, height: 20 } },
  style: { fontSize: 12, fontFamily: 'Arial', color: '#000000' },
}
const order = {
  id: 34014,
  details: [
    { id: 34079, productName: 'Hộp 1', skuDetails: [{ text: 'BỒI VỎ', values: [{ text: 'Giấy kraft' }] }] },
    { id: 34080, productName: 'Hộp 2', skuDetails: [
      { text: 'DẠNG KẾT CẤU', values: [{ text: 'ÂM DƯƠNG NẮP LƯNG' }] },
      { text: 'BỒI VỎ', values: [{ text: 'Giấy trắng' }, { text: 'Giấy màu' }] },
    ] },
  ],
}
const data = { customerOrder: order }

describe('PDF text content bindings', () => {
  it('retains SKU HTML through saving and switching modes, including explicitly empty HTML', () => {
    const content = '<strong>Composition:</strong> {{ skuDetails.values.text }}'
    const sku = { ...configureImportedText(imported, 'sku'), content, pdfSkuContent: content, skuAttributeLabel: 'Thành phần', pdfSkuRowIndex: 1 }
    const restored = JSON.parse(JSON.stringify(serializeTemplate({ nodes: [configureImportedText(sku, 'manual')] }))).nodes[0]
    const reopened = configureImportedText(restored, 'sku')
    expect(reopened).toMatchObject({ type: 'richText', content, skuAttributeLabel: 'Thành phần', pdfSkuRowIndex: 1 })
    expect(configureImportedText(reopened, 'static').content).toBe(imported.content)
    expect(getImportedSkuContent({ ...sku, pdfSkuContent: '' })).toBe('')
  })

  it('preserves PDF geometry and original text through mode changes and serialization', () => {
    const manual = configureImportedText(imported, 'manual')
    expect(manual.content).toBe('{{ input:customerOrder.quoteFields.pdf-text-1 }}')
    expect(getImportedManualPath({ ...imported, id: 'pdf-text-2' })).not.toBe(getImportedManualPath(imported))
    const sku = configureImportedText(manual, 'sku')
    expect(sku.binding).toBe('customerOrder.details.0.skuDetails.values.text')
    const saved = JSON.parse(JSON.stringify(serializeTemplate({ nodes: [sku] }))).nodes[0]
    expect(saved).toMatchObject({ id: imported.id, layout: imported.layout, style: imported.style, importedFromPdf: true })
    expect(configureImportedText(saved, 'static').content).toBe(imported.content)
    expect(configureImportedText(saved, 'manual').content).toBe(manual.content)
    expect(imported.content).toBe('MOQ: 1000')
  })

  it('selects the requested product row and SKU label while retaining aggregate table bindings', () => {
    const sku = { ...configureImportedText(imported, 'sku'), binding: 'customerOrder.details.1.skuDetails.values.text', skuAttributeLabel: '  bồi   vỏ  ' }
    expect(resolveNodeValue(sku, data)).toBe('Giấy trắng\nGiấy màu')
    expect(resolveNodeValue({ ...sku, skuAttributeLabel: '' }, data)).toBe('ÂM DƯƠNG NẮP LƯNG\nGiấy trắng\nGiấy màu')
    expect(resolveBindingValue(order.details[0], 'skuDetails.values.text', 'BỒI VỎ')).toEqual(['Giấy kraft'])
    expect(resolveNodeValue({ binding: 'customerOrder.details.productName' }, data)).toBe('Hộp 1\nHộp 2')
    expect(resolveNodeValue({ ...sku, binding: 'customerOrder.details.skuDetails.values.text' }, data)).toBe('Giấy kraft\nGiấy trắng\nGiấy màu')
    expect(resolveNodeValue({ ...sku, skuAttributeLabel: 'Không có', fallback: '-' }, data)).toBe('-')
    expect(getValueByPath(data, 'customerOrder.details.8.productName', '-')).toBe('-')
  })

  it('keeps automatic field selection separate from the SKU attribute filter', () => {
    const sku = { ...configureImportedText(imported, 'sku'), skuAttributeLabel: 'BỒI VỎ' }
    const binding = configureImportedText(sku, 'binding', [{ path: 'customerOrder.id' }])
    expect(resolveNodeValue(binding, data)).toBe('34014')
    const aggregate = { ...binding, binding: 'customerOrder.details.skuDetails.values.text' }
    expect(resolveNodeValue(aggregate, data)).toContain('ÂM DƯƠNG NẮP LƯNG')
  })

  it('round-trips imported manual fields into the correct order/detail quoteConfig', () => {
    const template = { nodes: [
      configureImportedText(imported, 'manual'),
      configureImportedText({ ...imported, id: 'pdf-text-2', pdfManualPath: 'customerOrder.details.1.moq' }, 'manual'),
    ] }
    const draft = createQuotationData(order, template)
    draft.customerOrder.quoteFields = { 'pdf-text-1': 'Ghi chú mới' }
    draft.customerOrder.details[1].moq = '2000'
    const payload = buildQuotationPayload(draft, template, order)
    expect(payload.quoteConfig.manualValues).toEqual({ 'customerOrder.quoteFields.pdf-text-1': 'Ghi chú mới' })
    expect(payload.details[0].quoteConfig).toBeUndefined()
    expect(payload.details[1].quoteConfig.manualValues).toEqual({ moq: '2000' })
    expect(payload.details[1].moq).toBeUndefined()
    const reopened = createQuotationData(mergeSavedQuotationOrder(order, payload), template)
    expect(getValueByPath(reopened, getImportedManualPath(template.nodes[0]))).toBe('Ghi chú mới')
    expect(getValueByPath(reopened, 'customerOrder.details.1.moq')).toBe('2000')
  })
})

describe('imported PDF text inspector and rendering', () => {
  let container
  let root
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    root = createRoot(container)
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    delete global.IS_REACT_ACT_ENVIRONMENT
  })
  const mount = async element => {
    // eslint-disable-next-line testing-library/no-unnecessary-act -- React DOM root.render requires act.
    await act(async () => root.render(element))
  }

  it('offers manual and SKU modes and displays the row/attribute configuration', async () => {
    const onChange = jest.fn()
    await mount(<ImportedTextInspector node={imported} onChange={onChange} />)
    const select = container.querySelector('select')
    expect([...select.options].map(option => option.value)).toEqual(['static', 'manual', 'binding', 'sku'])
    await act(async () => {
      select.value = 'sku'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const sku = onChange.mock.calls[0][0]
    await mount(<ImportedTextInspector node={sku} onChange={onChange} />)
    expect(container.querySelector('[aria-label="Dòng sản phẩm"]').value).toBe('1')
    expect(container.querySelector('[aria-label="Thuộc tính SKU"]')).not.toBeNull()
    const textarea = container.querySelector('textarea')
    expect(textarea.value).toBe('{{ skuDetails.values.text }}')
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(textarea, '<b>Composition:</b> {{ skuDetails.value.text }}')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(onChange.mock.calls.at(-1)[0]).toMatchObject({ type: 'richText', pdfContentMode: 'sku', content: '<b>Composition:</b> {{ skuDetails.value.text }}' })
    await mount(<ImportedTextInspector node={configureImportedText(sku, 'manual')} onChange={onChange} />)
    expect(container.querySelector('[aria-label="Key nhập tay"]').value).toBe(getImportedManualPath(imported))
  })

  it.each(['values', 'value'])('renders HTML with skuDetails.%s.text for the selected product and attribute', async property => {
    const sku = {
      ...configureImportedText(imported, 'sku'),
      pdfSkuRowIndex: 1,
      skuAttributeLabel: '  thành   phần ',
      content: `<strong>Composition:</strong> {{ skuDetails.${property}.text }}<br/>Order: {{ customerOrder.id }}`,
    }
    const skuData = { customerOrder: { id: 34014, details: [
      { skuDetails: [{ text: 'Thành phần', values: [{ text: 'Cotton' }] }] },
      { skuDetails: [
        { text: 'Màu sắc', values: [{ text: 'Đỏ' }] },
        { text: 'THÀNH PHẦN', values: [{ text: 'Polyester' }, { text: 'Spandex' }] },
      ] },
    ] } }
    await mount(<DocumentNodeContent node={sku} data={skuData} preview />)
    expect(container.querySelector('strong').textContent).toBe('Composition:')
    expect(container.textContent).toBe('Composition: Polyester\nSpandexOrder: 34014')
    await mount(<DocumentNodeContent node={{ ...sku, skuAttributeLabel: 'Không có' }} data={skuData} preview />)
    expect(container.textContent).toBe('Composition: Order: 34014')
  })

  it('treats SKU values as text and keeps existing dataField SKU templates working', async () => {
    const sku = { ...configureImportedText(imported, 'sku'), skuAttributeLabel: 'BỒI VỎ', content: '<strong>Composition:</strong> {{ skuDetails.values.text }}' }
    const skuData = { customerOrder: { details: [{ skuDetails: [{ text: 'BỒI VỎ', values: [{ text: '<b>Cotton</b> & Polyester' }] }] }] } }
    await mount(<DocumentNodeContent node={sku} data={skuData} preview />)
    expect(container.textContent).toBe('Composition: <b>Cotton</b> & Polyester')
    expect(container.querySelector('b')).toBeNull()
    const legacy = { ...sku, type: 'dataField', content: imported.content }
    await mount(<DocumentNodeContent node={legacy} data={data} preview />)
    expect(container.textContent).toBe('Giấy kraft')
    await mount(<ImportedTextInspector node={{ ...legacy, pdfSkuContent: undefined }} onChange={jest.fn()} />)
    expect(container.querySelector('textarea').value).toBe('{{ skuDetails.values.text }}')
  })

  it('renders SKU values and emits edits from manual PDF text while honoring read-only mode', async () => {
    const sku = { ...configureImportedText(imported, 'sku'), skuAttributeLabel: 'BỒI VỎ' }
    await mount(<DocumentNodeContent node={sku} data={data} preview />)
    expect(container.textContent).toBe('Giấy kraft')
    const manual = configureImportedText({ ...imported, pdfManualPath: 'customerOrder.details.1.moq' }, 'manual')
    const manualData = { customerOrder: { details: [{}, { moq: '2000' }] } }
    const onManualFieldChange = jest.fn()
    await mount(<DocumentNodeContent node={manual} data={manualData} preview editable onManualFieldChange={onManualFieldChange} />)
    const input = container.querySelector('input')
    expect(input.value).toBe('2000')
    expect(input.placeholder).toBe('Nhập moq')
    expect(input.style.background).toContain('rgba(37, 99, 235')
    await act(async () => {
      input.value = '3000'
      input.dispatchEvent(new Event('focusout', { bubbles: true }))
    })
    expect(onManualFieldChange).toHaveBeenCalledWith('customerOrder.details.1.moq', '3000')
    await mount(<DocumentNodeContent node={manual} data={manualData} preview />)
    expect(container.querySelector('input')).toBeNull()
    expect(container.textContent).toBe('2000')
  })
})
