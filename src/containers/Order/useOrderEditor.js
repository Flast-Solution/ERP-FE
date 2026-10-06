import { useCallback, useMemo, useState } from 'react';
import { message } from 'antd';
import _ from 'lodash';
import { arrayNotEmpty, RequestUtils, InAppEvent } from '@flast-erp/core/utils';
import { useEffectAsync } from '@flast-erp/core/hooks';
import { HASH_MODAL, SUCCESS_CODE } from '@/configs';
import { HASH_POPUP } from '@/configs/constant';
import OrderService, { getWarehouseByProduct } from '@/services/OrderService';
import { mergeSavedOrderLines } from './orderLine';
import { resolveOrderSkuDetails } from './orderSku';
import { calculateUsdLineTotal, calculateEditorLine } from './orderPricing';
import { CURRENCY_USD, getExchangeRate, findSkuById, resolveUnitPrice, updateOrderLine } from './orderEditorModel';
import { buildOrderEditorPayload } from './orderEditorPayload';
import { formatOrderCurrency as formatCurrencyAmount } from './orderFormatting';
const ORDER_TEMPLATE = {
  key: "1",
  note: "",
  detailId: null,
  code: "",
  dayQuote: null,
  productId: null,
  productCode: "",
  productName: "",
  skuId: "",
  unit: "(Chưa có)",
  warrantyPeriod: "(Chưa có)",
  quantity: 1,
  price: 0,
  productPrice: 0,
  totalPrice: 0,
  warehouse: "",
  stock: 0,
  discountRate: 0,
  discountAmount: 0,
  profit: 0,
  status: 0,
  editable: false,
  mSkuDetails: [],
  orderLine: {}
}

function getLeadProducts(lead = {}) {
  const productIds = Array.isArray(lead?.productIds)
    ? lead.productIds
    : (lead?.productId != null ? [lead.productId] : []);
  const productNames = Array.isArray(lead?.productNames)
    ? lead.productNames
    : (lead?.productName ? [lead.productName] : []);

  return productIds
    .filter(productId => productId != null)
    .map((productId, index) => ({
      id: productId,
      name: productNames[index] || `Sản phẩm #${productId}`,
    }));
}

function randomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const useOrderEditor = ({ orderId, dataId, business, onSaveSuccess, restrictOrderFields }) => {
  const [lineItems, setData] = useState([]);
  const [customer, setCustomer] = useState();
  const [leadProducts, setLeadProducts] = useState([]);

  const [localOrder, setLocalOrder] = useState({ orderId, reload: false });
  const [customerOrder, setCustomerOrder] = useState();
  const [shippingCost, setShippingCost] = useState(0);
  const currency = CURRENCY_USD;
  const [exchangeRate, setExchangeRate] = useState(1);
  const [vatRate, setVatRate] = useState(0);
  const [calculationFormula, setCalculationFormula] = useState('');

  const data = useMemo(() => lineItems.map(line => calculateEditorLine(line, {
    currency, exchangeRate, shippingCost, formula: calculationFormula,
  })), [lineItems, calculationFormula, currency, exchangeRate, shippingCost]);

  useEffectAsync(async () => {
    const { data: configs, errorCode } = await RequestUtils.Get('/erp/config/fetch', {
      limit: 10,
      page: 1,
      key: 'CACULATOR_TOTAL'
    });
    if (errorCode !== SUCCESS_CODE || !Array.isArray(configs)) {
      return;
    }
    const config = configs.find(item => item?.key === 'CACULATOR_TOTAL');
    setCalculationFormula(typeof config?.value === 'string' ? config.value.trim() : '');
  }, []);

  useEffectAsync(async () => {
    const { customer, order, data } = await OrderService.getOrderOnEdit(localOrder.orderId);
    if (customer) {
      setCustomer(customer);
    }
    if (order) {
      setCustomerOrder(order);
      const savedRate = Number(order.exchangeRate) > 0 ? Number(order.exchangeRate) : 1;
      setShippingCost(Number(order.shippingCost ?? 0));
      setExchangeRate(savedRate);
      setVatRate(Number(order.vat ?? 0));
    }
    if (arrayNotEmpty(data)) {
      setData(mergeSavedOrderLines(data, localOrder.savedDetails));
    }
  }, [localOrder]);

  useEffectAsync(async () => {
    if (!dataId) {
      return;
    }
    const { data: response, errorCode } = await RequestUtils.Get("/data/get-customer", { dataId });
    if (errorCode === SUCCESS_CODE) {
      const leadBusiness = response.lead?.business ?? business;
      setCustomer({
        ...response.customer,
        ...(leadBusiness ? { business: leadBusiness } : {})
      });
      setLeadProducts(getLeadProducts(response.lead));
      onAddProduct(response.lead);
    }
  }, [business, dataId]);

  const onAddProduct = useCallback((lead = null) => {
    const suggestedProducts = lead ? getLeadProducts(lead) : leadProducts;
    const onAfterChoiseProduct = (values) => {
      let order = _.cloneDeep(ORDER_TEMPLATE);
      const { mSkuDetails, mProduct, quantity, productId, productCode, skuId, orderLine } = values;
      /* Tạo Item trong list sản phẩm */
      order.key = randomString();
      order.note = values?.note ?? "";
      order.code = values?.code ?? "";
      order.productId = productId;
      order.productCode = productCode ?? mProduct.code ?? null;
      order.productName = mProduct.name;
      order.unit = mProduct.unit ?? "N/A";
      order.mSkuDetails = resolveOrderSkuDetails({ mSkuDetails, skuDetails: values.skuDetails, skuId }, mProduct);
      order.orderLine = orderLine ?? {};
      order.skuId = String(skuId);
      order.quantity = quantity;
      order.profit = Number(values?.profit ?? 0);
      order.status = values?.status ?? 0;
      order.warehouseOptions = getWarehouseByProduct(skuId, mProduct);

      const skus = mProduct?.skus ?? [];
      const selectedSku = findSkuById(skus, skuId);
      const skuPrices = Array.isArray(selectedSku?.skuPrices) ? selectedSku.skuPrices : [];

      order.skuPrices = skuPrices;
      order.productPrice = Number(mProduct?.price ?? mProduct?.priceRef ?? 0);
      order.currency = currency;
      order.exchangeRate = getExchangeRate(currency, exchangeRate);

      if (arrayNotEmpty(order.warehouseOptions)) {
        let warehouse = _.first(order.warehouseOptions);
        order.warehouse = warehouse?.stockName ?? '';
        order.stock = warehouse?.quantity ?? 0;
      }

      order.productPrice = resolveUnitPrice({
        skuPrices,
        quantity: order.quantity,
        product: mProduct
      });
      order.totalPrice = calculateUsdLineTotal({
        item: order,
        shippingCost,
        formula: calculationFormula,
        currency,
        exchangeRate
      });
      setData(datas => ([...datas, order]));
    };

    InAppEvent.emit(HASH_MODAL, {
      hash: "#sku.add",
      title: "Thêm sản phẩm",
      data: {
        onSave: onAfterChoiseProduct,
        productId: suggestedProducts[0]?.id,
        leadProducts: suggestedProducts,
      }
    });
  }, [calculationFormula, currency, exchangeRate, leadProducts, shippingCost]);

  const onAddStock = useCallback(() => {
    const onAfterSubmit = (values) => {
      console.log('Save stock', values);
    };
    InAppEvent.emit(HASH_POPUP, {
      hash: "stock.add",
      title: "Nhập kho",
      data: { onSave: onAfterSubmit }
    });
  }, []);

  const getLineAmount = useCallback((item) => Math.max(
    Number(item?.totalPrice ?? 0)
      - Number(item?.discountAmount ?? 0),
    0,
  ), []);
  const getSalePrice = useCallback(item => item?.salePriceVnd ?? item?.priceV ?? null, []);
  const getLineVat = useCallback(
    (item) => getLineAmount(item) * (vatRate / 100),
    [getLineAmount, vatRate],
  );
  const formatDisplayAmount = value => formatCurrencyAmount(Number(value ?? 0), currency);
  const isOrder = (customerOrder?.id || 0) !== 0;
  const totalQuantity = data.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
  const totalDiscount = data.reduce((sum, item) => sum + Number(item.discountAmount ?? 0), 0);
  const totalSubOrder = data.reduce((sum, item) => sum + getLineAmount(item), 0);
  const totalVat = totalSubOrder * (vatRate / 100);
  const totalOrder = totalSubOrder + totalVat;

  const handleExchangeRateChange = (value) => {
    const nextExchangeRate = Number(value ?? 0);
    if (!Number.isFinite(nextExchangeRate) || nextExchangeRate <= 0) return;
    setExchangeRate(nextExchangeRate);
  };

  const editRow = key => setData(lines => lines.map(line => ({ ...line, editable: line.key === key })));
  const closeEdit = () => setData(lines => lines.map(line => ({ ...line, editable: false })));
  const handleChange = (key, field, value) => setData(lines => lines.map(line => (
    line.key === key ? updateOrderLine(line, field, value, { restrictOrderFields }) : line
  )));

  const deleteRow = (key) => {
    setData(lines => lines.filter(line => line.key !== key));
  };

  const onSubmitOrder = useCallback(async () => {

    const submit = async (mCustomer) => {
      const params = buildOrderEditorPayload({ customer: mCustomer, business, customerOrder,
        dataId, lines: data, shippingCost, vatRate, currency, exchangeRate });
      const { message: eMsg, data: order, errorCode } = await RequestUtils.Post("/order/save", params);
      message.info(eMsg);
      if (errorCode === SUCCESS_CODE) {
        if (onSaveSuccess) {
          onSaveSuccess(order);
          return;
        }
        setLocalOrder(pre => ({
          orderId: order.id,
          reload: !pre.reload,
          savedDetails: order.details ?? []
        }));
      }
    }

    const onAfterSaveCustomer = (values) => {
      submit(values);
      setCustomer(values);
    }

    /* Tạo mới chưa có thông tin khách hàng */
    if ((customer?.id || 0) !== 0) {
      await submit(customer);
      return;
    }

    /* Tạo Lead và Customer */
    InAppEvent.emit(HASH_POPUP, {
      hash: "customer.add",
      title: "Thêm / Chọn khách hàng ",
      data: {
        onSave: onAfterSaveCustomer,
        customer,
        details: data
      }
    });
  }, [business, currency, data, dataId, customer, customerOrder, exchangeRate, onSaveSuccess, shippingCost, vatRate]);

  const onOpenFormPayment = useCallback(() => {
    InAppEvent.emit(HASH_MODAL, {
      hash: "#order.payment",
      title: "Thêm thanh toán đơn hàng",
      data: {
        customerOrder,
        details: data,
        onSave: (_) => setLocalOrder(pre => ({ ...pre, reload: !pre.reload }))
      }
    });
  }, [customerOrder, data]);

  const onOpenInvoice = useCallback(() => {
    InAppEvent.emit(HASH_MODAL, {
      hash: "#order.invoice",
      title: "Hóa đơn thanh toán",
      data: { customerOrder, customer, details: data }
    });
  }, [customerOrder, customer, data]);

  return { data, customer, customerOrder, setCustomerOrder, shippingCost, setShippingCost,
    currency, exchangeRate, vatRate, setVatRate, isOrder,
    totalQuantity, totalDiscount, totalSubOrder, totalVat, totalOrder, getLineAmount, getSalePrice,
    getLineVat, formatDisplayAmount, handleExchangeRateChange, editRow, closeEdit, handleChange,
    deleteRow, onSubmitOrder, onAddProduct, onAddStock, onOpenFormPayment, onOpenInvoice };
};

export default useOrderEditor;
