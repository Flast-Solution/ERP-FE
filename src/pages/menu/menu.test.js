import { RequestUtils } from '@flast-erp/core/utils';
import { getMenuTree, listMenus, saveMenu, deleteMenu } from './service';
import { descendantIds, filterMenuTree, menuUrlFromName, suggestMenuUrls } from './model';
jest.mock('@flast-erp/core/utils', () => ({
  RequestUtils: { Get: jest.fn(), Post: jest.fn(), Delete: jest.fn() },
}));
beforeEach(() => jest.clearAllMocks());
test('loads tree and flat list using documented endpoints', async () => {
  RequestUtils.Get.mockResolvedValue({ success: true, data: [] });
  await getMenuTree();
  await listMenus();
  expect(RequestUtils.Get.mock.calls).toEqual([['/erp/menu/tree'], ['/erp/menu/list']]);
});
test('creates root with null parent and updates child without losing false or zero', async () => {
  RequestUtils.Post.mockResolvedValue({ errorCode: 200 });
  await saveMenu({ nameVi: ' Trang chủ ', sortOrder: 0, active: false });
  expect(RequestUtils.Post).toHaveBeenLastCalledWith('/erp/menu/save', {
    id: null,
    parentId: null,
    nameVi: 'Trang chủ',
    nameEn: '',
    urlVi: '',
    urlEn: '',
    sortOrder: 0,
    active: false,
  });
  await saveMenu({
    id: 12,
    parentId: 10,
    nameVi: 'Giới thiệu',
    nameEn: 'About us',
    urlVi: '/gioi-thieu',
    urlEn: '/about-us',
    sortOrder: 1,
    active: true,
    children: [],
  });
  expect(RequestUtils.Post.mock.calls[1][1]).toEqual({
    id: 12,
    parentId: 10,
    nameVi: 'Giới thiệu',
    nameEn: 'About us',
    urlVi: '/gioi-thieu',
    urlEn: '/about-us',
    sortOrder: 1,
    active: true,
  });
});
test('uses DELETE query and reports backend restriction', async () => {
  RequestUtils.Delete.mockResolvedValue({ success: false, message: 'Menu có menu con' });
  await expect(deleteMenu(10)).rejects.toThrow('Menu có menu con');
  expect(RequestUtils.Delete).toHaveBeenCalledWith('/erp/menu/delete?id=10');
});
test('excludes self and all descendants even with mixed id types and cycles', () => {
  expect([
    ...descendantIds(
      [
        { id: 1, parentId: 3 },
        { id: 2, parentId: '1' },
        { id: 3, parentId: 2 },
        { id: 4, parentId: null },
      ],
      1,
    ),
  ]).toEqual(['1', '2', '3']);
});
test('retains ancestors during search and sorts siblings without mutating source', () => {
  const tree = [
    {
      id: 1,
      nameVi: 'Gốc',
      children: [
        { id: 2, nameEn: 'About us', sortOrder: 2 },
        { id: 3, nameVi: 'Liên hệ', sortOrder: 0 },
      ],
    },
  ];
  expect(filterMenuTree(tree, 'about')[0].children.map((item) => item.id)).toEqual([2]);
  expect(filterMenuTree(tree, '')[0].children.map((item) => item.id)).toEqual([3, 2]);
  expect(tree[0].children[0].id).toBe(2);
});

test('suggests Vietnamese and English slugs including crossed d and punctuation', () => {
  expect(menuUrlFromName(' Điện & Đồ gia dụng ')).toBe('/dien-do-gia-dung');
  expect(menuUrlFromName('About Us!')).toBe('/about-us');
  expect(menuUrlFromName('')).toBe('');
});
test('updates automatic URLs but preserves manual or previously saved URLs', () => {
  const manual = { urlVi: false, urlEn: true };
  expect(
    suggestMenuUrls(
      { nameVi: 'Giới thiệu', nameEn: 'About' },
      { nameVi: 'Giới thiệu', nameEn: 'About' },
      manual,
    ),
  ).toEqual({ urlVi: '/gioi-thieu' });
  suggestMenuUrls({ urlVi: '/custom' }, {}, manual);
  expect(suggestMenuUrls({ nameVi: 'Liên hệ' }, { nameVi: 'Liên hệ' }, manual)).toEqual({});
  suggestMenuUrls({ urlVi: '' }, {}, manual);
  expect(suggestMenuUrls({ nameVi: 'Liên hệ' }, { nameVi: 'Liên hệ' }, manual)).toEqual({
    urlVi: '/lien-he',
  });
});
