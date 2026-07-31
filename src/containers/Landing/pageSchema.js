import { getLandingBlock } from './blockRegistry'

export const DEFAULT_PAGE_SCHEMA = {
  schemaVersion: 1,
  name: 'Trang chủ flast.vn',
  theme: {
    primaryColor: '#7c5cff',
    fontFamily: 'Inter, sans-serif',
  },
  seo: {
    meta: [
      { id: 's1', name: 'title', value: 'flast.vn — Xây trang web bằng AI' },
      { id: 's2', name: 'description', value: 'Tạo và chỉnh sửa website trực quan với trợ lý AI.' },
    ],
  },
  breadcrumbs: [{ id: 'c1', text: 'Trang chủ', url: '/' }],
  dataSources: {},
  sections: [
    {
      id: 'nav',
      type: 'navbar',
      props: {
        brandName: 'Nimbus',
        links: [
          { label: 'Sản phẩm', url: '#features' },
          { label: 'Giải pháp', url: '#hero' },
          { label: 'Bảng giá', url: '#pricing' },
        ],
        buttonText: 'Dùng thử',
      },
    },
    {
      id: 'hero',
      type: 'hero',
      props: {
        eyebrow: 'Nền tảng vận hành',
        title: 'Đưa sản phẩm ra thị trường nhanh hơn',
        description: 'Nimbus giúp đội ngũ của bạn xây dựng, triển khai và mở rộng — tất cả trong một nơi.',
        primaryButtonText: 'Bắt đầu miễn phí',
        secondaryButtonText: 'Xem demo',
        background: '#fafaff',
      },
    },
    {
      id: 'features',
      type: 'features',
      props: {
        items: [
          {
            title: 'Triển khai tức thì',
            description: 'Đẩy code lên production chỉ với một cú nhấp.',
          },
          {
            title: 'Cộng tác thời gian thực',
            description: 'Cả nhóm cùng làm việc trên một bản xem trước.',
          },
          {
            title: 'Phân tích tích hợp',
            description: 'Theo dõi hiệu suất ngay trong bảng điều khiển.',
          },
        ],
      },
    },
    {
      id: 'pricing',
      type: 'pricing',
      props: {
        title: 'Bảng giá linh hoạt',
        description: 'Bắt đầu miễn phí, nâng cấp khi nhóm phát triển.',
        borderRadius: '16px',
        plans: [
          { name: 'Free', price: '0₫', description: 'Cho cá nhân', featured: false },
          { name: 'Team', price: '290k', description: 'Cho nhóm nhỏ', featured: true },
          { name: 'Scale', price: 'Liên hệ', description: 'Cho doanh nghiệp', featured: false },
        ],
      },
    },
    {
      id: 'footer',
      type: 'footer',
      props: {
        text: '© 2026 Nimbus · Được tạo với Patch',
      },
    },
  ],
}

export const clonePageSchema = schema => JSON.parse(JSON.stringify(schema))

const isPlainObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const normalizePageSchema = schema => {
  const source = isPlainObject(schema) ? clonePageSchema(schema) : clonePageSchema(DEFAULT_PAGE_SCHEMA)
  return {
    ...source,
    schemaVersion: Number.isInteger(source.schemaVersion) ? source.schemaVersion : 1,
    name: typeof source.name === 'string' ? source.name : 'Trang chưa đặt tên',
    theme: isPlainObject(source.theme) ? source.theme : clonePageSchema(DEFAULT_PAGE_SCHEMA.theme),
    seo: isPlainObject(source.seo) && Array.isArray(source.seo.meta)
      ? source.seo
      : clonePageSchema(DEFAULT_PAGE_SCHEMA.seo),
    breadcrumbs: Array.isArray(source.breadcrumbs)
      ? source.breadcrumbs
      : clonePageSchema(DEFAULT_PAGE_SCHEMA.breadcrumbs),
    dataSources: isPlainObject(source.dataSources) ? source.dataSources : {},
    sections: Array.isArray(source.sections) ? source.sections : [],
  }
}

export const validatePageSchema = schema => {
  const errors = []
  if (!isPlainObject(schema)) return ['Schema phải là một object.']
  if (!Number.isInteger(schema.schemaVersion) || schema.schemaVersion < 1) errors.push('schemaVersion không hợp lệ.')
  if (typeof schema.name !== 'string' || !schema.name.trim()) errors.push('Tên trang không hợp lệ.')
  if (!isPlainObject(schema.theme)) errors.push('Theme không hợp lệ.')
  else {
    if (schema.theme.primaryColor != null && typeof schema.theme.primaryColor !== 'string') errors.push('Màu theme không hợp lệ.')
    if (schema.theme.fontFamily != null && typeof schema.theme.fontFamily !== 'string') errors.push('Font theme không hợp lệ.')
  }
  if (!Array.isArray(schema.sections)) return [...errors, 'Danh sách sections không hợp lệ.']
  if (new Set(schema.sections.map(section => section?.id)).size !== schema.sections.length) {
    errors.push('ID block không được trùng nhau.')
  }
  schema.sections.forEach((section, index) => {
    if (!isPlainObject(section)) {
      errors.push(`Block ${index + 1} không phải object.`)
      return
    }
    if (typeof section.id !== 'string' || !section.id.trim()) errors.push(`Block ${index + 1} thiếu id.`)
    if (typeof section.type !== 'string' || !section.type.trim()) errors.push(`Block ${index + 1} thiếu type.`)
    else if (!getLandingBlock(section.type)) errors.push(`Block ${section.id || index + 1} có type không được hỗ trợ.`)
    if (!isPlainObject(section.props)) errors.push(`Props của block ${section.id || index + 1} không hợp lệ.`)
  })
  if (schema.seo != null && (!isPlainObject(schema.seo) || !Array.isArray(schema.seo.meta))) errors.push('SEO không hợp lệ.')
  else if (schema.seo?.meta?.some(meta => !isPlainObject(meta) || typeof meta.name !== 'string' || typeof meta.value !== 'string')) errors.push('Thẻ SEO không hợp lệ.')
  if (schema.breadcrumbs != null && !Array.isArray(schema.breadcrumbs)) errors.push('Breadcrumb không hợp lệ.')
  else if (schema.breadcrumbs?.some(item => !isPlainObject(item) || typeof item.text !== 'string' || typeof item.url !== 'string')) errors.push('Mục breadcrumb không hợp lệ.')
  if (schema.dataSources != null && !isPlainObject(schema.dataSources)) errors.push('Nguồn dữ liệu không hợp lệ.')
  else if (Object.values(schema.dataSources ?? {}).some(sources => !Array.isArray(sources))) errors.push('Danh sách API của block không hợp lệ.')
  return errors
}

export const findPageSection = (schema, sectionId) => (
  schema?.sections?.find(section => section?.id === sectionId) ?? null
)

export const isPageSchema = schema => (
  isPlainObject(schema)
  && Array.isArray(schema.sections)
  && validatePageSchema(normalizePageSchema(schema)).length === 0
)
