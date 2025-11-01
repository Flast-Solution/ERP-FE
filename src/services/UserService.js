/**************************************************************************/
/*  UserService.js                                                        */
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
import { arrayEmpty } from "utils/dataUtils";
import RequestUtils from "utils/RequestUtils";

const UserService = {
  async findId(id) {
    const { data, errorCode, message } = await RequestUtils.Get("/user/find-id", { id });
    if (errorCode === SUCCESS_CODE) {
      return [null, data];
    }
    return [message, null];
  },
  async mapId2Name(ids = []) {
    let users = await RequestUtils.GetAsList("/user/list-name-id", { ids });
    if (arrayEmpty(users)) {
      return {};
    }
    return Object.fromEntries(users.map(item => [item.id, item.name]));
  }
}

export default UserService;