export const normalizeOrderLineKey = value => String(value ?? '').trim();

export const getDuplicateOrderLineKeys = (entries = []) => {
  const seenKeys = new Set();
  const duplicateKeys = new Set();

  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    const key = normalizeOrderLineKey(entry?.key);
    if (!key) return;
    if (seenKeys.has(key)) duplicateKeys.add(key);
    seenKeys.add(key);
  });

  return Array.from(duplicateKeys);
};

export const hasIncompleteOrderLineEntries = (entries = []) => (
  (Array.isArray(entries) ? entries : []).some(entry => (
    !normalizeOrderLineKey(entry?.key)
    || entry?.value === undefined
    || entry?.value === null
    || (typeof entry.value === 'string' && !entry.value.trim())
  ))
);

export const buildOrderLine = (entries = []) => Object.fromEntries(
  (Array.isArray(entries) ? entries : [])
    .map(entry => [
      normalizeOrderLineKey(entry?.key),
      typeof entry?.value === 'string' ? entry.value.trim() : entry?.value,
    ])
    .filter(([key]) => Boolean(key)),
);

export const parseOrderLine = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  if (typeof value !== 'string' || !value.trim()) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(value);
    return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)
      ? parsedValue
      : {};
  } catch (error) {
    return {};
  }
};

export const mergeSavedOrderLines = (details = [], savedDetails = []) => {
  if (!Array.isArray(details) || !Array.isArray(savedDetails)) {
    return Array.isArray(details) ? details : [];
  }

  return details.map((detail) => {
    if (Object.keys(parseOrderLine(detail?.orderLine)).length > 0) {
      return detail;
    }
    const savedDetail = savedDetails.find(item => String(item?.id) === String(detail?.id));
    return savedDetail?.orderLine == null
      ? detail
      : { ...detail, orderLine: savedDetail.orderLine };
  });
};
