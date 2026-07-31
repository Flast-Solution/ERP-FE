import { EXTENDED_LANDING_BLOCKS } from './extendedBlockRegistry'

const createId = (type) => {
  const suffix = (typeof window !== 'undefined' && window.crypto?.randomUUID?.())
    ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${type}-${suffix}`
}

export const LANDING_BLOCKS = [
  {
    type: 'navbar',
    label: 'Thanh điều hướng',
    icon: '☰',
    defaults: {
      brandName: 'Tên thương hiệu',
      logoUrl: '',
      logoAlt: 'Logo thương hiệu',
      links: [
        { label: 'Trang chủ', url: '#' },
        { label: 'Giới thiệu', url: '#gioi-thieu' },
      ],
      buttonText: 'Liên hệ',
      actions: [
        {
          label: 'Liên hệ',
          url: '/contact',
          openInNewTab: false,
        },
      ],
    },
    fields: [
      { name: 'brandName', label: 'Tên thương hiệu', control: 'text' },
      { name: 'logoUrl', label: 'Logo', control: 'image', uploadFolder: 'landing/logo' },
      { name: 'logoAlt', label: 'Mô tả logo', control: 'text' },
      {
        name: 'links',
        label: 'Liên kết menu',
        control: 'repeater',
        itemFields: [
          { name: 'label', label: 'Nhãn', control: 'text' },
          { name: 'url', label: 'Liên kết', control: 'text' },
        ],
        itemDefaults: { label: 'Liên kết mới', url: '#' },
      },
      {
        name: 'actions',
        label: 'Nút hành động',
        control: 'repeater',
        itemFields: [
          { name: 'label', label: 'Nhãn nút', control: 'text' },
          { name: 'url', label: 'Đi tới trang/URL', control: 'text' },
          { name: 'openInNewTab', label: 'Mở trong tab mới', control: 'checkbox' },
        ],
        itemDefaults: {
          label: 'Nút mới',
          url: '/',
          openInNewTab: false,
        },
      },
    ],
  },
  {
    type: 'hero',
    label: 'Hero',
    icon: '▣',
    defaults: {
      eyebrow: 'GIỚI THIỆU',
      title: 'Tiêu đề nổi bật của trang',
      description: 'Mô tả ngắn giúp khách hàng hiểu giá trị bạn mang lại.',
      primaryButtonText: 'Bắt đầu',
      primaryButtonUrl: '/get-started',
      primaryButtonOpenInNewTab: false,
      secondaryButtonText: 'Tìm hiểu thêm',
      secondaryButtonUrl: '#features',
      secondaryButtonOpenInNewTab: false,
      background: '#fafaff',
    },
    fields: [
      { name: 'eyebrow', label: 'Nhãn phía trên', control: 'text' },
      { name: 'title', label: 'Tiêu đề', control: 'textarea' },
      { name: 'description', label: 'Mô tả', control: 'textarea' },
      { name: 'primaryButtonText', label: 'Nút chính', control: 'text' },
      { name: 'primaryButtonUrl', label: 'URL nút chính', control: 'text' },
      { name: 'primaryButtonOpenInNewTab', label: 'Mở nút chính trong tab mới', control: 'checkbox' },
      { name: 'secondaryButtonText', label: 'Nút phụ', control: 'text' },
      { name: 'secondaryButtonUrl', label: 'URL nút phụ', control: 'text' },
      { name: 'secondaryButtonOpenInNewTab', label: 'Mở nút phụ trong tab mới', control: 'checkbox' },
      { name: 'background', label: 'Màu nền', control: 'color' },
    ],
  },
  {
    type: 'bannerSlider',
    label: 'Banner slide',
    icon: '▤',
    defaults: {
      images: [],
      autoplay: true,
      interval: '5',
      height: '420',
      showDots: true,
    },
    fields: [
      {
        name: 'images',
        label: 'Ảnh banner',
        control: 'multiImage',
      },
      { name: 'autoplay', label: 'Tự động chuyển slide', control: 'checkbox' },
      { name: 'interval', label: 'Thời gian chuyển (giây)', control: 'number' },
      { name: 'height', label: 'Chiều cao banner (px)', control: 'number' },
      { name: 'showDots', label: 'Hiển thị chấm điều hướng', control: 'checkbox' },
    ],
  },
  {
    type: 'heading',
    label: 'Tiêu đề',
    icon: 'H',
    defaults: {
      text: 'Tiêu đề mới',
      level: 'h2',
      align: 'left',
    },
    fields: [
      { name: 'text', label: 'Nội dung', control: 'textarea' },
      {
        name: 'level',
        label: 'Cấp tiêu đề',
        control: 'select',
        options: [
          { label: 'H1', value: 'h1' },
          { label: 'H2', value: 'h2' },
          { label: 'H3', value: 'h3' },
        ],
      },
      {
        name: 'align',
        label: 'Căn lề',
        control: 'select',
        options: [
          { label: 'Trái', value: 'left' },
          { label: 'Giữa', value: 'center' },
          { label: 'Phải', value: 'right' },
        ],
      },
    ],
  },
  {
    type: 'text',
    label: 'Văn bản',
    icon: '¶',
    defaults: {
      text: 'Nhập nội dung văn bản tại đây.',
      align: 'left',
    },
    fields: [
      { name: 'text', label: 'Nội dung', control: 'textarea' },
      {
        name: 'align',
        label: 'Căn lề',
        control: 'select',
        options: [
          { label: 'Trái', value: 'left' },
          { label: 'Giữa', value: 'center' },
          { label: 'Phải', value: 'right' },
        ],
      },
    ],
  },
  {
    type: 'image',
    label: 'Hình ảnh',
    icon: '▧',
    defaults: {
      src: 'https://placehold.co/1200x520/f4f2ff/6550d8?text=Hinh+anh',
      alt: 'Hình ảnh',
      caption: '',
      radius: '12',
    },
    fields: [
      { name: 'src', label: 'Hình ảnh', control: 'image', uploadFolder: 'landing/image' },
      { name: 'alt', label: 'Văn bản thay thế', control: 'text' },
      { name: 'caption', label: 'Chú thích', control: 'text' },
      { name: 'radius', label: 'Bo góc (px)', control: 'number' },
    ],
  },
  {
    type: 'button',
    label: 'Nút bấm',
    icon: '▰',
    defaults: {
      text: 'Xem thêm',
      url: '#',
      align: 'left',
      openInNewTab: false,
    },
    fields: [
      { name: 'text', label: 'Nhãn nút', control: 'text' },
      { name: 'url', label: 'Liên kết', control: 'text' },
      { name: 'openInNewTab', label: 'Mở trong tab mới', control: 'checkbox' },
      {
        name: 'align',
        label: 'Căn lề',
        control: 'select',
        options: [
          { label: 'Trái', value: 'left' },
          { label: 'Giữa', value: 'center' },
          { label: 'Phải', value: 'right' },
        ],
      },
    ],
  },
  {
    type: 'features',
    label: 'Danh sách tính năng',
    icon: '▦',
    defaults: {
      items: [
        {
          title: 'Tính năng thứ nhất',
          description: 'Mô tả tính năng.',
          icon: 'bolt',
          imageUrl: '',
          buttonText: 'Xem thêm',
          buttonUrl: '#',
          buttonOpenInNewTab: false,
        },
        {
          title: 'Tính năng thứ hai',
          description: 'Mô tả tính năng.',
          icon: 'check',
          imageUrl: '',
          buttonText: 'Xem thêm',
          buttonUrl: '#',
          buttonOpenInNewTab: false,
        },
        {
          title: 'Tính năng thứ ba',
          description: 'Mô tả tính năng.',
          icon: 'star',
          imageUrl: '',
          buttonText: 'Xem thêm',
          buttonUrl: '#',
          buttonOpenInNewTab: false,
        },
      ],
    },
    fields: [
      {
        name: 'items',
        label: 'Danh sách tính năng',
        control: 'repeater',
        itemFields: [
          { name: 'title', label: 'Tiêu đề', control: 'text' },
          { name: 'description', label: 'Mô tả', control: 'textarea' },
          {
            name: 'icon',
            label: 'Icon',
            control: 'select',
            options: [
              { label: 'Tia chớp', value: 'bolt' },
              { label: 'Dấu tích', value: 'check' },
              { label: 'Ngôi sao', value: 'star' },
              { label: 'Trái tim', value: 'heart' },
              { label: 'Không dùng icon', value: 'none' },
            ],
          },
          {
            name: 'imageUrl',
            label: 'Hình ảnh',
            control: 'image',
            uploadFolder: 'landing/features',
          },
          { name: 'buttonText', label: 'Nhãn nút', control: 'text' },
          { name: 'buttonUrl', label: 'URL của nút', control: 'text' },
          { name: 'buttonOpenInNewTab', label: 'Mở nút trong tab mới', control: 'checkbox' },
        ],
        itemDefaults: {
          title: 'Tính năng mới',
          description: 'Mô tả tính năng.',
          icon: 'bolt',
          imageUrl: '',
          buttonText: 'Xem thêm',
          buttonUrl: '#',
          buttonOpenInNewTab: false,
        },
      },
    ],
  },
  {
    type: 'pricing',
    label: 'Bảng giá',
    icon: '₫',
    defaults: {
      title: 'Bảng giá',
      description: 'Chọn gói phù hợp với bạn.',
      borderRadius: '16px',
      plans: [
        {
          name: 'Cơ bản',
          price: '0₫',
          description: 'Dành cho cá nhân',
          icon: 'check',
          imageUrl: '',
          featured: false,
          buttonText: 'Chọn gói',
          buttonUrl: '#',
          buttonOpenInNewTab: false,
        },
        {
          name: 'Nâng cao',
          price: 'Liên hệ',
          description: 'Dành cho doanh nghiệp',
          icon: 'star',
          imageUrl: '',
          featured: true,
          buttonText: 'Chọn gói',
          buttonUrl: '#',
          buttonOpenInNewTab: false,
        },
      ],
    },
    fields: [
      { name: 'title', label: 'Tiêu đề', control: 'text' },
      { name: 'description', label: 'Mô tả', control: 'textarea' },
      { name: 'borderRadius', label: 'Bo góc', control: 'text' },
      {
        name: 'plans',
        label: 'Các gói',
        control: 'repeater',
        itemFields: [
          { name: 'name', label: 'Tên gói', control: 'text' },
          { name: 'price', label: 'Giá', control: 'text' },
          { name: 'description', label: 'Mô tả', control: 'text' },
          {
            name: 'icon',
            label: 'Icon',
            control: 'select',
            options: [
              { label: 'Dấu tích', value: 'check' },
              { label: 'Ngôi sao', value: 'star' },
              { label: 'Tia chớp', value: 'bolt' },
              { label: 'Không dùng icon', value: 'none' },
            ],
          },
          {
            name: 'imageUrl',
            label: 'Hình ảnh',
            control: 'image',
            uploadFolder: 'landing/pricing',
          },
          { name: 'featured', label: 'Gói nổi bật', control: 'checkbox' },
          { name: 'buttonText', label: 'Nhãn nút', control: 'text' },
          { name: 'buttonUrl', label: 'URL của nút', control: 'text' },
          { name: 'buttonOpenInNewTab', label: 'Mở nút trong tab mới', control: 'checkbox' },
        ],
        itemDefaults: {
          name: 'Gói mới',
          price: 'Liên hệ',
          description: 'Mô tả gói',
          icon: 'check',
          imageUrl: '',
          featured: false,
          buttonText: 'Chọn gói',
          buttonUrl: '#',
          buttonOpenInNewTab: false,
        },
      },
    ],
  },
  {
    type: 'divider',
    label: 'Đường phân cách',
    icon: '—',
    defaults: {
      color: '#e8e8ee',
      width: '100',
    },
    fields: [
      { name: 'color', label: 'Màu đường kẻ', control: 'color' },
      { name: 'width', label: 'Độ rộng (%)', control: 'number' },
    ],
  },
  {
    type: 'spacer',
    label: 'Khoảng trống',
    icon: '↕',
    defaults: { height: '48' },
    fields: [
      { name: 'height', label: 'Chiều cao (px)', control: 'number' },
    ],
  },
  {
    type: 'footer',
    label: 'Chân trang',
    icon: '▂',
    defaults: { text: '© 2026 Tên doanh nghiệp' },
    fields: [
      { name: 'text', label: 'Nội dung', control: 'textarea' },
    ],
  },
  ...EXTENDED_LANDING_BLOCKS,
]

export const getLandingBlock = (type) => (
  LANDING_BLOCKS.find(block => block.type === type) ?? null
)

export const createLandingBlock = (type) => {
  const definition = getLandingBlock(type)
  if (!definition) return null

  return {
    id: createId(type),
    type,
    props: {
      blockTitle: '',
      ...JSON.parse(JSON.stringify(definition.defaults)),
    },
  }
}
