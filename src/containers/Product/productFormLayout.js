export const PRODUCT_FORM_LAYOUT_VERSION = 1;

export const DEFAULT_PRODUCT_FORM_LAYOUT = [
  {
    id: 'general',
    title: 'Thông tin chung',
    items: [
      'name',
      'serviceId',
      'providerId',
      'unit',
      'status',
      'currency',
      'price',
      'priceRef',
    ],
  },
  {
    id: 'assets',
    title: 'Ảnh và tài liệu',
    items: ['image', 'file'],
  },
  {
    id: 'inventory',
    title: 'Thuộc tính và bảng giá',
    items: ['listProperties', 'priceRanges'],
  },
  {
    id: 'extended',
    title: 'Thông tin mở rộng',
    items: ['listOpenInfo'],
  },
  {
    id: 'quality',
    title: 'Kiểm định chất lượng',
    items: ['qualityControl'],
  },
];

const cloneDefaultLayout = () => DEFAULT_PRODUCT_FORM_LAYOUT.map(block => ({
  ...block,
  items: [...block.items],
}));

export const createProductFormLayoutStorageKey = (user = {}) => {
  const bizId = user?.bizId ?? user?.biz_id ?? 'default';
  const userId = user?.id ?? user?.userId ?? 'anonymous';
  return `flast:ui:product-form-layout:v${PRODUCT_FORM_LAYOUT_VERSION}:${bizId}:${userId}`;
};

/**
 * Keep the user's order while automatically adding controls introduced by
 * newer releases. Invalid/removed IDs are discarded safely.
 */
export const normalizeProductFormLayout = (savedLayout) => {
  const defaults = cloneDefaultLayout();
  const savedBlocks = Array.isArray(savedLayout?.blocks)
    ? savedLayout.blocks
    : Array.isArray(savedLayout)
      ? savedLayout
      : [];
  const defaultById = new Map(defaults.map(block => [block.id, block]));
  const normalized = [];

  savedBlocks.forEach(savedBlock => {
    const defaultBlock = defaultById.get(savedBlock?.id);
    if (!defaultBlock) return;

    const validItems = new Set(defaultBlock.items);
    const savedItems = Array.isArray(savedBlock.items)
      ? savedBlock.items.filter((item, index, items) => (
        validItems.has(item) && items.indexOf(item) === index
      ))
      : [];
    const missingItems = defaultBlock.items.filter(item => !savedItems.includes(item));

    normalized.push({
      ...defaultBlock,
      items: [...savedItems, ...missingItems],
    });
    defaultById.delete(savedBlock.id);
  });

  defaults.forEach(block => {
    if (defaultById.has(block.id)) normalized.push(block);
  });

  return normalized;
};

export const readProductFormLayout = (storageKey) => {
  if (typeof window === 'undefined') return cloneDefaultLayout();
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey));
    return normalizeProductFormLayout(saved);
  } catch {
    return cloneDefaultLayout();
  }
};

export const saveProductFormLayout = (storageKey, blocks) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({
      version: PRODUCT_FORM_LAYOUT_VERSION,
      updatedAt: new Date().toISOString(),
      blocks,
    }));
  } catch {
    // The form remains usable when browser storage is disabled or full.
  }
};

export const resetProductFormLayout = (storageKey) => {
  if (typeof window !== 'undefined') window.localStorage.removeItem(storageKey);
  return cloneDefaultLayout();
};
