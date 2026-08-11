import { GATEWAY } from '@/configs'
import {
  resolveUploadFilename,
  resolveUploadUrl,
} from '@/containers/PreviewModal/uploadUtils'

const parseStringValue = (value) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) return []

  try {
    const parsed = JSON.parse(normalized)
    if (Array.isArray(parsed)) return parsed
    if (typeof parsed === 'string') return [parsed]
  } catch (_) {
    // Hỗ trợ dữ liệu cũ chưa lưu theo JSON.
  }

  if (normalized.includes('||')) return normalized.split('||')
  if (normalized.includes('\n')) return normalized.split(/\r?\n/)
  if (normalized.includes(',')) return normalized.split(',')
  return [normalized]
}

const parseProductAssets = (value, keys) => {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? (keys.map(key => value[key]).find(Boolean) || value)
    : value
  const items = Array.isArray(source) ? source : parseStringValue(source)

  return [...new Set(items
    .flatMap(item => (typeof item === 'string' ? parseStringValue(item) : [item]))
    .map(resolveUploadFilename)
    .map(item => String(item ?? '').trim())
    .filter(Boolean))]
}

export const parseProductImages = value => parseProductAssets(
  value,
  ['image', 'images', 'imageUrls', 'fileUrls'],
)

export const serializeProductImages = (value) => JSON.stringify(parseProductImages(value))

export const isProductImageAsset = (value) => {
  const filename = resolveUploadFilename(value)
  const path = String(filename ?? '').split(/[?#]/)[0].toLowerCase()
  return /\.(avif|bmp|gif|heic|heif|ico|jpe?g|png|svg|webp)$/.test(path)
}

export const splitProductAssets = (value) => {
  const legacyFileValue = value && typeof value === 'object' && !Array.isArray(value)
    ? (value.file || value.files || value.attachments || value.attachmentUrls)
    : null
  const legacyFiles = legacyFileValue ? parseProductImages(legacyFileValue) : []
  const assets = [...new Set([
    ...parseProductImages(value),
    ...legacyFiles,
  ])]
  return {
    images: assets.filter(isProductImageAsset),
    files: assets.filter(asset => !isProductImageAsset(asset)),
  }
}

export const serializeProductAssets = ({ images, files } = {}) => JSON.stringify([
  ...parseProductImages(images),
  ...parseProductImages(files),
])

export const getProductImagePreviewUrl = (value) => {
  const firstImage = parseProductImages(value).find(isProductImageAsset)
  if (!firstImage) return ''
  if (/^https?:\/\//i.test(firstImage) || firstImage.startsWith('/api/')) return firstImage
  if (firstImage.startsWith('/')) return `${String(GATEWAY).replace(/\/$/, '')}${firstImage}`
  return resolveUploadUrl(firstImage)
}
