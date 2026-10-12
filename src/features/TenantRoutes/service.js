import { RequestUtils } from '@flast-erp/core/utils';
import { validateConfig } from './model';

const unwrap = response => {
  if (Number(response?.errorCode) !== 200 && response?.success !== true) {
    throw new Error(response?.message || 'Không tải được cấu hình route');
  }
  return response.data;
};

export async function fetchConfig(bizId) {
  const response = await RequestUtils.Get('/business/custom-routes');
  return validateConfig(unwrap(response), bizId);
}

export async function saveConfig(bizId, config) {
  validateConfig(config, bizId);
  const response = await RequestUtils.Post('/business/custom-routes', config);
  return validateConfig(unwrap(response), bizId);
}
