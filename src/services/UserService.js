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

import { SUCCESS_CODE } from "@/configs";
import { arrayEmpty } from "@/utils/dataUtils";
import RequestUtils from "@/utils/RequestUtils";



const UserService = {
  allData: [],
  cacheItems: {},
  timeSheet: {
    Woff: {
      ot: 0, am: 0, pm: 0
    },
    businessTrip: {
      ot: 0, am: 0, pm: 0
    },
    Working: {
      ot: 0, am: 0, pm: 0
    },
    holiday: {
      ot: 0, am: 0, pm: 0
    },
    annualLeave: {
      ot: 0, am: 0, pm: 0
    }
  },
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
  },
  empty() {
    this.cacheItems = {};
  },
  fetchNameById(id) {
    return this.cacheItems[id]?.fullName ?? '(Unknow)';
  },
  fetchIdBySSoId(ssoId) {
    let userId = 0;
    for (let id in this.cacheItems) {
      if (this.cacheItems[id]?.ssoId === ssoId) {
        userId = id;
        break;
      }
    }
    return userId;
  },
  fetchSSoById(id) {
    if (!id) {
      return '';
    }
    return this.cacheItems[id]?.ssoId ?? '';
  },
  async fetchId(id) {
    if (!id) {
      return {};
    }
    if (this.cacheItems[id]) {
      return this.cacheItems[id];
    }
    const { data, errorCode } = await RequestUtils.Get("/user/find-id", { id });
    if (errorCode !== SUCCESS_CODE) {
      return [];
    }
    this.cacheItems[id] = data;
    return this.cacheItems[id];
  },
  async loadByIds(ids = []) {
    if (!ids || arrayEmpty(ids)) {
      return [];
    }
    let idNeedFetch = [], idResult = [];
    for (let id of ids) {
      if (!this.cacheItems[id]) {
        idNeedFetch.push(id);
      } else {
        idResult.push(id);
      }
    }
    let datas = [];
    if (arrayEmpty(idNeedFetch)) {
      for (let id of idResult) {
        datas.push(this.cacheItems[id]);
      }
      return datas;
    }
    const { data: embedded, errorCode } = await RequestUtils.Get("/user/list", { ids: idNeedFetch });
    if (errorCode !== SUCCESS_CODE || !Array.isArray(embedded)) {
      return [];
    }
    for (let item of embedded) {
      this.cacheItems[item.id] = item;
    }
    for (let id of ids) {
      datas.push(this.cacheItems[id]);
    }
    return datas;
  },
  async loadAll() {
    const { data: embedded, errorCode } = await RequestUtils.Get("/user/list");
    if (errorCode !== SUCCESS_CODE || !Array.isArray(embedded)) {
      return [];
    }
    for (let item of embedded) {
      this.cacheItems[item.id] = item;
    }
    return embedded;
  },
  timeSheetSumary(action, data) {
    this.timeSheet[action] = data;
  },
  timeSheetSetOt(action, minute) {
    let actions = ["Woff", "businessTrip", "Working", "holiday"]
    if (actions.includes(action)) {
      this.timeSheet[action]["ot"] += minute;
    }
  },
  addWorkday(am, pm) {
    this.timeSheet.Working.am += am;
    this.timeSheet.Working.pm += pm;
  },
  addWorkOff(am, pm) {
    this.timeSheet.Woff.am += am;
    this.timeSheet.Woff.pm += pm;
  },
  addBusinessTrip(am, pm) {
    this.timeSheet.businessTrip.am += am;
    this.timeSheet.businessTrip.pm += pm;
  },
  addHoliday(am, pm) {
    this.timeSheet.holiday.am += am;
    this.timeSheet.holiday.pm += pm;
  },
  addAnnualLeave(am, pm) {
    this.timeSheet.annualLeave.am += am;
    this.timeSheet.annualLeave.pm += pm;
  },
  getTimeSheetSumary() {
    return this.timeSheet;
  },
  timeSheetClear() {
    this.timeSheet = {
      Woff: {
        ot: 0, am: 0, pm: 0
      },
      businessTrip: {
        ot: 0, am: 0, pm: 0
      },
      Working: {
        ot: 0, am: 0, pm: 0
      },
      holiday: {
        ot: 0, am: 0, pm: 0
      },
      annualLeave: {
        ot: 0, am: 0, pm: 0
      }
    };
  }
}

export default UserService;