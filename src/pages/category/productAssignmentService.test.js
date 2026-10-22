import { RequestUtils } from '@flast-erp/core/utils';
import { fetchCategoryProductOptions, saveCategoryProducts } from './productAssignmentService';

jest.mock('@flast-erp/core/utils', () => ({
  RequestUtils: { Get: jest.fn(), Post: jest.fn() },
}));
jest.mock('@/configs', () => ({ SUCCESS_CODE: 200 }));

beforeEach(() => jest.clearAllMocks());

it('gửi đúng categoryId và danh sách ID sản phẩm không trùng', async () => {
  RequestUtils.Post.mockResolvedValue({ errorCode: 200, success: true });
  await saveCategoryProducts(19, [777, 789, 777]);
  expect(RequestUtils.Post).toHaveBeenCalledWith('/erp/category/product/save-products', {
    categoryId: 19,
    productIds: [777, 789],
  });
});

it('không coi response nghiệp vụ lỗi là lưu thành công', async () => {
  RequestUtils.Post.mockResolvedValue({
    errorCode: 400,
    success: false,
    message: 'Không có quyền',
  });
  await expect(saveCategoryProducts(19, [777])).rejects.toThrow('Không có quyền');
});

it('đọc danh sách sản phẩm phân trang và truyền bộ lọc tên', async () => {
  RequestUtils.Get.mockResolvedValue({
    errorCode: 200,
    data: { embedded: [{ id: 777, name: 'Vải' }], page: { totalElements: 35 } },
  });
  expect(await fetchCategoryProductOptions({ page: 2, limit: 10, name: 'Vải' })).toEqual({
    items: [{ id: 777, name: 'Vải' }],
    total: 35,
  });
  expect(RequestUtils.Get).toHaveBeenCalledWith('/erp/product/fetch', {
    page: 2,
    limit: 10,
    name: 'Vải',
  });
});
