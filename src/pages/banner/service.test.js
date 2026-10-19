import { RequestUtils } from '@flast-erp/core/utils';
import { listBanners, getBanner, saveBanner, deleteBanner } from './service';
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Get: jest.fn(), Post: jest.fn(), Delete: jest.fn() } }));
beforeEach(() => jest.clearAllMocks());
test('lists without query and loads details by path id', async () => {
  RequestUtils.Get.mockResolvedValueOnce({ success: true, data: [] }).mockResolvedValueOnce({ errorCode: 200, data: { id: 8 } });
  expect(await listBanners()).toEqual([]);
  expect(await getBanner(8)).toEqual({ id: 8 });
  expect(RequestUtils.Get.mock.calls).toEqual([['/erp/banner/list'], ['/erp/banner/8']]);
});
test('sends only supported fields and preserves false and zero on update', async () => {
  RequestUtils.Post.mockResolvedValue({ success: true });
  const fields = { name: ' Banner ', imageUrls: [' /images/a.jpg ', '/images/b.jpg'], targetUrl: '/products', position: 'HOME_TOP', sortOrder: 0, active: false };
  await saveBanner({ ...fields, id: 8, extra: 'ignored' });
  expect(RequestUtils.Post).toHaveBeenLastCalledWith('/erp/banner/save', { ...fields, id: 8, name: 'Banner', imageUrls: ['/images/a.jpg', '/images/b.jpg'] });
  await saveBanner(fields);
  expect(RequestUtils.Post.mock.calls[1][1].id).toBeNull();
});
test('deletes with query id and surfaces backend errors', async () => {
  RequestUtils.Delete.mockResolvedValue({ success: false, message: 'Không thể xóa' });
  await expect(deleteBanner(8)).rejects.toThrow('Không thể xóa');
  expect(RequestUtils.Delete).toHaveBeenCalledWith('/erp/banner/delete?id=8');
});

test('uploads a batch to folder/multiple and keeps backend paths', async () => {
  const axios = require('axios').default;
  const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: { success: true, files: ['banner/a.png', 'banner/b.png'] } });
  const { uploadBannerImages } = require('./service');
  const files = [new File(['a'], 'a.png', { type: 'image/png' }), new File(['b'], 'b.png', { type: 'image/png' })];
  expect(await uploadBannerImages(files)).toEqual(['banner/a.png', 'banner/b.png']);
  expect(post.mock.calls[0][0]).toBe('/erp/folder/multiple');
  expect(post.mock.calls[0][1].getAll('files')).toHaveLength(2);
  expect(post.mock.calls[0][1].get('folder')).toBe('banner');
  post.mockRestore();
});
test('does not accept an incomplete upload as a successful batch', async () => {
  const axios = require('axios').default;
  const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: { success: true, files: [] } });
  const { uploadBannerImages } = require('./service');
  await expect(uploadBannerImages([new File(['a'], 'a.png')])).rejects.toThrow('không khớp');
  post.mockRestore();
});

test('preserves image array order in a single banner save', async () => {
  RequestUtils.Post.mockResolvedValue({ success: true });
  await saveBanner({ id: 5, name: 'Banner', imageUrls: ['banner/b.png', 'banner/a.png'], position: 'TOP' });
  expect(RequestUtils.Post).toHaveBeenCalledTimes(1);
  expect(RequestUtils.Post.mock.calls[0][1].imageUrls).toEqual(['banner/b.png', 'banner/a.png']);
});
