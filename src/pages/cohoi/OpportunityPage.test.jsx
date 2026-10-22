import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useLocation } from 'react-router-dom';
import OpportunityPage from './OpportunityPage';

jest.mock('react-router-dom', () => ({ useLocation: jest.fn() }));
jest.mock('@/components/TenantPage', () => ({
  __esModule: true,
  default: () => <div>Remote opportunities</div>,
}));
jest.mock('./OpportunityHelpButton', () => ({
  __esModule: true,
  default: () => <a href="/help/hatenko/opportunities/index.html">Hướng dẫn cơ hội</a>,
}));

it('shows help outside the tenant module on the list and hides it on the overdue page', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    useLocation.mockReturnValue({ pathname: '/sale/co-hoi' });
    await act(async () => root.render(<OpportunityPage />));
    expect(container.textContent).toContain('Remote opportunities');
    expect(container.querySelector('a').getAttribute('href')).toBe(
      '/help/hatenko/opportunities/index.html',
    );
    useLocation.mockReturnValue({ pathname: '/sale/co-hoi/seven-day' });
    await act(async () => root.render(<OpportunityPage />));
    expect(container.querySelector('a')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
