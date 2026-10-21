/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import DeliveryPager from './DeliveryPager';
import { Form, Checkbox } from 'antd';
import { RequestUtils } from '@flast-erp/core/utils';
import WarehouseDocumentsUpload from '../WareHouse/WarehouseDocumentsUpload';
const mockForm = { setFieldsValue: jest.fn() };
let mockCanUpdate = true;
jest.mock('@/hooks/useGetMe', () => () => ({
  hasPermission: (permission) => permission === 'shipping.delivery.update' && mockCanUpdate,
}));
jest.mock('react-to-print', () => ({ useReactToPrint: () => jest.fn() }));
jest.mock('@flast-erp/core/utils', () => ({
  RequestUtils: { Post: jest.fn() },
  f5List: jest.fn(),
}));
jest.mock('@flast-erp/core/components', () => ({ FormSelectAPI: () => null }));
jest.mock('@erp/shared-ui/components/UploadedFilePreview/index', () => () => null);
jest.mock('../WareHouse/WarehouseDocumentsUpload', () => jest.fn(() => null));
jest.mock('antd', () => {
  const React = require('react');
  const Wrapper = ({ children }) => React.createElement('div', null, children);
  const Form = jest.fn(Wrapper);
  Form.useForm = () => [mockForm];
  Form.Item = Wrapper;
  return {
    Form,
    Button: Wrapper,
    Checkbox: { Group: jest.fn(() => null) },
    Col: Wrapper,
    Row: Wrapper,
    Table: () => null,
    Tag: Wrapper,
    Tooltip: Wrapper,
    message: { success: jest.fn(), error: jest.fn() },
  };
});
let root;
beforeEach(() => {
  jest.clearAllMocks();
  Form.mockImplementation(({ children }) => <div>{children}</div>);
  mockCanUpdate = true;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  root = createRoot(document.createElement('div'));
});
afterEach(async () => {
  await act(async () => root.unmount());
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
const shipment = {
  id: 39,
  deliveryCode: 'GDN-DEMO',
  status: 0,
  attachments: '["warehouse/old.pdf"]',
  requiredDocuments: ['warehouseSlip'],
  delivery: { recipientName: 'Người nhận' },
  lots: [],
};
test('restores existing attachments and saves uploaded paths with the original shipment identity', async () => {
  const markDrawerClean = jest.fn();
  RequestUtils.Post.mockResolvedValue({ success: true });
  await act(async () =>
    root.render(<DeliveryPager data={shipment} markDrawerClean={markDrawerClean} />),
  );
  expect(Checkbox.Group.mock.calls.at(-1)[0].disabled).not.toBe(true);
  expect(mockForm.setFieldsValue).toHaveBeenCalledWith({
    status: 0,
    attachments: ['warehouse/old.pdf'],
    requiredDocuments: ['warehouseSlip'],
  });
  await act(async () =>
    Form.mock.calls.at(-1)[0].onFinish({
      status: 0,
      attachments: ['warehouse/old.pdf', 'warehouse/pod.pdf'],
      requiredDocuments: ['warehouseSlip', 'handoverReport'],
    }),
  );
  expect(RequestUtils.Post).toHaveBeenCalledWith('/warehouse/delivery', {
    ...shipment,
    status: 0,
    attachments: ['warehouse/old.pdf', 'warehouse/pod.pdf'],
    requiredDocuments: ['warehouseSlip', 'handoverReport'],
  });
  expect(markDrawerClean).toHaveBeenCalledTimes(1);
});
test.each([{ success: false, errorCode: 200, message: 'Save failed' }, null])(
  'keeps unsaved changes guarded when saving fails (%s)',
  async (response) => {
    const markDrawerClean = jest.fn();
    RequestUtils.Post.mockResolvedValue(response);
    await act(async () =>
      root.render(<DeliveryPager data={shipment} markDrawerClean={markDrawerClean} />),
    );
    await act(async () => Form.mock.calls.at(-1)[0].onFinish({ status: 0, attachments: [] }));
    expect(markDrawerClean).not.toHaveBeenCalled();
  },
);
test('blocks saves during upload and keeps print-only users read-only', async () => {
  await act(async () => root.render(<DeliveryPager data={shipment} />));
  await act(async () => WarehouseDocumentsUpload.mock.calls.at(-1)[0].onUploadingChange(true));
  await act(async () => Form.mock.calls.at(-1)[0].onFinish({ status: 0, attachments: [] }));
  expect(RequestUtils.Post).not.toHaveBeenCalled();
  mockCanUpdate = false;
  WarehouseDocumentsUpload.mockClear();
  await act(async () => root.render(<DeliveryPager data={shipment} />));
  expect(WarehouseDocumentsUpload).not.toHaveBeenCalled();
  expect(Checkbox.Group.mock.calls.at(-1)[0].disabled).toBe(true);
  await act(async () => Form.mock.calls.at(-1)[0].onFinish({ status: 0, attachments: [] }));
  expect(RequestUtils.Post).not.toHaveBeenCalled();
});
