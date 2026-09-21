import {
  extractUploadItems as extractSharedUploadItems,
  resolveUploadFilename as resolveSharedUploadFilename,
  resolveUploadUrl as resolveSharedUploadUrl,
} from '@/containers/PreviewModal/uploadUtils'

/**
 * GET/POST /auth/user-bussiness/find-info|save-info
 * Envelope: { errorCode, message, success, data: BusinessInfo }
 * BusinessInfo:
 *   { id, name, hotline, email, logo, meta, address, status, code, certificate }
 * logo / certificate[] = path string (vd. "test/….png")
 */

export const unwrapBusinessInfo = response => {
  const info = response?.data
  return info && typeof info === 'object' && !Array.isArray(info) ? info : null
}

export const mapBusinessInfoToForm = (businessInfo) => {
  const info = businessInfo ?? {}
  return {
    displayName: info.name ?? '',
    email: info.email ?? '',
    phone: info.hotline ?? '',
    address: info.address ?? '',
    code: info.code ?? '',
  }
}

export const normalizeCertificatePaths = certificate => (
  Array.isArray(certificate) ? certificate.filter(Boolean) : []
)

export const resolveUploadUrl = item => resolveSharedUploadUrl(item)

/** Upload /erp/folder/multiple — reuse shared extractor (response sample chưa khóa). */
export const extractUploadItems = payload => extractSharedUploadItems(payload)

export const resolveUploadFilename = item => {
  if (typeof item === 'string' || typeof item === 'number') return String(item)
  return resolveSharedUploadFilename(item)
}

export const toCertificateFile = (item, index, sourceFile = {}) => {
  if (item?.uid && item?.status) return item
  const filename = resolveUploadFilename(item)
  const url = resolveUploadUrl(item)
  return {
    uid: sourceFile.uid ?? filename ?? `certificate-file-${index}`,
    name: sourceFile.name ?? filename?.split('/').pop() ?? `file-${index + 1}`,
    status: 'done',
    url,
    response: item,
  }
}

export const mapCertificatesFromBusinessInfo = certificate => {
  const paths = normalizeCertificatePaths(certificate)
  if (!paths.length) return []

  return [{
    id: 'certificate-loaded',
    name: '',
    files: paths.map((path, index) => toCertificateFile(path, index)),
  }]
}

/** POST body: { userBusiness: BusinessInfo } */
export const buildBusinessInfoPayload = ({
  bizId,
  businessInfo,
  certificates,
  logoFile,
  values,
}) => {
  const certificate = certificates
    .flatMap(item => item.files ?? [])
    .map(file => resolveUploadFilename(file.response ?? file))
    .filter(Boolean)
  const logo = logoFile
    ? (resolveUploadFilename(logoFile.response ?? logoFile) || null)
    : null
  const id = businessInfo?.id ?? bizId ?? null

  return {
    ...(id != null ? { id } : {}),
    name: values.displayName ?? '',
    hotline: values.phone ?? '',
    email: values.email ?? '',
    logo,
    meta: businessInfo?.meta ?? null,
    address: values.address ?? '',
    status: businessInfo?.status ?? 1,
    code: values.code ?? '',
    certificate: certificate.length ? certificate : null,
  }
}
