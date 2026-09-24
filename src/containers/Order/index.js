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
import { Table, Button, DatePicker, Input, InputNumber, Select, Space, Tooltip, Typography, message } from 'antd';
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
import styled from 'styled-components';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const { Text } = Typography;
const CURRENCY_VND = 'VND';
const CURRENCY_USD = 'USD';
const currencyOptions = [
  { label: 'VND', value: CURRENCY_VND },
  { label: 'USD', value: CURRENCY_USD }
];
const vatOptions = [0, 8, 10].map(value => ({ label: `${value}%`, value }));

const SkuOrderLineTooltip = ({ skuDetails, orderLine }) => {
  const details = Array.isArray(skuDetails) ? skuDetails : [];
  const orderLineEntries = Object.entries(parseOrderLine(orderLine));

  if (details.length === 0 && orderLineEntries.length === 0) {
    return <span>Chưa có thông tin SKU và thông tin bổ sung.</span>;
  }

  return (
    <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
      <Text strong style={{ color: 'inherit' }}>Thông tin SKU</Text>
      {details.length > 0 ? details.map((detail, index) => (
        <div key={`${detail?.text ?? 'sku'}-${index}`} style={{ marginTop: 6 }}>
          <strong>{detail?.text || 'Thuộc tính'}: </strong>
          {(Array.isArray(detail?.values) ? detail.values : [])
            .map(value => value?.text ?? value?.value ?? value?.id)
            .filter(value => value !== undefined && value !== null && value !== '')
            .join(', ') || '—'}
        </div>
      )) : <div style={{ marginTop: 6 }}>Chưa có</div>}

      <div style={{ marginTop: 12 }}>
        <Text strong style={{ color: 'inherit' }}>Thông tin bổ sung</Text>
        {orderLineEntries.length > 0 ? orderLineEntries.map(([key, value]) => (
          <div key={key} style={{ marginTop: 6 }}>
            <strong>{key}: </strong>{String(value ?? '—')}
          </div>
        )) : <div style={{ marginTop: 6 }}>Chưa có</div>}
      </div>
    </div>
  );
};

const OpportunityTable = styled(Table)`
  .ant-table-cell {
    padding: 12px 10px !important;
    vertical-align: middle;
  }

  .ant-input-number-input {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .ant-table-summary {
    background: ${({ theme }) => theme?.background?.content || '#fafafa'};
    font-variant-numeric: tabular-nums;
  }
`;

const formatCurrencyAmount = (value, currency = CURRENCY_VND) => Number(value ?? 0).toLocaleString(
  currency === CURRENCY_USD ? 'en-US' : 'vi-VN',
  { style: 'currency', currency, maximumFractionDigits: currency === CURRENCY_USD ? 2 : 0 }
);

const getExchangeRate = (currency, exchangeRate) => (
  currency === CURRENCY_USD ? Number(exchangeRate ?? 0) : 1
);
const parseDayQuote = value => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return dayjs(value, 'DD/MM/YYYY', true);
  }
  return dayjs(value);
};
const formatDayQuoteForPayload = value => {
  const dateValue = parseDayQuote(value);
  return dateValue?.isValid() ? dateValue.format('DD/MM/YYYY') : null;
};
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
  const [vatRate, setVatRate] = useState(0);
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
    console.log('[OpportunityEdit][3. Component data]', {
      requestedOrderId: localOrder.orderId,
      currency: order?.currency,
      exchangeRate: order?.exchangeRate,
      orderTotal: order?.total,
      details: (data ?? []).map(detail => ({
        id: detail?.id,
        price: detail?.price,
        quantity: detail?.quantity,
        discountAmount: detail?.discountAmount,
        total: detail?.total,
        totalPrice: detail?.totalPrice
      }))
    });
    if (customer) {
      setCustomer(customer);
    }
    if (order) {
      setCustomerOrder(order);
      setShippingCost(Number(order.shippingCost ?? 0));
      setCurrency(order.currency === CURRENCY_USD ? CURRENCY_USD : CURRENCY_VND);
      setExchangeRate(order.currency === CURRENCY_USD ? Number(order.exchangeRate ?? 1) : 1);
      setVatRate(Number(order.vat ?? 0));
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
      order.code = values?.code ?? "";
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

  const getLineAmount = useCallback((item) => Math.max(
    Number(item?.totalPrice ?? 0)
      - (Number(item?.discountAmount ?? 0) * getExchangeRate(currency, exchangeRate)),
    0,
  ), [currency, exchangeRate]);
  const getSalePrice = useCallback((item) => {
    const quantity = Number(item?.quantity ?? 0);
    return quantity > 0 ? getLineAmount(item) / quantity : 0;
  }, [getLineAmount]);
  const getLineVat = useCallback(
    (item) => getLineAmount(item) * (vatRate / 100),
    [getLineAmount, vatRate],
  );
  const renderVndAmount = value => (
    <Text style={{ display: 'block', textAlign: 'right', whiteSpace: 'nowrap' }}>
      {formatMoney(value)}
    </Text>
  );

  const columns = [
    {
      title: 'Số đơn',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (value, record) => (
        <Input
          size="small"
          value={value}
          maxLength={100}
          placeholder="Nhập số đơn"
          onChange={event => handleChange(record.key, 'code', event.target.value)}
        />
      )
    },
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
      title: `Đơn giá mua (${currency})`,
      dataIndex: 'price',
      key: 'price',
      width: 140,
      align: 'right',
      editable: true
    },
    {
      title: `Chi phí vận chuyển (${currency})`,
      dataIndex: 'shippingCost',
      key: 'shippingCost',
      width: 140,
      align: 'right',
      onCell: (_, index) => ({
        rowSpan: index === 0 ? Math.max(data.length, 1) : 0
      }),
      render: (_, __, index) => index === 0 ? (
        <InputNumber
          size="small"
          min={0}
          value={shippingCost}
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
          controls={false}
          style={{ width: '100%', textAlign: 'right' }}
        />
      ) : null
    },
    {
      title: 'Lợi nhuận (%)',
      dataIndex: 'profit',
      key: 'profit',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <InputNumber
          size="small"
          min={0}
          max={99.99}
          value={Number(record?.profit ?? 0)}
          onChange={value => handleChange(record.key, 'profit', value)}
          formatter={value => `${value ?? 0}%`}
          parser={value => value?.replace('%', '')}
          controls={false}
          style={{ width: '100%', textAlign: 'right' }}
        />
      )
    },
    {
      title: 'Giá bán (VND)',
      dataIndex: 'salePrice',
      key: 'salePrice',
      width: 140,
      align: 'right',
      render: (_, record) => renderVndAmount(getSalePrice(record))
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true,
      width: 100,
      align: 'right'
    },
    {
      title: 'Thành tiền (VND)',
      dataIndex: 'lineAmount',
      key: 'lineAmount',
      width: 150,
      align: 'right',
      render: (_, record) => renderVndAmount(getLineAmount(record))
    },
    {
      title: (
        <Space size={6}>
          <span>VAT</span>
          <Select
            size="small"
            value={vatRate}
            options={vatOptions}
            onChange={value => setVatRate(Number(value ?? 0))}
            style={{ width: 68 }}
          />
        </Space>
      ),
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: 170,
      align: 'right',
      render: (_, record) => renderVndAmount(getLineVat(record))
    },
    {
      title: 'Tổng tiền (VND)',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      width: 150,
      align: 'right',
      render: (_, record) => renderVndAmount(getLineAmount(record) + getLineVat(record))
    },
    {
      title: 'Deadline',
      dataIndex: 'dayQuote',
      key: 'dayQuote',
      width: 150,
      render: (value, record) => {
        const dateValue = parseDayQuote(value);
        return (
          <DatePicker
            size="small"
            allowClear
            value={dateValue?.isValid() ? dateValue : null}
            format="DD/MM/YYYY"
            placeholder="dd/mm/yyyy"
            onChange={date => handleChange(
              record.key,
              'dayQuote',
              date ? date.format('DD/MM/YYYY') : null,
            )}
            style={{ width: '100%' }}
          />
        );
      }
    },
    {
      title: 'CK (%)',
      dataIndex: 'discountRate',
      key: 'discountRate',
      width: 90,
      align: 'right',
      editable: true
    },
    {
      title: `Tiền CK (${currency})`,
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      width: 120,
      align: 'right',
      editable: true
    },
    {
      title: 'Bảo hành',
      dataIndex: 'warrantyPeriod',
      key: 'warrantyPeriod',
      width: 110,
      editable: true
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 90
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
      width: 100,
      align: 'right'
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
  const totalSubOrder = data.reduce((sum, item) => sum + getLineAmount(item), 0);
  const totalVat = totalSubOrder * (vatRate / 100);
  const totalOrder = totalSubOrder + totalVat;

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
    } else {
      target[field] = value;
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
            size="small"
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
            size="small"
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
            size="small"
            min={1}
            value={text}
            onChange={value => handleChange(record.key, column.dataIndex, value)}
            controls={false}
            style={{ width: '100%', textAlign: 'right' }}
            formatter={formatterInputNumber}
            parser={parserInputNumber}
          />
        );
      }
      return (
        <InputNumber
          size="small"
          min={0}
          max={column.dataIndex === 'profit' ? 99.99 : undefined}
          value={text}
          onChange={value => handleChange(record.key, column.dataIndex, value)}
          controls={false}
          style={{ width: '100%', textAlign: 'right' }}
          formatter={formatterInputNumber}
          parser={parserInputNumber}
        />
      );
    } else {
      if (column.dataIndex === 'warehouse') {
        return <Text style={{ width: 120 }} ellipsis> {text || '(Chưa nhập)'} </Text>;
      }
      if (column.dataIndex === 'mSkuDetails') {
        const skuDetails = record.mSkuDetails ?? record.skuDetails ?? [];
        const orderLineEntries = Object.entries(parseOrderLine(record.orderLine));

        return (
          <Tooltip
            placement="topLeft"
            mouseEnterDelay={0.2}
            styles={{ root: { maxWidth: 520 } }}
            title={<SkuOrderLineTooltip skuDetails={skuDetails} orderLine={record.orderLine} />}
          >
            <div style={{ cursor: 'help' }}>
              <ShowSkuDetail skuDetails={skuDetails} width={260} />
              {orderLineEntries.map(([key, value]) => (
                <Text key={key} ellipsis style={{ display: 'block', width: 260 }}>
                  <strong>{key}: </strong>
                  <span>{String(value ?? '')}</span>
                </Text>
              ))}
            </div>
          </Tooltip>
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
          dayQuote: formatDayQuoteForPayload(detail.dayQuote),
          skuDetails: detail.skuDetails ?? mSkuDetails ?? []
        })),
        shippingCost: Number(shippingCost || 0),
        vat: vatRate,
        currency,
        exchangeRate: getExchangeRate(currency, exchangeRate)
      };
      if (customerOrder?.id) {
        params.id = customerOrder.id;
        params.code = customerOrder.code ?? '';
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
  }, [currency, data, dataId, customer, customerOrder, exchangeRate, shippingCost, vatRate]);

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
      <OpportunityTable
        bordered
        scroll={{ x: 2700 }}
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
          render: [
            'code',
            'profit',
            'shippingCost',
            'salePrice',
            'lineAmount',
            'vatAmount',
            'grandTotal',
            'dayQuote',
            'operation'
          ].includes(col.dataIndex)
            ? col.render
            : (text, record, index) => renderCell(text, record, index, col)
        }))}
        pagination={false}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={3}>
              <Space wrap size={12}>
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
                    style={{ width: 170 }}
                  />
                </Space>
              </Space>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3}></Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right">{formatCurrencyAmount(shippingCost, currency)}</Table.Summary.Cell>
            <Table.Summary.Cell index={5}></Table.Summary.Cell>
            <Table.Summary.Cell index={6}></Table.Summary.Cell>
            <Table.Summary.Cell index={7} align="right">{totalQuantity}</Table.Summary.Cell>
            <Table.Summary.Cell index={8} align="right">{formatMoney(totalSubOrder)}</Table.Summary.Cell>
            <Table.Summary.Cell index={9} align="right">{formatMoney(totalVat)}</Table.Summary.Cell>
            <Table.Summary.Cell index={10} align="right"><Text strong>{formatMoney(totalOrder)}</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={11}></Table.Summary.Cell>
            <Table.Summary.Cell index={12}></Table.Summary.Cell>
            <Table.Summary.Cell index={13} align="right">{formatCurrencyAmount(totalDiscount, currency)}</Table.Summary.Cell>
            <Table.Summary.Cell index={14} colSpan={5}></Table.Summary.Cell>
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
            <div style={{ minWidth: 430 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Text strong style={{ whiteSpace: 'nowrap' }}>
                  {customerOrder.type === 'order' ? 'Mã đơn hàng' : 'Mã cơ hội'}
                </Text>
                <Input
                  size="small"
                  value={customerOrder.code ?? ''}
                  maxLength={100}
                  placeholder="Nhập mã"
                  onChange={event => setCustomerOrder(current => ({
                    ...current,
                    code: event.target.value
                  }))}
                  style={{ flex: 1 }}
                />
              </div>
              <InvoiceTable
                order={customerOrder}
              />
            </div>
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
