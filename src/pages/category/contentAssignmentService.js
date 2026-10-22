import { RequestUtils } from '@flast-erp/core/utils';

const readResponse = (response) => {
  if (response?.success === false || (response?.errorCode != null && response.errorCode !== 200)) {
    throw new Error(response?.message || 'Không thể xử lý trang tin tức.');
  }
  return response?.data;
};

export const fetchContentOptions = async ({ page, limit, name }) => {
  const data = readResponse(
    await RequestUtils.Get('/erp/page-content/fetch', { page, limit, name: name || undefined }),
  );
  const items = Array.isArray(data) ? data : (data?.embedded ?? data?.content ?? data?.items);
  if (!Array.isArray(items)) throw new Error('Dữ liệu trang tin tức không hợp lệ.');
  return {
    items,
    total:
      data?.page?.totalElements ??
      data?.totalElements ??
      data?.total ??
      (page - 1) * limit + items.length + (items.length === limit ? 1 : 0),
  };
};

export const saveCategoryContents = async (categoryId, contentIds) => {
  readResponse(
    await RequestUtils.Post('/erp/category/page/save-contents', {
      categoryId,
      contentIds: [...new Set(contentIds)],
    }),
  );
};

export const saveTagContents = async (tagId, contentIds) => {
  readResponse(
    await RequestUtils.Post('/erp/tag/save-contents', {
      tagId,
      contentIds: [...new Set(contentIds)],
    }),
  );
};
