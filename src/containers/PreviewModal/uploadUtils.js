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

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

const isLocalUrl = (value) => {
  try {
    return LOCAL_HOSTNAMES.has(new URL(value).hostname)
  } catch {
    return false
  }
}

const resolveApiAssetUrl = (apiPath) => {
  const normalizedPath = `/${String(apiPath).replace(/^\/+/, '')}`
  const baseUrl = String(axios.defaults.baseURL || '/api').replace(/\/+$/, '')

  // Keep development URLs relative so the CRA proxy can forward them.
  if (!/^https?:\/\//i.test(baseUrl) || isLocalUrl(baseUrl)) return normalizedPath

  const pathWithoutApiPrefix = normalizedPath.replace(/^\/api(?=\/|$)/i, '')
  return /\/api$/i.test(baseUrl)
    ? `${baseUrl}${pathWithoutApiPrefix}`
    : `${baseUrl}${normalizedPath}`
}

const safeDecodeURIComponent = value => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export const normalizeUploadFileName = value => String(value || '')
  .trim()
  .replace(/\s+/g, '-')

export const normalizeUploadPath = value => safeDecodeURIComponent(String(value ?? ''))
  .replace(/\\/g, '/')
  .split('/')
  .map(segment => safeDecodeURIComponent(segment).trim().replace(/\s+/g, '-'))
  .filter(segment => segment && segment !== '.' && segment !== '..')
  .map(segment => encodeURIComponent(segment))
  .join('/')

export const buildUploadViewUrl = (filename, apiBaseUrl = axios.defaults.baseURL || '/api') => {
  const normalizedPath = normalizeUploadPath(filename)
  if (!normalizedPath) return ''
  const baseUrl = String(apiBaseUrl).replace(/\/+$/, '')
  return `${baseUrl}/erp/folder/view/${normalizedPath}`
}

const normalizeUploadViewUrl = value => {
  const url = String(value || '').trim()
  if (!url || !/\/(?:upload|erp)\/folder\/view(?:[/?#]|$)/i.test(url)) return url

  const absolute = /^https?:\/\//i.test(url)
  try {
    const parsedUrl = new URL(url, 'http://upload.local')
    const matchedMarker = parsedUrl.pathname.match(/\/(?:upload|erp)\/folder\/view/i)?.[0]
    const marker = '/erp/folder/view'
    const markerIndex = matchedMarker
      ? parsedUrl.pathname.toLowerCase().indexOf(matchedMarker.toLowerCase())
      : -1
    if (markerIndex < 0) return url

    const pathFilename = parsedUrl.pathname.slice(markerIndex + matchedMarker.length).replace(/^\/+/, '')
    const filename = parsedUrl.searchParams.get('filename') || pathFilename
    const normalizedPath = normalizeUploadPath(filename)
    if (!normalizedPath) return url

    parsedUrl.pathname = `${parsedUrl.pathname.slice(0, markerIndex)}${marker}/${normalizedPath}`
    parsedUrl.searchParams.delete('filename')

    return absolute
      ? parsedUrl.toString()
      : `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
  } catch {
    return url
  }
}

export const resolveRuntimeAssetUrl = (value) => {
  const url = normalizeUploadViewUrl(toUploadText(value))
  if (!url || /^(?:data:|blob:|\/\/)/i.test(url)) return url
  if (/^\/api(?:\/|$)/i.test(url)) return resolveApiAssetUrl(url)
  if (!/^https?:\/\//i.test(url)) return url

  try {
    const parsedUrl = new URL(url)
    // Replace a persisted development origin with the API base of the current
    // environment. This also keeps old templates portable after deployment.
    if (LOCAL_HOSTNAMES.has(parsedUrl.hostname) && parsedUrl.pathname.startsWith('/api/')) {
      return resolveApiAssetUrl(`${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`)
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
  if (/^https?:\/\//i.test(filename) || /^\/api(?:\/|$)/i.test(filename)) {
    return resolveRuntimeAssetUrl(filename)
  }
  return resolveRuntimeAssetUrl(buildUploadViewUrl(filename))
}

export const toUploadFile = (item, index) => {
  const filename = resolveUploadFilename(item)
  const directUrl = toUploadText(item?.url) || toUploadText(item?.thumbUrl)
  const url = directUrl ? resolveRuntimeAssetUrl(directUrl) : resolveUploadUrl(item)
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
