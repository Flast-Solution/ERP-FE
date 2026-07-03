import { create } from 'zustand'

/* Dữ liệu mặc định — ràng buộc API cho từng phần tử trên trang */
const DEFAULT_API = {
  nav: [],
  hero: [{ id: 'a1', key: 'config', method: 'GET', url: 'https://api.flast.vn/site/config' }],
  features: [{ id: 'a2', key: 'features', method: 'GET', url: 'https://api.flast.vn/features' }],
  pricing: [
    { id: 'a3', key: 'plans', method: 'GET', url: 'https://api.flast.vn/pricing/plans' },
    { id: 'a4', key: 'promo', method: 'GET', url: 'https://api.flast.vn/pricing/promo' },
  ],
}

const DEFAULT_SEO = [
  { id: 's1', name: 'title', value: 'flast.vn — Xây trang web bằng AI' },
  { id: 's2', name: 'description', value: 'Tạo và chỉnh sửa website trực quan với trợ lý AI.' },
  { id: 's3', name: 'og:image', value: 'https://flast.vn/og.png' },
]

const DEFAULT_CRUMBS = [{ id: 'c1', text: 'Trang chủ', url: '/' }]

/*
 * Kết quả chỉnh sửa giả lập theo từng phần tử.
 * Đây là stub demo — thay bằng lời gọi model thật khi nối backend.
 */
const SIMULATED_EDITS = {
  hero: { heroBg: 'linear-gradient(180deg,#f3f0ff,#fff)', heroTitle: 'Ra mắt nhanh hơn, không cần viết hạ tầng' },
  pricing: { pricingRadius: '22px' },
  features: {},
  nav: {},
}

const THINKING_MS = 1500
const APPLIED_MS = 700
const TOAST_MS = 2600

const countApis = (config) =>
  Object.values(config).reduce((total, list) => total + list.length, 0)

let toastTimer = null

export const useEditorStore = create((set, get) => ({
  /* Trạng thái giao diện */
  device: 'desktop',
  selected: null,
  value: '',
  busy: false,
  status: 'idle',
  edits: {},
  toast: null,
  files: [],
  configOpen: false,

  /* Cấu hình */
  apiConfig: DEFAULT_API,
  seoConfig: DEFAULT_SEO,
  crumbConfig: DEFAULT_CRUMBS,

  get apiCount() {
    return countApis(get().apiConfig)
  },

  setDevice: (device) => set({ device }),

  openEdit: (id) => {
    get().clearFiles()
    set({ selected: id, value: '', status: 'idle' })
  },

  close: () => {
    get().clearFiles()
    set({ selected: null, value: '' })
  },

  setValue: (value) => set({ value }),

  /* `prompt` là nội dung sẽ gửi cho model khi nối backend thật */
  submit: (prompt, id) => {
    set({ busy: true, status: 'thinking' })

    setTimeout(() => {
      set((s) => ({
        edits: { ...s.edits, ...(SIMULATED_EDITS[id] || {}) },
        busy: false,
        status: 'applied',
      }))

      const imageCount = get().files.length
      get()._showToast(
        imageCount ? `Đã cập nhật #${id} với ${imageCount} ảnh` : `Đã cập nhật #${id}`
      )

      setTimeout(() => {
        get().clearFiles()
        set({ selected: null, value: '', status: 'idle' })
      }, APPLIED_MS)
    }, THINKING_MS)
  },

  publish: () => get()._showToast('Đã xuất bản flast.vn'),

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

  saveConfig: (config) => {
    set({ apiConfig: config, configOpen: false })
    get()._showToast(`Đã lưu cấu hình · ${countApis(config)} API`)
  },

  saveSeo: (seo) => set({ seoConfig: seo }),

  saveCrumb: (crumbs) => set({ crumbConfig: crumbs }),

  /* Nội bộ */
  _showToast: (message) => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: message })
    toastTimer = setTimeout(() => set({ toast: null }), TOAST_MS)
  },
}))
