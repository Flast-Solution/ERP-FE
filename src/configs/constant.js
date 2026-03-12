/**************************************************************************/
/*  constant.js                                                           */
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

export const QUERY_PARAMS_PROPERTY = {
  outsideFilter: 'outsideFilter',
  filters: 'filters',
  extraFilters: 'extraFilters'
}

export const MAX_FILE_SIZE_MB = 3;
export const VAT_PERCENT = 8;
export const HASH_MODAL = "#modal";
export const FORMAT_TIME_INPUT = 'HH:mm';
export const HASH_POPUP = "HASH_POPUP";
export const HASH_POPUP_CLOSE = "HASH_POPUP_CLOSE"
export const FORMAT_DATE_INPUT = 'DD-MM-YYYY';
export const CURRENCY_UNIT = 'VND';

export const STATUS_LEAD = {
  CREATE_DATA: 0,
  DO_NOT_MANUFACTORY: 1,
  IS_CONTACT: 2,
  CONTACT_LATER: 6,
  KO_LIEN_HE_DUOC: 4,
  THANH_CO_HOI: 7
}

export const getStatusLead = (option) => {
  switch (option) {
    case STATUS_LEAD.CREATE_DATA:
      return ' Chưa liên hệ';
    case STATUS_LEAD.DO_NOT_MANUFACTORY:
      return 'Không triển khai';
    case STATUS_LEAD.IS_CONTACT:
      return ' Đang tư vấn';
    case STATUS_LEAD.CONTACT_LATER:
      return 'Liên hệ sau';
    case STATUS_LEAD.KO_LIEN_HE_DUOC:
      return 'Không liên hệ được';
    case STATUS_LEAD.THANH_CO_HOI:
      return 'Thành cơ hội';
    default:
      return 'N/A';
  }
}

export const getColorStatusLead = (option) => {
  switch (option) {
    case STATUS_LEAD.CREATE_DATA:
      return '#f50';
    case STATUS_LEAD.DO_NOT_MANUFACTORY:
      return '#2db7f5';
    case STATUS_LEAD.IS_CONTACT:
      return '#87d068';
    case STATUS_LEAD.CONTACT_LATER:
      return '#108ee9';
    case STATUS_LEAD.KO_LIEN_HE_DUOC:
      return 'red';
    case STATUS_LEAD.THANH_CO_HOI:
      return 'green';
    default:
      return 'black';
  }
}

export const getTypeGroup = (option) => {
  switch (option) {
    case 1:
      return 'Sale';
    case 2:
      return 'Chăm sóc khách hàng';
    case 3:
      return 'MarkeTing';
    case 4:
      return 'Kho';
    default:
      return 'N/A';
  }
}

/**************************************************************************/

export const SUCCESS_API_CODE = 200;

export const NGHI_PHEP_META = [
    { id: 1, name: 'Nghỉ phép năm (Annual Leave)' },
    { id: 2, name: 'Nghỉ không lương (Unpaid Absence)' },
    { id: 3, name: 'Nghỉ theo chính sách phúc lợi của công ty (Leave According To Company Welfare Policy)' },
    { id: 4, name: 'Nghỉ ốm hưởng BHXH (Sick Leave With Social Insurance)' },
    { id: 5, name: 'Lý do khác (Other Reasons)' },
]

export const OVERTIME_META = [
    { id: 1, name: 'Làm thêm giờ' },
    { id: 2, name: 'Làm thêm vào ngày nghỉ' }
]

export const NGHI_PHEP_STATUS_WAITING = 0;
export const NGHI_PHEP_STATUS_CONFIRM = 1;
export const NGHI_PHEP_STATUS_DONE = 2;
export const NGHI_PHEP_STATUS_REJECT = 3;

export const APP_FOLLOW_STATUS_WAITING = 0;
export const APP_FOLLOW_STATUS_CONFIRM = 1;
export const APP_FOLLOW_STATUS_DONE = 2;
export const APP_FOLLOW_STATUS_REJECT = 3;

export const NGHI_PHEP_STATUS_TEXT = [
    { id: NGHI_PHEP_STATUS_WAITING, name: 'Chờ xác nhận (Waiting For Confirmation)' },
    { id: NGHI_PHEP_STATUS_CONFIRM, name: 'Xác nhận (Confirm)' },
    { id: NGHI_PHEP_STATUS_DONE, name: 'Duyệt (Approve)' },
    { id: NGHI_PHEP_STATUS_REJECT, name: 'Không đồng ý (Refuse)' }
]

export const APP_STATUS_TEXT = NGHI_PHEP_STATUS_TEXT;
