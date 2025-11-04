/**
 * @param {*} skuDetails 
 * [{ "id": 20, "productId": 776, "skuId": 11, "name": "Bồi vỏ", "value": "Giấy Mỹ thuật", "attributedId": 10024, "attributedValueId": 10090, "del": 0 }]
 * @returns [{ text: 'Bồi vỏ', values: [{id: 20, text: 'Giấy Mỹ thuật'}]}]
 */
const createMSkuDetails = (skuDetails) => 
  Object.values(skuDetails.reduce(groupByName, {})).map(toMSkuGroup);

/* Nhóm theo name, giữ lại id + value duy nhất */
const groupByName = (acc, item) => {
  const { name, id, value } = item;
  const key = name;
  acc[key] ??= { text: key, values: new Map() };
  acc[key].values.set(id, { id, text: value });
  return acc;
};

/* Chuyển Map thành mảng và sắp xếp theo id */
const toMSkuGroup = (group) => ({
  text: group.text,
  values: Array.from(group.values.values()).sort((a, b) => a.id - b.id)
});

export { createMSkuDetails };