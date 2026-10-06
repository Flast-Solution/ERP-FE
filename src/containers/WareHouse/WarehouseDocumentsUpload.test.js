/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import { Form, Upload, message } from 'antd'
import WarehouseDocumentsUpload from './WarehouseDocumentsUpload'
import UploadedFilePreview from '../../components/UploadedFilePreview'

jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn(), defaults: {} } }))
jest.mock('@ant-design/icons', () => ({ UploadOutlined: () => null }))
jest.mock('../../components/UploadedFilePreview', () => jest.fn(() => null))
jest.mock('antd', () => ({
  Form: { useFormInstance: jest.fn(), useWatch: jest.fn(), Item: ({ children }) => <div>{children}</div> },
  Upload: { Dragger: jest.fn(() => null), LIST_IGNORE: 'ignore' },
  message: { success: jest.fn(), error: jest.fn() },
}))

let root
let form
let stored
beforeEach(() => {
  jest.clearAllMocks()
  global.IS_REACT_ACT_ENVIRONMENT = true
  root = createRoot(document.createElement('div'))
  stored = ['warehouse/old.pdf']
  form = {
    getFieldValue: () => stored,
    setFieldValue: jest.fn((name, value) => { stored = value }),
  }
  Form.useFormInstance.mockReturnValue(form)
  Form.useWatch.mockImplementation(() => stored)
})
afterEach(async () => {
  await act(async () => root.unmount())
  delete global.IS_REACT_ACT_ENVIRONMENT
})

test('uploads multiple documents to warehouse and appends paths to existing attachments', async () => {
  const changed = jest.fn()
  const uploading = jest.fn()
  axios.post.mockResolvedValue({ data: { files: ['warehouse/new.docx', 'warehouse/new.xlsx'] } })
  await act(async () => root.render(<WarehouseDocumentsUpload onChange={changed} onUploadingChange={uploading} />))
  const files = [new File(['word'], 'new.docx'), new File(['sheet'], 'new.xlsx')]
  await act(async () => {
    const props = Upload.Dragger.mock.calls.at(-1)[0]
    files.forEach(file => expect(props.beforeUpload(file, files)).toBe(Upload.LIST_IGNORE))
  })
  expect(axios.post).toHaveBeenCalledTimes(1)
  const [url, body] = axios.post.mock.calls[0]
  expect(url).toBe('/erp/folder/multiple')
  expect(body.get('folder')).toBe('warehouse')
  expect(body.getAll('files').map(file => file.name)).toEqual(['new.docx', 'new.xlsx'])
  expect(stored).toEqual(['warehouse/old.pdf', 'warehouse/new.docx', 'warehouse/new.xlsx'])
  expect(changed).toHaveBeenCalledTimes(1)
  expect(uploading.mock.calls).toEqual([[true], [false]])
})

test('previews restored attachments in the modal and supports removing a document', async () => {
  await act(async () => root.render(<WarehouseDocumentsUpload />))
  const props = Upload.Dragger.mock.calls.at(-1)[0]
  const file = props.fileList[0]
  expect(file.url).toBe('/api/erp/folder/view/warehouse/old.pdf')
  await act(async () => props.onPreview(file))
  expect(UploadedFilePreview.mock.calls.at(-1)[0].file).toBe(file)
  await act(async () => UploadedFilePreview.mock.calls.at(-1)[0].onClose())
  expect(UploadedFilePreview.mock.calls.at(-1)[0].file).toBeNull()
  await act(async () => props.onRemove(file))
  expect(stored).toEqual([])
})

test('failed uploads keep saved attachments and release the submitting guard', async () => {
  const uploading = jest.fn()
  axios.post.mockRejectedValue(new Error('Upload failed'))
  await act(async () => root.render(<WarehouseDocumentsUpload onUploadingChange={uploading} />))
  const file = new File(['pdf'], 'new.pdf')
  await act(async () => Upload.Dragger.mock.calls.at(-1)[0].beforeUpload(file, [file]))
  expect(stored).toEqual(['warehouse/old.pdf'])
  expect(message.error).toHaveBeenCalledWith('Upload failed')
  expect(uploading.mock.calls).toEqual([[true], [false]])
})
