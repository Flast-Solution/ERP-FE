import { create } from 'zustand'
import {
  clonePageSchema,
  DEFAULT_PAGE_SCHEMA,
  isPageSchema,
  normalizePageSchema,
  validatePageSchema,
} from '@/containers/Landing/pageSchema'
import { applyLandingPatch } from '@/containers/Landing/landingAi'
import { createLandingBlock } from '@/containers/Landing/blockRegistry'
import { CUSTOM_JSX_TYPE } from '@/containers/Landing/customJsx'
import {
  deleteWebPage,
  getLandingPage,
  saveLandingPage,
} from '@/containers/Landing/landingRepository'
import useChatStore from '@/containers/AIChatbot/useChatStore'
import { buildLandingPage } from '@/containers/Landing/landingBuildService'
import WebPageService, { buildWebPagePayload } from '@/services/WebPageService'

/* Dữ liệu mặc định — ràng buộc API cho từng phần tử trên trang */
const DEFAULT_API = {}

const DEFAULT_SEO = DEFAULT_PAGE_SCHEMA.seo.meta

const DEFAULT_CRUMBS = DEFAULT_PAGE_SCHEMA.breadcrumbs

const APPLIED_MS = 700
const TOAST_MS = 2600
const DRAFT_STORAGE_KEY = 'flast_landing_editor_draft_v1'
const PUBLISHED_STORAGE_KEY = 'flast_landing_editor_published_v1'
const VERSION_STORAGE_KEY = 'flast_landing_editor_versions_v1'
const MAX_VERSIONS = 10

const countApis = (config) =>
  Object.values(config).reduce((total, list) => total + list.length, 0)

let toastTimer = null

const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    const value = JSON.parse(window.localStorage.getItem(key))
    return value ?? fallback
  } catch (_) {
    return fallback
  }
}

const writeStorage = (key, value) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

const storedDraft = readStorage(DRAFT_STORAGE_KEY, null)
const initialSchema = isPageSchema(storedDraft?.schema)
  ? normalizePageSchema(storedDraft.schema)
  : clonePageSchema(DEFAULT_PAGE_SCHEMA)

const storedVersions = readStorage(VERSION_STORAGE_KEY, [])
const initialVersions = Array.isArray(storedVersions) ? storedVersions : []

export const useEditorStore = create((set, get) => ({
  /* Trạng thái giao diện */
  device: 'desktop',
  viewMode: 'edit',
  selected: null,
  value: '',
  busy: false,
  building: false,
  status: 'idle',
  error: null,
  toast: null,
  files: [],
  configOpen: false,
  customJsxOpen: false,
  customJsxTarget: 'block',
  customJsxEditingId: null,
  initializedPage: false,
  currentPageId: 'landing-home',
  /** Id trang trên server (sau create). null → lần lưu phải gọi create, không phải update. */
  remotePageId: null,
  currentPageSlug: '/',
  currentPageAuthenticationRequired: false,

  /* Bản nháp trang và lịch sử chỉnh sửa */
  originalSchema: clonePageSchema(DEFAULT_PAGE_SCHEMA),
  draftSchema: clonePageSchema(initialSchema),
  history: [clonePageSchema(initialSchema)],
  historyIndex: 0,
  versions: initialVersions,
  lastSavedAt: storedDraft?.savedAt ?? null,
  publishedAt: readStorage(PUBLISHED_STORAGE_KEY, null)?.publishedAt ?? null,

  /* Cấu hình */
  apiConfig: DEFAULT_API,
  seoConfig: DEFAULT_SEO,
  crumbConfig: DEFAULT_CRUMBS,

  get apiCount() {
    return countApis(get().apiConfig)
  },

  setDevice: (device) => set({ device }),
  setViewMode: (viewMode) => {
    if (viewMode !== 'edit') get().close()
    set({ viewMode })
  },

  initializePage: ({ id, mode } = {}) => {
    const pageId = id || 'landing-home'
    if (get().initializedPage && String(get().currentPageId) === String(pageId)) return

    const page = getLandingPage(pageId)
    const schema = page?.schema
      ? normalizePageSchema(page.schema)
      : {
          ...clonePageSchema(DEFAULT_PAGE_SCHEMA),
          name: mode === 'create' ? 'Trang mới' : DEFAULT_PAGE_SCHEMA.name,
        }

    // Chỉ update khi đã có remoteId từ API. UUID local / landing-home → create.
    const isApiPageId = pageId !== 'landing-home' && /^\d+$/.test(String(pageId))
    const remotePageId = page?.remoteId != null && page.remoteId !== ''
      ? page.remoteId
      : isApiPageId ? Number(pageId) : null

    set({
      initializedPage: true,
      currentPageId: pageId,
      remotePageId,
      currentPageSlug: page?.slug ?? '/',
      currentPageAuthenticationRequired: Boolean(page?.authenticationRequired),
      originalSchema: clonePageSchema(schema),
      draftSchema: clonePageSchema(schema),
      history: [clonePageSchema(schema)],
      historyIndex: 0,
      selected: null,
      value: '',
      status: 'idle',
      lastSavedAt: page?.updatedAt ?? null,
      publishedAt: page?.publishedAt ?? null,
      apiConfig: schema.dataSources ?? {},
      seoConfig: schema.seo?.meta ?? DEFAULT_SEO,
      crumbConfig: schema.breadcrumbs ?? DEFAULT_CRUMBS,
    })
  },

  openEdit: (id) => {
    get().clearFiles()
    set({ selected: id, value: '', status: 'idle' })
  },

  close: () => {
    get().clearFiles()
    set({ selected: null, value: '' })
  },

  setValue: (value) => set({ value }),

  updatePageMeta: (values) => {
    get()._commitSchema({
      ...get().draftSchema,
      ...values,
    })
  },

  updatePageSlug: (slug) => {
    const normalized = String(slug ?? '').trim()
    set({ currentPageSlug: normalized || '/' })
    get().saveDraft({ silent: true })
  },

  updateTheme: (values) => {
    const current = get().draftSchema
    get()._commitSchema({
      ...current,
      theme: {
        ...current.theme,
        ...values,
      },
    })
  },

  addBlock: (type, afterId) => {
    const block = createLandingBlock(type)
    if (!block) return

    const current = get().draftSchema
    if (type === 'breadcrumb') {
      block.props.items = clonePageSchema(current.breadcrumbs ?? DEFAULT_CRUMBS)
    }
    const sections = [...current.sections]
    const afterIndex = sections.findIndex(section => section.id === afterId)
    const insertIndex = afterIndex >= 0 ? afterIndex + 1 : sections.length
    sections.splice(insertIndex, 0, block)

    get()._commitSchema({ ...current, sections }, block.id)
    get()._showToast('Đã thêm block mới.')
  },

  addCustomBlock: ({ name, source, routePath, apiSources, definitionId, artifact }, afterId) => {
    const block = createLandingBlock(CUSTOM_JSX_TYPE)
    if (!block) return
    block.definitionId = definitionId
    block.kind = 'jsx'
    block.artifact = artifact
    block.props = { ...block.props, name, title: name, source, routePath: routePath || '' }

    const current = get().draftSchema
    const sections = [...current.sections]
    const afterIndex = sections.findIndex(section => section.id === afterId)
    sections.splice(afterIndex >= 0 ? afterIndex + 1 : sections.length, 0, block)
    const dataSources = { ...(current.dataSources ?? {}) }
    if (apiSources?.length) dataSources[block.id] = clonePageSchema(apiSources)
    get()._commitSchema({ ...current, sections, dataSources }, block.id)
    get()._showToast('Đã build và thêm Custom JSX block.')
  },

  replaceBlockWithCustom: (id, { name, source, routePath, apiSources, definitionId, artifact }) => {
    const current = get().draftSchema
    const previous = current.sections.find(section => section.id === id)
    if (!previous) return
    const replacement = createLandingBlock(CUSTOM_JSX_TYPE)
    if (!replacement) return
    replacement.id = previous.id
    replacement.definitionId = definitionId
    replacement.kind = 'jsx'
    replacement.artifact = artifact
    replacement.props = {
      ...replacement.props,
      ...previous.props,
      name,
      title: name,
      source,
      routePath: routePath || '',
    }
    const sections = current.sections.map(section => section.id === id ? replacement : section)
    const dataSources = { ...(current.dataSources ?? {}) }
    if (apiSources?.length) dataSources[id] = clonePageSchema(apiSources)
    else delete dataSources[id]
    get()._commitSchema({ ...current, sections, dataSources }, id)
    get()._showToast('Đã thay block được chọn bằng Custom JSX; ID và cấu hình API được giữ nguyên.')
  },

  updateCustomBlock: (id, { name, source, routePath, apiSources, definitionId, artifact }) => {
    const current = get().draftSchema
    const sections = current.sections.map(section => section.id === id
      ? {
          ...section,
          definitionId: definitionId || section.definitionId,
          kind: 'jsx',
          artifact,
          props: { ...section.props, name, source, routePath: routePath || '' },
        }
      : section)
    const dataSources = { ...(current.dataSources ?? {}) }
    if (apiSources?.length) dataSources[id] = clonePageSchema(apiSources)
    else delete dataSources[id]
    get()._commitSchema({ ...current, sections, dataSources }, id)
    get()._showToast('Đã build lại Custom JSX block.')
  },

  addCustomOverlay: ({ overlayId, name, source, definitionId, artifact }) => {
    const suffix = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const overlay = {
      id: String(overlayId || `overlay-${suffix}`).trim(),
      definitionId,
      kind: 'drawer',
      type: CUSTOM_JSX_TYPE,
      artifact,
      props: { name, title: name, source },
    }
    const current = get().draftSchema
    get()._commitSchema({ ...current, overlays: [...(current.overlays ?? []), overlay] }, get().selected)
    get()._showToast('Đã thêm drawer JSX toàn cục.')
    return overlay.id
  },

  updateCustomOverlay: (id, { overlayId, name, source, definitionId, artifact }) => {
    const current = get().draftSchema
    const overlays = (current.overlays ?? []).map(overlay => overlay.id === id
      ? {
          ...overlay,
          id: String(overlayId || id).trim(),
          definitionId: definitionId || overlay.definitionId,
          artifact,
          props: { ...overlay.props, name, title: name, source },
        }
      : overlay)
    get()._commitSchema({ ...current, overlays }, get().selected)
    get()._showToast('Đã build lại drawer JSX.')
  },

  removeOverlay: id => {
    const current = get().draftSchema
    get()._commitSchema({
      ...current,
      overlays: (current.overlays ?? []).filter(overlay => overlay.id !== id),
    }, get().selected)
    get()._showToast('Đã xóa drawer/popup.')
  },

  updateBlockProps: (id, values) => {
    const current = get().draftSchema
    const target = current.sections.find(section => section.id === id)
    const sections = current.sections.map(section => (
      section.id === id
        ? {
            ...section,
            props: {
              ...section.props,
              ...values,
            },
          }
        : section
    ))
    get()._commitSchema({
      ...current,
      sections,
      ...(target?.type === 'breadcrumb' && Array.isArray(values.items)
        ? { breadcrumbs: clonePageSchema(values.items) }
        : {}),
    }, id)
  },

  duplicateBlock: (id) => {
    const current = get().draftSchema
    const sourceIndex = current.sections.findIndex(section => section.id === id)
    if (sourceIndex < 0) return

    const source = clonePageSchema(current.sections[sourceIndex])
    const copy = createLandingBlock(source.type)
    if (!copy) return
    copy.props = source.props
    if (source.type === CUSTOM_JSX_TYPE) {
      copy.definitionId = source.definitionId
      copy.kind = source.kind
      copy.artifact = source.artifact
    }

    const sections = [...current.sections]
    sections.splice(sourceIndex + 1, 0, copy)
    get()._commitSchema({ ...current, sections }, copy.id)
    get()._showToast('Đã nhân bản block.')
  },

  removeBlock: (id) => {
    const current = get().draftSchema
    const sections = current.sections.filter(section => section.id !== id)
    if (sections.length === current.sections.length) return

    get()._commitSchema({ ...current, sections }, null)
    get()._showToast('Đã xóa block.')
  },

  moveBlock: (id, direction) => {
    const current = get().draftSchema
    const sections = [...current.sections]
    const index = sections.findIndex(section => section.id === id)
    const target = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= sections.length) return

    const [block] = sections.splice(index, 1)
    sections.splice(target, 0, block)
    get()._commitSchema({ ...current, sections }, id)
  },

  startAiEdit: () => set({
    busy: true,
    status: 'thinking',
    error: null,
  }),

  applyAiPatch: (operations, summary) => {
    try {
      const current = get()
      const nextSchema = normalizePageSchema(applyLandingPatch(current.draftSchema, operations))
      const validationErrors = validatePageSchema(nextSchema)
      if (validationErrors.length) throw new Error(validationErrors[0])
      const nextHistory = [
        ...current.history.slice(0, current.historyIndex + 1),
        clonePageSchema(nextSchema),
      ]

      set({
        draftSchema: nextSchema,
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
        busy: false,
        status: 'applied',
        error: null,
      })
      get().saveDraft({ silent: true })
      get()._showToast(summary || 'Đã áp dụng thay đổi từ AI.')

      setTimeout(() => {
        get().clearFiles()
        set({ selected: null, value: '', status: 'idle' })
      }, APPLIED_MS)
    } catch (error) {
      get().failAiEdit(error.message)
    }
  },

  failAiEdit: (error) => {
    set({
      busy: false,
      status: 'error',
      error,
    })
    get()._showToast(error || 'Không áp dụng được thay đổi từ AI.')
  },

  undo: () => {
    const current = get()
    if (current.viewMode !== 'edit' || current.historyIndex <= 0 || current.busy) return
    const historyIndex = current.historyIndex - 1
    set({
      draftSchema: clonePageSchema(current.history[historyIndex]),
      historyIndex,
      status: 'idle',
      error: null,
    })
  },

  redo: () => {
    const current = get()
    if (current.viewMode !== 'edit' || current.historyIndex >= current.history.length - 1 || current.busy) return
    const historyIndex = current.historyIndex + 1
    set({
      draftSchema: clonePageSchema(current.history[historyIndex]),
      historyIndex,
      status: 'idle',
      error: null,
    })
  },

  saveDraft: async ({ silent = false } = {}) => {
    const savedAt = new Date().toISOString()
    const current = get()
    writeStorage(DRAFT_STORAGE_KEY, {
      schema: current.draftSchema,
      savedAt,
    })
    const localPage = saveLandingPage({
      id: current.currentPageId,
      schema: current.draftSchema,
      slug: current.currentPageSlug,
      status: 'DRAFT',
      authenticationRequired: current.currentPageAuthenticationRequired,
    })
    set({ lastSavedAt: savedAt })
    if (silent) return localPage

    const schema = normalizePageSchema(current.draftSchema)
    const validationErrors = validatePageSchema(schema)
    if (validationErrors.length) {
      get()._showToast(validationErrors[0])
      return null
    }

    set({ building: true })
    try {
      const sessionId = useChatStore.getState().getSessionId('form_builder')
      const build = await buildLandingPage({
        pageId: current.currentPageId,
        schema,
        sessionId,
      })
      if (!build?.url) {
        throw new Error('Build thành công nhưng server chưa trả URL micro-frontend.')
      }

      const remotePage = current.remotePageId
        ? await WebPageService.update(current.remotePageId, buildWebPagePayload({
          id: current.remotePageId,
          name: schema.name,
          slug: current.currentPageSlug,
          title: schema.name,
          schema,
          build,
          authenticationRequired: current.currentPageAuthenticationRequired,
        }))
        : await WebPageService.create(buildWebPagePayload({
          name: schema.name,
          slug: current.currentPageSlug,
          title: schema.name,
          schema,
          build,
          authenticationRequired: current.currentPageAuthenticationRequired,
        }))

      const nextId = remotePage.id
      const saved = saveLandingPage({
        id: nextId,
        schema,
        slug: remotePage.slug || current.currentPageSlug,
        status: 'DRAFT',
        build,
        remoteId: nextId,
        authenticationRequired: current.currentPageAuthenticationRequired,
      })
      if (String(current.currentPageId) !== String(nextId)) deleteWebPage(current.currentPageId)
      set({
        currentPageId: nextId,
        remotePageId: nextId,
        currentPageSlug: saved.slug,
        lastSavedAt: savedAt,
      })
      get()._showToast('Đã build và lưu trang.')
      return saved
    } catch (error) {
      get()._showToast(error?.message || 'Không build/lưu được Landing Page.')
      return null
    } finally {
      set({ building: false })
    }
  },

  publish: async () => {
    const publishedAt = new Date().toISOString()
    const schema = normalizePageSchema(get().draftSchema)
    const validationErrors = validatePageSchema(schema)
    if (validationErrors.length) {
      get()._showToast(validationErrors[0])
      return
    }
    const current = get()
    const version = {
      id: `${Date.now()}`,
      publishedAt,
      name: schema.name,
      schema,
    }
    const versions = [version, ...get().versions].slice(0, MAX_VERSIONS)

    set({ building: true })
    try {
      const sessionId = useChatStore.getState().getSessionId('form_builder')
      const build = await buildLandingPage({
        pageId: current.currentPageId,
        schema,
        sessionId,
      })
      if (!build?.url) {
        throw new Error('Build thành công nhưng server chưa trả URL micro-frontend.')
      }

      const remotePage = current.remotePageId
        ? await WebPageService.update(current.remotePageId, buildWebPagePayload({
          id: current.remotePageId,
          name: schema.name,
          slug: current.currentPageSlug,
          title: schema.name,
          schema,
          build,
          authenticationRequired: current.currentPageAuthenticationRequired,
        }))
        : await WebPageService.create(buildWebPagePayload({
          name: schema.name,
          slug: current.currentPageSlug,
          title: schema.name,
          schema,
          build,
          authenticationRequired: current.currentPageAuthenticationRequired,
        }))

      const nextId = remotePage.id
      writeStorage(PUBLISHED_STORAGE_KEY, {
        pageId: nextId,
        slug: remotePage.slug || current.currentPageSlug,
        schema,
        publishedAt,
        build,
      })
      writeStorage(VERSION_STORAGE_KEY, versions)
      writeStorage(DRAFT_STORAGE_KEY, { schema, savedAt: publishedAt })
      saveLandingPage({
        id: nextId,
        schema,
        slug: remotePage.slug || current.currentPageSlug,
        status: 'PUBLISHED',
        publishedAt,
        build,
        remoteId: nextId,
        authenticationRequired: current.currentPageAuthenticationRequired,
      })
      if (String(current.currentPageId) !== String(nextId)) deleteWebPage(current.currentPageId)
      set({
        currentPageId: nextId,
        remotePageId: nextId,
        currentPageSlug: remotePage.slug || current.currentPageSlug,
        originalSchema: schema,
        versions,
        publishedAt,
        lastSavedAt: publishedAt,
      })
      get()._showToast('Đã build và xuất bản trang.')
    } catch (error) {
      get()._showToast(error?.message || 'Không build/xuất bản được Landing Page.')
    } finally {
      set({ building: false })
    }
  },

  restoreVersion: (versionId) => {
    const version = get().versions.find(item => item.id === versionId)
    if (!isPageSchema(version?.schema)) return
    get()._commitSchema(clonePageSchema(version.schema), null)
    get()._showToast('Đã khôi phục phiên bản vào bản nháp.')
  },

  /* Ảnh đính kèm */
  addFiles: (list) => {
    const images = list
      .filter((f) => f.type.startsWith('image/'))
      .map((f, i) => ({
        id: `${Date.now()}-${i}-${f.name}`,
        name: f.name,
        url: URL.createObjectURL(f),
      }))
    set((s) => ({ files: [...s.files, ...images] }))
  },

  removeFile: (id) => {
    set((s) => {
      const target = s.files.find((f) => f.id === id)
      if (target?.url) URL.revokeObjectURL(target.url)
      return { files: s.files.filter((f) => f.id !== id) }
    })
  },

  clearFiles: () => {
    get().files.forEach((f) => f.url && URL.revokeObjectURL(f.url))
    set({ files: [] })
  },

  /* Modal cấu hình */
  setConfigOpen: (open) => set({ configOpen: open }),
  openCustomJsx: ({ target = 'block', editingId = null } = {}) => set({
    customJsxOpen: true,
    customJsxTarget: target,
    customJsxEditingId: editingId,
  }),
  closeCustomJsx: () => set({ customJsxOpen: false, customJsxEditingId: null }),

  saveConfig: (config) => {
    set({ apiConfig: config, configOpen: false })
    get()._commitSchema({ ...get().draftSchema, dataSources: config })
    get()._showToast(`Đã lưu cấu hình · ${countApis(config)} API`)
  },

  saveSeo: (seo) => {
    set({ seoConfig: seo })
    get()._commitSchema({ ...get().draftSchema, seo: { meta: seo } })
  },

  saveCrumb: (crumbs) => {
    set({ crumbConfig: crumbs })
    const current = get().draftSchema
    const sections = current.sections.map(section => section.type === 'breadcrumb'
      ? { ...section, props: { ...section.props, items: clonePageSchema(crumbs) } }
      : section)
    get()._commitSchema({ ...current, breadcrumbs: crumbs, sections })
  },

  /* Nội bộ */
  _commitSchema: (schema, selected = get().selected) => {
    const normalizedSchema = normalizePageSchema(schema)
    if (validatePageSchema(normalizedSchema).length) return
    const current = get()
    const nextHistory = [
      ...current.history.slice(0, current.historyIndex + 1),
      clonePageSchema(normalizedSchema),
    ]
    set({
      draftSchema: clonePageSchema(normalizedSchema),
      apiConfig: clonePageSchema(normalizedSchema.dataSources ?? {}),
      seoConfig: clonePageSchema(normalizedSchema.seo?.meta ?? []),
      crumbConfig: clonePageSchema(normalizedSchema.breadcrumbs ?? []),
      history: nextHistory,
      historyIndex: nextHistory.length - 1,
      selected,
      status: 'idle',
      error: null,
    })
    get().saveDraft({ silent: true })
  },

  _showToast: (message) => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: message })
    toastTimer = setTimeout(() => set({ toast: null }), TOAST_MS)
  },
}))
