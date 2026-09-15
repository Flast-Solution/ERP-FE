import { COMPONENT_TYPES, DOCUMENT_SCHEMA_VERSION } from './constants'
import { createNodeId } from './utils'

const PDF_SCALE = 96 / 72

const multiplyMatrix = (left, right) => [
  left[0] * right[0] + left[2] * right[1],
  left[1] * right[0] + left[3] * right[1],
  left[0] * right[2] + left[2] * right[3],
  left[1] * right[2] + left[3] * right[3],
  left[0] * right[4] + left[2] * right[5] + left[4],
  left[1] * right[4] + left[3] * right[5] + left[5],
]

const applyMatrix = (matrix, x, y) => [
  matrix[0] * x + matrix[2] * y + matrix[4],
  matrix[1] * x + matrix[3] * y + matrix[5],
]

const toHex = (values = []) => {
  const normalized = Array.from(values).slice(0, 3).map(value => {
    const channel = value <= 1 ? value * 255 : value
    return Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0')
  })
  return normalized.length === 3 ? `#${normalized.join('')}` : '#111111'
}

const createAbsoluteLayout = (page, x, y, width, height, rotation = 0) => ({
  absolute: {
    page,
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.max(width, 1),
    height: Math.max(height, 1),
    rotation,
  },
  avoidPageBreak: true,
})

const createTextNodes = async (page, pageNumber, viewport) => {
  const textContent = await page.getTextContent()
  return textContent.items
    .filter(item => String(item.str ?? '').trim())
    .map((item) => {
      const matrix = multiplyMatrix(viewport.transform, item.transform)
      const fontSize = Math.max(Math.hypot(matrix[2], matrix[3]), 6)
      const width = Math.max((item.width || item.str.length * fontSize * 0.5) * viewport.scale, 2)
      const left = matrix[4]
      const top = matrix[5] - fontSize
      const fontMeta = textContent.styles?.[item.fontName] ?? {}
      const fontFamily = fontMeta.fontFamily || 'Times New Roman'
      const isBold = /bold|black|heavy|semibold/i.test(`${item.fontName} ${fontFamily}`)
      return {
        id: createNodeId(),
        type: COMPONENT_TYPES.RICH_TEXT,
        visible: true,
        importedFromPdf: true,
        layout: createAbsoluteLayout(pageNumber, left, top, width + 2, fontSize * 1.25),
        style: {
          fontFamily,
          fontSize,
          fontWeight: isBold ? 700 : 400,
          lineHeight: 1,
          textAlign: 'left',
          color: '#111111',
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderRadius: 0,
          padding: 0,
          marginBottom: 0,
          whiteSpace: 'pre',
        },
        content: String(item.str),
      }
    })
}

const createVectorNodes = async (pdfjs, page, pageNumber, viewport) => {
  const operatorList = await page.getOperatorList()
  const nodes = []
  const stack = []
  let ctm = [1, 0, 0, 1, 0, 0]
  let lineWidth = 1
  let strokeColor = '#111111'
  let fillColor = '#111111'
  let currentPath = []
  const imageDescriptors = []

  const mapPoint = (x, y) => {
    const [userX, userY] = applyMatrix(ctm, x, y)
    return applyMatrix(viewport.transform, userX, userY)
  }

  const flushPath = (paintMode = 'stroke') => {
    currentPath.forEach((shape) => {
      if (shape.type === 'rectangle') {
        const [startX, startY] = mapPoint(shape.x, shape.y)
        const [endX, endY] = mapPoint(shape.x + shape.width, shape.y + shape.height)
        nodes.push({
          id: createNodeId(),
          type: COMPONENT_TYPES.RECTANGLE,
          visible: true,
          importedFromPdf: true,
          layout: createAbsoluteLayout(
            pageNumber,
            Math.min(startX, endX),
            Math.min(startY, endY),
            Math.abs(endX - startX),
            Math.abs(endY - startY),
          ),
          style: paintMode === 'fill'
            ? { borderWidth: 0, borderColor: fillColor, backgroundColor: fillColor, padding: 0, marginBottom: 0 }
            : { borderWidth: Math.max(lineWidth * viewport.scale, 0.5), borderColor: strokeColor, backgroundColor: 'transparent', padding: 0, marginBottom: 0 },
          height: Math.abs(endY - startY),
        })
        return
      }
      if (paintMode !== 'stroke') return
      const [startX, startY] = mapPoint(shape.x1, shape.y1)
      const [endX, endY] = mapPoint(shape.x2, shape.y2)
      const deltaX = endX - startX
      const deltaY = endY - startY
      const length = Math.hypot(deltaX, deltaY)
      if (length < 1) return
      nodes.push({
        id: createNodeId(),
        type: COMPONENT_TYPES.LINE,
        visible: true,
        importedFromPdf: true,
        layout: createAbsoluteLayout(pageNumber, startX, startY, length, Math.max(lineWidth * viewport.scale, 1), Math.atan2(deltaY, deltaX) * 180 / Math.PI),
        style: { borderColor: strokeColor, borderWidth: Math.max(lineWidth * viewport.scale, 0.5), padding: 0, marginBottom: 0 },
      })
    })
    currentPath = []
  }

  operatorList.fnArray.forEach((fn, index) => {
    const args = operatorList.argsArray[index] ?? []
    if (fn === pdfjs.OPS.save) stack.push({ ctm: [...ctm], lineWidth, strokeColor, fillColor })
    else if (fn === pdfjs.OPS.restore) {
      const saved = stack.pop()
      if (saved) ({ ctm, lineWidth, strokeColor, fillColor } = saved)
    } else if (fn === pdfjs.OPS.transform) ctm = multiplyMatrix(ctm, args)
    else if (fn === pdfjs.OPS.setLineWidth) lineWidth = Number(args[0]) || 1
    else if (fn === pdfjs.OPS.setStrokeRGBColor) strokeColor = toHex(args)
    else if (fn === pdfjs.OPS.setFillRGBColor) fillColor = toHex(args)
    else if (fn === pdfjs.OPS.constructPath) {
      const pathOps = Array.from(args[0] ?? [])
      const coords = Array.from(args[1] ?? [])
      let cursor = 0
      let current = null
      pathOps.forEach((pathOp) => {
        if (pathOp === pdfjs.OPS.moveTo) {
          current = { x: coords[cursor], y: coords[cursor + 1] }
          cursor += 2
        } else if (pathOp === pdfjs.OPS.lineTo) {
          const next = { x: coords[cursor], y: coords[cursor + 1] }
          cursor += 2
          if (current) currentPath.push({ type: 'line', x1: current.x, y1: current.y, x2: next.x, y2: next.y })
          current = next
        } else if (pathOp === pdfjs.OPS.rectangle) {
          currentPath.push({ type: 'rectangle', x: coords[cursor], y: coords[cursor + 1], width: coords[cursor + 2], height: coords[cursor + 3] })
          cursor += 4
        } else if ([pdfjs.OPS.curveTo, pdfjs.OPS.curveTo2, pdfjs.OPS.curveTo3].includes(pathOp)) {
          cursor += pathOp === pdfjs.OPS.curveTo ? 6 : 4
        }
      })
    } else if ([pdfjs.OPS.stroke, pdfjs.OPS.closeStroke, pdfjs.OPS.fillStroke, pdfjs.OPS.eoFillStroke, pdfjs.OPS.closeFillStroke, pdfjs.OPS.closeEOFillStroke].includes(fn)) {
      flushPath('stroke')
    } else if ([pdfjs.OPS.fill, pdfjs.OPS.eoFill].includes(fn)) {
      flushPath('fill')
    } else if (fn === pdfjs.OPS.paintImageXObject) {
      imageDescriptors.push({ objectId: args[0], ctm: [...ctm] })
    } else if (fn === pdfjs.OPS.paintInlineImageXObject) {
      imageDescriptors.push({ image: args[0], ctm: [...ctm] })
    } else if (fn === pdfjs.OPS.endPath) {
      currentPath = []
    }
  })

  const objectToDataUrl = (image) => {
    if (!image || typeof document === 'undefined') return ''
    const canvas = document.createElement('canvas')
    const drawable = image.bitmap || image.image || image.canvas || image
    const width = image.width || drawable?.width
    const height = image.height || drawable?.height
    if (!width || !height) return ''
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return ''
    if (!image.data) {
      const isDrawable = (
        (typeof HTMLImageElement !== 'undefined' && drawable instanceof HTMLImageElement)
        || (typeof HTMLCanvasElement !== 'undefined' && drawable instanceof HTMLCanvasElement)
        || (typeof ImageBitmap !== 'undefined' && drawable instanceof ImageBitmap)
        || (typeof OffscreenCanvas !== 'undefined' && drawable instanceof OffscreenCanvas)
        || (typeof SVGImageElement !== 'undefined' && drawable instanceof SVGImageElement)
        || (typeof HTMLVideoElement !== 'undefined' && drawable instanceof HTMLVideoElement)
      )
      if (!isDrawable) return ''
      context.drawImage(drawable, 0, 0, width, height)
      return canvas.toDataURL('image/png')
    }
    const rgba = new Uint8ClampedArray(width * height * 4)
    if (image.data.length === rgba.length) rgba.set(image.data)
    else if (image.data.length === width * height * 3) {
      for (let source = 0, target = 0; source < image.data.length; source += 3, target += 4) {
        rgba[target] = image.data[source]
        rgba[target + 1] = image.data[source + 1]
        rgba[target + 2] = image.data[source + 2]
        rgba[target + 3] = 255
      }
    } else return ''
    context.putImageData(new ImageData(rgba, width, height), 0, 0)
    return canvas.toDataURL('image/png')
  }

  const getPageObject = objectId => new Promise(resolve => page.objs.get(objectId, resolve))
  const imageNodes = await Promise.all(imageDescriptors.map(async (descriptor) => {
    const image = descriptor.image || await getPageObject(descriptor.objectId)
    let src = ''
    try {
      src = objectToDataUrl(image)
    } catch {
      src = ''
    }
    if (!src) return null
    const imageMatrix = multiplyMatrix(viewport.transform, descriptor.ctm)
    const corners = [
      applyMatrix(imageMatrix, 0, 0),
      applyMatrix(imageMatrix, 1, 0),
      applyMatrix(imageMatrix, 0, 1),
      applyMatrix(imageMatrix, 1, 1),
    ]
    const xs = corners.map(point => point[0])
    const ys = corners.map(point => point[1])
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    const width = Math.max(...xs) - x
    const height = Math.max(...ys) - y
    return {
      id: createNodeId(),
      type: COMPONENT_TYPES.IMAGE,
      visible: true,
      importedFromPdf: true,
      layout: createAbsoluteLayout(pageNumber, x, y, width, height),
      style: { padding: 0, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent' },
      src,
      alt: `Ảnh import trang ${pageNumber}`,
      height,
    }
  }))
  nodes.push(...imageNodes.filter(Boolean))
  return nodes
}

export const importPdfAsTemplate = async (file, currentTemplate = {}) => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf')
  await import('pdfjs-dist/legacy/build/pdf.worker.entry')
  const buffer = await file.arrayBuffer()
  const document = await pdfjs.getDocument({ data: buffer, disableWorker: true }).promise
  const pages = []
  const nodes = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const viewport = page.getViewport({ scale: PDF_SCALE })
    pages.push({ pageNumber, width: viewport.width, height: viewport.height })
    const [textNodes, vectorNodes] = await Promise.all([
      createTextNodes(page, pageNumber, viewport),
      createVectorNodes(pdfjs, page, pageNumber, viewport),
    ])
    nodes.push(...vectorNodes, ...textNodes)
  }

  return {
    ...currentTemplate,
    schemaVersion: Math.max(DOCUMENT_SCHEMA_VERSION, 3),
    name: currentTemplate.name || file.name.replace(/\.pdf$/i, ''),
    page: { ...(currentTemplate.page ?? {}), margin: { top: 0, right: 0, bottom: 0, left: 0 } },
    layout: { mode: 'absolute', columns: 12, columnGap: 0, rowGap: 0 },
    importedPdf: { name: file.name, importedAt: new Date().toISOString(), pageCount: document.numPages },
    pages,
    nodes,
  }
}
