/**************************************************************************/
/*  index.js                                                              */
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

export const SUCCESS_CODE = 200;
export const GATE_EVN = {
  Loc: 'http://127.0.0.1:9765',
  Pro: 'https://open.api.flast.vn',
  Web: 'https://flast-vn',
  AiA: 'https://service.aicuatui.vn'
};

export const GATEWAY = GATE_EVN['Loc'];
export const CHANGE_STORE = 'CHANGE_STORE';
export const UPLOAD_PATH = GATEWAY + '/uploads';

export const API = {
  SINGIN: '/auth/login'
};

export const ACTIONS = {
  ADD_USER: 'add__user',
  REMOVE_USER: 'remove__user',
  TOOGLE_COLLAPSE: 'tg_cll',
  F5_LIST: 'f5_list'
};

export const INAPP_NOTIFICATION_EMITTER = 'in_app_noti';
export const EVENT_ACCEPT_IMAGE_TYPES = '.png, .jpeg, .jpg';
export const HASH_MODAL = '#modal';
export const HASH_MODAL_CLOSE = '#close-modal';
export const DEFAULT_INBOX_ID = 'inbox';
export const DEFAULT_PARENT_INBOX_ID = 'parent';
export const FORMAT_DATE_INPUT = 'DD-MM-YYYY';
export const FORMAT_DATE_TIME_INPUT = 'DD-MM-YYYY HH:mm';
export const FORMAT_TIME_INPUT = 'HH:mm';
export const MAX_FILE_SIZE_MB = 3;
export const REPORT_DATE_FORMAT = 'YYYY-MM-DD';
export const CURRENCY_UNIT = 'VND';
export const EMBED_YOUTUBE_LINK = '//www.youtube.com/embed/';
export const DEFAULT_COLOR_VALUE = '#ffffff';
export const outerRadius = 143 / 2;
