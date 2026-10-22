import { installTableScrollbars } from './controller';

let root;
let cleanup;
const flush = async () => {
  await Promise.resolve();
  jest.advanceTimersByTime(20);
};

beforeEach(() => {
  jest.useFakeTimers();
  root = document.createElement('div');
  root.innerHTML =
    '<div class="ant-table-container"><div class="ant-table-content"><table><tbody><tr><td>Data</td></tr></tbody></table></div></div>';
  document.body.append(root);
  const viewport = root.querySelector('.ant-table-content');
  Object.defineProperties(viewport, {
    scrollWidth: { value: 1000 },
    clientWidth: { value: 300 },
  });
});

afterEach(() => {
  cleanup?.();
  cleanup = null;
  root.remove();
  jest.useRealTimers();
});

it('does not add another scrollbar when the tenant already manages its footer', async () => {
  const viewport = root.querySelector('.ant-table-content');
  viewport.classList.add('table-horizontal-scroll-managed');
  const footer = document.createElement('div');
  footer.className = 'table-horizontal-scroll-host';
  root.append(footer);
  cleanup = installTableScrollbars(root);
  await flush();
  expect(root.querySelector('.table-visible-scrollbar')).toBeNull();
  expect(root.querySelector('.table-horizontal-scroll-host')).toBe(footer);
});

it('removes the fallback when a tenant scrollbar appears after rendering', async () => {
  cleanup = installTableScrollbars(root);
  await flush();
  expect(root.querySelectorAll('.table-visible-scrollbar')).toHaveLength(1);
  const viewport = root.querySelector('.ant-table-content');
  viewport.classList.add('table-horizontal-scroll-managed');
  const footer = document.createElement('div');
  footer.className = 'table-horizontal-scroll-host';
  root.append(footer);
  await flush();
  expect(root.querySelector('.table-visible-scrollbar')).toBeNull();
  expect(viewport.classList.contains('table-has-visible-scrollbar')).toBe(false);
  expect(root.querySelector('.table-horizontal-scroll-host')).toBe(footer);
});
