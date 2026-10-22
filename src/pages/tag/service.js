import { RequestUtils } from '@flast-erp/core/utils';

const check = (response) => {
  if (response?.success === false || (response?.errorCode != null && response.errorCode !== 200)) {
    throw new Error(response.message || 'Không thể xử lý tag');
  }
  return response?.data;
};
export async function fetchTags({ name = '', type = 'product', page = 1, limit = 20 } = {}) {
  const data = check(await RequestUtils.Get('/erp/tag/fetch', { name, type, page, limit }));
  const items = Array.isArray(data) ? data : (data?.embedded ?? data?.content ?? data?.items);
  if (!Array.isArray(items)) throw new Error('Dữ liệu danh sách tag không hợp lệ');
  const total = data?.page?.totalElements ?? data?.totalElements ?? data?.total ?? null;
  return { items, total };
}

// The edit screen locates a tag by ID; continue across pages so later tags remain editable.
export async function listTags(type = 'product') {
  const tags = [];
  const limit = 20;
  let page = 1;
  while (true) {
    const result = await fetchTags({ type, page, limit });
    tags.push(...result.items);
    if (result.items.length < limit || (result.total != null && tags.length >= result.total)) {
      return tags;
    }
    page += 1;
  }
}
export async function saveTag({ id = null, name, description, type }) {
  if (!['product', 'pages'].includes(type)) throw new Error('Vui lòng chọn loại tag');
  return check(
    await RequestUtils.Post('/erp/tag/save', {
      id,
      name: name.trim(),
      description: description || '',
      type,
    }),
  );
}
export async function deleteTag(id) {
  return check(await RequestUtils.Delete(`/erp/tag/delete?id=${encodeURIComponent(id)}`));
}

export async function saveTagProducts(tagId, productIds) {
  return check(
    await RequestUtils.Post('/erp/tag/save-products', {
      tagId,
      productIds: [...new Set(productIds)],
    }),
  );
}
