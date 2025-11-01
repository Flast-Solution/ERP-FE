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

import theme from 'theme';
import mapKeys from 'lodash/mapKeys';

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
export const DEPARTMENT_MAP_KEYS_VALUE = mapKeys(DEPARTMENT, 'value');

export const PROJECT_STATUS_LIST = ['Not Started', 'In Progress', 'Completed', 'On Hold'];
export const PROJECT_TASK_STATUS_LIST = ['To Do', 'In Progress','Done','Cancelled'];

export const MATERIAL_UNIT_TYPE = [
  { value: "QUANTITY", name: "Số lượng" },
  { value: "DIMENSION", name: "Kích thước" },
  { value: "WEIGHT", name: "Trọng lượng" }
];
