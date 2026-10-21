import axios from 'axios';
import { bannerImages } from './config';
import { extractUploadItems, normalizeUploadFileName } from '@/containers/PreviewModal/uploadUtils';
import { RequestUtils } from '@flast-erp/core/utils';
const unwrap = (response) => {
  if (
    !response ||
    response.success === false ||
    (response.errorCode != null && response.errorCode !== 200)
  )
    throw new Error(response?.message || 'Không thể xử lý banner');
  return response.data;
};
export async function listBanners() {
  const data = unwrap(await RequestUtils.Get('/erp/banner/list'));
  if (!Array.isArray(data)) throw new Error('Dữ liệu danh sách banner không hợp lệ');
  return data;
}
export const getBanner = async (id) =>
  unwrap(await RequestUtils.Get(`/erp/banner/${encodeURIComponent(id)}`));
export const deleteBanner = async (id) =>
  unwrap(await RequestUtils.Delete(`/erp/banner/delete?id=${encodeURIComponent(id)}`));
export async function saveBanner({
  id = null,
  name,
  imageUrls,
  targetUrl,
  position,
  sortOrder = 0,
  active = true,
}) {
  const urls = bannerImages(imageUrls);
  if (!urls.length) throw new Error('Vui lòng tải ảnh banner');
  return unwrap(
    await RequestUtils.Post('/erp/banner/save', {
      id,
      name: name.trim(),
      imageUrls: urls,
      targetUrl: targetUrl?.trim() || '',
      position: position.trim(),
      sortOrder,
      active,
    }),
  );
}

export async function uploadBannerImages(files) {
  const formData = new FormData();
  files.forEach((file) =>
    formData.append('files', file, normalizeUploadFileName(file.name) || file.name),
  );
  formData.append('folder', 'banner');
  const { data } = await axios.post('/erp/folder/multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (data?.success === false) throw new Error(data.message || 'Tải ảnh thất bại');
  const paths = extractUploadItems(data);
  if (paths.length !== files.length)
    throw new Error('Số ảnh API trả về không khớp số ảnh đã chọn. Vui lòng kiểm tra và tải lại.');
  return paths;
}
