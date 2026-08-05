import {
  clonePageSchema,
  DEFAULT_PAGE_SCHEMA,
  isPageSchema,
  normalizePageSchema,
} from './pageSchema'

const PAGE_STORAGE_KEY = 'flast_landing_pages_v1'
const LEGACY_DRAFT_KEY = 'flast_landing_editor_draft_v1'
const LEGACY_PUBLISHED_KEY = 'flast_landing_editor_published_v1'

const read = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? fallback
  } catch (_) {
    return fallback
  }
}

const write = (key, value) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export const createLandingPageId = () => (
  (typeof window !== 'undefined' && window.crypto?.randomUUID?.())
  ?? `landing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
)

const buildLegacyPage = () => {
  const published = read(LEGACY_PUBLISHED_KEY, null)
  const draft = read(LEGACY_DRAFT_KEY, null)
  const schema = isPageSchema(draft?.schema)
    ? draft.schema
    : isPageSchema(published?.schema)
      ? published.schema
      : clonePageSchema(DEFAULT_PAGE_SCHEMA)

  return {
    id: 'landing-home',
    name: schema.name || 'Trang chủ',
    slug: '/',
    status: isPageSchema(published?.schema) ? 'PUBLISHED' : 'DRAFT',
    updatedAt: draft?.savedAt ?? published?.publishedAt ?? null,
    publishedAt: published?.publishedAt ?? null,
    schema,
  }
}

export const listLandingPages = () => {
  const pages = read(PAGE_STORAGE_KEY, [])
  if (Array.isArray(pages) && pages.length) return pages

  const legacyPage = buildLegacyPage()
  write(PAGE_STORAGE_KEY, [legacyPage])
  return [legacyPage]
}

export const getLandingPage = id => (
  listLandingPages().find(page => String(page.id) === String(id)) ?? null
)

export const WEB_CONTENT_TYPES = {
  LANDING: 'LANDING_EDITOR',
  MICRO_FRONTEND: 'MICRO_FRONTEND',
}

export const saveWebPage = page => {
  if (!page?.id) return null

  const pages = listLandingPages()
  const previous = pages.find(item => String(item.id) === String(page.id))
  const nextPage = {
    ...previous,
    ...page,
    id: page.id,
    name: String(page.name || previous?.name || 'Trang chưa đặt tên'),
    slug: String(page.slug || previous?.slug || `/m/${page.id}`),
    contentType: page.contentType || previous?.contentType || WEB_CONTENT_TYPES.LANDING,
    status: page.status || previous?.status || 'DRAFT',
    authenticationRequired: Boolean(page.authenticationRequired),
    remoteId: page.remoteId ?? previous?.remoteId ?? null,
    updatedAt: new Date().toISOString(),
  }
  const nextPages = previous
    ? pages.map(item => String(item.id) === String(page.id) ? nextPage : item)
    : [nextPage, ...pages]

  write(PAGE_STORAGE_KEY, nextPages)
  return nextPage
}

export const deleteWebPage = id => {
  const pages = listLandingPages()
  const nextPages = pages.filter(page => String(page.id) !== String(id))
  if (nextPages.length === pages.length) return false
  write(PAGE_STORAGE_KEY, nextPages)
  return true
}

export const saveLandingPage = ({
  id,
  schema,
  slug = '/',
  status = 'DRAFT',
  publishedAt = null,
  build,
  remoteId,
}) => {
  if (!id || !isPageSchema(schema)) return null

  const pages = listLandingPages()
  const previous = pages.find(page => String(page.id) === String(id))
  const nextPage = {
    ...previous,
    id,
    name: schema.name || 'Trang chưa đặt tên',
    slug: slug || previous?.slug || '/',
    status,
    updatedAt: new Date().toISOString(),
    publishedAt: publishedAt ?? previous?.publishedAt ?? null,
    contentType: WEB_CONTENT_TYPES.LANDING,
    authenticationRequired: Boolean(previous?.authenticationRequired),
    schema: normalizePageSchema(schema),
    build: build ?? previous?.build ?? null,
    // remoteId = id từ API create/update; thiếu → lần lưu sau phải create
    remoteId: remoteId ?? previous?.remoteId ?? null,
  }
  const nextPages = previous
    ? pages.map(page => String(page.id) === String(id) ? nextPage : page)
    : [nextPage, ...pages]

  write(PAGE_STORAGE_KEY, nextPages)
  return nextPage
}
