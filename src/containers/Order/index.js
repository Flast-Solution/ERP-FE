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

import React, { useCallback, useState } from 'react';
import { Table, Button, InputNumber, Select, Space, Typography, message } from 'antd';
import { ShowSkuDetail } from '@/containers/Product/SkuView';
import { arrayEmpty, arrayNotEmpty, formatMoney } from '@flast-erp/core/utils';
import { formatterInputNumber, parserInputNumber } from '@flast-erp/core/utils';
import { HASH_POPUP } from '@/configs/constant';
import { RequestUtils, InAppEvent } from '@flast-erp/core/utils';
import {
  SaveOutlined,
  TagOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
  FilePptOutlined
} from '@ant-design/icons';
import _ from 'lodash';
import { HASH_MODAL, SUCCESS_CODE } from '@/configs';
import OrderService, { getWarehouseByProduct } from '@/services/OrderService';
import { useEffectAsync } from '@flast-erp/core/hooks';
import { mergeSavedOrderLines, parseOrderLine } from './orderLine';

const { Text } = Typography;
const CURRENCY_VND = 'VND';
const CURRENCY_USD = 'USD';
const currencyOptions = [
  { label: 'VND', value: CURRENCY_VND },
  { label: 'USD', value: CURRENCY_USD }
];

const formatCurrencyAmount = (value, currency = CURRENCY_VND) => Number(value ?? 0).toLocaleString(
  currency === CURRENCY_USD ? 'en-US' : 'vi-VN',
  { style: 'currency', currency, maximumFractionDigits: currency === CURRENCY_USD ? 2 : 0 }
);

const getExchangeRate = (currency, exchangeRate) => (
  currency === CURRENCY_USD ? Number(exchangeRate ?? 0) : 1
);
const warrantyOptions = [
  { name: '(Chưa có)', id: 1 },
  { name: '6 Tháng', id: 6 },
  { name: '12 Tháng', id: 12 },
  { name: '24 Tháng', id: 24 }
];

const ORDER_TEMPLATE = {
  key: "1",
  note: "",
  detailId: null,
  orderName: "",
  productId: null,
  productCode: "",
  productName: "",
  skuId: "",
  unit: "(Chưa có)",
  warrantyPeriod: "(Chưa có)",
  quantity: 1,
  price: 0,
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

function findByQuantity(arr, quantity) {
  return arrayNotEmpty(arr) ? arr.find(
    item => Number(quantity) >= Number(item.quantityFrom)
      && Number(quantity) <= Number(item.quantityTo)
  ) || {} : {};
}

function findSkuById(skus = [], skuId) {
  return (Array.isArray(skus) ? skus : []).find(
    sku => String(sku?.id) === String(skuId)
  );
}

function resolveUnitPrice({ skuPrices = [], quantity, product = {} }) {
  const priceRange = findByQuantity(skuPrices, quantity);
  return Number(
    priceRange?.price
    ?? priceRange?.priceRef
    ?? product?.price
    ?? product?.priceRef
    ?? 0
  );
}

const tokenizeFormula = (formula = '') => {
  const tokens = [];
  let index = 0;

  while (index < formula.length) {
    const char = formula[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      const match = formula.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (!match) throw new Error('Số trong công thức không hợp lệ');
      tokens.push({ type: 'number', value: Number(match[0]) });
      index += match[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      const match = formula.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      tokens.push({ type: 'identifier', value: match[0] });
      index += match[0].length;
      continue;
    }
    if ('+-*/()%'.includes(char)) {
      tokens.push({ type: char, value: char });
      index += 1;
      continue;
    }
    throw new Error(`Ký tự không được hỗ trợ trong công thức: ${char}`);
  }

  return tokens;
};

const evaluateCalculationFormula = (formula, variables) => {
  if (!formula?.trim()) return null;

  try {
    const tokens = tokenizeFormula(formula);
    let cursor = 0;
    const peek = () => tokens[cursor];
    const consume = type => {
      const token = tokens[cursor];
      if (!token || token.type !== type) {
        throw new Error(`Thiếu token ${type}`);
      }
      cursor += 1;
      return token;
    };

    const parsePrimary = () => {
      const token = peek();
      let value;
      if (token?.type === 'number') {
        value = consume('number').value;
      } else if (token?.type === 'identifier') {
        const variableName = consume('identifier').value;
        if (!Object.prototype.hasOwnProperty.call(variables, variableName)) {
          throw new Error(`Biến ${variableName} không tồn tại`);
        }
        value = Number(variables[variableName] ?? 0);
      } else if (token?.type === '(') {
        consume('(');
        value = parseExpression();
        consume(')');
      } else {
        throw new Error('Công thức không hợp lệ');
      }

      while (peek()?.type === '%') {
        consume('%');
        value /= 100;
      }
      return value;
    };

    const parseUnary = () => {
      if (peek()?.type === '+') {
        consume('+');
        return parseUnary();
      }
      if (peek()?.type === '-') {
        consume('-');
        return -parseUnary();
      }
      return parsePrimary();
    };

    const parseTerm = () => {
      let value = parseUnary();
      while (peek()?.type === '*' || peek()?.type === '/') {
        const operator = tokens[cursor].type;
        cursor += 1;
        const right = parseUnary();
        value = operator === '*' ? value * right : value / right;
      }
      return value;
    };

    function parseExpression() {
      let value = parseTerm();
      while (peek()?.type === '+' || peek()?.type === '-') {
        const operator = tokens[cursor].type;
        cursor += 1;
        const right = parseTerm();
        value = operator === '+' ? value + right : value - right;
      }
      return value;
    }

    const result = parseExpression();
    if (cursor !== tokens.length || !Number.isFinite(result)) return null;
    return Math.round((result + Number.EPSILON) * 100) / 100;
  } catch (_) {
    return null;
  }
};

const calculateLineTotal = ({ item, shippingCost, formula }) => {
  if (!formula) {
    return Number(item?.price ?? 0) * Number(item?.quantity ?? 0);
  }
  return evaluateCalculationFormula(formula, {
    price: Number(item?.price ?? 0),
    quantity: Number(item?.quantity ?? 0),
    shippingCost: Number(shippingCost ?? 0),
    profit: Number(item?.profit ?? 0),
  });
};

const calculateConvertedLineTotal = ({ item, shippingCost, formula, currency, exchangeRate }) => {
  const amount = calculateLineTotal({ item, shippingCost, formula })
    ?? (Number(item?.price ?? 0) * Number(item?.quantity ?? 0));
  return Math.round(amount * getExchangeRate(currency, exchangeRate));
};

const EditButton = ({
  editable,
  onEdit,
  onClose,
  onDelete
}) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <Button size="small" onClick={editable ? onClose : onEdit}>
      {editable ? <CheckOutlined /> : 'Sửa'}
    </Button>
    <Button
      size="small"
      danger
      icon={<DeleteOutlined />}
      style={{ marginLeft: 6 }}
      onClick={onDelete}
    />
  </div>
);

const BanHangPage = ({
  orderId,
  dataId
}) => {

  const [data, setData] = useState([]);
  const [customer, setCustomer] = useState();
  const [leadProducts, setLeadProducts] = useState([]);

  const [localOrder, setLocalOrder] = useState({ orderId, reload: false });
  const [customerOrder, setCustomerOrder] = useState();
  const [shippingCost, setShippingCost] = useState(0);
  const [currency, setCurrency] = useState(CURRENCY_VND);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [calculationFormula, setCalculationFormula] = useState('');

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

  useEffectAsync(async (isMounted) => {
    const { customer, order, data } = await OrderService.getOrderOnEdit(localOrder.orderId);
    if (customer) {
      setCustomer(customer);
    }
    if (order) {
      setCustomerOrder(order);
      setShippingCost(Number(order.shippingCost ?? 0));
      setCurrency(order.currency === CURRENCY_USD ? CURRENCY_USD : CURRENCY_VND);
      setExchangeRate(order.currency === CURRENCY_USD ? Number(order.exchangeRate ?? 1) : 1);
    }
    if (arrayNotEmpty(data)) {
      setData(mergeSavedOrderLines(data, localOrder.savedDetails));
    }
  }, [localOrder]);

  useEffectAsync(async (isMounted) => {
    if (!dataId) {
      return;
    }
    const { data: response, errorCode } = await RequestUtils.Get("/data/get-customer", { dataId });
    if (errorCode === SUCCESS_CODE) {
      setCustomer(response.customer);
      setLeadProducts(getLeadProducts(response.lead));
      onAddProduct(response.lead);
    }
  }, [dataId]);

  const onAddProduct = useCallback((lead = null) => {
    const suggestedProducts = lead ? getLeadProducts(lead) : leadProducts;
    const onAfterChoiseProduct = (values) => {
      let order = _.cloneDeep(ORDER_TEMPLATE);
      const { mSkuDetails, mProduct, quantity, productId, productCode, skuId, orderLine } = values;
      /* Tạo Item trong list sản phẩm */
      order.key = randomString();
      order.note = values?.note ?? "";
      order.orderName = values?.orderName ?? "";
      order.productId = productId;
      order.productCode = productCode ?? mProduct.code ?? null;
      order.productName = mProduct.name;
      order.unit = mProduct.unit ?? "N/A";
      order.mSkuDetails = mSkuDetails;
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

      order.price = resolveUnitPrice({
        skuPrices,
        quantity: order.quantity,
        product: mProduct
      });
      order.totalPrice = calculateConvertedLineTotal({
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

  const columns = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 180,
      ellipsis: true
    },
    {
      title: 'SKU',
      dataIndex: 'mSkuDetails',
      key: 'mSkuDetails',
      width: 260
    },
    {
      title: 'Bảo hành',
      dataIndex: 'warrantyPeriod',
      key: 'warrantyPeriod',
      width: 110,
      editable: true
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true,
      width: 100
    },
    {
      title: `Đơn giá (${currency})`,
      dataIndex: 'price',
      key: 'price',
      width: 120,
      editable: true
    },
    {
      title: 'CK (%)',
      dataIndex: 'discountRate',
      key: 'discountRate',
      width: 90,
      editable: true
    },
    {
      title: `Tiền CK (${currency})`,
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      width: 120,
      editable: true
    },
    {
      title: 'Lợi nhuận (%)',
      dataIndex: 'profit',
      key: 'profit',
      width: 130,
      render: (_, record) => (
        <InputNumber
          min={0}
          max={99.99}
          value={Number(record?.profit ?? 0)}
          onChange={value => handleChange(record.key, 'profit', value)}
          formatter={value => `${value ?? 0}%`}
          parser={value => value?.replace('%', '')}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: `Phí ship (${currency})`,
      dataIndex: 'shippingCost',
      key: 'shippingCost',
      width: 140,
      onCell: (_, index) => ({
        rowSpan: index === 0 ? Math.max(data.length, 1) : 0
      }),
      render: (_, __, index) => index === 0 ? (
        <InputNumber
          min={0}
          value={shippingCost}
          addonAfter={currency}
          onChange={value => {
            const nextShippingCost = Number(value ?? 0);
            setShippingCost(nextShippingCost);
            if (calculationFormula) {
              setData(current => current.map(item => ({
                ...item,
                totalPrice: calculateConvertedLineTotal({
                  item,
                  shippingCost: nextShippingCost,
                  formula: calculationFormula,
                  currency,
                  exchangeRate
                })
              })));
            }
          }}
          formatter={formatterInputNumber}
          parser={parserInputNumber}
          style={{ width: '100%' }}
        />
      ) : null
    },
    {
      title: 'Thành tiền (VND)',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 150,
      editable: true
    },
    {
      title: 'Kho',
      dataIndex: 'warehouse',
      key: 'warehouse',
      editable: true,
      width: 130
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 100
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 90
    },
    {
      title: 'Sửa',
      dataIndex: 'operation',
      key: 'operation',
      fixed: 'right',
      width: 110,
      render: (_, record) => (
        <EditButton
          editable={record.editable}
          onEdit={() => editRow(record.key)}
          onClose={closeEdit}
          onDelete={() => deleteRow(record.key)}
        />
      )
    }
  ];

  let isOrder = (customerOrder?.id || 0) !== 0;
  const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
  const totalDiscount = data.reduce((sum, item) => sum + item.discountAmount, 0);
  const totalSubOrder = data.reduce(
    (sum, item) => sum + item.totalPrice - (item.discountAmount * getExchangeRate(currency, exchangeRate)),
    0
  );

  const recalculateTotals = useCallback((nextCurrency, nextExchangeRate) => {
    setData(current => current.map(item => ({
      ...item,
      currency: nextCurrency,
      exchangeRate: getExchangeRate(nextCurrency, nextExchangeRate),
      totalPrice: calculateConvertedLineTotal({
        item,
        shippingCost,
        formula: calculationFormula,
        currency: nextCurrency,
        exchangeRate: nextExchangeRate
      })
    })));
  }, [calculationFormula, shippingCost]);

  const handleCurrencyChange = (nextCurrency) => {
    const nextExchangeRate = nextCurrency === CURRENCY_USD ? exchangeRate : 1;
    setCurrency(nextCurrency);
    if (nextCurrency === CURRENCY_VND) setExchangeRate(1);
    recalculateTotals(nextCurrency, nextExchangeRate);
  };

  const handleExchangeRateChange = (value) => {
    const nextExchangeRate = Number(value ?? 0);
    setExchangeRate(nextExchangeRate);
    recalculateTotals(currency, nextExchangeRate);
  };

  const editRow = (key) => {
    const newData = data.map(item => ({ ...item, editable: item.key === key }));
    setData(newData);
  };

  const closeEdit = () => {
    setData(data.map(item => ({ ...item, editable: false })));
  };

  const handleChange = (key, field, value) => {
    const newData = [...data];
    const target = newData.find((item) => item.key === key);
    if (!target) {
      return;
    }

    if (['quantity', 'price', 'discountRate', 'discountAmount', 'profit', 'totalPrice'].includes(field)) {
      target[field] = parseFloat(value || 0);
    } else if (field === 'warehouse') {
      target[field] = target.warehouseOptions.find(option => option.id === value)?.stockName || '';
    } else if (field === 'warrantyPeriod') {
      target[field] = warrantyOptions.find(option => option.id === value)?.name || '';
    }

    /* Calculate dependent fields */
    if (field === 'quantity' && arrayNotEmpty(target.skuPrices)) {
      target.price = resolveUnitPrice({
        skuPrices: target.skuPrices,
        quantity: target.quantity,
        product: {
          price: target.productPrice
        }
      });
    }
    if (['quantity', 'price', 'profit'].includes(field)) {
      target.totalPrice = calculateConvertedLineTotal({
        item: target,
        shippingCost,
        formula: calculationFormula,
        currency,
        exchangeRate
      });
    }
    if (field === 'discountRate') {
      target.discountAmount = (target.price * target.quantity * target.discountRate) / 100;
    }
    if (field === 'discountAmount') {
      target.discountRate = ((target.discountAmount / (target.price * target.quantity)) * 100).toFixed(2);
    }
    setData(newData);
  };

  const renderCell = (text, record, index, column) => {
    if (record.editable && column.editable) {
      if (column.dataIndex === 'warehouse') {
        return (
          <Select
            placeholder="Chọn kho"
            disabled={arrayEmpty(record?.warehouseOptions)}
            value={text}
            options={(record?.warehouseOptions ?? []).map(opt => ({
              label: opt.stockName,
              value: opt.id
            }))}
            onChange={value => handleChange(record.key, column.dataIndex, value)}
            style={{ width: '100%' }}
          />
        );
      }
      if (column.dataIndex === 'warrantyPeriod') {
        return (
          <Select
            placeholder="Chọn bảo hành"
            disabled={!record.editable}
            value={text}
            options={warrantyOptions.map(opt => ({
              label: opt.name,
              value: opt.id
            }))}
            onChange={value => handleChange(record.key, column.dataIndex, value)}
            style={{ width: '100%' }}
          />
        );
      }
      if (column.dataIndex === 'quantity') {
        return (
          <InputNumber
            min={1}
            value={text}
            onChange={value => handleChange(record.key, column.dataIndex, value)}
            style={{ width: '100%' }}
            formatter={formatterInputNumber}
            parser={parserInputNumber}
          />
        );
      }
      return (
        <InputNumber
          min={0}
          max={column.dataIndex === 'profit' ? 99.99 : undefined}
          value={text}
          onChange={value => handleChange(record.key, column.dataIndex, value)}
          style={{ width: '100%' }}
          formatter={formatterInputNumber}
          parser={parserInputNumber}
          addonAfter={column.dataIndex === 'totalPrice' ? CURRENCY_VND : (
            ['price', 'discountAmount'].includes(column.dataIndex) ? currency : undefined
          )}
        />
      );
    } else {
      if (column.dataIndex === 'warehouse') {
        return <Text style={{ width: 120 }} ellipsis> {text || '(Chưa nhập)'} </Text>;
      }
      if (column.dataIndex === 'mSkuDetails') {
        const orderLineEntries = Object.entries(parseOrderLine(record.orderLine));

        return (
          <div>
            <ShowSkuDetail skuDetails={record.mSkuDetails ?? record.skuDetails} width={260} />
            {orderLineEntries.map(([key, value]) => (
              <Text key={key} ellipsis style={{ display: 'block', width: 260 }} title={`${key}: ${value ?? ''}`}>
                <strong>{key}: </strong>
                <span>{String(value ?? '')}</span>
              </Text>
            ))}
          </div>
        );
      }
      const isFormatted = ['price', 'discountAmount', 'totalPrice'].includes(column.dataIndex);
      if (column.dataIndex === 'profit') {
        return `${Number(text ?? 0)}%`;
      }
      return isFormatted
        ? formatCurrencyAmount(text, column.dataIndex === 'totalPrice' ? CURRENCY_VND : currency)
        : text;
    }
  };

  const deleteRow = (key) => {
    setData(data.filter(item => item.key !== key));
  };

  const onSubmitOrder = useCallback(async () => {

    const submit = async (mCustomer) => {
      let params = {
        customer: mCustomer,
        details: data.map(({ mSkuDetails, ...detail }) => ({
          ...detail,
          skuDetails: detail.skuDetails ?? mSkuDetails ?? []
        })),
        shippingCost: Number(shippingCost || 0),
        currency,
        exchangeRate: getExchangeRate(currency, exchangeRate)
      };
      if (customerOrder?.id) {
        params.id = customerOrder.id;
      }
      if (dataId) {
        params.dataId = dataId;
      }
      const { message: eMsg, data: order, errorCode } = await RequestUtils.Post("/order/save", params);
      message.info(eMsg);
      if (errorCode === SUCCESS_CODE) {
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
      submit(customer);
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
  }, [currency, data, dataId, customer, customerOrder, exchangeRate, shippingCost]);

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

  return (
    <>
      <Table
        bordered
        scroll={{ x: 1760 }}
        dataSource={data}
        columns={columns.map(col => ({
          ...col,
          onHeaderCell: () => ({
            style: { whiteSpace: 'nowrap' }
          }),
          onCell: (record, index) => ({
            ...(col.onCell?.(record, index) ?? {}),
            editable: col.editable?.toString()
          }),
          render: ['profit', 'shippingCost', 'operation'].includes(col.dataIndex)
            ? col.render
            : (text, record, index) => renderCell(text, record, index, col)
        }))}
        pagination={false}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={3}>
              <Space wrap size={12}>
                <Text strong>Tổng cộng</Text>
                <Space size={6}>
                  <Text>Loại tiền</Text>
                  <Select
                    size="small"
                    value={currency}
                    options={currencyOptions}
                    onChange={handleCurrencyChange}
                    style={{ width: 90 }}
                  />
                </Space>
                <Space size={6}>
                  <Text>Tỷ giá</Text>
                  <InputNumber
                    size="small"
                    min={currency === CURRENCY_USD ? 0.01 : 1}
                    value={exchangeRate}
                    disabled={currency === CURRENCY_VND}
                    onChange={handleExchangeRateChange}
                    formatter={formatterInputNumber}
                    parser={parserInputNumber}
                    addonAfter="VND"
                    style={{ width: 170 }}
                  />
                </Space>
              </Space>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3}>{totalQuantity}</Table.Summary.Cell>
            <Table.Summary.Cell index={4}></Table.Summary.Cell>
            <Table.Summary.Cell index={5}></Table.Summary.Cell>
            <Table.Summary.Cell index={6}>{formatCurrencyAmount(totalDiscount, currency)}</Table.Summary.Cell>
            <Table.Summary.Cell index={7}></Table.Summary.Cell>
            <Table.Summary.Cell index={8}>{formatCurrencyAmount(shippingCost, currency)}</Table.Summary.Cell>
            <Table.Summary.Cell index={9}>{formatMoney(totalSubOrder)}</Table.Summary.Cell>
            <Table.Summary.Cell index={10} colSpan={4}></Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
      <div style={{ marginTop: 25, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Button
            disabled={arrayEmpty(data)}
            onClick={onSubmitOrder}
            icon={<SaveOutlined />}
          >
            Lưu đơn hàng
          </Button>
          <Button
            onClick={() => onAddProduct()}
            style={{ marginLeft: 8 }}
            icon={<PlusOutlined />}
          >
            Thêm sản phẩm
          </Button>
          <Button
            onClick={onAddStock}
            style={{ marginLeft: 8 }}
            icon={<ShoppingCartOutlined />}
          >
            Nhập kho
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            icon={<TagOutlined />}
            disabled={!isOrder}
            onClick={onOpenFormPayment}
          >
            VAT + K.Mãi + Thanh toán
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={onOpenInvoice}
            icon={<FilePptOutlined />}
            disabled={!isOrder}
          >
            In hóa đơn
          </Button>
        </div>
        <div>
          {isOrder &&
            <InvoiceTable
              order={customerOrder}
            />
          }
        </div>
      </div>
    </>
  );
}

const InvoiceTable = ({
  order
}) => {
  const { subtotal, vat, priceOff, total, paid } = order;
  const data = [
    {
      key: '1',
      leftLabel: 'Tổng chưa VAT',
      leftValue: formatMoney(subtotal),
      rightLabel: 'VAT',
      rightValue: formatMoney(subtotal * (vat / 100))
    },
    {
      key: '2',
      leftLabel: 'C.Khấu | Voucher',
      leftValue: formatMoney(priceOff),
      rightLabel: 'Tổng tiền',
      rightValue: formatMoney(total)
    },
    {
      key: '3',
      leftLabel: 'Đã thanh toán',
      leftValue: formatMoney(paid),
      rightLabel: 'Còn lại',
      rightValue: formatMoney(total - paid)
    }
  ];

  const columns = [
    {
      dataIndex: 'leftLabel',
      key: 'left',
      render: (_, record) => (
        <div style={{ fontWeight: 'bold' }}>{record.leftLabel}: <span style={{ fontWeight: 'normal' }}>{record.leftValue}</span></div>
      )
    },
    {
      dataIndex: 'rightLabel',
      key: 'right',
      render: (_, record) => (
        <div style={{ fontWeight: 'bold' }}>{record.rightLabel}: <span style={{ fontWeight: 'normal' }}>{record.rightValue}</span></div>
      )
    }
  ];

  return (
    <Table
      dataSource={data}
      columns={columns}
      pagination={false}
      bordered
      showHeader={false}
      style={{ width: '100%' }}
    />
  )
};

export default BanHangPage;
