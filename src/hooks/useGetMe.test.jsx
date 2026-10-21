/* eslint-disable testing-library/no-unnecessary-act */
import React, { act, useReducer } from 'react';
import { createRoot } from 'react-dom/client';
import { DataContext } from '@flast-erp/core/components';
import useGetMe from './useGetMe';
import { ACTIONS } from '@/configs';
jest.mock('@flast-erp/core/components', () => ({
  DataContext: require('react').createContext(null),
}));
jest.mock('@/utils/authUtils', () => ({
  getClientPermissions: () => [],
  hasClientPermission: () => true,
}));
let current;
function Consumer() {
  current = useGetMe();
  return <span>{current.user.sipExt}</span>;
}
function Provider() {
  const [state, dispatch] = useReducer(
    (state, action) => (action.type === ACTIONS.ADD_USER ? { ...state, user: action.data } : state),
    { user: { id: 7, fullName: 'User' } },
  );
  return (
    <DataContext.Provider value={{ ...state, dispatch }}>
      <Consumer />
    </DataContext.Provider>
  );
}
test('updates the actual reducer context without requiring setMyData', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Provider />));
    await act(async () => current.setMe({ ...current.user, sipExt: '1001' }));
    expect(current.user).toEqual({ id: 7, fullName: 'User', sipExt: '1001' });
    expect(container.textContent).toBe('1001');
  } finally {
    await act(async () => root.unmount());
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
