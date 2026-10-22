import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ProductAssignmentModal from './ProductAssignmentModal';

jest.mock('antd', () => ({
  Alert: () => null,
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  Input: { Search: () => null },
  message: { success: jest.fn(), error: jest.fn() },
  Modal: ({ children, onOk }) => (
    <div>
      {children}
      <button onClick={onOk}>Save</button>
    </div>
  ),
  Space: ({ children }) => <div>{children}</div>,
  Typography: { Text: ({ children }) => <span>{children}</span> },
  Table: ({ dataSource, rowSelection, pagination }) => (
    <div>
      {dataSource.map((row) => (
        <input
          key={row.id}
          type="checkbox"
          aria-label={String(row.id)}
          checked={rowSelection.selectedRowKeys.includes(row.id)}
          onChange={() => rowSelection.onChange([...rowSelection.selectedRowKeys, row.id])}
        />
      ))}
      <button onClick={() => pagination.onChange(2, 10)}>Next</button>
    </div>
  ),
}));

it('preselects attached products and preserves off-page selections when adding another', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  const fetchProducts = jest.fn(({ page }) =>
    Promise.resolve({
      items: [{ id: page === 1 ? 789 : 777 }],
      total: 20,
    }),
  );
  const onSave = jest.fn().mockResolvedValue(undefined);
  const button = (text) =>
    [...container.querySelectorAll('button')].find((item) => item.textContent === text);
  try {
    await act(async () =>
      root.render(
        <ProductAssignmentModal
          fetchProducts={fetchProducts}
          initialSelectedIds={[789, 779]}
          onSave={onSave}
          onClose={() => {}}
        />,
      ),
    );
    expect(container.querySelector('input[aria-label="789"]').checked).toBe(true);
    await act(async () => button('Next').click());
    await act(async () => container.querySelector('input[aria-label="777"]').click());
    await act(async () => button('Save').click());
    expect(onSave).toHaveBeenCalledWith([789, 779, 777]);
  } finally {
    await act(async () => root.unmount());
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
