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
import { calculateEditorLine } from './orderPricing';
import { CURRENCY_USD, findSkuById, resolveUnitPrice, updateOrderLine } from './orderEditorModel';
import { buildOrderEditorPayload } from './orderEditorPayload';
import { buildFormulaSnapshot, calculateFormulaLine, calculateEnteredPriceLine, configToFormula, readFormulaSnapshot } from './orderFormula';
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
  const [currency, setCurrency] = useState(CURRENCY_USD);
  const [vatRate, setVatRate] = useState(0);
  const [defaultFormula, setDefaultFormula] = useState(null);
  const [pricingFormula, setPricingFormula] = useState(null);

  const orderedQuantity = lineItems.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const data = useMemo(() => lineItems.map(line => pricingFormula
    ? calculateEnteredPriceLine(line, currency)
    : calculateEditorLine(line, { currency, shippingCost, orderedQuantity, formula: '' })),
  [lineItems, pricingFormula, currency, shippingCost, orderedQuantity]);
  const chargedShippingCost = pricingFormula?.shippingMode === 'included' ? 0 : Number(shippingCost || 0);

  useEffectAsync(async () => {
    const { data: configs, errorCode } = await RequestUtils.Get('/erp/config/fetch', {
      limit: 100,
      page: 1,
      key: 'CACULATOR_TOTAL'
    });
    if (errorCode !== SUCCESS_CODE) {
      return;
    }
    const configItems = Array.isArray(configs) ? configs : configs?.embedded ?? [];
    const config = configItems.find(item => item?.key === 'CACULATOR_TOTAL');
    setDefaultFormula(configToFormula(config));
  }, []);

  useEffectAsync(async () => {
    const { customer, order, data } = await OrderService.getOrderOnEdit(localOrder.orderId);
    if (customer) {
      setCustomer(customer);
    }
    if (order) {
      setCustomerOrder(order);
      setCurrency(order.currency === 'VND' ? 'VND' : CURRENCY_USD);
      setShippingCost(Number(order.shippingCost ?? 0));
      setVatRate(Number(order.vat ?? 0));
      const snapshot = readFormulaSnapshot(order);
      setPricingFormula(snapshot);
      if (snapshot) setShippingCost(Number(order.payOptions.pricingFormula.shippingCost ?? order.shippingCost ?? 0));
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
      order._recalculateTotal = true;
      setData(datas => [...datas, order]);
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
  }, [currency, leadProducts]);

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

  const editRow = key => setData(lines => lines.map(line => ({ ...line, editable: line.key === key })));
  const closeEdit = () => setData(lines => lines.map(line => ({ ...line, editable: false })));
  const handleChange = (key, field, value) => setData(lines => lines.map(line => (
    line.key === key ? updateOrderLine({ ...line, currency }, field, value, { restrictOrderFields }) : line
  )));
  const deleteRow = key => setData(lines => lines.filter(line => line.key !== key));

  const onSubmitOrder = useCallback(async () => {

    const submit = async (mCustomer) => {
      const params = buildOrderEditorPayload({ customer: mCustomer, business, customerOrder,
        dataId, lines: data, shippingCost: chargedShippingCost, vatRate, currency,
        pricingFormula: pricingFormula ? { ...buildFormulaSnapshot(pricingFormula), shippingCost: Number(shippingCost || 0) } : undefined });
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
  }, [business, currency, data, dataId, customer, customerOrder, onSaveSuccess, pricingFormula, chargedShippingCost, shippingCost, vatRate]);

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

  const applyPricingFormula = formula => {
    if (restrictOrderFields || !formula?.expression?.trim()) return false;
    const nextLines = data.map(line => calculateFormulaLine(line, formula, { currency, shippingCost, orderedQuantity }));
    const invalid = nextLines.find(line => line.formulaError);
    if (invalid) {
      message.error(`${invalid.productName || invalid.key}: ${invalid.formulaError}`);
      return false;
    }
    // Apply once. Subsequent input edits and reloads use the saved prices, not the formula.
    setData(nextLines.map(line => ({ ...line, _recalculateTotal: false, _recalculateSalePrice: false })));
    setPricingFormula(buildFormulaSnapshot(formula));
    return true;
  };

  return { pricingFormula, defaultFormula, applyPricingFormula, orderedQuantity, chargedShippingCost,
    data, customer, customerOrder, setCustomerOrder, shippingCost, setShippingCost,
    currency, setCurrency: value => {
      setCurrency(value);
      setData(lines => lines.map(line => ({ ...line, _recalculateTotal: true })));
    }, vatRate, setVatRate, isOrder,
    totalQuantity, totalDiscount, totalSubOrder, totalVat, totalOrder, getLineAmount, getSalePrice,
    getLineVat, formatDisplayAmount, editRow, closeEdit, handleChange,
    deleteRow, onSubmitOrder, onAddProduct, onAddStock, onOpenFormPayment, onOpenInvoice };
};

export default useOrderEditor;
