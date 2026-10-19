import { listTags, saveTag, deleteTag } from './service';
import { RequestUtils } from '@flast-erp/core/utils';
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Get: jest.fn(), Post: jest.fn(), Delete: jest.fn() } }));
beforeEach(() => jest.clearAllMocks());
test('loads product tags by default', async () => {
  RequestUtils.Get.mockResolvedValue({ errorCode: 200, data: [{ id: 1, name: 'A' }] });
  expect(await listTags()).toEqual([{ id: 1, name: 'A' }]);
  expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/tag/list', { type: 'product' });
});
test('saves only supported fields and preserves update identity', async () => {
  RequestUtils.Post.mockResolvedValue({ success: true, data: null });
  await saveTag({ name: ' A ', slug: 'a', color: 'red', type: 'product' });
  expect(RequestUtils.Post).toHaveBeenLastCalledWith('/erp/tag/save', { id: null, name: 'A', description: '', type: 'product' });
  await saveTag({ id: 9, name: 'B', description: 'text', type: 'pages' });
  expect(RequestUtils.Post).toHaveBeenLastCalledWith('/erp/tag/save', { id: 9, name: 'B', description: 'text', type: 'pages' });
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
  expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/tag/list', { type: 'pages' });
});
