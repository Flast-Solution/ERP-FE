/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import PdfPreview from './PdfPreview'

test('previews PDF in an iframe with the correct MIME type and releases blob URLs on change and close', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  URL.createObjectURL = jest.fn().mockReturnValueOnce('blob:first-pdf').mockReturnValueOnce('blob:second-pdf')
  URL.revokeObjectURL = jest.fn()
  const container = document.createElement('div')
  const root = createRoot(container)
  try {
    await act(async () => root.render(<PdfPreview buffer={new ArrayBuffer(4)} name="delivery.pdf" />))
    expect(URL.createObjectURL.mock.calls[0][0].type).toBe('application/pdf')
    expect(container.querySelector('iframe').getAttribute('src')).toBe('blob:first-pdf')
    expect(container.querySelector('iframe').title).toBe('delivery.pdf')
    await act(async () => root.render(<PdfPreview buffer={new ArrayBuffer(8)} />))
    expect(container.querySelector('iframe').getAttribute('src')).toBe('blob:second-pdf')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:first-pdf')
  } finally {
    await act(async () => root.unmount())
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:second-pdf')
    delete global.IS_REACT_ACT_ENVIRONMENT
  }
})
