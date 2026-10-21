export const descendantIds = (items, id) => {
  const excluded = new Set(id == null ? [] : [String(id)]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of items) {
      if (
        item.parentId != null &&
        excluded.has(String(item.parentId)) &&
        !excluded.has(String(item.id))
      ) {
        excluded.add(String(item.id));
        changed = true;
      }
    }
  }
  return excluded;
};
export const filterMenuTree = (items, query) => {
  const text = query.trim().toLocaleLowerCase();
  return items
    .flatMap((item) => {
      const children = filterMenuTree(Array.isArray(item.children) ? item.children : [], query);
      const match =
        !text ||
        [item.nameVi, item.nameEn, item.urlVi, item.urlEn].some((value) =>
          String(value || '')
            .toLocaleLowerCase()
            .includes(text),
        );
      if (!match && !children.length) return [];
      const ownChildren = match
        ? filterMenuTree(Array.isArray(item.children) ? item.children : [], '')
        : children;
      return [{ ...item, children: ownChildren.length ? ownChildren : undefined }];
    })
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

export const menuUrlFromName = (name) => {
  const slug = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `/${slug}` : '';
};

export const suggestMenuUrls = (changed, values, manual) => {
  const updates = {};
  ['Vi', 'En'].forEach((language) => {
    const name = `name${language}`;
    const url = `url${language}`;
    if (Object.prototype.hasOwnProperty.call(changed, url))
      manual[url] = Boolean(changed[url]?.trim());
    if (Object.prototype.hasOwnProperty.call(changed, name) && !manual[url])
      updates[url] = menuUrlFromName(values[name]);
  });
  return updates;
};
