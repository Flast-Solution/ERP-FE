import { RequestUtils } from '@flast-erp/core/utils'
import { buildLotDetailRows, fetchOrderDetailLots } from './orderDetailLots'

jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Post: jest.fn(), Get: jest.fn() } }), { virtual: true })
beforeEach(() => jest.clearAllMocks())

test('loads instances using order detail ID, then previews using instance ID', async () => {
  RequestUtils.Post.mockResolvedValueOnce({ success: true, data: [{ id: 113, entityId: 34169 }, { id: 114, entityId: 34172 }] })
    .mockResolvedValueOnce({ success: true, data: [{ processInstance: { id: 113 }, submissions: [{
      id: 57, stepCode: 'start', version: 4, valuesJson: {
        lots: [{ code_lot: '1', so_luong: 1, danh_gia: { quality: true } }],
        tieu_chi: [{ id: 'quality', name: 'Chất lượng', type: 'boolean' }],
      },
    }] }] })
  const rows = await fetchOrderDetailLots(34169)
  expect(RequestUtils.Post).toHaveBeenCalledWith('/workflow/process/instance/get-entity', { entityName: 'PRODUCTION', entityIds: [34169] })
  expect(RequestUtils.Get).not.toHaveBeenCalled()
  expect(RequestUtils.Post).toHaveBeenCalledWith('/workflow/process/preview-list', [113])
  expect(rows[0]).toMatchObject({ code_lot: '1', so_luong: 1, danh_gia: { quality: true }, _criteria: [{ id: 'quality', name: 'Chất lượng', type: 'boolean' }] })
})

test('does not request preview when no workflow exists', async () => {
  RequestUtils.Post.mockResolvedValue({ success: true, data: [] })
  expect(await fetchOrderDetailLots(34169)).toEqual([])
  expect(RequestUtils.Get).not.toHaveBeenCalled()
})

test('reports API failures instead of treating them as an empty lot list', async () => {
  RequestUtils.Post.mockResolvedValue({ success: false, message: 'Lỗi workflow' })
  await expect(fetchOrderDetailLots(34169)).rejects.toThrow('Lỗi workflow')
  expect(RequestUtils.Get).not.toHaveBeenCalled()
})

test('keeps latest version per step and template without duplicating lots', () => {
  const submission = { id: 57, stepCode: 'start', templateId: 50 }
  const rows = buildLotDetailRows({ submissions: [
    { ...submission, version: 4, valuesJson: JSON.stringify({ lots: [{ code_lot: 'new' }] }) },
    { ...submission, id: 56, version: 3, valuesJson: { lots: [{ code_lot: 'old' }] } },
  ] }, 113)
  expect(rows.map(row => row.code_lot)).toEqual(['new'])
})

test('reads nhap_lot rows and typed columns instead of stale lots in the same submission', () => {
  const rows = buildLotDetailRows({ submissions: [{ id: 57, stepCode: 'start', templateId: 52, version: 8,
    valuesJson: {
      lots: [{ code_lot: 'old', so_luong: 1 }],
      nhap_lot: {
        rows: [{ code: '1', quantity: 1000, employe: 'Duongtm', quality: true },
          { code: '2', quantity: 500, quality: false }],
        columns: [{ key: 'quality', label: 'Chất lượng', type: 'boolean' }],
      },
    },
  }] }, 113)
  expect(rows.map(row => [row.code_lot, row.so_luong])).toEqual([['1', 1000], ['2', 500]])
  expect(rows[0]._criteria).toEqual([{ id: 'quality', name: 'Chất lượng', type: 'boolean' }])
  expect(rows[1].danh_gia.quality).toBe(false)
  expect(rows[0]._source).toBe('nhap_lot')
})

test('an empty nhap_lot does not fall back to stale lots', () => {
  expect(buildLotDetailRows({ submissions: [{ valuesJson: {
    nhap_lot: { rows: [], columns: [] }, lots: [{ code_lot: 'old' }],
  } }] }, 113)).toEqual([])
})

test('a newer template for the same step supersedes the previous template', () => {
  const rows = buildLotDetailRows({ submissions: [
    { id: 1, stepCode: 'start', templateId: 50, version: 4, valuesJson: { lots: [{ code_lot: 'old' }] } },
    { id: 2, stepCode: 'start', templateId: 52, version: 8, valuesJson: { nhap_lot: { rows: [{ code: 'new', quantity: 500 }] } } },
  ] }, 113)
  expect(rows.map(row => row.code_lot)).toEqual(['new'])
})

test('reads fixed fields from preview template when columns are null and retains linked source tests', () => {
  const table = { rows: [{ id: 'lot-a', code: '1', quantity: 10, lotTest: true, quality: 'OK' }], columns: null,
    tests: { house: { rows: [{ id: 'h', name: 'Độ ẩm', standard: '≤ 5%', results: { 'lot-a': '4.2%' } }], excludedLotIds: null },
      thirdParty: { rows: [{ id: 't', name: 'Karl Fischer', standard: '≤ 5%', houseRowId: 'h', results: { 'lot-a': '5.6%' } }], excludedLotIds: null } } }
  const rows = buildLotDetailRows({ stepProcesses: { id: 220, stepCode: 'start', name: 'Nhập', formTemplate: { fields: [
    { fieldKey: 'nhap_lot', config: { columns: [{ key: 'code', label: 'Mã LOT', type: 'text' },
      { key: 'quality', label: 'Chất lượng', type: 'text' }, { key: 'lotTest', label: 'LOT test', type: 'boolean' }] } },
  ] } }, submissions: [{ id: 61, stepId: 220, version: 2, valuesJson: { nhap_lot: table } }] }, 120)
  expect(rows[0]).toMatchObject({ _lotId: 'lot-a', _stepName: 'Nhập', _rowKey: '120-61-lot-a',
    _criteria: [{ id: 'quality', name: 'Chất lượng', type: 'text' }, { id: 'lotTest', name: 'LOT test', type: 'boolean' }] })
  expect(rows[0]._lotTable.tests.thirdParty.rows[0].houseRowId).toBe('h')
  expect(rows[0]._lotTable.tests.house.rows[0].results['lot-a']).toBe('4.2%')
})
