import { RequestUtils } from '@flast-erp/core/utils';
import { emptyConfig } from './model';
import { fetchConfig, saveConfig } from './service';
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Get: jest.fn(), Post: jest.fn() } }));
afterEach(() => jest.clearAllMocks());
test('reads and saves complete configuration through the core API client', async () => {
  const config = emptyConfig(5), saved = { ...config, revision: 1 };
  RequestUtils.Get.mockResolvedValue({ errorCode: 200, success: true, data: config });
  RequestUtils.Post.mockResolvedValue({ errorCode: 200, success: true, data: saved });
  expect(await fetchConfig(5)).toEqual(config);
  expect(RequestUtils.Get).toHaveBeenCalledWith('/business/custom-routes');
  expect(await saveConfig(5, config)).toEqual(saved);
  expect(RequestUtils.Post).toHaveBeenCalledWith('/business/custom-routes', config);
});
test('rejects API errors and mismatched business data', async () => {
  RequestUtils.Get.mockResolvedValue({ errorCode: 200, data: emptyConfig(6) });
  await expect(fetchConfig(5)).rejects.toThrow('doanh nghiệp');
  RequestUtils.Post.mockResolvedValue({ errorCode: 409, success: false, message: 'Cấu hình đã thay đổi' });
  await expect(saveConfig(5, emptyConfig(5))).rejects.toThrow('Cấu hình đã thay đổi');
  RequestUtils.Get.mockRejectedValue(new Error('Network failure'));
  await expect(fetchConfig(5)).rejects.toThrow('Network failure');
});
test('validates the payload before sending a request', async () => {
  await expect(saveConfig(5, emptyConfig(6))).rejects.toThrow('doanh nghiệp');
  expect(RequestUtils.Post).not.toHaveBeenCalled();
});
