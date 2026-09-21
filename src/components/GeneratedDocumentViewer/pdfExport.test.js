import {
  captureDocumentPage,
  getPdfPageSlices,
  neutralizePdfCaptureStyles,
} from './pdfExport'

jest.mock('html2canvas', () => jest.fn(() => Promise.resolve({ width: 100, height: 100 })))

const html2canvas = require('html2canvas')

describe('pdfExport', () => {
  it('splits tall canvases without cutting protected rows', () => {
    const root = document.createElement('div')
    Object.defineProperty(root, 'getBoundingClientRect', {
      value: () => ({ top: 0, bottom: 2000, height: 2000 }),
    })
    const row = document.createElement('tr')
    Object.defineProperty(row, 'getBoundingClientRect', {
      value: () => ({ top: 950, bottom: 1050 }),
    })
    const tbody = document.createElement('tbody')
    tbody.appendChild(row)
    root.appendChild(tbody)

    expect(getPdfPageSlices(root, 2000, 1000)).toEqual([
      { offset: 0, height: 950 },
      { offset: 950, height: 1000 },
      { offset: 1950, height: 50 },
    ])
  })

  it('disables invoice zoom and page scale for capture, then restores them', () => {
    const zoomWrap = document.createElement('div')
    zoomWrap.setAttribute('data-invoice-zoom', '')
    zoomWrap.style.setProperty('zoom', '0.85')
    const page = document.createElement('div')
    page.className = 'document-pdf-page generated-document-page'
    page.style.setProperty('transform', 'scale(0.85)')
    zoomWrap.appendChild(page)
    document.body.appendChild(zoomWrap)

    const restore = neutralizePdfCaptureStyles(page)
    expect(page.style.getPropertyValue('transform')).toBe('none')
    // jsdom may drop unrecognized `zoom`; assert we still clear transform and restore after.
    const zoomAfterNeutralize = zoomWrap.style.getPropertyValue('zoom')
    if (zoomAfterNeutralize) expect(zoomAfterNeutralize).toBe('normal')

    restore()
    expect(page.style.getPropertyValue('transform')).toBe('scale(0.85)')
    const zoomAfterRestore = zoomWrap.style.getPropertyValue('zoom')
    if (zoomAfterRestore) expect(zoomAfterRestore).toBe('0.85')
    zoomWrap.remove()
  })

  it('captures pages with onclone that clears zoom and transform', async () => {
    const page = document.createElement('div')
    page.className = 'document-pdf-page'
    document.body.appendChild(page)

    html2canvas.mockImplementation(async (element, options) => {
      const clone = document.createElement('div')
      clone.className = 'document-pdf-page'
      clone.style.setProperty('transform', 'scale(0.8)')
      const zoom = document.createElement('div')
      zoom.setAttribute('data-invoice-zoom', '')
      zoom.style.setProperty('zoom', '0.8')
      const clonedPage = document.createElement('div')
      clonedPage.className = 'generated-document-page'
      clonedPage.style.setProperty('transform', 'scale(0.8)')
      const doc = {
        querySelectorAll: (selector) => {
          if (selector.includes('data-invoice-zoom')) return [zoom]
          if (selector.includes('generated-document-page')) return [clonedPage]
          return []
        },
      }
      options.onclone(doc, clone)
      expect(clonedPage.style.getPropertyValue('transform')).toBe('none')
      expect(clone.style.getPropertyValue('transform')).toBe('none')
      const zoomValue = zoom.style.getPropertyValue('zoom')
      if (zoomValue) expect(zoomValue).toBe('normal')
      return { width: 10, height: 10 }
    })

    await captureDocumentPage(page)
    expect(html2canvas).toHaveBeenCalled()
    page.remove()
  })
})
