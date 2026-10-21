import { RequestUtils } from '@flast-erp/core/utils';
const unwrap = (response) => {
  if (
    !response ||
    response.success === false ||
    (response.errorCode != null && response.errorCode !== 200)
  )
    throw new Error(response?.message || 'Không thể xử lý menu');
  return response.data;
};
const readList = (response) => {
  const data = unwrap(response);
  if (!Array.isArray(data)) throw new Error('Dữ liệu menu không hợp lệ');
  return data;
};
export const getMenuTree = async () => readList(await RequestUtils.Get('/erp/menu/tree'));
export const listMenus = async () => readList(await RequestUtils.Get('/erp/menu/list'));
export const deleteMenu = async (id) =>
  unwrap(await RequestUtils.Delete(`/erp/menu/delete?id=${encodeURIComponent(id)}`));
export async function saveMenu({
  id = null,
  parentId = null,
  nameVi,
  nameEn,
  urlVi,
  urlEn,
  sortOrder = 0,
  active = true,
}) {
  return unwrap(
    await RequestUtils.Post('/erp/menu/save', {
      id,
      parentId,
      nameVi: nameVi.trim(),
      nameEn: nameEn?.trim() || '',
      urlVi: urlVi?.trim() || '',
      urlEn: urlEn?.trim() || '',
      sortOrder,
      active,
    }),
  );
}
