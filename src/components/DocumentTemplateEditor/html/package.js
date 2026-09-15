import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { createHtmlDocumentTemplate, normalizeHtmlDefinition } from './model'

const LIMIT = 20 * 1024 * 1024
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf' }
const toBase64 = bytes => {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 8192) binary += String.fromCharCode(...bytes.subarray(index, index + 8192))
  return btoa(binary)
}
export const importHtmlTemplateZip = async file => {
  if (file.size > LIMIT) throw new Error('Gói mẫu tối đa 20 MB')
  return importHtmlTemplateBytes(new Uint8Array(await file.arrayBuffer()))
}
export const importHtmlTemplateBytes = bytes => {
  if (bytes.length > LIMIT) throw new Error('Gói mẫu tối đa 20 MB')
  let total = 0
  let count = 0
  const files = unzipSync(bytes, { filter: entry => {
    total += entry.originalSize
    count += 1
    if (total > LIMIT || count > 100) throw new Error('Gói mẫu vượt quá 20 MB giải nén hoặc 100 tệp')
    if (/^\/|\\/.test(entry.name) || entry.name.split('/').includes('..')) throw new Error('Đường dẫn tệp trong ZIP không hợp lệ')
    return !entry.name.endsWith('/')
  } })
  if (!files['template.html'] || !files['fields.json']) throw new Error('ZIP cần có template.html và fields.json ở thư mục gốc')
  const assets = {}
  Object.entries(files).forEach(([path, content]) => {
    const mime = MIME[path.split('.').pop().toLowerCase()]
    if (path.startsWith('assets/') && mime) assets[path] = `data:${mime};base64,${toBase64(content)}`
  })
  return createHtmlDocumentTemplate(strFromU8(files['template.html']), JSON.parse(strFromU8(files['fields.json'])), assets,
    files['sample-data.json'] ? JSON.parse(strFromU8(files['sample-data.json'])) : {})
}
export const exportHtmlTemplateZip = template => {
  const definition = normalizeHtmlDefinition(template.htmlTemplate)
  const fields = Object.fromEntries(Object.entries(definition.fields).map(([id, { repeatId, ...field }]) => [id, field]))
  const manifest = { version: 1, name: template.name, documentType: template.documentType, orientation: template.page?.orientation, fields, repeats: definition.repeats, sheetTables: definition.sheetTables }
  // Assets are embedded, so the exported package is independent of upload URLs.
  return zipSync({
    'template.html': strToU8(`<!doctype html><html><head><meta charset="utf-8"><style>${definition.css.replace(/</g, '\\3c ')}</style></head><body>${definition.html}</body></html>`),
    'fields.json': strToU8(JSON.stringify(manifest, null, 2)),
    ...(Object.keys(definition.sampleData).length ? { 'sample-data.json': strToU8(JSON.stringify(definition.sampleData, null, 2)) } : {}),
  })
}
export const downloadTemplateBytes = (bytes, name) => {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
