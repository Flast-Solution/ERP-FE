import { fetchTags, listTags, saveTag, deleteTag, saveTagProducts } from './service';
import { RequestUtils } from '@flast-erp/core/utils';
jest.mock('@flast-erp/core/utils', () => ({
  RequestUtils: { Get: jest.fn(), Post: jest.fn(), Delete: jest.fn() },
}));
beforeEach(() => jest.clearAllMocks());
test('loads product tags by default', async () => {
  RequestUtils.Get.mockResolvedValue({ errorCode: 200, data: [{ id: 1, name: 'A' }] });
  expect(await listTags()).toEqual([{ id: 1, name: 'A' }]);
  expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/tag/fetch', {
    name: '',
    type: 'product',
    page: 1,
    limit: 20,
  });
});
test('saves only supported fields and preserves update identity', async () => {
  RequestUtils.Post.mockResolvedValue({ success: true, data: null });
  await saveTag({ name: ' A ', slug: 'a', color: 'red', type: 'product' });
  expect(RequestUtils.Post).toHaveBeenLastCalledWith('/erp/tag/save', {
    id: null,
    name: 'A',
    description: '',
    type: 'product',
  });
  await saveTag({ id: 9, name: 'B', description: 'text', type: 'pages' });
  expect(RequestUtils.Post).toHaveBeenLastCalledWith('/erp/tag/save', {
    id: 9,
    name: 'B',
    description: 'text',
    type: 'pages',
  });
});
test('deletes via DELETE with id in query and propagates rejection', async () => {
  RequestUtils.Delete.mockResolvedValue({ success: false, message: 'Không thể xóa' });
  await expect(deleteTag(9)).rejects.toThrow('Không thể xóa');
  expect(RequestUtils.Delete).toHaveBeenCalledWith('/erp/tag/delete?id=9');
});

test('rejects unsupported tag types before sending', async () => {
  await expect(saveTag({ name: 'A', type: 'other' })).rejects.toThrow('Vui lòng chọn loại tag');
  expect(RequestUtils.Post).not.toHaveBeenCalled();
});

test('passes the selected pages filter to the list API', async () => {
  RequestUtils.Get.mockResolvedValue({ success: true, data: [] });
  await listTags('pages');
  expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/tag/fetch', {
    name: '',
    type: 'pages',
    page: 1,
    limit: 20,
  });
});

test('passes name and server pagination and reads the paged response', async () => {
  RequestUtils.Get.mockResolvedValue({
    errorCode: 200,
    data: {
      embedded: [{ id: 21, name: 'hàng' }],
      page: { totalElements: 41 },
    },
  });
  expect(await fetchTags({ name: 'hàng', type: 'product', page: 2, limit: 20 })).toEqual({
    items: [{ id: 21, name: 'hàng' }],
    total: 41,
  });
  expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/tag/fetch', {
    name: 'hàng',
    type: 'product',
    page: 2,
    limit: 20,
  });
});

test('keeps tags beyond the first page available for editing', async () => {
  RequestUtils.Get.mockResolvedValueOnce({
    success: true,
    data: {
      items: Array.from({ length: 20 }, (_, id) => ({ id })),
      total: 21,
    },
  }).mockResolvedValueOnce({ success: true, data: { items: [{ id: 21 }], total: 21 } });
  expect(await listTags()).toHaveLength(21);
  expect(RequestUtils.Get).toHaveBeenLastCalledWith('/erp/tag/fetch', {
    name: '',
    type: 'product',
    page: 2,
    limit: 20,
  });
});

test('assigns a tag to selected products with the supported payload', async () => {
  RequestUtils.Post.mockResolvedValue({ errorCode: 200, success: true });
  await saveTagProducts(19, [777, 789, 777]);
  expect(RequestUtils.Post).toHaveBeenCalledWith('/erp/tag/save-products', {
    tagId: 19,
    productIds: [777, 789],
  });
});

test('propagates a failed tag assignment instead of reporting success', async () => {
  RequestUtils.Post.mockResolvedValue({ success: false, message: 'Không có quyền' });
  await expect(saveTagProducts(19, [777])).rejects.toThrow('Không có quyền');
});
