import html2canvas from 'html2canvas'

const findCrossingRange = (ranges, minimumTop, target) => ranges.reduce((selected, range) => {
  const crossesBoundary = range.top > minimumTop && range.top < target && range.bottom > target
  return crossesBoundary && (!selected || range.top > selected.top) ? range : selected
}, null)

export const getPdfPageSlices = (root, canvasHeight, pagePixelHeight) => {
  const rootRect = root.getBoundingClientRect()
  const scaleY = canvasHeight / Math.max(rootRect.height, 1)
  const protectedRanges = Array.from(root.querySelectorAll('[data-pdf-avoid-break="true"], tbody tr, tfoot tr'))
    .map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        top: Math.max(0, Math.round((rect.top - rootRect.top) * scaleY)),
        bottom: Math.min(canvasHeight, Math.round((rect.bottom - rootRect.top) * scaleY)),
      }
    })
    .filter(range => range.bottom > range.top)

  const slices = []
  let offset = 0
  while (offset < canvasHeight) {
    const target = Math.min(offset + pagePixelHeight, canvasHeight)
    if (target === canvasHeight) {
      slices.push({ offset, height: target - offset })
      break
    }
    const crossingRange = findCrossingRange(
      protectedRanges,
      offset + pagePixelHeight * 0.35,
      target,
    )
    const cutAt = crossingRange?.top ?? target
    slices.push({ offset, height: cutAt - offset })
    offset = cutAt > offset ? cutAt : target
  }
  return slices
}

const pushStyleRestorer = (restorers, element, property, nextValue) => {
  const previous = element.style.getPropertyValue(property)
  const previousPriority = element.style.getPropertyPriority(property)
  element.style.setProperty(property, nextValue, 'important')
  restorers.push(() => {
    if (previous) element.style.setProperty(property, previous, previousPriority)
    else element.style.removeProperty(property)
  })
}

const shouldNeutralizeZoom = (node) => Boolean(
  node.hasAttribute?.('data-invoice-zoom') || node.style?.getPropertyValue('zoom'),
)

const shouldNeutralizeTransform = (node) => Boolean(
  node.classList?.contains('generated-document-page')
  || node.classList?.contains('document-pdf-page')
  || (node.style?.getPropertyValue('transform') && node.style.getPropertyValue('transform') !== 'none'),
)

/** Temporarily strip zoom/scale that break html2canvas text metrics (Chrome 128+). */
export const neutralizePdfCaptureStyles = (element) => {
  const restorers = []
  const targets = new Set()
  let node = element
  while (node && node.nodeType === 1) {
    targets.add(node)
    node = node.parentElement
  }
  element.querySelectorAll?.('[data-invoice-zoom], .generated-document-page, .document-pdf-page')
    .forEach(target => targets.add(target))

  targets.forEach((target) => {
    if (shouldNeutralizeZoom(target)) pushStyleRestorer(restorers, target, 'zoom', 'normal')
    if (shouldNeutralizeTransform(target)) pushStyleRestorer(restorers, target, 'transform', 'none')
  })

  return () => {
    while (restorers.length) restorers.pop()()
  }
}

export const withPdfCaptureLayout = async (root, run) => {
  const restore = neutralizePdfCaptureStyles(root)
  try {
    if (document.fonts?.ready) await document.fonts.ready
    return await run()
  } finally {
    restore()
  }
}

const prepareClonedPageForCapture = (clonedDoc, clonedElement) => {
  clonedDoc.querySelectorAll('[data-invoice-zoom]').forEach((node) => {
    node.style.setProperty('zoom', 'normal', 'important')
  })
  clonedDoc.querySelectorAll('.generated-document-page, .document-pdf-page').forEach((node) => {
    node.style.setProperty('transform', 'none', 'important')
    node.style.setProperty('zoom', 'normal', 'important')
  })
  clonedElement.style.setProperty('transform', 'none', 'important')
  clonedElement.style.setProperty('zoom', 'normal', 'important')
}

export const captureDocumentPage = (element, options = {}) => html2canvas(element, {
  scale: 2,
  useCORS: true,
  allowTaint: false,
  backgroundColor: '#ffffff',
  logging: false,
  ...options,
  onclone: (clonedDoc, clonedElement) => {
    prepareClonedPageForCapture(clonedDoc, clonedElement)
    options.onclone?.(clonedDoc, clonedElement)
  },
})
