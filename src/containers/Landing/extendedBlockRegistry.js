const text = (name, label, control = 'text') => ({ name, label, control })
const actionFields = [
  text('buttonText', 'Nhãn nút'),
  text('buttonUrl', 'URL của nút'),
  text('buttonOpenInNewTab', 'Mở trong tab mới', 'checkbox'),
]
const list = (name, label, itemFields, itemDefaults) => ({
  name, label, control: 'repeater', itemFields, itemDefaults,
})

const contentListBlock = ({ type, label, icon, entity }) => ({
  type,
  label,
  icon,
  defaults: {
    title: label,
    description: '',
    entity,
    emptyText: 'Chưa có dữ liệu để hiển thị.',
    items: [
      { title: `${label} mẫu 1`, description: 'Dữ liệu xem trước', imageUrl: '', url: '#' },
      { title: `${label} mẫu 2`, description: 'Dữ liệu xem trước', imageUrl: '', url: '#' },
    ],
  },
  fields: [
    text('title', 'Tiêu đề'),
    text('description', 'Mô tả', 'textarea'),
    text('entity', 'Mã nguồn dữ liệu'),
    text('emptyText', 'Nội dung khi trống'),
    list('items', 'Dữ liệu xem trước', [
      text('title', 'Tiêu đề'),
      text('description', 'Mô tả', 'textarea'),
      { name: 'imageUrl', label: 'Hình ảnh', control: 'image', uploadFolder: `landing/${type}` },
      text('url', 'Liên kết'),
    ], { title: 'Mục mới', description: '', imageUrl: '', url: '#' }),
  ],
})

export const EXTENDED_LANDING_BLOCKS = [
  {
    type: 'container', label: 'Container', icon: '□',
    defaults: { title: 'Nội dung trong container', content: 'Nhập nội dung...', maxWidth: '1120', padding: '32', background: '#ffffff' },
    fields: [text('title', 'Tiêu đề'), text('content', 'Nội dung', 'textarea'), text('maxWidth', 'Độ rộng tối đa (px)', 'number'), text('padding', 'Khoảng đệm (px)', 'number'), text('background', 'Màu nền', 'color')],
  },
  {
    type: 'columns', label: 'Hàng và cột', icon: '▥',
    defaults: {
      gap: '20',
      columns: [
        { width: '50', title: 'Cột thứ nhất', content: 'Nội dung cột thứ nhất', buttonText: '', buttonUrl: '#' },
        { width: '50', title: 'Cột thứ hai', content: 'Nội dung cột thứ hai', buttonText: '', buttonUrl: '#' },
      ],
    },
    fields: [
      text('gap', 'Khoảng cách cột (px)', 'number'),
      list('columns', 'Danh sách cột', [text('width', 'Độ rộng (%)', 'number'), text('title', 'Tiêu đề'), text('content', 'Nội dung', 'textarea'), ...actionFields.slice(0, 2)], { width: '50', title: 'Cột mới', content: '', buttonText: '', buttonUrl: '#' }),
    ],
  },
  {
    type: 'richText', label: 'Rich text', icon: '¶',
    defaults: { html: '<h2>Tiêu đề nội dung</h2><p>Soạn nội dung có định dạng tại đây.</p>' },
    fields: [text('html', 'Nội dung', 'richtext')],
  },
  {
    type: 'cta', label: 'CTA', icon: '◎',
    defaults: { title: 'Sẵn sàng bắt đầu?', description: 'Liên hệ với chúng tôi để được tư vấn.', buttonText: 'Liên hệ ngay', buttonUrl: '/contact', buttonOpenInNewTab: false, background: '#f3f0ff' },
    fields: [text('title', 'Tiêu đề'), text('description', 'Mô tả', 'textarea'), ...actionFields, text('background', 'Màu nền', 'color')],
  },
  {
    type: 'contactForm', label: 'Form liên hệ', icon: '✉',
    defaults: {
      title: 'Liên hệ với chúng tôi', submitText: 'Gửi liên hệ', successMessage: 'Cảm ơn bạn đã liên hệ.',
      fields: [
        { label: 'Họ và tên', name: 'fullName', type: 'text', placeholder: 'Nhập họ và tên', required: true },
        { label: 'Email', name: 'email', type: 'email', placeholder: 'name@example.com', required: true },
        { label: 'Nội dung', name: 'message', type: 'textarea', placeholder: 'Nhập nội dung', required: false },
      ],
    },
    fields: [text('title', 'Tiêu đề'), text('submitText', 'Nhãn nút gửi'), text('successMessage', 'Thông báo thành công'), list('fields', 'Các trường', [text('label', 'Nhãn'), text('name', 'Tên field'), { name: 'type', label: 'Kiểu', control: 'select', options: ['text', 'email', 'tel', 'textarea'].map(value => ({ label: value, value })) }, text('placeholder', 'Placeholder'), text('required', 'Bắt buộc', 'checkbox')], { label: 'Trường mới', name: 'field', type: 'text', placeholder: '', required: false })],
  },
  {
    type: 'leadForm', label: 'Form thu lead', icon: '⌁',
    defaults: { title: 'Đăng ký nhận tư vấn', submitText: 'Đăng ký', source: 'LANDING_PAGE', fields: [{ label: 'Số điện thoại', name: 'mobile', type: 'tel', placeholder: 'Nhập số điện thoại', required: true }] },
    fields: [text('title', 'Tiêu đề'), text('source', 'Nguồn lead'), text('submitText', 'Nhãn nút gửi'), list('fields', 'Các trường', [text('label', 'Nhãn'), text('name', 'Tên field'), { name: 'type', label: 'Kiểu', control: 'select', options: ['text', 'email', 'tel', 'textarea'].map(value => ({ label: value, value })) }, text('placeholder', 'Placeholder'), text('required', 'Bắt buộc', 'checkbox')], { label: 'Trường mới', name: 'field', type: 'text', placeholder: '', required: false })],
  },
  {
    type: 'video', label: 'Video', icon: '▶',
    defaults: { url: '', title: 'Video giới thiệu', aspectRatio: '16/9', autoplay: false },
    fields: [text('url', 'URL video'), text('title', 'Tiêu đề'), { name: 'aspectRatio', label: 'Tỷ lệ', control: 'select', options: [{ label: '16:9', value: '16/9' }, { label: '4:3', value: '4/3' }, { label: '1:1', value: '1/1' }] }, text('autoplay', 'Tự động phát', 'checkbox')],
  },
  {
    type: 'gallery', label: 'Thư viện ảnh', icon: '▦',
    defaults: { title: 'Thư viện ảnh', columns: '3', images: [] },
    fields: [text('title', 'Tiêu đề'), text('columns', 'Số cột', 'number'), { name: 'images', label: 'Danh sách ảnh', control: 'multiImage' }],
  },
  {
    type: 'faq', label: 'FAQ / Accordion', icon: '?',
    defaults: { title: 'Câu hỏi thường gặp', items: [{ question: 'Sản phẩm phù hợp với ai?', answer: 'Nội dung trả lời câu hỏi.' }] },
    fields: [text('title', 'Tiêu đề'), list('items', 'Câu hỏi', [text('question', 'Câu hỏi'), text('answer', 'Trả lời', 'textarea')], { question: 'Câu hỏi mới', answer: '' })],
  },
  {
    type: 'testimonials', label: 'Đánh giá khách hàng', icon: '★',
    defaults: { title: 'Khách hàng nói gì', items: [{ name: 'Nguyễn Văn A', role: 'Khách hàng', quote: 'Trải nghiệm rất tốt.', avatar: '' }] },
    fields: [text('title', 'Tiêu đề'), list('items', 'Đánh giá', [text('name', 'Tên'), text('role', 'Chức danh'), text('quote', 'Nội dung', 'textarea'), { name: 'avatar', label: 'Ảnh đại diện', control: 'image', uploadFolder: 'landing/testimonials' }], { name: 'Khách hàng', role: '', quote: '', avatar: '' })],
  },
  {
    type: 'logos', label: 'Logo đối tác', icon: '◇',
    defaults: { title: 'Đối tác của chúng tôi', images: [] },
    fields: [text('title', 'Tiêu đề'), { name: 'images', label: 'Danh sách logo', control: 'multiImage' }],
  },
  {
    type: 'stats', label: 'Số liệu thống kê', icon: '#',
    defaults: { items: [{ value: '1.000+', label: 'Khách hàng' }, { value: '99%', label: 'Hài lòng' }, { value: '24/7', label: 'Hỗ trợ' }] },
    fields: [list('items', 'Số liệu', [text('value', 'Giá trị'), text('label', 'Nhãn')], { value: '100+', label: 'Chỉ số mới' })],
  },
  {
    type: 'map', label: 'Bản đồ', icon: '⌖',
    defaults: { title: 'Địa chỉ của chúng tôi', embedUrl: '', address: 'Nhập địa chỉ doanh nghiệp', height: '360' },
    fields: [text('title', 'Tiêu đề'), text('address', 'Địa chỉ'), text('embedUrl', 'Google Maps embed URL'), text('height', 'Chiều cao (px)', 'number')],
  },
  {
    type: 'social', label: 'Mạng xã hội', icon: '@',
    defaults: { title: 'Kết nối với chúng tôi', links: [{ label: 'Facebook', url: 'https://facebook.com' }] },
    fields: [text('title', 'Tiêu đề'), list('links', 'Liên kết', [text('label', 'Tên mạng xã hội'), text('url', 'URL')], { label: 'Mạng xã hội', url: '#' })],
  },
  contentListBlock({ type: 'productList', label: 'Sản phẩm / Dịch vụ', icon: '▣', entity: 'product' }),
  contentListBlock({ type: 'postList', label: 'Danh sách bài viết', icon: '▤', entity: 'post' }),
  contentListBlock({ type: 'teamList', label: 'Danh sách nhân sự', icon: '♙', entity: 'user' }),
  {
    type: 'countdown', label: 'Countdown', icon: '◷',
    defaults: { title: 'Ưu đãi kết thúc sau', targetDate: '2026-12-31T23:59', completedText: 'Chương trình đã kết thúc' },
    fields: [text('title', 'Tiêu đề'), text('targetDate', 'Thời điểm kết thúc'), text('completedText', 'Nội dung khi kết thúc')],
  },
  {
    type: 'popup', label: 'Popup', icon: '▱',
    defaults: { title: 'Thông báo', content: 'Nội dung popup', buttonText: 'Xem ngay', buttonUrl: '#', delay: '3' },
    fields: [text('title', 'Tiêu đề'), text('content', 'Nội dung', 'textarea'), text('buttonText', 'Nhãn nút'), text('buttonUrl', 'URL'), text('delay', 'Hiển thị sau (giây)', 'number')],
  },
  {
    type: 'tabs', label: 'Tabs', icon: '▰',
    defaults: { items: [{ label: 'Tab 1', content: 'Nội dung tab 1' }, { label: 'Tab 2', content: 'Nội dung tab 2' }] },
    fields: [list('items', 'Danh sách tab', [text('label', 'Nhãn'), text('content', 'Nội dung', 'textarea')], { label: 'Tab mới', content: '' })],
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
