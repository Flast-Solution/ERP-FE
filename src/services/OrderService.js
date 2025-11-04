/**************************************************************************/
/*  OrderService.js                                                       */
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

export const getWarehouseByProduct = (skuId, mProduct) => {
  if (arrayEmpty(mProduct?.warehouses)) {
    return []
  }
  let warehouseOptions = [];
  for (let warehouse of mProduct.warehouses) {
    if (skuId === warehouse.skuId) {
      warehouseOptions.push(warehouse);
    }
  }
  return warehouseOptions;
}

const OrderService = {
  allStatus: [],
  allService: [],
  getListOrderName() {
    return [
      { name: "Bán lẻ", color: "rgb(0, 176, 216)" },
      { name: "Dịch vụ", color: "rgb(55, 95, 206)" },
      { name: "Sản xuất", color: "rgb(242, 111, 33)" }
    ]
  },
  empty() {
    this.allStatus = [];
  },
  async fetchStatus() {
    if(arrayEmpty(this.allStatus)) {
      this.allStatus = await RequestUtils.GetAsList("/order-status/fetch");
    }
    return this.allStatus;
  },
  async fetchService() {
    if(arrayEmpty(this.allService)) {
      this.allService = await RequestUtils.GetAsList("/service/list");
    }
    return this.allService;
  },
  async viewInTable(response) {
    if (arrayEmpty(response.embedded)) {
      return response;
    }

    const listStatus = await this.fetchStatus();
    const getColorMeta = (item) => {
      return listStatus.find(i => i.id === item.status) ?? {};
    }

    for (let item of response.embedded) {
      const { details } = item;
      item.products = details.map((detail, id) => ({ id: id + 1, name: detail.productName }));
      item.detailstatus = details.map((detail, id) => ({ ...getColorMeta(detail), id: id + 1 }));
      delete item.details;
    }
    return { embedded: response.embedded, page: response.page };
  },
  async getOrderOnEdit(orderId) {
    let response = { customer: null, order: null, data: [] };
    if (!orderId) {
      return response;
    }
    let { data, errorCode } = await RequestUtils.Get("/order/view-on-edit", { orderId });
    if (errorCode !== SUCCESS_CODE || arrayEmpty(data.data)) {
      return response;
    }
    let details = data.data;
    const pIds = details.map(i => i.productId).join(",");
    const { data: products, errorCode: eCode } = await RequestUtils.Get("/product/fetch", { ids: pIds });
    if (eCode !== SUCCESS_CODE || arrayEmpty(products.embedded)) {
      return response;
    }
    for (let detail of details) {
      let mProduct = (products.embedded ?? []).find(item => item.id === detail.productId);
      detail.warehouseOptions = getWarehouseByProduct(detail.skuId, mProduct);
      if (arrayEmpty(detail.warehouseOptions)) {
        continue;
      }
      let [warehouse] = detail.warehouseOptions;
      detail.warehouse = warehouse?.stockName ?? '';
      detail.stock = warehouse?.quantity ?? 0;
    }
    return data;
  },
  statusName(sId) {
    return this.allStatus.find(i => i.id === sId)?.name ?? '';
  },
  statusColor(sId) {
    return this.allStatus.find(i => i.id === sId)?.color ?? 'black';
  }
}

export default OrderService;