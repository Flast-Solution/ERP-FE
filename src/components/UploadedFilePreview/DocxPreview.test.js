/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { strToU8, zipSync } from 'fflate'
import DocxPreview from './DocxPreview'

jest.mock('antd', () => ({
  Alert: ({ message }) => <div>{message}</div>, Spin: () => <span>Loading</span>,
}))

test('renders Word text, bold formatting and tables inside an isolated frame', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const bytes = zipSync({
    '[Content_Types].xml': strToU8('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
    '_rels/.rels': strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
    'word/document.xml': strToU8('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Delivery document</w:t></w:r></w:p><w:tbl><w:tblPr/><w:tblGrid><w:gridCol w:w="2000"/></w:tblGrid><w:tr><w:tc><w:p><w:r><w:t>Fabric</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>'),
  })
  try {
    await act(async () => root.render(<DocxPreview buffer={bytes.buffer} name="delivery.docx" />))
    const iframe = container.querySelector('iframe')
    const frame = iframe.contentDocument
    frame.body.innerHTML = '<div id="styles"></div><div id="document"></div>'
    await act(async () => iframe.dispatchEvent(new Event('load')))
    for (let attempt = 0; attempt < 50 && !frame.querySelector('table'); attempt++) {
      await act(async () => new Promise(resolve => setTimeout(resolve, 10)))
    }
    expect(iframe.getAttribute('sandbox')).toBe('allow-same-origin')
    expect(frame.body.textContent).toContain('Delivery document')
    expect(frame.querySelector('table').textContent).toContain('Fabric')
    expect(frame.querySelector('span').style.fontWeight).toBe('bold')
    expect(frame.querySelector('section.docx')).not.toBeNull()
  } finally {
    await act(async () => root.unmount())
    container.remove()
    delete global.IS_REACT_ACT_ENVIRONMENT
  }
})
