import {
  buildQuotationPayload,
  createQuotationData,
  mergeSavedQuotationOrder,
} from './quotationMappers'

const template = {
  nodes: [{
    type: 'container',
    children: [
      {
        type: 'dynamicTable',
        source: 'customerOrder.details',
        columns: [
          { binding: 'productName' },
          ...['moq', 'mcq', 'date', 'terms.delivery'].map(binding => ({ binding, inputMode: 'manual' })),
        ],
      },
      {
        type: 'richText',
        content: '{{ input-list:customerOrder.customerNote }} {{ input:customer.name }} {{ customerOrder.code }}',
      },
    ],
  }],
}

const makeOrder = () => ({
  id: 34014,
  dataId: 55,
  customerId: 44,
  customerReceiverName: 'Ha Za Copt',
  customerMobilePhone: '098755455',
  customerEmail: '',
  customerAddress: null,
  customerNote: null,
  shippingCost: null,
  quoteConfig: null,
  details: [34079, 34080].map(id => ({
    id,
    productId: 776,
    skuId: 11,
    productName: 'Hộp carton lạnh',
    price: id === 34079 ? 100000 : 500000,
    quantity: 5,
    quoteConfig: null,
  })),
})

describe('quotation quoteConfig mapping', () => {
  it('sends the selected quote approver beside details using the exact BE field name', () => {
    const order = makeOrder()
    const data = createQuotationData(order, template)
    const payload = buildQuotationPayload(data, template, order, 1649)
    expect(payload.aproval).toEqual({ status: 1, type: 'quote', userApproval: 1649 })
    expect(payload.details).toHaveLength(2)
    expect(payload.quoteConfig).not.toHaveProperty('aproval')
    expect(mergeSavedQuotationOrder(order, payload, { id: order.id }).aproval).toEqual(payload.aproval)
  })

  it.each([0, 2])('supports an explicit approval decision status %i', status => {
    const order = makeOrder()
    const payload = buildQuotationPayload(createQuotationData(order, template), template, order, 1649, status)
    expect(payload.aproval).toEqual({ status, type: 'quote', userApproval: 1649 })
  })

  it('does not add approval to other quotation flows', () => {
    const order = makeOrder()
    expect(buildQuotationPayload(createQuotationData(order, template), template, order)).not.toHaveProperty('aproval')
  })

  it('round-trips manual fields in nested templates without adding them to business data', () => {
    const order = makeOrder()
    const data = createQuotationData(order, template)
    Object.assign(data.customerOrder.details[0], { moq: '1000', mcq: '200', date: '20-10-2026' })
    Object.assign(data.customerOrder.details[1], { moq: '123', mcq: '333', date: '22-11-2026' })
    data.customerOrder.customerNote = 'Quotation validity: Until 30/Jul/2025\nMOQ (5000 met) and MCQ (1000 met)'
    data.customer.name = 'Tên trên báo giá'

    const payload = buildQuotationPayload(data, template, order)
    expect(payload.quoteConfig.manualValues).toEqual({
      'customerOrder.customerNote': data.customerOrder.customerNote,
      'customer.name': 'Tên trên báo giá',
    })
    expect(payload.details.map(detail => detail.quoteConfig.manualValues)).toEqual([
      { moq: '1000', mcq: '200', date: '20-10-2026' },
      { moq: '123', mcq: '333', date: '22-11-2026' },
    ])
    expect(payload.details.map(({ quoteConfig, ...detail }) => detail))
      .toEqual(order.details.map(({ quoteConfig, ...detail }) => detail))
    expect(payload.customer.name).toBe(order.customerReceiverName)
    expect(payload.customerNote).toBeNull()
    expect(payload.quoteConfig.manualValues).not.toHaveProperty('customerOrder.code')

    const saved = mergeSavedQuotationOrder(order, payload, null)
    const reopened = createQuotationData(saved, template)
    expect(reopened.customerOrder.details[0].moq).toBe('1000')
    expect(reopened.customerOrder.details[1].moq).toBe('123')
    expect(reopened.customerOrder.customerNote).toBe(data.customerOrder.customerNote)
    expect(reopened.customer.name).toBe('Tên trên báo giá')
    expect(buildQuotationPayload(reopened, template, saved)).toEqual(payload)
    expect(order).toEqual(makeOrder())
  })

  it('matches repeated products by detail ID when either the viewer or save response reorders rows', () => {
    const order = makeOrder()
    const data = createQuotationData(order, template)
    data.customerOrder.details.reverse()
    data.customerOrder.details[0].moq = '123'
    data.customerOrder.details[1].moq = '1000'
    const payload = buildQuotationPayload(data, template, order)
    const saved = mergeSavedQuotationOrder(order, payload, {
      details: [{ id: '34080', price: 600000 }, { id: '34079' }],
    })
    const reopened = createQuotationData(saved, template)
    expect(reopened.customerOrder.details.map(row => [row.id, row.moq, row.price])).toEqual([
      ['34080', '123', 600000], ['34079', '1000', 100000],
    ])
  })

  it.each(['', null, 0, false])('preserves an explicit manual value of %p over legacy data', value => {
    const order = makeOrder()
    order.customerNote = 'Old note'
    order.details[0].moq = 'Old MOQ'
    order.quoteConfig = { manualValues: { 'customerOrder.customerNote': value } }
    order.details[0].quoteConfig = { manualValues: { moq: value } }
    const data = createQuotationData(order, template)
    expect(data.customerOrder.customerNote).toBe(value)
    expect(data.customerOrder.details[0].moq).toBe(value)
    const payload = buildQuotationPayload(data, template, order)
    expect(payload.quoteConfig.manualValues['customerOrder.customerNote']).toBe(value)
    expect(payload.details[0].quoteConfig.manualValues.moq).toBe(value)
  })

  it.each([null, '{invalid', [], 'null'])('falls back to legacy fields with absent/invalid config %p', quoteConfig => {
    const order = makeOrder()
    order.quoteConfig = quoteConfig
    order.customerNote = 'Existing note'
    order.details[0].quoteConfig = quoteConfig
    order.details[0].moq = '1000'
    const data = createQuotationData(order, template)
    expect(data.customerOrder.customerNote).toBe('Existing note')
    expect(data.customerOrder.details[0].moq).toBe('1000')
    expect(buildQuotationPayload(data, template, order).details[0].quoteConfig.manualValues.moq).toBe('1000')
  })

  it('preserves other config and fields removed from the template, including JSON string responses', () => {
    const order = makeOrder()
    order.quoteConfig = JSON.stringify({ locale: 'vi', manualValues: { oldField: 'Keep' } })
    order.details[0].quoteConfig = JSON.stringify({
      otherSetting: true,
      manualValues: { moq: '2000', oldColumn: { values: [1, 2] } },
    })
    const data = createQuotationData(order, template)
    data.customerOrder.details[0].moq = ''
    const payload = buildQuotationPayload(data, template, order)
    expect(payload.quoteConfig).toMatchObject({ locale: 'vi', manualValues: { oldField: 'Keep' } })
    expect(payload.details[0].quoteConfig).toEqual({
      otherSetting: true,
      manualValues: { moq: '', oldColumn: { values: [1, 2] } },
    })
    const saved = mergeSavedQuotationOrder(order, payload, {
      quoteConfig: { serverSetting: 1 },
      details: [{ id: 34079, quoteConfig: null }, { id: 34080 }],
    })
    expect(saved.quoteConfig).toMatchObject({ locale: 'vi', serverSetting: 1, manualValues: { oldField: 'Keep' } })
    expect(saved.details[0].quoteConfig).toEqual(payload.details[0].quoteConfig)
  })

  it('handles nested bindings and JSON values without mutating the API snapshot', () => {
    const order = makeOrder()
    order.details[0].quoteConfig = { manualValues: { 'terms.delivery': { days: [1, 2] } } }
    const data = createQuotationData(order, template)
    data.customerOrder.details[0].terms.delivery.days.push(3)
    expect(order.details[0].quoteConfig.manualValues['terms.delivery'].days).toEqual([1, 2])
    const payload = buildQuotationPayload(data, template, order)
    expect(payload.details[0].quoteConfig.manualValues['terms.delivery']).toEqual({ days: [1, 2, 3] })
    expect(payload.details[0].terms).toBeUndefined()
  })

  it('does not overwrite native price when a template makes it manually editable', () => {
    const priceTemplate = { nodes: [{ type: 'dynamicTable', source: 'customerOrder.details', columns: [{ binding: 'price', inputMode: 'manual' }] }] }
    const order = makeOrder()
    const data = createQuotationData(order, priceTemplate)
    data.customerOrder.details[0].price = 250000
    const payload = buildQuotationPayload(data, priceTemplate, order)
    expect(payload.details[0].price).toBe(100000)
    expect(payload.details[0].quoteConfig.manualValues.price).toBe(250000)
    expect(createQuotationData(mergeSavedQuotationOrder(order, payload), priceTemplate).customerOrder.details[0].price).toBe(250000)
  })
})
