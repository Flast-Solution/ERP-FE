import {
  mergeInitialProductProperties,
  updateAttributeDefaults,
  syncSelectedProductProperties,
} from './productProperties';

describe('mergeInitialProductProperties', () => {
  it('adds every initial attribute as a separate empty property', () => {
    expect(mergeInitialProductProperties([], [
      { id: 10008, name: 'Phong cách', initial: true },
      { id: 10009, name: 'Màu sắc', initial: true },
      { id: 10010, name: 'Chất liệu', initial: false },
    ])).toEqual([
      { attributedId: 10008, attributedValueId: [] },
      { attributedId: 10009, attributedValueId: [] },
    ]);
  });

  it('preserves configured values and only adds missing initial attributes', () => {
    const configured = [
      { attributedId: 10008, attributedValueId: [20001] },
      { attributedId: 10011, attributedValueId: [20002] },
    ];

    expect(mergeInitialProductProperties(configured, [
      { id: 10008, initial: true },
      { id: 10009, initial: true },
    ])).toEqual([
      { attributedId: 10008, attributedValueId: [20001] },
      { attributedId: 10011, attributedValueId: [20002] },
      { attributedId: 10009, attributedValueId: [] },
    ]);
  });

  it('does not add the same initial attribute more than once', () => {
    expect(mergeInitialProductProperties([], [
      { id: 10008, initial: true },
      { id: 10008, initial: true },
    ])).toEqual([
      { attributedId: 10008, attributedValueId: [] },
    ]);
  });
});

describe('syncSelectedProductProperties', () => {
  it('adds selected attributes and preserves configured values', () => {
    expect(syncSelectedProductProperties([
      { attributedId: 10008, attributedValueId: [20001] },
      { attributedId: 10009, attributedValueId: [20002] },
    ], [10008, 10010])).toEqual([
      { attributedId: 10008, attributedValueId: [20001] },
      { attributedId: 10010, attributedValueId: [] },
    ]);
  });

  it('removes duplicated selected attribute ids', () => {
    expect(syncSelectedProductProperties([], [10008, '10008'])).toEqual([
      { attributedId: 10008, attributedValueId: [] },
    ]);
  });
});


test('type defaults use listType instead of global initial flags', () => {
  const attrs = [{ id: 1, initial: true, listType: [8] }, { id: 2, initial: false, listType: [9] }];
  expect(mergeInitialProductProperties([], attrs, 9)).toEqual([{ attributedId: 2, attributedValueId: [] }]);
  expect(mergeInitialProductProperties([], attrs)).toEqual([{ attributedId: 1, attributedValueId: [] }]);
});

test('updates membership for one type without changing other types or global defaults', () => {
  const attrs = [{ id: 1, initial: true, listType: [8, 9] }, { id: 2, initial: false, listType: [8] }];
  const result = updateAttributeDefaults(attrs, ['2'], 9);
  expect(result).toEqual([{ id: 1, initial: true, listType: [8] }, { id: 2, initial: false, listType: [8, 9] }]);
  expect(updateAttributeDefaults(result, ['2'], 9)).toEqual(result);
  expect(updateAttributeDefaults(attrs, ['2'], null)[0]).toEqual({ id: 1, initial: false, listType: [8, 9] });
});
