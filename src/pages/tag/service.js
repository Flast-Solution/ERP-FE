import { RequestUtils } from '@flast-erp/core/utils';

const check = response => {
  if (response?.success === false || (response?.errorCode != null && response.errorCode !== 200)) {
    throw new Error(response.message || 'Không thể xử lý tag');
  }
  return response?.data;
};
export async function listTags(type = 'product') {
  const data = check(await RequestUtils.Get('/erp/tag/list', { type }));
  if (!Array.isArray(data)) throw new Error('Dữ liệu danh sách tag không hợp lệ');
  return data;
}
export async function saveTag({ id = null, name, description, type }) {
  if (!['product', 'pages'].includes(type)) throw new Error('Vui lòng chọn loại tag');
  return check(await RequestUtils.Post('/erp/tag/save', { id, name: name.trim(), description: description || '', type }));
}
export async function deleteTag(id) {
  return check(await RequestUtils.Delete(`/erp/tag/delete?id=${encodeURIComponent(id)}`));
}
