/**************************************************************************/
/*  localData.js                                                          */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import theme from '@/theme';
import mapKeys from 'lodash/mapKeys';
import {
  AudioOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FileZipOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';

export const ACTIVE_TYPES = [
  {
    value: 2,
    text: 'Kích hoạt',
    color: 'red',
    textColor: theme.color.error
  },
  {
    value: 1,
    text: 'Ngưng',
    color: 'green',
    textColor: theme.color.success
  }
];

export const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'tif', 'tiff'];

export const CHANNEL_SOURCE = [
  { 'id': 11, 'name': 'Web' },
  { 'id': 1, 'name': 'Facebook' },
  { 'id': 2, 'name': 'Zalo' },
  { 'id': 3, 'name': 'Hotline' },
  { 'id': 4, 'name': 'Trực tiếp' },
  { 'id': 5, 'name': 'Email' },
  { 'id': 6, 'name': 'MKT0D' },
  { 'id': 7, 'name': 'Giới thiệu' },
  { 'id': 8, 'name': 'Cskh' },
  { 'id': 9, 'name': 'Partner' },
  { 'id': 10, 'name': 'Shopee' }
];
export const CHANNEL_SOURCE_MAP_KEYS = mapKeys(CHANNEL_SOURCE, 'id');

export const CHANNEL_STATUS = [
  { 'id': 1, 'name': 'Chưa liên hệ' },
  { 'id': 2, 'name': 'Đã liên hệ' }
];
export const CHANNEL_STATUS_MAP_KEYS = mapKeys(CHANNEL_STATUS, 'id');

export const KPI_TYPE = [
  { text: 'Doanh số', value: 'doanhso' },
  { text: 'SQL', value: 'sql' },
  { text: 'Trafic', value: 'trafic' }
]
export const KPI_TYPE_MAP_KEYS = mapKeys(KPI_TYPE, 'value');

export const PAYMENT_TYPE_CONST = [
  { label: 'Tiền mặt', value: 6 },
  { label: 'Chuyển khoản MBbank', value: 1 },
  { label: 'Chuyển khoản TPbank', value: 7 },
  { label: 'COD Viettel', value: 2 },
  { label: 'Ví Momo', value: 3 },
  { label: 'Ví Vnpay', value: 4 },
  { label: 'Ncc thu hộ', value: 5 }
];

export const PRIORITY_TYPE_TAGS = [
  { text: 'Cao', value: 'cao', color: 'red' },
  { text: 'Trung bình', value: 'trungbinh', color: 'purple' },
  { text: 'Thấp', value: 'thap', color: 'green' }
];
export const PRIORITY_TYPE_TAGS_MAP_KEYS = mapKeys(
  PRIORITY_TYPE_TAGS,
  'value',
);

export const PRODUCT_STATUS = [
  { value: 0, text: 'Ngưng', color: 'red' },
  { value: 1, text: 'Kích hoạt', color: 'green' }
];

export const DEPARTMENT = [
  { value: 1, name: "IT", color: 'blue' },
  { value: 2, name: "Marketing", color: 'green' },
  { value: 3, name: "Kinhdoanh", color: 'purple' },
  { value: 4, name: "Khác", color: 'orange' }
];

export const CAR_WORK_TYPE = 1;
export const DEPARTMENT_MAP_KEYS_VALUE = mapKeys(DEPARTMENT, 'value');

export const PROJECT_STATUS_LIST = ['Not Started', 'In Progress', 'Completed', 'On Hold'];
export const PROJECT_TASK_STATUS_LIST = ['To Do', 'In Progress', 'Done', 'Cancelled'];

export const MATERIAL_UNIT_TYPE = [
  { value: "QUANTITY", name: "Số lượng" },
  { value: "DIMENSION", name: "Kích thước" },
  { value: "WEIGHT", name: "Trọng lượng" }
];



export const CAR_NOT_WORK_TYPE = 2;
export const REGISTER_WORK_TYPE = [
  { value: 1, text: 'Công tác có phí', color: 'green' },
  { value: 2, text: 'Công tác không phí', color: 'red' }
];

export const HOTEL_ROOM_PAY_TYPE_COMPANY = 1;
export const HOTEL_ROOM_PAY_TYPE_PERSIONAL = 2;
export const HOTEL_ROOM_PAY_TYPE = [
  { value: HOTEL_ROOM_PAY_TYPE_COMPANY, text: 'Công ty trả/company pay', color: 'green' },
  { value: HOTEL_ROOM_PAY_TYPE_PERSIONAL, text: 'Cá nhân tạm ứng/person pay', color: 'red' }
];

export const FLIGHT_WAY_TYPE_DEPARTURE = 1;
export const FLIGHT_WAY_TYPE_ARRIVAL = 2;
export const FLIGHT_WAY_TYPE = [
  { value: FLIGHT_WAY_TYPE_DEPARTURE, text: 'Chiều đi / Departure', color: 'green' },
  { value: FLIGHT_WAY_TYPE_ARRIVAL, text: 'Chiều về / Arrival', color: 'red' }
];

export const FILE_TYPES = [
  { value: 'pdf', IconCPN: FilePdfOutlined, color: theme.color.red },
  { value: 'ppt', IconCPN: FilePptOutlined, color: theme.color.pink },
  { value: 'pptx', IconCPN: FilePptOutlined, color: theme.color.pink },
  { value: 'doc', IconCPN: FileWordOutlined, color: theme.color.blue },
  { value: 'docx', IconCPN: FileWordOutlined, color: theme.color.blue },
  { value: 'xlsx', IconCPN: FileExcelOutlined, color: theme.color.green },
  { value: 'xls', IconCPN: FileExcelOutlined, color: theme.color.green },
  { value: 'csv', IconCPN: FileExcelOutlined, color: theme.color.green },
  { value: 'zip', IconCPN: FileZipOutlined, color: theme.color.violet },
  { value: 'zar', IconCPN: FileZipOutlined, color: theme.color.violet },
  { value: 'txt', IconCPN: FileTextOutlined, color: 'currentColor' },
  { value: 'mov', IconCPN: VideoCameraOutlined, color: 'currentColor' },
  { value: 'mp4', IconCPN: VideoCameraOutlined, color: 'currentColor' },
  { value: 'avi', IconCPN: VideoCameraOutlined, color: 'currentColor' },
  { value: 'flv', IconCPN: VideoCameraOutlined, color: 'currentColor' },
  { value: 'wmv', IconCPN: VideoCameraOutlined, color: 'currentColor' },
  { value: 'mp3', IconCPN: AudioOutlined, color: theme.color.lightGreen },
];
