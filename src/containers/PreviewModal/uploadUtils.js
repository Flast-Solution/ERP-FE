import axios from 'axios'

export const extractUploadItems = (response) => {
  const payload = response?.data ?? response
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.files)) return payload.files
  if (Array.isArray(payload?.urls)) return payload.urls
  if (Array.isArray(payload?.fileNames)) return payload.fileNames
  if (Array.isArray(payload?.filenames)) return payload.filenames
  if (Array.isArray(payload?.paths)) return payload.paths
  return payload ? [payload] : []
}

const isAbsoluteUploadUrl = (value = '') => (
  /^https?:\/\//i.test(String(value)) || String(value).startsWith('/api/')
)

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export const resolveRuntimeAssetUrl = (value) => {
  const url = toUploadText(value)
  if (!url || /^(?:data:|blob:|\/\/)/i.test(url)) return url
  if (!/^https?:\/\//i.test(url)) return url

  try {
    const parsedUrl = new URL(url)
    // Templates created in development used to persist the dev origin. Keep
    // only the application-relative URL so the current deployed host is used.
    if (LOCAL_HOSTNAMES.has(parsedUrl.hostname) && parsedUrl.pathname.startsWith('/api/')) {
      return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
    }
  } catch {
    return url
  }
  return url
}

const toUploadText = value => {
  if (typeof value !== 'string' && typeof value !== 'number') return ''
  const normalized = String(value).trim()
  if (/^\[object\s+(?:Object|Undefined|Null)\]$/i.test(normalized)) return ''
  return normalized
}

export const resolveUploadFilename = (item) => {
  if (typeof item === 'string' || typeof item === 'number') return toUploadText(item)
  const candidates = [
    item?.filename,
    item?.file_name,
    item?.fileName,
    item?.file_name_path,
    item?.path,
    item?.fullPath,
    item?.full_path,
    item?.url,
    item?.fileUrl,
    item?.file_url,
  ]
  return candidates.map(toUploadText).find(Boolean) || ''
}

export const resolveUploadUrl = (item) => {
  const filename = resolveUploadFilename(item)
  if (!filename) return ''
  if (isAbsoluteUploadUrl(filename)) return resolveRuntimeAssetUrl(filename)
  const baseUrl = String(axios.defaults.baseURL || '/api').replace(/\/$/, '')
  return resolveRuntimeAssetUrl(`${baseUrl}/upload/folder/view?filename=${encodeURIComponent(filename)}`)
}

export const toUploadFile = (item, index) => {
  const filename = resolveUploadFilename(item)
  const url = toUploadText(item?.url)
    || toUploadText(item?.thumbUrl)
    || resolveUploadUrl(item)
  const name = toUploadText(item?.name) || filename.split('/').pop() || ''
  const hasUploadIdentity = Boolean(toUploadText(item?.uid) || item?.originFileObj)

  if (!filename && !url && !hasUploadIdentity) return null

  return {
    ...(item && typeof item === 'object' ? item : {}),
    uid: toUploadText(item?.uid) || toUploadText(item?.id) || filename || url || `upload-${index}`,
    name: name || `file-${index + 1}`,
    status: item?.status || 'done',
    url,
    thumbUrl: url,
    response: item?.response ?? item,
  }
}

export const fileListToValues = (event) => {
  const fileList = Array.isArray(event) ? event : (event?.fileList ?? [])
  return fileList
    .filter(file => file.status === 'done')
    .flatMap(file => extractUploadItems(file.response ?? resolveUploadUrl(file)))
}
