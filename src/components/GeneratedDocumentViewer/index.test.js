import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import GeneratedDocumentViewer from './index'

jest.mock('antd', () => {
  const React = require('react')
  const Children = ({ children }) => React.createElement('div', null, children)
  return {
    Button: ({ children, disabled, onClick }) => React.createElement('button', { disabled, onClick }, children),
    Drawer: ({ open, children }) => open ? React.createElement('div', null, children) : null,
    Spin: Children,
    Tooltip: Children,
    Segmented: () => null,
    Empty: () => null,
    Input: { TextArea: () => null },
    message: { error: jest.fn(), success: jest.fn() },
  }
})
jest.mock('@ant-design/icons', () => Object.fromEntries([
  'CheckOutlined', 'CloseCircleOutlined', 'CloseOutlined', 'DownloadOutlined',
  'MinusOutlined', 'PlusOutlined', 'PrinterOutlined', 'SaveOutlined', 'SendOutlined',
].map(name => [name, () => null])))
jest.mock('html2canvas', () => jest.fn())
jest.mock('jspdf', () => ({ jsPDF: jest.fn() }))
jest.mock('react-to-print', () => ({ useReactToPrint: () => jest.fn() }))
jest.mock('@/components/DocumentTemplateEditor/DocumentNodeContent', () => {
  const React = require('react')
  return ({ editable }) => React.createElement('input', { disabled: !editable, defaultValue: 'Quote value' })
}, { virtual: true })
jest.mock('@/components/DocumentTemplateEditor/styles', () => {
  const React = require('react')
  const Block = React.forwardRef(({ children }, ref) => React.createElement('div', { ref }, children))
  return { A4Page: Block, A4ContentGrid: Block }
}, { virtual: true })
jest.mock('@/components/DocumentTemplateEditor/utils', () => ({
  getValueByPath: require('lodash/get'),
}), { virtual: true })

const template = { nodes: [{ id: 'note', type: 'richText', content: '{{ input:customerOrder.customerNote }}' }] }
const data = { customerOrder: { id: 34019, customerNote: 'Quote value' } }

describe('quotation viewer controls', () => {
  let container
  let root

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => { root.unmount() })
    delete global.IS_REACT_ACT_ENVIRONMENT
  })

  const mount = async props => {
    // eslint-disable-next-line testing-library/no-unnecessary-act -- React DOM root.render requires act.
    await act(async () => { root.render(<GeneratedDocumentViewer open template={template} data={data} {...props} />) })
  }
  const findButton = label => [...container.querySelectorAll('button')].find(button => button.textContent === label)

  it('shows Save and editable fields for draft submitters', async () => {
    await mount({ onSubmitDocument: jest.fn() })
    expect(findButton('Lưu báo giá')).toBeDefined()
    expect(findButton('Duyệt')).toBeUndefined()
    expect(container.querySelector('input').disabled).toBe(false)
  })

  it.each([false, true])('shows review actions instead of Save and honors readOnly=%s', async readOnly => {
    const onApproveDocument = jest.fn()
    const onRejectDocument = jest.fn()
    await mount({ readOnly, onApproveDocument, onRejectDocument, toolbarContent: <span>Trạng thái duyệt</span> })
    expect(findButton('Lưu báo giá')).toBeUndefined()
    expect(container.textContent).not.toContain('Trang 1')
    expect(container.querySelector('input').disabled).toBe(readOnly)
    await act(async () => { findButton('Duyệt').click() })
    await act(async () => { findButton('Từ chối').click() })
    expect(onApproveDocument).toHaveBeenCalledWith(data)
    expect(onRejectDocument).toHaveBeenCalledWith(data)
  })

  it('cannot show Save or editable fields when the document is read-only', async () => {
    await mount({ readOnly: true, onSubmitDocument: jest.fn(), allowDocumentSubmit: true })
    expect(findButton('Lưu báo giá')).toBeUndefined()
    expect(container.querySelector('input').disabled).toBe(true)
  })

  it('disables both review actions and editing during an in-flight decision', async () => {
    await mount({ onApproveDocument: jest.fn(), onRejectDocument: jest.fn(), documentSubmitting: true })
    expect(findButton('Duyệt').disabled).toBe(true)
    expect(findButton('Từ chối').disabled).toBe(true)
    expect(container.querySelector('input').disabled).toBe(true)
  })

  it('keeps both decision buttons visible but disabled after review, and enables them on resubmission', async () => {
    const onApproveDocument = jest.fn()
    const onRejectDocument = jest.fn()
    await mount({ onApproveDocument, onRejectDocument, reviewDisabled: true })
    expect(findButton('Duyệt').disabled).toBe(true)
    expect(findButton('Từ chối').disabled).toBe(true)
    await act(async () => {
      findButton('Duyệt').click()
      findButton('Từ chối').click()
    })
    expect(onApproveDocument).not.toHaveBeenCalled()
    expect(onRejectDocument).not.toHaveBeenCalled()
    await mount({ onApproveDocument, onRejectDocument, reviewDisabled: false })
    expect(findButton('Duyệt').disabled).toBe(false)
    expect(findButton('Từ chối').disabled).toBe(false)
  })
})
