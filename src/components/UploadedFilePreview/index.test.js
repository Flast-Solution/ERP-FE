/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import UploadedFilePreview from './index'

jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn(), defaults: {} } }))
jest.mock('./PdfPreview', () => ({ __esModule: true, default: () => <div>PDF viewer</div> }))
jest.mock('./DocxPreview', () => ({ __esModule: true, default: () => <div>Word viewer</div> }))
jest.mock('./SpreadsheetPreview', () => ({ __esModule: true, default: () => <div>Excel viewer</div> }))
jest.mock('antd', () => ({
  Modal: ({ open, children }) => open ? <div>{children}</div> : null,
  Alert: ({ message }) => <div>{message}</div>, Spin: () => <div>Loading</div>,
  Image: ({ src, alt }) => <img src={src} alt={alt} />,
}))
let root
let container
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  jest.clearAllMocks()
  container = document.createElement('div')
  root = createRoot(container)
  axios.get.mockResolvedValue({ data: new Uint8Array([1, 2]).buffer })
})
afterEach(async () => {
  await act(async () => root.unmount())
  delete global.IS_REACT_ACT_ENVIRONMENT
})

test.each([['pdf', 'PDF'], ['docx', 'Word'], ['xlsx', 'Excel']])('loads the %s viewer only when a file is opened', async (extension, viewer) => {
  await act(async () => root.render(<UploadedFilePreview file={null} onClose={() => {}} />))
  expect(axios.get).not.toHaveBeenCalled()
  await act(async () => root.render(<UploadedFilePreview file={{ name: `file.${extension}`, url: `/api/file.${extension}` }} onClose={() => {}} />))
  expect(container.textContent).toContain(`${viewer} viewer`)
  expect(axios.get).toHaveBeenCalledWith(`/api/file.${extension}`, expect.objectContaining({ baseURL: '', responseType: 'arraybuffer' }))
  expect(container.querySelector('a')).toBeNull()
})

test('cancels an in-flight request and does not display the previous file after switching', async () => {
  let resolveFirst
  axios.get.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
  await act(async () => root.render(<UploadedFilePreview file={{ name: 'first.docx', url: '/api/first.docx' }} />))
  const signal = axios.get.mock.calls[0][1].signal
  await act(async () => root.render(<UploadedFilePreview file={{ name: 'second.xlsx', url: '/api/second.xlsx' }} />))
  expect(signal.aborted).toBe(true)
  await act(async () => resolveFirst({ data: new ArrayBuffer(1) }))
  expect(container.textContent).toContain('Excel viewer')
  expect(container.textContent).not.toContain('Word viewer')
})

test('shows loading errors and rejects legacy DOC without requesting the file', async () => {
  await act(async () => root.render(<UploadedFilePreview file={{ name: 'old.doc', url: '/api/old.doc' }} />))
  expect(container.textContent).toContain('chưa hỗ trợ')
  expect(axios.get).not.toHaveBeenCalled()
  axios.get.mockRejectedValue(new Error('Request failed'))
  await act(async () => root.render(<UploadedFilePreview file={{ name: 'file.pdf', url: '/api/file.pdf' }} />))
  expect(container.textContent).toContain('Request failed')
})

test('releases image blob URLs when the preview closes', async () => {
  URL.createObjectURL = jest.fn(() => 'blob:image-preview')
  URL.revokeObjectURL = jest.fn()
  await act(async () => root.render(<UploadedFilePreview file={{ name: 'file.png', url: '/api/file.png' }} />))
  expect(container.querySelector('img').getAttribute('src')).toBe('blob:image-preview')
  await act(async () => root.render(<UploadedFilePreview file={null} />))
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:image-preview')
})

test('does not duplicate the API prefix when axios has an API base URL', () => {
  const client = jest.requireActual('axios').create({ baseURL: '/api' })
  expect(client.getUri({ url: '/api/erp/folder/view/warehouse/file.docx', baseURL: '' }))
    .toBe('/api/erp/folder/view/warehouse/file.docx')
})
