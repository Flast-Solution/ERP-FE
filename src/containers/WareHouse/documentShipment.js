// A delivery created from a document set must match that shipment's quantities.
// Ordinary warehouse deliveries keep their existing stock validation.
export const getDocumentShipmentError = (data, quantity, submitType) => {
  if (!data.documentSetId || submitType !== 'confirm') return null;
  const planned = Number(data.documentQuantity);
  if (!Number.isFinite(planned) || planned <= 0) return 'Bộ chứng từ chưa có số lượng xuất hợp lệ.';
  if (Math.abs(Number(quantity) - planned) > 0.000001 || !Number.isFinite(Number(quantity))) {
    return `Số lượng xuất phải bằng số lượng trong bộ chứng từ của lần xuất (${planned}).`;
  }
  return null;
};
