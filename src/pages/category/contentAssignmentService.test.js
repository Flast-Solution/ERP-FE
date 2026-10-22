import { RequestUtils } from '@flast-erp/core/utils';
import {
  fetchContentOptions,
  saveCategoryContents,
  saveTagContents,
} from './contentAssignmentService';

jest.mock('@flast-erp/core/utils', () => ({
  RequestUtils: { Get: jest.fn(), Post: jest.fn() },
}));
beforeEach(() => jest.clearAllMocks());

it('sends only categoryId and distinct contentIds when assigning to a category', async () => {
  RequestUtils.Post.mockResolvedValue({ errorCode: 200 });
  await saveCategoryContents(19, [101, 102, 101]);
  expect(RequestUtils.Post).toHaveBeenCalledWith('/erp/category/page/save-contents', {
    categoryId: 19,
    contentIds: [101, 102],
  });
});

it('sends tagId and contentIds and propagates assignment errors', async () => {
  RequestUtils.Post.mockResolvedValueOnce({ errorCode: 200 });
  await saveTagContents(1, [101, 102]);
  expect(RequestUtils.Post).toHaveBeenCalledWith('/erp/tag/save-contents', {
    tagId: 1,
    contentIds: [101, 102],
  });
  RequestUtils.Post.mockResolvedValueOnce({ success: false, message: 'Không có quyền' });
  await expect(saveTagContents(1, [101])).rejects.toThrow('Không có quyền');
});

it('fetches paged news content with the name filter', async () => {
  RequestUtils.Get.mockResolvedValue({
    errorCode: 200,
    data: {
      embedded: [{ id: 101, name: 'Tin mới' }],
      page: { totalElements: 21 },
    },
  });
  expect(await fetchContentOptions({ page: 2, limit: 10, name: 'Tin' })).toEqual({
    items: [{ id: 101, name: 'Tin mới' }],
    total: 21,
  });
  expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/page-content/fetch', {
    page: 2,
    limit: 10,
    name: 'Tin',
  });
});
