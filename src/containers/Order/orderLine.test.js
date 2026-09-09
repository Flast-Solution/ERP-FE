import {
  buildOrderLine,
  getDuplicateOrderLineKeys,
  hasIncompleteOrderLineEntries,
  mergeSavedOrderLines,
  parseOrderLine,
} from './orderLine';

describe('orderLine helpers', () => {
  it('builds an object from trimmed key/value entries', () => {
    expect(buildOrderLine([
      { key: ' color ', value: ' Đỏ ' },
      { key: 'size', value: 'XL' },
    ])).toEqual({ color: 'Đỏ', size: 'XL' });
  });

  it('reports duplicate keys before they overwrite one another', () => {
    expect(getDuplicateOrderLineKeys([
      { key: 'color', value: 'Đỏ' },
      { key: ' color ', value: 'Xanh' },
      { key: 'size', value: 'XL' },
    ])).toEqual(['color']);
  });

  it('returns an empty object when no additional information is entered', () => {
    expect(buildOrderLine()).toEqual({});
  });

  it('detects rows missing a key or value', () => {
    expect(hasIncompleteOrderLineEntries([{ key: 'color', value: '' }])).toBe(true);
    expect(hasIncompleteOrderLineEntries([{ key: '', value: 'Đỏ' }])).toBe(true);
    expect(hasIncompleteOrderLineEntries([{ key: 'color', value: 'Đỏ' }])).toBe(false);
  });

  it('parses orderLine returned by the API as a JSON string', () => {
    expect(parseOrderLine('{"Số lượng":"100"}')).toEqual({ 'Số lượng': '100' });
  });

  it('keeps object values and safely ignores invalid JSON', () => {
    const orderLine = { color: 'Đỏ' };
    expect(parseOrderLine(orderLine)).toBe(orderLine);
    expect(parseOrderLine('invalid-json')).toEqual({});
    expect(parseOrderLine('["invalid"]')).toEqual({});
  });

  it('restores orderLine from the save response when reload data omits it', () => {
    expect(mergeSavedOrderLines(
      [{ id: 34146, productName: 'BÁNH CHOCOPIE' }],
      [{ id: 34146, orderLine: '{"Trọng lượng":"100 kg"}' }],
    )).toEqual([{
      id: 34146,
      productName: 'BÁNH CHOCOPIE',
      orderLine: '{"Trọng lượng":"100 kg"}',
    }]);
  });

  it('prefers orderLine returned by reload data when it is available', () => {
    expect(mergeSavedOrderLines(
      [{ id: 1, orderLine: '{"Màu":"Đỏ"}' }],
      [{ id: 1, orderLine: '{"Màu":"Xanh"}' }],
    )[0].orderLine).toBe('{"Màu":"Đỏ"}');
  });
});
