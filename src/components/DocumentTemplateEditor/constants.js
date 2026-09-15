import {
  BarcodeOutlined,
  CalendarOutlined,
  EditOutlined,
  FileImageOutlined,
  FontSizeOutlined,
  MinusOutlined,
  PicCenterOutlined,
  QrcodeOutlined,
  TableOutlined,
  AppstoreOutlined,
  FileTextOutlined,
} from '@ant-design/icons'

export const DOCUMENT_SCHEMA_VERSION = 3
export const DOCUMENT_CANVAS_ID = 'document-template-canvas'

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'quotation', label: 'Chứng từ báo giá' },
  { value: 'goods_issue', label: 'Chứng từ xuất hàng' },
  { value: 'invoice', label: 'Chứng từ hoá đơn' },

]

export const COMPONENT_TYPES = {
  TEXT: 'text',
  DATA_FIELD: 'dataField',
  MANUAL_FIELD: 'manualField',
  TABLE: 'dynamicTable',
  IMAGE: 'image',
  QR_CODE: 'qrCode',
  BARCODE: 'barcode',
  DATE: 'date',
  RECTANGLE: 'rectangle',
  LINE: 'line',
  LOGO: 'logo',
  DIVIDER: 'divider',
  SIGNATURE: 'signature',
  CONTAINER: 'container',
  RICH_TEXT: 'richText',
}

export const COMPONENT_PALETTE = [
  { type: COMPONENT_TYPES.TEXT, label: 'Văn bản', icon: FontSizeOutlined },
  { type: COMPONENT_TYPES.RICH_TEXT, label: 'Nội dung nâng cao', icon: FileTextOutlined },
  { type: COMPONENT_TYPES.CONTAINER, label: 'Container / Grid', icon: AppstoreOutlined },
  { type: COMPONENT_TYPES.DATA_FIELD, label: 'Trường dữ liệu', icon: PicCenterOutlined },
  { type: COMPONENT_TYPES.MANUAL_FIELD, label: 'Trường nhập tay', icon: EditOutlined },
  { type: COMPONENT_TYPES.TABLE, label: 'Bảng dữ liệu', icon: TableOutlined },
  { type: COMPONENT_TYPES.IMAGE, label: 'Hình ảnh', icon: FileImageOutlined },
  { type: COMPONENT_TYPES.LOGO, label: 'Logo', icon: FileImageOutlined },
  { type: COMPONENT_TYPES.QR_CODE, label: 'QR Code', icon: QrcodeOutlined },
  { type: COMPONENT_TYPES.BARCODE, label: 'Barcode', icon: BarcodeOutlined },
  { type: COMPONENT_TYPES.DATE, label: 'Ngày tháng', icon: CalendarOutlined },
  { type: COMPONENT_TYPES.RECTANGLE, label: 'Khung', icon: PicCenterOutlined },
  { type: COMPONENT_TYPES.LINE, label: 'Đường thẳng', icon: MinusOutlined },
  { type: COMPONENT_TYPES.DIVIDER, label: 'Phân cách', icon: MinusOutlined },
  { type: COMPONENT_TYPES.SIGNATURE, label: 'Chữ ký', icon: EditOutlined },
]

export const DEFAULT_STYLE = {
  fontFamily: 'Times New Roman',
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.4,
  textAlign: 'left',
  color: '#1f2937',
  backgroundColor: 'transparent',
  borderColor: '#d9d9d9',
  borderWidth: 0,
  borderRadius: 0,
  padding: 8,
  marginBottom: 8,
}

export const DEFAULT_NODE_LAYOUT = {
  columnSpan: 12,
  rowSpan: 1,
  minHeight: null,
  startNewRow: false,
}

export const COLUMN_SPAN_OPTIONS = [
  { value: 3, label: '25%' },
  { value: 4, label: '33%' },
  { value: 6, label: '50%' },
  { value: 8, label: '66%' },
  { value: 9, label: '75%' },
  { value: 12, label: '100%' },
]

export const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
]

export const ALIGN_OPTIONS = [
  { value: 'left', label: 'Trái' },
  { value: 'center', label: 'Giữa' },
  { value: 'right', label: 'Phải' },
]

export const FORMAT_OPTIONS = [
  { value: 'text', label: 'Văn bản' },
  { value: 'number', label: 'Số' },
  { value: 'currency', label: 'Tiền tệ' },
  { value: 'number_en', label: 'Số (4,867)' },
  { value: 'decimal_en', label: 'USD (8,906.61)' },
  { value: 'date', label: 'Ngày tháng' },
]
