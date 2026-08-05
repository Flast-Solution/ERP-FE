const text = (name, label, control = 'text') => ({ name, label, control })
const actionFields = [
  text('buttonText', 'Nhãn nút'),
  text('buttonUrl', 'URL của nút'),
  text('buttonOpenInNewTab', 'Mở trong tab mới', 'checkbox'),
]
const list = (name, label, itemFields, itemDefaults) => ({
  name, label, control: 'repeater', itemFields, itemDefaults,
})

const COLUMN_BOX_DEFAULTS = {
  marginTop: '0', marginRight: '0', marginBottom: '0', marginLeft: '0',
  paddingTop: '20', paddingRight: '20', paddingBottom: '20', paddingLeft: '20',
  background: '#ffffff', borderWidth: '1', borderStyle: 'solid',
  borderColor: '#e8e8ee', borderRadius: '14', shadow: 'none', verticalAlign: 'stretch',
}

const COLUMN_BOX_FIELDS = [
  text('marginTop', 'Margin trên (px)', 'number'), text('marginRight', 'Margin phải (px)', 'number'),
  text('marginBottom', 'Margin dưới (px)', 'number'), text('marginLeft', 'Margin trái (px)', 'number'),
  text('paddingTop', 'Padding trên (px)', 'number'), text('paddingRight', 'Padding phải (px)', 'number'),
  text('paddingBottom', 'Padding dưới (px)', 'number'), text('paddingLeft', 'Padding trái (px)', 'number'),
  text('background', 'Màu nền cột', 'colorOptional'), text('borderWidth', 'Độ dày border (px)', 'number'),
  {
    name: 'borderStyle', label: 'Kiểu border', control: 'select', options: [
      { label: 'Liền', value: 'solid' }, { label: 'Nét đứt', value: 'dashed' },
      { label: 'Chấm', value: 'dotted' }, { label: 'Hai đường', value: 'double' },
    ],
  },
  text('borderColor', 'Màu border', 'color'), text('borderRadius', 'Bo góc (px)', 'number'),
  {
    name: 'shadow', label: 'Đổ bóng', control: 'select', options: [
      { label: 'Không dùng', value: 'none' }, { label: 'Nhẹ', value: 'soft' },
      { label: 'Vừa', value: 'medium' }, { label: 'Đậm', value: 'strong' },
    ],
  },
  {
    name: 'verticalAlign', label: 'Căn dọc cột', control: 'select', options: [
      { label: 'Cao bằng hàng', value: 'stretch' }, { label: 'Trên', value: 'start' },
      { label: 'Giữa', value: 'center' }, { label: 'Dưới', value: 'end' },
    ],
  },
]

const contentListBlock = ({ type, label, icon, entity }) => ({
  type,
  label,
  icon,
  defaults: {
    title: label,
    description: '',
    entity,
    emptyText: 'Chưa có dữ liệu để hiển thị.',
    pageSize: '6',
    hideButtons: false,
    buttonStyle: 'outline',
    buttonBackground: '#232D4B',
    buttonTextColor: '#232D4B',
    buttonBorderColor: '#232D4B',
    buttonBorderRadius: '0',
    items: [
      { title: `${label} mẫu 1`, description: 'Dữ liệu xem trước', imageUrl: '', buttonText: 'Xem chi tiết', url: '#', openInNewTab: false },
      { title: `${label} mẫu 2`, description: 'Dữ liệu xem trước', imageUrl: '', buttonText: 'Xem chi tiết', url: '#', openInNewTab: false },
    ],
  },
  fields: [
    text('title', 'Tiêu đề'),
    text('description', 'Mô tả', 'textarea'),
    text('entity', 'Mã nguồn dữ liệu'),
    text('emptyText', 'Nội dung khi trống'),
    text('pageSize', 'Số mục mỗi trang', 'number'),
    text('hideButtons', 'Ẩn nút', 'checkbox'),
    {
      name: 'buttonStyle', label: 'Kiểu nút', control: 'select', options: [
        { label: 'Nút chính', value: 'primary' },
        { label: 'Nút viền', value: 'outline' },
        { label: 'Liên kết', value: 'link' },
      ],
    },
    text('buttonBackground', 'Màu nền nút', 'color'),
    text('buttonTextColor', 'Màu chữ nút', 'color'),
    text('buttonBorderColor', 'Màu viền nút', 'color'),
    text('buttonBorderRadius', 'Bo góc nút (px)', 'number'),
    list('items', 'Dữ liệu xem trước', [
      text('title', 'Tiêu đề'),
      text('description', 'Mô tả', 'textarea'),
      { name: 'imageUrl', label: 'Hình ảnh', control: 'image', uploadFolder: `landing/${type}` },
      text('buttonText', 'Nhãn nút'),
      text('url', 'URL của nút'),
      text('openInNewTab', 'Mở trong tab mới', 'checkbox'),
      text('publishedDate', 'Ngày đăng'),
      text('author', 'Tác giả'),
      text('category', 'Danh mục'),
      text('jobTitle', 'Chức danh'),
      text('department', 'Phòng ban'),
    ], { title: 'Mục mới', description: '', imageUrl: '', buttonText: 'Xem chi tiết', url: '#', openInNewTab: false, publishedDate: '', author: '', category: '', jobTitle: '', department: '' }),
  ],
})

export const EXTENDED_LANDING_BLOCKS = [
  {
    type: 'container', label: 'Container', icon: '□',
    defaults: { title: 'Nội dung trong container', content: 'Nhập nội dung...', blocks: [], maxWidth: '1120', padding: '32', background: '#ffffff' },
    fields: [
      { name: 'blocks', label: 'Block con', control: 'nestedBlocks' },
      text('title', 'Tiêu đề dự phòng'), text('content', 'Nội dung dự phòng', 'textarea'),
      text('maxWidth', 'Độ rộng tối đa (px)', 'number'), text('padding', 'Khoảng đệm (px)', 'number'), text('background', 'Màu nền', 'color'),
    ],
  },
  {
    type: 'columns', label: 'Hàng và cột', icon: '▥',
    defaults: {
      gap: '20',
      rowMarginTop: '0', rowMarginRight: '0', rowMarginBottom: '0', rowMarginLeft: '0',
      rowPaddingTop: '40', rowPaddingRight: '32', rowPaddingBottom: '40', rowPaddingLeft: '32',
      rowBackground: '', rowBorderWidth: '0', rowBorderStyle: 'solid',
      rowBorderColor: '#e8e8ee', rowBorderRadius: '0', rowShadow: 'none',
      columns: [
        { ...COLUMN_BOX_DEFAULTS, width: '50', title: 'Cột thứ nhất', content: 'Nội dung cột thứ nhất', buttonText: '', buttonUrl: '#', blocks: [] },
        { ...COLUMN_BOX_DEFAULTS, width: '50', title: 'Cột thứ hai', content: 'Nội dung cột thứ hai', buttonText: '', buttonUrl: '#', blocks: [] },
      ],
    },
    fields: [
      text('gap', 'Khoảng cách cột (px)', 'number'),
      text('rowMarginTop', 'Margin trên của hàng (px)', 'number'),
      text('rowMarginRight', 'Margin phải của hàng (px)', 'number'),
      text('rowMarginBottom', 'Margin dưới của hàng (px)', 'number'),
      text('rowMarginLeft', 'Margin trái của hàng (px)', 'number'),
      text('rowPaddingTop', 'Padding trên của hàng (px)', 'number'),
      text('rowPaddingRight', 'Padding phải của hàng (px)', 'number'),
      text('rowPaddingBottom', 'Padding dưới của hàng (px)', 'number'),
      text('rowPaddingLeft', 'Padding trái của hàng (px)', 'number'),
      text('rowBackground', 'Màu nền hàng', 'colorOptional'),
      text('rowBorderWidth', 'Độ dày border hàng (px)', 'number'),
      {
        name: 'rowBorderStyle', label: 'Kiểu border hàng', control: 'select', options: [
          { label: 'Liền', value: 'solid' }, { label: 'Nét đứt', value: 'dashed' },
          { label: 'Chấm', value: 'dotted' }, { label: 'Hai đường', value: 'double' },
        ],
      },
      text('rowBorderColor', 'Màu border hàng', 'color'),
      text('rowBorderRadius', 'Bo góc hàng (px)', 'number'),
      {
        name: 'rowShadow', label: 'Đổ bóng hàng', control: 'select', options: [
          { label: 'Không dùng', value: 'none' }, { label: 'Nhẹ', value: 'soft' },
          { label: 'Vừa', value: 'medium' }, { label: 'Đậm', value: 'strong' },
        ],
      },
      list('columns', 'Danh sách cột', [text('width', 'Độ rộng (%)', 'number'), ...COLUMN_BOX_FIELDS, { name: 'blocks', label: 'Block trong cột', control: 'nestedBlocks' }, text('title', 'Tiêu đề dự phòng'), text('content', 'Nội dung dự phòng', 'textarea'), ...actionFields.slice(0, 2)], { ...COLUMN_BOX_DEFAULTS, width: '50', title: 'Cột mới', content: '', buttonText: '', buttonUrl: '#', blocks: [] }),
    ],
  },
  {
    type: 'richText', label: 'Rich text', icon: '¶',
    defaults: { html: '<h2>Tiêu đề nội dung</h2><p>Soạn nội dung có định dạng tại đây.</p>' },
    fields: [text('html', 'Nội dung', 'richtext')],
  },
  {
    type: 'cta', label: 'CTA', icon: '◎',
    defaults: {
      title: 'Sẵn sàng bắt đầu?', description: 'Liên hệ với chúng tôi để được tư vấn.',
      buttonText: 'Liên hệ ngay', buttonUrl: '/contact', buttonOpenInNewTab: false,
      secondaryButtonText: '', secondaryButtonUrl: '#', secondaryButtonOpenInNewTab: false,
      background: '#f3f0ff', backgroundImageUrl: '', overlayColor: '#000000', overlayOpacity: '0',
      textColor: '#16161a', layout: 'center',
    },
    fields: [
      text('title', 'Tiêu đề'), text('description', 'Mô tả', 'textarea'), ...actionFields,
      text('secondaryButtonText', 'Nhãn CTA phụ'), text('secondaryButtonUrl', 'URL CTA phụ'),
      text('secondaryButtonOpenInNewTab', 'Mở CTA phụ trong tab mới', 'checkbox'),
      text('layout', 'Căn nội dung', 'select'),
      text('background', 'Màu nền', 'color'),
      { name: 'backgroundImageUrl', label: 'Ảnh nền', control: 'image', uploadFolder: 'landing/cta' },
      text('overlayColor', 'Màu lớp phủ', 'color'), text('overlayOpacity', 'Độ mờ lớp phủ (%)', 'number'),
      text('textColor', 'Màu chữ', 'color'),
    ].map(field => field.name === 'layout' ? { ...field, options: ['left', 'center', 'right'].map(value => ({ label: value === 'left' ? 'Trái' : value === 'right' ? 'Phải' : 'Giữa', value })) } : field),
  },
  {
    type: 'contactForm', label: 'Form liên hệ', icon: '✉',
    defaults: {
      title: 'Liên hệ với chúng tôi', submitText: 'Gửi liên hệ', successMessage: 'Cảm ơn bạn đã liên hệ.', endpoint: '', method: 'POST',
      fields: [
        { label: 'Họ và tên', name: 'fullName', type: 'text', placeholder: 'Nhập họ và tên', required: true },
        { label: 'Email', name: 'email', type: 'email', placeholder: 'name@example.com', required: true },
        { label: 'Nội dung', name: 'message', type: 'textarea', placeholder: 'Nhập nội dung', required: false },
      ],
    },
    fields: [text('title', 'Tiêu đề'), text('endpoint', 'API nhận dữ liệu'), { name: 'method', label: 'HTTP method', control: 'select', options: ['POST', 'PUT'].map(value => ({ label: value, value })) }, text('submitText', 'Nhãn nút gửi'), text('successMessage', 'Thông báo thành công'), list('fields', 'Các trường', [text('label', 'Nhãn'), text('name', 'Tên field'), { name: 'type', label: 'Kiểu', control: 'select', options: ['text', 'email', 'tel', 'number', 'date', 'textarea'].map(value => ({ label: value, value })) }, text('placeholder', 'Placeholder'), text('required', 'Bắt buộc', 'checkbox')], { label: 'Trường mới', name: 'field', type: 'text', placeholder: '', required: false })],
  },
  {
    type: 'leadForm', label: 'Form thu lead', icon: '⌁',
    defaults: { title: 'Đăng ký nhận tư vấn', submitText: 'Đăng ký', successMessage: 'Đăng ký thành công.', endpoint: '', method: 'POST', source: 'LANDING_PAGE', fields: [{ label: 'Số điện thoại', name: 'mobile', type: 'tel', placeholder: 'Nhập số điện thoại', required: true }] },
    fields: [text('title', 'Tiêu đề'), text('source', 'Nguồn lead'), text('endpoint', 'API nhận dữ liệu'), { name: 'method', label: 'HTTP method', control: 'select', options: ['POST', 'PUT'].map(value => ({ label: value, value })) }, text('submitText', 'Nhãn nút gửi'), text('successMessage', 'Thông báo thành công'), list('fields', 'Các trường', [text('label', 'Nhãn'), text('name', 'Tên field'), { name: 'type', label: 'Kiểu', control: 'select', options: ['text', 'email', 'tel', 'number', 'date', 'textarea'].map(value => ({ label: value, value })) }, text('placeholder', 'Placeholder'), text('required', 'Bắt buộc', 'checkbox')], { label: 'Trường mới', name: 'field', type: 'text', placeholder: '', required: false })],
  },
  {
    type: 'video', label: 'Video', icon: '▶',
    defaults: { url: '', title: 'Video giới thiệu', thumbnailUrl: '', aspectRatio: '16/9', autoplay: false, requireConsent: false, consentText: 'Cho phép tải video từ bên thứ ba' },
    fields: [text('url', 'YouTube/Vimeo/embed URL'), text('title', 'Tiêu đề'), { name: 'thumbnailUrl', label: 'Ảnh thumbnail', control: 'image', uploadFolder: 'landing/video' }, { name: 'aspectRatio', label: 'Tỷ lệ', control: 'select', options: [{ label: '16:9', value: '16/9' }, { label: '4:3', value: '4/3' }, { label: '1:1', value: '1/1' }] }, text('autoplay', 'Tự động phát', 'checkbox'), text('requireConsent', 'Yêu cầu đồng ý trước khi tải', 'checkbox'), text('consentText', 'Nội dung xin đồng ý')],
  },
  {
    type: 'gallery', label: 'Thư viện ảnh', icon: '▦',
    defaults: { title: 'Thư viện ảnh', columns: '3', mobileColumns: '1', aspectRatio: '4/3', enableLightbox: true, images: [] },
    fields: [text('title', 'Tiêu đề'), text('columns', 'Số cột desktop', 'number'), text('mobileColumns', 'Số cột mobile', 'number'), { name: 'aspectRatio', label: 'Tỷ lệ ảnh', control: 'select', options: ['16/9', '4/3', '1/1', '3/4'].map(value => ({ label: value, value })) }, text('enableLightbox', 'Bật xem ảnh lớn', 'checkbox'), { name: 'images', label: 'Danh sách ảnh', control: 'multiImage', uploadFolder: 'landing/gallery' }],
  },
  {
    type: 'faq', label: 'FAQ / Accordion', icon: '?',
    defaults: { title: 'Câu hỏi thường gặp', allowMultiple: false, items: [{ question: 'Sản phẩm phù hợp với ai?', answer: 'Nội dung trả lời câu hỏi.' }] },
    fields: [text('title', 'Tiêu đề'), text('allowMultiple', 'Cho phép mở nhiều câu', 'checkbox'), list('items', 'Câu hỏi', [text('question', 'Câu hỏi'), text('answer', 'Trả lời', 'textarea')], { question: 'Câu hỏi mới', answer: '' })],
  },
  {
    type: 'testimonials', label: 'Đánh giá khách hàng', icon: '★',
    defaults: { title: 'Khách hàng nói gì', cardStyle: 'border', carousel: false, items: [{ name: 'Nguyễn Văn A', role: 'Khách hàng', company: '', quote: 'Trải nghiệm rất tốt.', rating: '5', avatar: '', companyLogo: '' }] },
    fields: [text('title', 'Tiêu đề'), { name: 'cardStyle', label: 'Kiểu thẻ', control: 'select', options: [{ label: 'Viền', value: 'border' }, { label: 'Bóng đổ', value: 'shadow' }, { label: 'Tối giản', value: 'minimal' }] }, text('carousel', 'Hiển thị dạng carousel', 'checkbox'), list('items', 'Đánh giá', [text('name', 'Tên'), text('role', 'Chức danh'), text('company', 'Công ty'), text('quote', 'Nội dung', 'textarea'), text('rating', 'Số sao (1-5)', 'number'), { name: 'avatar', label: 'Ảnh đại diện', control: 'image', uploadFolder: 'landing/testimonials' }, { name: 'companyLogo', label: 'Logo công ty', control: 'image', uploadFolder: 'landing/testimonials' }], { name: 'Khách hàng', role: '', company: '', quote: '', rating: '5', avatar: '', companyLogo: '' })],
  },
  {
    type: 'logos', label: 'Logo đối tác', icon: '◇',
    defaults: {
      title: 'Đối tác của chúng tôi', displayMode: 'image', grayscale: true,
      logoHeight: '64', images: [], partners: [], background: '#F3EEE1',
      titleColor: '#726C5C', titleFontSize: '12', textColor: '#374873', textFontSize: '20',
      columns: '5', mobileColumns: '2',
    },
    fields: [
      text('title', 'Tiêu đề'),
      {
        name: 'displayMode', label: 'Kiểu logo', control: 'select', options: [
          { label: 'Logo hình ảnh', value: 'image' },
          { label: 'Tên thương hiệu dạng chữ', value: 'text' },
        ],
      },
      text('background', 'Màu nền', 'color'),
      text('titleColor', 'Màu tiêu đề', 'color'),
      text('titleFontSize', 'Cỡ chữ tiêu đề (px)', 'number'),
      text('columns', 'Số cột desktop', 'number'),
      text('mobileColumns', 'Số cột mobile', 'number'),
      list('partners', 'Danh sách tên đối tác', [text('name', 'Tên đối tác'), text('url', 'Liên kết')], { name: 'Đối tác mới', url: '#' }),
      text('textColor', 'Màu tên đối tác', 'color'),
      text('textFontSize', 'Cỡ chữ tên đối tác (px)', 'number'),
      text('grayscale', 'Ảnh xám, hiện màu khi hover', 'checkbox'),
      text('logoHeight', 'Chiều cao logo (px)', 'number'),
      { name: 'images', label: 'Danh sách logo', control: 'multiImage', uploadFolder: 'landing/logos' },
    ],
  },
  {
    type: 'stats', label: 'Số liệu thống kê', icon: '#',
    defaults: { background: '#ffffff', textColor: '#16161a', animate: true, items: [{ value: '1000', prefix: '', suffix: '+', icon: '★', label: 'Khách hàng' }, { value: '99', prefix: '', suffix: '%', icon: '✓', label: 'Hài lòng' }] },
    fields: [text('background', 'Màu nền', 'color'), text('textColor', 'Màu chữ', 'color'), text('animate', 'Hiệu ứng đếm tăng', 'checkbox'), list('items', 'Số liệu', [text('value', 'Giá trị số'), text('prefix', 'Tiền tố'), text('suffix', 'Hậu tố'), text('icon', 'Icon'), text('label', 'Nhãn')], { value: '100', prefix: '', suffix: '+', icon: '★', label: 'Chỉ số mới' })],
  },
  {
    type: 'map', label: 'Bản đồ', icon: '⌖',
    defaults: { title: 'Địa chỉ của chúng tôi', embedUrl: '', address: 'Nhập địa chỉ doanh nghiệp', height: '360', mobileHeight: '260' },
    fields: [text('title', 'Tiêu đề'), text('address', 'Địa chỉ'), text('embedUrl', 'Google Maps embed URL (https://www.google.com/maps/embed?...)'), text('height', 'Chiều cao desktop (px)', 'number'), text('mobileHeight', 'Chiều cao mobile (px)', 'number')],
  },
  {
    type: 'social', label: 'Mạng xã hội', icon: '@',
    defaults: { title: 'Kết nối với chúng tôi', links: [{ platform: 'facebook', label: 'Facebook', url: 'https://facebook.com', openInNewTab: true }] },
    fields: [text('title', 'Tiêu đề'), list('links', 'Liên kết', [{ name: 'platform', label: 'Nền tảng', control: 'select', options: ['facebook', 'youtube', 'instagram', 'linkedin', 'tiktok', 'zalo', 'other'].map(value => ({ label: value, value })) }, text('label', 'Nhãn'), text('url', 'URL'), text('openInNewTab', 'Mở tab mới', 'checkbox')], { platform: 'other', label: 'Mạng xã hội', url: '#', openInNewTab: true })],
  },
  contentListBlock({ type: 'productList', label: 'Sản phẩm / Dịch vụ', icon: '▣', entity: 'product' }),
  contentListBlock({ type: 'postList', label: 'Danh sách bài viết', icon: '▤', entity: 'post' }),
  contentListBlock({ type: 'teamList', label: 'Danh sách nhân sự', icon: '♙', entity: 'user' }),
  {
    type: 'countdown', label: 'Countdown', icon: '◷',
    defaults: {
      title: 'Ưu đãi kết thúc sau',
      targetDate: '2026-12-31T23:59',
      timezone: 'Asia/Ho_Chi_Minh',
      completedText: 'Chương trình đã kết thúc',
      titleColor: '',
      boxBackground: '#ffffff',
      boxBorderColor: '#e8e8ee',
      valueColor: '#16161a',
      labelColor: '#726C5C',
    },
    fields: [
      text('title', 'Tiêu đề'),
      text('targetDate', 'Thời điểm kết thúc (ISO)'),
      text('timezone', 'Múi giờ IANA'),
      text('completedText', 'Nội dung khi kết thúc'),
      text('titleColor', 'Màu tiêu đề', 'colorOptional'),
      text('boxBackground', 'Màu nền ô đếm', 'color'),
      text('boxBorderColor', 'Màu viền ô đếm', 'colorOptional'),
      text('valueColor', 'Màu số đếm', 'color'),
      text('labelColor', 'Màu nhãn đơn vị', 'color'),
    ],
  },
  {
    type: 'popup', label: 'Popup', icon: '▱',
    defaults: {
      title: 'Thông báo', content: 'Nội dung popup', buttonText: 'Xem ngay', buttonUrl: '#',
      triggerType: 'delay', delay: '3', scrollPercent: '60', frequency: 'session',
      showLauncher: false, launcherLabel: 'Mở popup', width: '520', position: 'center',
      overlayColor: '#0f1118', overlayOpacity: '55', background: '#ffffff', textColor: '#16161a',
      closeOnOverlay: true, closeOnEscape: true, lockBodyScroll: true, showCloseButton: true,
      contentBlocks: [],
    },
    fields: [
      text('title', 'Tiêu đề dự phòng'), text('content', 'Nội dung dự phòng', 'textarea'),
      { name: 'contentBlocks', label: 'Nội dung trong popup', control: 'nestedBlocks' },
      text('buttonText', 'Nhãn nút dự phòng'), text('buttonUrl', 'URL nút dự phòng'),
      {
        name: 'triggerType', label: 'Điều kiện mở popup', control: 'select', options: [
          { label: 'Sau một khoảng thời gian', value: 'delay' },
          { label: 'Khi cuộn trang', value: 'scroll' },
          { label: 'Khi chuẩn bị rời trang', value: 'exit_intent' },
          { label: 'Chỉ mở bằng nút', value: 'manual' },
        ],
      },
      text('delay', 'Hiển thị sau (giây)', 'number'),
      text('scrollPercent', 'Mở khi cuộn đến (%)', 'number'),
      {
        name: 'frequency', label: 'Tần suất hiển thị', control: 'select', options: [
          { label: 'Mỗi lần tải trang', value: 'always' },
          { label: 'Một lần mỗi phiên', value: 'session' },
          { label: 'Một lần mỗi ngày', value: 'day' },
        ],
      },
      text('showLauncher', 'Hiển thị nút mở popup', 'checkbox'),
      text('launcherLabel', 'Nhãn nút mở popup'),
      text('width', 'Chiều rộng popup (px)', 'number'),
      {
        name: 'position', label: 'Vị trí popup', control: 'select', options: [
          { label: 'Giữa màn hình', value: 'center' },
          { label: 'Dưới bên phải', value: 'bottom-right' },
          { label: 'Dưới màn hình', value: 'bottom' },
        ],
      },
      text('overlayColor', 'Màu lớp phủ', 'color'), text('overlayOpacity', 'Độ mờ lớp phủ (%)', 'number'),
      text('background', 'Màu nền popup', 'color'), text('textColor', 'Màu chữ popup', 'color'),
      text('closeOnOverlay', 'Đóng khi click lớp phủ', 'checkbox'),
      text('closeOnEscape', 'Đóng bằng phím Escape', 'checkbox'),
      text('lockBodyScroll', 'Khóa cuộn trang khi mở', 'checkbox'),
      text('showCloseButton', 'Hiển thị nút đóng', 'checkbox'),
    ],
  },
  {
    type: 'tabs', label: 'Tabs', icon: '▰',
    defaults: {
      style: 'underline', tabTextColor: '#54545f', tabBackground: '',
      activeTabTextColor: '#6550d8', activeTabBackground: '#eee9ff',
      tabBorderColor: '#dedee8', panelBackground: '#ffffff', panelTextColor: '#211f1b',
      items: [
        { label: 'Tab 1', content: '<p>Nội dung tab 1</p>', blocks: [] },
        { label: 'Tab 2', content: '<p>Nội dung tab 2</p>', blocks: [] },
      ],
    },
    fields: [
      { name: 'style', label: 'Kiểu tab', control: 'select', options: [{ label: 'Gạch chân', value: 'underline' }, { label: 'Pill', value: 'pill' }, { label: 'Box', value: 'box' }] },
      text('tabTextColor', 'Màu chữ tab', 'color'),
      text('tabBackground', 'Màu nền tab', 'colorOptional'),
      text('activeTabTextColor', 'Màu chữ tab đang chọn', 'color'),
      text('activeTabBackground', 'Màu nền tab đang chọn', 'colorOptional'),
      text('tabBorderColor', 'Màu viền tab', 'color'),
      text('panelBackground', 'Màu nền vùng nội dung', 'colorOptional'),
      text('panelTextColor', 'Màu chữ vùng nội dung', 'color'),
      list('items', 'Danh sách tab', [
        text('label', 'Nhãn'),
        { name: 'blocks', label: 'Block trong tab', control: 'nestedBlocks' },
        text('content', 'Nội dung Rich Text dự phòng', 'richtext'),
      ], { label: 'Tab mới', content: '<p>Nội dung tab mới</p>', blocks: [] }),
    ],
  },
  {
    type: 'timeline', label: 'Timeline', icon: '↧',
    defaults: { title: 'Hành trình phát triển', items: [{ time: '2024', title: 'Khởi đầu', description: 'Bắt đầu hành trình.' }] },
    fields: [text('title', 'Tiêu đề'), list('items', 'Các mốc', [text('time', 'Thời gian'), text('title', 'Tiêu đề'), text('description', 'Mô tả', 'textarea')], { time: '2026', title: 'Mốc mới', description: '' })],
  },
  {
    type: 'customHtml', label: 'Custom HTML', icon: '</>',
    defaults: { html: '<div><strong>Nội dung HTML an toàn</strong></div>' },
    fields: [text('html', 'HTML (script và event sẽ bị loại bỏ)', 'textarea')],
  },
]
