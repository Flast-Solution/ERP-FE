/**************************************************************************/
/*  WarehouseService.js                                                   */
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

import { SUCCESS_CODE } from "configs";
import { decodeProperty } from "utils/dataUtils";
import RequestUtils from "utils/RequestUtils";

const WarehouseService = {
  allStatus: [],
  empty() {
    this.allStatus = [];
  },
  async hashSku(sku) {
    const encoder = new TextEncoder();
    const data = encoder.encode(sku);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
  async fetch(filter = {}) {
    const { data, errorCode } = await RequestUtils.Get("/warehouse/fetch", filter);
    if (errorCode !== SUCCESS_CODE) {
      return { embedded: [], page: {} };
    }
    const { embedded, page } = data;
    decodeProperty(embedded, ['skuInfo']);
    return { embedded, page };
  }
}

export default WarehouseService;