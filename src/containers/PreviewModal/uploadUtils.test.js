import axios from 'axios'
import { resolveRuntimeAssetUrl, resolveUploadUrl } from './uploadUtils'

describe('upload asset URLs', () => {
  const originalBaseUrl = axios.defaults.baseURL

  beforeEach(() => {
    axios.defaults.baseURL = '/api'
  })

  afterEach(() => {
    axios.defaults.baseURL = originalBaseUrl
  })

  it.each([
    ['http://localhost:3000/api/upload/folder/view?filename=document-template%2Flogo.png', '/api/erp/folder/view/document-template/logo.png'],
    ['https://localhost:3000/api/upload/folder/view?filename=image.png#preview', '/api/erp/folder/view/image.png#preview'],
    ['http://127.0.0.1:3000/api/upload/folder/view?filename=image.png', '/api/erp/folder/view/image.png'],
    ['http://[::1]:3000/api/upload/folder/view?filename=image.png', '/api/erp/folder/view/image.png'],
  ])('removes a persisted development origin from %s', (source, expected) => {
    expect(resolveRuntimeAssetUrl(source)).toBe(expected)
  })

  it.each([
    ['https://cdn.example.com/logo.png', 'https://cdn.example.com/logo.png'],
    ['/api/erp/folder/view/logo.png', '/api/erp/folder/view/logo.png'],
    ['data:image/png;base64,AAAA', 'data:image/png;base64,AAAA'],
    ['blob:https://example.com/id', 'blob:https://example.com/id'],
  ])('preserves portable and external source %s', (source, expected) => {
    expect(resolveRuntimeAssetUrl(source)).toBe(expected)
  })

  it('creates a portable URL when uploading on the development server', () => {
    axios.defaults.baseURL = 'http://localhost:3000/api'
    expect(resolveUploadUrl({ fileName: 'document-template/image/photo 1.png' })).toBe(
      '/api/erp/folder/view/document-template/image/photo-1.png',
    )
  })

  it('keeps an explicit remote API origin when the deployment uses one', () => {
    axios.defaults.baseURL = 'https://api.example.com/api'
    expect(resolveUploadUrl('document-template/logo/logo.png')).toBe(
      'https://api.example.com/api/erp/folder/view/document-template/logo/logo.png',
    )
  })

  it('adds the deployed API origin to an API-relative image URL', () => {
    axios.defaults.baseURL = 'http://157.10.199.138:9080/api'
    expect(resolveRuntimeAssetUrl('/api/upload/folder/view?filename=document-template%2Flogo.png')).toBe(
      'http://157.10.199.138:9080/api/erp/folder/view/document-template/logo.png',
    )
  })

  it('moves a persisted localhost image URL to the deployed API origin', () => {
    axios.defaults.baseURL = 'https://api.example.com/api'
    expect(resolveRuntimeAssetUrl('http://localhost:3000/api/upload/folder/view?filename=logo.png')).toBe(
      'https://api.example.com/api/erp/folder/view/logo.png',
    )
  })

  it('migrates an old remote query URL to the path format', () => {
    expect(resolveRuntimeAssetUrl(
      'http://157.10.199.138:9080/api/upload/folder/view?filename=test%2Fmy%20image.png',
    )).toBe('http://157.10.199.138:9080/api/erp/folder/view/test/my-image.png')
  })
})
