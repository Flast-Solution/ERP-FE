import { mergeInitialProductProperties } from './productProperties';

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
