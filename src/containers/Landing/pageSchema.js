export const DEFAULT_PAGE_SCHEMA = {
  schemaVersion: 1,
  name: 'Trang chủ flast.vn',
  theme: {
    primaryColor: '#7c5cff',
    fontFamily: 'Inter, sans-serif',
  },
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

export const findPageSection = (schema, sectionId) => (
  schema?.sections?.find(section => section?.id === sectionId) ?? null
)

export const isPageSchema = schema => (
  Boolean(schema)
  && typeof schema === 'object'
  && Array.isArray(schema.sections)
  && schema.sections.every(section => (
    typeof section?.id === 'string'
    && typeof section?.type === 'string'
    && section?.props
    && typeof section.props === 'object'
  ))
)
