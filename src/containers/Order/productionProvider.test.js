import { isProviderProduction } from './productionProvider';

test('recognizes production assigned to a provider', () => {
  expect(isProviderProduction({ details: [{ id: 86, providerId: 10011 }, { id: 87, providerId: 10011 }] })).toBe(true);
  expect(isProviderProduction({ providerId: 10011 })).toBe(true);
});
test('keeps internal and mixed production BOM information visible', () => {
  expect(isProviderProduction({ details: [{ providerId: 10011 }, { providerId: null }] })).toBe(false);
  expect(isProviderProduction({ details: [{ providerId: 0 }] })).toBe(false);
  expect(isProviderProduction({ details: [] })).toBe(false);
});
