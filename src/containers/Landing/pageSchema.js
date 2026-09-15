import { getLandingBlock } from './blockRegistry'

export const DEFAULT_PAGE_SCHEMA = {
  schemaVersion: 2,
  name: 'Trang chủ flast.vn',
  theme: {
    primaryColor: '#7c5cff',
    secondaryColor: '#d9a441',
    surfaceColor: '#ffffff',
    surfaceAltColor: '#f7f5ff',
    textColor: '#16161a',
    mutedColor: '#6f6f82',
    fontFamily: 'Inter, sans-serif',
    displayFontFamily: 'Inter, sans-serif',
    monoFontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontStylesheetUrl: '',
    containerWidth: '1180',
    borderRadius: '12',
    sectionSpacingDesktop: '40',
    sectionSpacingMobile: '24',
  },
  seo: {
    meta: [
      { id: 's1', name: 'title', value: 'flast.vn — Xây trang web bằng AI' },
      { id: 's2', name: 'description', value: 'Tạo và chỉnh sửa website trực quan với trợ lý AI.' },
    ],
  },
  breadcrumbs: [{ id: 'c1', text: 'Trang chủ', url: '/' }],
  dataSources: {},
  overlays: [],
  sections: [
    {
      id: 'nav',
      type: 'navbar',
      props: {
        brandName: 'Nimbus',
        brandUrl: '/',
        brandOpenInNewTab: false,
        sticky: false,
        backgroundColor: '#ffffff',
        textColor: '#16161a',
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
        backgroundType: 'color',
        backgroundImageUrl: '',
        backgroundVideoUrl: '',
        overlayColor: '#000000',
        overlayOpacity: '35',
        layout: 'center',
        minHeight: '520',
        mobileMinHeight: '420',
        textColor: '#16161a',
        titleFontSize: '48',
        mobileTitleFontSize: '36',
        descriptionFontSize: '18',
        mobileDescriptionFontSize: '16',
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
    schemaVersion: Number.isInteger(source.schemaVersion) ? source.schemaVersion : 2,
    name: typeof source.name === 'string' ? source.name : 'Trang chưa đặt tên',
    theme: isPlainObject(source.theme)
      ? { ...clonePageSchema(DEFAULT_PAGE_SCHEMA.theme), ...source.theme }
      : clonePageSchema(DEFAULT_PAGE_SCHEMA.theme),
    seo: isPlainObject(source.seo) && Array.isArray(source.seo.meta)
      ? source.seo
      : clonePageSchema(DEFAULT_PAGE_SCHEMA.seo),
    breadcrumbs: Array.isArray(source.breadcrumbs)
      ? source.breadcrumbs
      : clonePageSchema(DEFAULT_PAGE_SCHEMA.breadcrumbs),
    dataSources: isPlainObject(source.dataSources) ? source.dataSources : {},
    overlays: Array.isArray(source.overlays) ? source.overlays : [],
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
  const allBlockIds = []
  const validateSection = (section, label) => {
    if (!isPlainObject(section)) {
      errors.push(`${label} không phải object.`)
      return
    }
    if (typeof section.id !== 'string' || !section.id.trim()) errors.push(`${label} thiếu id.`)
    else allBlockIds.push(section.id)
    if (typeof section.type !== 'string' || !section.type.trim()) errors.push(`${label} thiếu type.`)
    else if (!getLandingBlock(section.type)) errors.push(`Block ${section.id || label} có type không được hỗ trợ.`)
    if (!isPlainObject(section.props)) {
      errors.push(`Props của block ${section.id || label} không hợp lệ.`)
      return
    }

    if (['contactForm', 'leadForm'].includes(section.type)) {
      const fields = Array.isArray(section.props.fields) ? section.props.fields : []
      const names = fields.map(field => String(field?.name ?? '').trim()).filter(Boolean)
      if (names.length !== fields.length) errors.push(`Form ${section.id} có field thiếu tên.`)
      if (new Set(names).size !== names.length) errors.push(`Form ${section.id} có tên field bị trùng.`)
    }

    if (section.type === 'countdown') {
      if (Number.isNaN(new Date(section.props.targetDate).getTime())) errors.push(`Countdown ${section.id} có ngày kết thúc không hợp lệ.`)
      try {
        new Intl.DateTimeFormat('vi-VN', { timeZone: section.props.timezone || 'Asia/Ho_Chi_Minh' }).format()
      } catch {
        errors.push(`Countdown ${section.id} có múi giờ không hợp lệ.`)
      }
    }

    const nestedGroups = [
      ...(Array.isArray(section.props.blocks) ? [section.props.blocks] : []),
      ...(Array.isArray(section.props.visualBlocks) ? [section.props.visualBlocks] : []),
      ...(Array.isArray(section.props.contentBlocks) ? [section.props.contentBlocks] : []),
      ...(Array.isArray(section.props.columns)
        ? section.props.columns.map(column => Array.isArray(column?.blocks) ? column.blocks : [])
        : []),
      ...(section.type === 'tabs' && Array.isArray(section.props.items)
        ? section.props.items.map(item => Array.isArray(item?.blocks) ? item.blocks : [])
        : []),
    ]
    nestedGroups.forEach((blocks, groupIndex) => blocks.forEach((block, blockIndex) => (
      validateSection(block, `${label}.${groupIndex + 1}.${blockIndex + 1}`)
    )))
  }
  schema.sections.forEach((section, index) => validateSection(section, `Block ${index + 1}`))
  if (new Set(allBlockIds).size !== allBlockIds.length) errors.push('ID block lồng nhau không được trùng nhau.')
  if (schema.seo != null && (!isPlainObject(schema.seo) || !Array.isArray(schema.seo.meta))) errors.push('SEO không hợp lệ.')
  else if (schema.seo?.meta?.some(meta => !isPlainObject(meta) || typeof meta.name !== 'string' || typeof meta.value !== 'string')) errors.push('Thẻ SEO không hợp lệ.')
  if (schema.breadcrumbs != null && !Array.isArray(schema.breadcrumbs)) errors.push('Breadcrumb không hợp lệ.')
  else if (schema.breadcrumbs?.some(item => !isPlainObject(item) || typeof item.text !== 'string' || typeof item.url !== 'string')) errors.push('Mục breadcrumb không hợp lệ.')
  if (schema.dataSources != null && !isPlainObject(schema.dataSources)) errors.push('Nguồn dữ liệu không hợp lệ.')
  else if (Object.values(schema.dataSources ?? {}).some(sources => !Array.isArray(sources))) errors.push('Danh sách API của block không hợp lệ.')
  if (schema.overlays != null && !Array.isArray(schema.overlays)) errors.push('Danh sách drawer/popup không hợp lệ.')
  else if (schema.overlays?.some(item => !isPlainObject(item) || typeof item.id !== 'string' || !item.id.trim())) {
    errors.push('Drawer/popup thiếu ID hợp lệ.')
  } else if (new Set((schema.overlays ?? []).map(item => item.id)).size !== (schema.overlays ?? []).length) {
    errors.push('ID drawer/popup không được trùng nhau.')
  }
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
