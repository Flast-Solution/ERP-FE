import { getDocumentShipmentError } from './documentShipment';
test('a documented partial shipment must match its own quantity rather than the entire order', () => {
  const data = { documentSetId: 'shipment-2', documentQuantity: 30 };
  expect(getDocumentShipmentError(data, 30, 'confirm')).toBeNull();
  expect(getDocumentShipmentError(data, 100, 'confirm')).toContain('(30)');
  expect(getDocumentShipmentError(data, 20, 'confirm')).toContain('(30)');
  expect(getDocumentShipmentError(data, 20, 'draft')).toBeNull();
});
test('accepts fractional lot sums and leaves ordinary warehouse deliveries unchanged', () => {
  expect(getDocumentShipmentError({ documentSetId: 'shipment', documentQuantity: 0.3 }, 0.1 + 0.2, 'confirm')).toBeNull();
  expect(getDocumentShipmentError({}, 25, 'confirm')).toBeNull();
  expect(getDocumentShipmentError({ documentSetId: 'shipment' }, 25, 'confirm')).toBeTruthy();
});
