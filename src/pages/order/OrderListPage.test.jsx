import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useLocation } from 'react-router-dom';
import OrderListPage from './OrderListPage';

jest.mock('react-router-dom', () => ({ useLocation: jest.fn() }));
jest.mock('@/components/TenantPage', () => ({
  __esModule: true,
  default: () => <div>Remote orders</div>,
}));
jest.mock('./OrderHelpButton', () => ({
  __esModule: true,
  default: () => <a href="/help/hatenko/orders/index.html">Hướng dẫn đơn hàng</a>,
}));

it('shows help outside the tenant module on the list and hides it on the overdue page', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    useLocation.mockReturnValue({ pathname: '/sale/order' });
    await act(async () => root.render(<OrderListPage />));
    expect(container.textContent).toContain('Remote orders');
    expect(container.querySelector('a').getAttribute('href')).toBe(
      '/help/hatenko/orders/index.html',
    );
    useLocation.mockReturnValue({ pathname: '/sale/order/after-sale' });
    await act(async () => root.render(<OrderListPage />));
    expect(container.querySelector('a')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
