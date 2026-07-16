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

export const resolveUploadFilename = (item) => {
  if (typeof item === 'string') return item
  return item?.filename
    ?? item?.file_name
    ?? item?.fileName
    ?? item?.file_name_path
    ?? item?.path
    ?? item?.fullPath
    ?? item?.full_path
    ?? item?.url
    ?? item?.fileUrl
    ?? item?.file_url
    ?? ''
}

export const resolveUploadUrl = (item) => {
  const filename = resolveUploadFilename(item)
  if (!filename) return ''
  if (isAbsoluteUploadUrl(filename)) return filename
  const baseUrl = String(axios.defaults.baseURL || '/api').replace(/\/$/, '')
  return `${baseUrl}/upload/folder/view?filename=${encodeURIComponent(filename)}`
}

export const toUploadFile = (item, index) => {
  if (item?.uid) return item
  const filename = resolveUploadFilename(item)
  const url = resolveUploadUrl(item)
  const name = item?.name ?? filename?.split('/').pop() ?? `file-${index + 1}`

  return {
    uid: item?.id ?? filename ?? url ?? `upload-${index}`,
    name,
    status: 'done',
    url,
    thumbUrl: url,
    response: item,
  }
}

export const fileListToValues = (event) => {
  const fileList = Array.isArray(event) ? event : (event?.fileList ?? [])
  return fileList
    .filter(file => file.status === 'done')
    .flatMap(file => extractUploadItems(file.response ?? resolveUploadUrl(file)))
}
