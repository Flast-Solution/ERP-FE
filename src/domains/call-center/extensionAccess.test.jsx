import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import PhoneHeaderButton from './components/PhoneHeaderButton';
import { useSoftphoneConnection } from './hooks';
import useGetMe from '@/hooks/useGetMe';
import { useCallCenterStore } from './store/useCallCenterStore';
jest.mock('@/hooks/useGetMe', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./store/useCallCenterStore', () => ({ useCallCenterStore: jest.fn() }));
jest.mock('./components/Dialer', () => () => <span>Dialer</span>);
jest.mock('@flast-erp/core/utils', () => ({ InAppEvent: {} }));
const state = {
  connection: 'online',
  call: { status: 'idle' },
  connect: jest.fn(),
  disconnect: jest.fn(),
};
beforeEach(() => {
  jest.clearAllMocks();
  useCallCenterStore.mockImplementation((selector) => selector(state));
});
test.each([undefined, null, '', '   '])(
  'hides the call button without an extension (%s), even when previously online',
  (sipExt) => {
    useGetMe.mockReturnValue({ user: { id: 1, sipExt } });
    const html = renderToStaticMarkup(<PhoneHeaderButton />);
    expect(html).toBe('');
  },
);
test('an assigned and connected user has a ready button', () => {
  useGetMe.mockReturnValue({ user: { id: 1, sipExt: 'company_1001' } });
  const html = renderToStaticMarkup(<PhoneHeaderButton />);
  expect(html).not.toContain('disabled');
  expect(html).toContain('Sẵn sàng');
});
test('missing extension never registers an environment fallback', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  process.env.REACT_APP_CALL_CENTER_EXT = 'shared-extension';
  const root = createRoot(document.createElement('div'));
  const Harness = () => {
    useSoftphoneConnection('');
    return null;
  };
  try {
    await act(async () => root.render(<Harness />));
    expect(state.connect).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    delete process.env.REACT_APP_CALL_CENTER_EXT;
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
