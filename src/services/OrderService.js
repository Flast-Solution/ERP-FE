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

import { SUCCESS_CODE } from "@/configs";
import { RequestUtils, arrayEmpty } from '@flast-erp/core/utils';

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

const normalizeOrderCustomer = (order, customer) => {
  if (customer && typeof customer === 'object') return customer;
  if (!order?.customerId) return null;
  return {
    id: order.customerId,
    fullName: order.customerReceiverName,
    name: order.customerReceiverName,
    mobilePhone: order.customerMobilePhone,
    email: order.customerEmail,
    address: order.customerAddress,
    note: order.customerNote
  };
}

const normalizeOrderDetail = (detail, product, order) => {
  const selectedSku = (product?.skus ?? []).find(
    sku => String(sku?.id) === String(detail?.skuId)
  );
  const price = Number(detail?.price ?? 0);
  const quantity = Number(detail?.quantity ?? 0);
  const discountAmount = Number(detail?.priceOff ?? detail?.discountAmount ?? 0);
  const originalAmount = price * quantity;
  const currency = detail?.currency ?? order?.currency ?? 'VND';
  const exchangeRate = Number(detail?.exchangeRate ?? order?.exchangeRate ?? 1);
  const responseTotal = detail?.total ?? detail?.totalPrice ?? originalAmount;
  const convertedTotal = detail?.total != null || currency !== 'USD'
    ? Number(responseTotal)
    : Math.round(Number(responseTotal) * exchangeRate);

  return {
    ...detail,
    key: detail?.key ?? detail?.code ?? String(detail?.id),
    detailId: detail?.detailId ?? detail?.id,
    orderName: detail?.orderName ?? detail?.name ?? '',
    dayQuote: detail?.dayQuote ?? null,
    productCode: detail?.productCode ?? product?.code ?? null,
    productName: detail?.productName ?? product?.name ?? '',
    unit: detail?.unit ?? product?.unit ?? '(Chưa có)',
    mSkuDetails: detail?.mSkuDetails ?? detail?.skuDetails ?? [],
    price,
    quantity,
    discountAmount,
    discountRate: Number(detail?.discountRate ?? (
      originalAmount > 0 ? (discountAmount / originalAmount) * 100 : 0
    )),
    // `view-on-edit` trả `totalPrice` theo loại tiền gốc; response lưu mới
    // trả `total` đã quy đổi. Chỉ nhân tỷ giá khi `total` chưa có.
    totalPrice: convertedTotal,
    productPrice: Number(product?.price ?? product?.priceRef ?? price),
    skuPrices: selectedSku?.skuPrices ?? [],
    currency,
    exchangeRate,
    editable: false,
    warehouseOptions: getWarehouseByProduct(detail?.skuId, product)
  };
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
      this.allStatus = await RequestUtils.GetAsList("/erp/order-status/fetch");
    }
    return this.allStatus;
  },
  async fetchService() {
    if(arrayEmpty(this.allService)) {
      this.allService = await RequestUtils.GetAsList("/erp/service/list");
    }
    return this.allService;
  },
  async viewInTable(response) {
    if (arrayEmpty(response.embedded)) {
      return response;
    }

    const listStatus = await this.fetchStatus();
    const getColorMeta = (item) => {
      if (Number(item?.status) === 0) {
        return { name: 'Tạo mới' };
      }
      return listStatus.find(i => String(i.id) === String(item?.status)) ?? {};
    }

    for (let item of response.embedded) {
      const { details } = item;
      item.products = details.map((detail, id) => ({ id: id + 1, name: detail.productName }));
      item.detailstatus = details.map((detail, id) => ({ ...getColorMeta(detail), id: id + 1 }));
      // Keep details for creating batch inspection
      // delete item.details;
    }
    return { embedded: response.embedded, page: response.page };
  },
  async getOrderOnEdit(orderId) {
    const response = { customer: null, order: null, data: [] };
    if (!orderId) {
      return response;
    }
    const { data: payload, errorCode } = await RequestUtils.Get("/erp/order/view-on-edit", { orderId });
    if (errorCode !== SUCCESS_CODE || !payload) {
      return response;
    }

    const order = payload?.order && typeof payload.order === 'object'
      ? payload.order
      : payload;
    const details = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(order?.details)
        ? order.details
        : [];
    const customer = normalizeOrderCustomer(order, payload?.customer);

    console.log('[OpportunityEdit][1. API response]', {
      orderId,
      currency: order?.currency,
      exchangeRate: order?.exchangeRate,
      subtotal: order?.subtotal,
      total: order?.total,
      details: details.map(detail => ({
        id: detail?.id,
        price: detail?.price,
        quantity: detail?.quantity,
        priceOff: detail?.priceOff,
        discountAmount: detail?.discountAmount,
        total: detail?.total,
        totalPrice: detail?.totalPrice
      }))
    });

    if (arrayEmpty(details)) {
      return { customer, order, data: [] };
    }

    const pIds = details.map(item => item?.productId).filter(Boolean).join(",");
    let productItems = [];
    if (pIds) {
      try {
        const { data: products, errorCode: productErrorCode } = await RequestUtils.Get(
          "/erp/product/fetch",
          { ids: pIds }
        );
        if (productErrorCode === SUCCESS_CODE) {
          productItems = products?.embedded ?? [];
        }
      } catch (_) {
        productItems = [];
      }
    }

    const normalizedDetails = details.map(detail => {
      const product = productItems.find(
        item => String(item?.id) === String(detail?.productId)
      );
      const normalizedDetail = normalizeOrderDetail(detail, product, order);
      if (!arrayEmpty(normalizedDetail.warehouseOptions)) {
        const [warehouse] = normalizedDetail.warehouseOptions;
        normalizedDetail.warehouse = warehouse?.stockName ?? '';
        normalizedDetail.stock = warehouse?.quantity ?? 0;
      }
      return normalizedDetail;
    });

    console.log('[OpportunityEdit][2. Normalized]', {
      orderId,
      currency: order?.currency,
      exchangeRate: order?.exchangeRate,
      details: normalizedDetails.map(detail => ({
        id: detail?.id,
        detailId: detail?.detailId,
        price: detail?.price,
        quantity: detail?.quantity,
        discountAmount: detail?.discountAmount,
        total: detail?.total,
        totalPrice: detail?.totalPrice,
        currency: detail?.currency,
        exchangeRate: detail?.exchangeRate
      }))
    });

    return { customer, order, data: normalizedDetails };
  },
  statusName(sId) {
    return this.allStatus.find(i => i.id === sId)?.name ?? '';
  },
  statusColor(sId) {
    return this.allStatus.find(i => i.id === sId)?.color ?? 'black';
  }
}

export default OrderService;
