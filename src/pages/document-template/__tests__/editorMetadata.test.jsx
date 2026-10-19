import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import EditorPage from '../Editor';
import DocumentTemplateService from '@/services/DocumentTemplateService';
let mockSave;
let mockSearch = '';
let mockSelect;
let mockInitialTemplate;
const mockNavigate = jest.fn();
const mockForm = { setFieldsValue: jest.fn(), getFieldValue: jest.fn(), validateFields: jest.fn() };
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useParams: () => ({}), useSearchParams: () => [new URLSearchParams(mockSearch)] }));
jest.mock('react-helmet', () => ({ Helmet: () => null }));
jest.mock('@erp/shared-ui/components/DocumentTemplateEditor/index', () => ({ __esModule: true, default: ({ onSave, initialTemplate }) => { mockSave = onSave; mockInitialTemplate = initialTemplate; return null; }, createEmptyTemplate: () => ({ name: 'Mẫu', nodes: [], documentType: 'quotation' }) }));
jest.mock('@/services/DocumentTemplateService', () => ({ __esModule: true, default: { fetchAllEntities: jest.fn(), fetchTemplates: jest.fn(), saveTemplate: jest.fn() }, buildDocumentSchemaFromEntityFields: () => ({}), normalizeDocumentSchema: () => [], normalizeDocumentType: value => value, parseDocumentTemplateData: value => JSON.parse(value), resolveDocumentTemplateType: record => record?.documentType }));
jest.mock('antd', () => {
  const Box = ({ children }) => <div>{children}</div>;
  const Form = Box; Form.useForm = () => [mockForm]; Form.Item = Box;
  return { Form, Row: Box, Col: Box, Alert: Box, Spin: Box, Input: () => null, Select: props => { mockSelect = props; return null; }, message: { success: jest.fn(), error: jest.fn() } };
});
let root;
beforeEach(() => {
  jest.clearAllMocks(); mockSearch = ''; global.IS_REACT_ACT_ENVIRONMENT = true;
  root = createRoot(document.createElement('div'));
  DocumentTemplateService.fetchAllEntities.mockResolvedValue([]);
  DocumentTemplateService.fetchTemplates.mockResolvedValue({ errorCode: 200, data: [{ templateId: 10, name: 'Mẫu hóa đơn', version: '1.0', documentType: 'invoice', data: JSON.stringify({ name: 'Mẫu hóa đơn', nodes: [{ id: 'source-node' }] }) }] });
  DocumentTemplateService.saveTemplate.mockResolvedValue({ errorCode: 200, data: { templateId: 11 } });
});
afterEach(async () => { await act(async () => root.unmount()); delete global.IS_REACT_ACT_ENVIRONMENT; });
test('loads an existing source design and saves a new template with the entered version', async () => {
  mockSearch = '?sourceTemplateId=10';
  mockForm.validateFields.mockResolvedValue({ version: ' 2.1 ' });
  await act(async () => root.render(<EditorPage />));
  await act(async () => mockSave({ name: 'Mẫu mới', documentType: 'quotation', nodes: [{ id: 1 }] }));
  const payload = DocumentTemplateService.saveTemplate.mock.calls[0][0];
  expect(payload).toMatchObject({ templateId: null, sourceTemplateId: 10, documentType: 'invoice', version: '2.1' });
  expect(mockInitialTemplate.nodes).toEqual([{ id: 'source-node' }]);
  expect(JSON.parse(payload.data)).toEqual({ name: 'Mẫu mới', nodes: [{ id: 1 }] });
});
test('does not call save API when metadata is invalid', async () => {
  mockForm.validateFields.mockRejectedValue({ errorFields: [{ name: ['version'] }] });
  await act(async () => root.render(<EditorPage />));
  await act(async () => mockSave({ name: 'Mẫu', nodes: [] }));
  expect(DocumentTemplateService.saveTemplate).not.toHaveBeenCalled();
});

test('lists existing templates and chooses one through sourceTemplateId', async () => {
  await act(async () => root.render(<EditorPage />));
  expect(mockSelect.options[0]).toEqual({ value: 10, label: 'Mẫu hóa đơn — v1.0 (#10)' });
  mockSelect.onChange(10);
  expect(mockNavigate).toHaveBeenCalledWith('/system/document-templates/create?sourceTemplateId=10', { replace: true });
});
