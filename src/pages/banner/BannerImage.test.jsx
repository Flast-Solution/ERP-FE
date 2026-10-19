import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import BannerImage from './BannerImage';
jest.mock('antd', () => ({ Image: props => <img {...props} alt="banner" />, Spin: () => <span>loading</span>, Button: ({ children, ...props }) => <button {...props}>{children}</button>, Space: ({ children }) => <div>{children}</div>, Typography: { Text: ({ children }) => <span>{children}</span> } }));
let root, container, get;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); root = createRoot(container);
  axios.defaults.baseURL = '/api';
  URL.createObjectURL = jest.fn(() => 'blob:banner');
  URL.revokeObjectURL = jest.fn();
  get = jest.spyOn(axios, 'get');
});
afterEach(async () => { await act(async () => root.unmount()); get.mockRestore(); delete global.IS_REACT_ACT_ENVIRONMENT; });
test('loads Vietnamese filename using authenticated axios and displays a blob', async () => {
  get.mockResolvedValue({ data: new Blob(['image'], { type: 'image/png' }) });
  await act(async () => root.render(<BannerImage value="banner/Ảnh màn hình.png" />));
  expect(get.mock.calls[0][0]).toContain('/api/erp/folder/view/banner/');
  expect(get.mock.calls[0][1]).toMatchObject({ baseURL: '', responseType: 'blob' });
  expect(container.querySelector('img').getAttribute('src')).toBe('blob:banner');
  await act(async () => root.unmount());
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:banner');
  root = createRoot(container);
});
test('shows actual HTTP error instead of a broken img', async () => {
  get.mockRejectedValue({ response: { status: 403 } });
  await act(async () => root.render(<BannerImage value="banner/a.png" />));
  expect(container.textContent).toContain('HTTP 403');
  expect(container.querySelector('img')).toBeNull();
});
test('external images stay direct and never receive axios authentication', async () => {
  await act(async () => root.render(<BannerImage value="https://external.example.com/banner.png" />));
  expect(get).not.toHaveBeenCalled();
  expect(container.querySelector('img').src).toBe('https://external.example.com/banner.png');
});
