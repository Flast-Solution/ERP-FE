import { RequestUtils } from '@flast-erp/core/utils';
import { SUCCESS_CODE } from '@/configs';

const readResponse = (response) => {
  if (response?.success === false || response?.errorCode !== SUCCESS_CODE) {
    throw new Error(response?.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.');
  }
  return response.data;
};

export const fetchCategoryProductOptions = async ({ page, limit, name }) => {
  const data = readResponse(
    await RequestUtils.Get('/erp/product/fetch', { page, limit, name: name || undefined }),
  );
  const items = Array.isArray(data) ? data : (data?.embedded ?? data?.content ?? []);
  return {
    items,
    total: data?.page?.totalElements ?? data?.totalElements ?? data?.total ?? items.length,
  };
};

export const saveCategoryProducts = async (categoryId, productIds) => {
  readResponse(
    await RequestUtils.Post('/erp/category/product/save-products', {
      categoryId,
      productIds: [...new Set(productIds)],
    }),
  );
};
