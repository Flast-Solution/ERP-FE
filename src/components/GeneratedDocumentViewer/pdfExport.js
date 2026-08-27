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
