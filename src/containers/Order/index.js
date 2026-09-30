import { formatOrderCurrency as formatCurrencyAmount } from './orderFormatting';
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

import React, { useCallback, useMemo, useState } from 'react';
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
import { resolveOrderSkuDetails } from './orderSku';
import { calculateConvertedLineTotal } from './orderPricing';
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

const selectNumberOnFocus = event => event.target.select();

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
  dataId,
  business,
  onSaveSuccess,
  hideEditColumn = false,
}) => {

  const [lineItems, setData] = useState([]);
  const [customer, setCustomer] = useState();
  const [leadProducts, setLeadProducts] = useState([]);

  const [localOrder, setLocalOrder] = useState({ orderId, reload: false });
  const [customerOrder, setCustomerOrder] = useState();
  const [shippingCost, setShippingCost] = useState(0);
  const [currency, setCurrency] = useState(CURRENCY_VND);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [vatRate, setVatRate] = useState(0);
  const [calculationFormula, setCalculationFormula] = useState('');

  const data = useMemo(() => lineItems.map(item => {
    const totalPrice = item.manualSalePrice != null
      ? Math.round(item.manualSalePrice * Number(item.quantity ?? 0)
        + Number(item.discountAmount ?? 0) * getExchangeRate(currency, exchangeRate))
      : calculateConvertedLineTotal({ item, shippingCost, formula: calculationFormula, currency, exchangeRate });
    return {
      ...item,
      currency,
      exchangeRate: getExchangeRate(currency, exchangeRate),
      price: item.manualSalePrice ?? (Number(item.quantity ?? 0) > 0
        ? Math.max(totalPrice - Number(item.discountAmount ?? 0) * getExchangeRate(currency, exchangeRate), 0) / Number(item.quantity)
        : 0),
      totalPrice,
      total: totalPrice,
    };
  }), [lineItems, calculationFormula, currency, exchangeRate, shippingCost]);

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
      setData(mergeSavedOrderLines(data, localOrder.savedDetails).map(item => {
        if (item.price != null) {
          return { ...item, manualSalePrice: Number(item.price) };
        }
        const quantity = Number(item.quantity ?? 0);
        const savedTotal = item.totalPrice ?? item.total;
        return savedTotal != null && quantity > 0 ? {
          ...item,
          manualSalePrice: Math.max(Number(savedTotal)
            - Number(item.discountAmount ?? 0) * getExchangeRate(order?.currency, order?.exchangeRate), 0) / quantity,
        } : item;
      }));
    }
  }, [localOrder]);

  useEffectAsync(async (isMounted) => {
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
    if (item?.manualSalePrice != null) return Number(item.manualSalePrice);
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
      title: 'Giá mua',
      dataIndex: 'productPrice',
      key: 'productPrice',
      width: 140,
      align: 'right',
      editable: true
    },
    {
      title: 'Lợi nhuận (%)',
      dataIndex: 'profit',
      key: 'profit',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <InputNumber
          onFocus={selectNumberOnFocus}
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
      title: 'Giá bán',
      dataIndex: 'salePrice',
      key: 'salePrice',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <InputNumber
          onFocus={selectNumberOnFocus}
          size="small"
          min={0}
          value={getSalePrice(record)}
          onChange={value => handleChange(record.key, 'manualSalePrice', value)}
          formatter={formatterInputNumber}
          parser={parserInputNumber}
          controls={false}
          style={{ width: '100%', textAlign: 'right' }}
        />
      )
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
      title: 'Thành tiền',
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
      title: 'Tổng tiền',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      width: 150,
      align: 'right',
      render: (_, record) => renderVndAmount(getLineAmount(record) + getLineVat(record))
    },
    {
      title: customerOrder?.type === 'order' ? 'Ngày Chốt' : 'Ngày D.kiến',
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

  const clearManualSalePrices = () => setData(items => items.map(({ manualSalePrice, ...item }) => item));

  const handleCurrencyChange = (nextCurrency) => {
    clearManualSalePrices();
    setCurrency(nextCurrency);
    if (nextCurrency === CURRENCY_VND) setExchangeRate(1);
  };

  const handleExchangeRateChange = (value) => {
    clearManualSalePrices();
    const nextExchangeRate = Number(value ?? 0);
    setExchangeRate(nextExchangeRate);
  };

  const editRow = (key) => {
    const newData = data.map(item => ({ ...item, editable: item.key === key }));
    setData(newData);
  };

  const closeEdit = () => {
    setData(data.map(item => ({ ...item, editable: false })));
  };

  const handleChange = (key, field, value) => {
    const newData = data.map(item => ({ ...item }));
    const target = newData.find((item) => item.key === key);
    if (!target) {
      return;
    }

    if (['quantity', 'productPrice', 'discountRate', 'discountAmount', 'profit', 'totalPrice', 'manualSalePrice'].includes(field)) {
      target[field] = parseFloat(value || 0);
    } else if (field === 'warehouse') {
      target[field] = target.warehouseOptions.find(option => option.id === value)?.stockName || '';
    } else if (field === 'warrantyPeriod') {
      target[field] = warrantyOptions.find(option => option.id === value)?.name || '';
    } else {
      target[field] = value;
    }

    if (['productPrice', 'profit', 'discountRate', 'discountAmount'].includes(field)) {
      delete target.manualSalePrice;
    }

    /* Calculate dependent fields */
    if (field === 'quantity' && arrayNotEmpty(target.skuPrices)) {
      delete target.manualSalePrice;
      target.productPrice = resolveUnitPrice({
        skuPrices: target.skuPrices,
        quantity: target.quantity,
        product: {
          price: target.productPrice
        }
      });
    }
    if (['quantity', 'productPrice', 'profit'].includes(field)) {
      target.totalPrice = calculateConvertedLineTotal({
        item: target,
        shippingCost,
        formula: calculationFormula,
        currency,
        exchangeRate
      });
    }
    if (field === 'discountRate') {
      target.discountAmount = (target.productPrice * target.quantity * target.discountRate) / 100;
    }
    if (field === 'discountAmount') {
      target.discountRate = Number(((target.discountAmount / (target.productPrice * target.quantity)) * 100).toFixed(2));
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
            onFocus={selectNumberOnFocus}
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
          onFocus={selectNumberOnFocus}
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
        const skuDetails = resolveOrderSkuDetails(record);
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
      const isFormatted = ['productPrice', 'discountAmount', 'totalPrice'].includes(column.dataIndex);
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
        details: data.map(({ mSkuDetails, manualSalePrice, salePrice, ...detail }) => ({
          ...detail,
          price: manualSalePrice ?? getSalePrice(detail),
          dayQuote: formatDayQuoteForPayload(detail.dayQuote),
          skuDetails: resolveOrderSkuDetails({ ...detail, mSkuDetails })
        })),
        shippingCost: Number(shippingCost || 0),
        vat: vatRate,
        currency,
        exchangeRate: getExchangeRate(currency, exchangeRate)
      };
      const customerBusiness = mCustomer?.business ?? business;
      if (customerBusiness && typeof customerBusiness === 'object') {
        params.enterpriseName = customerBusiness.companyName;
        params.enterpriseId = customerBusiness.id;
      }
      if (customerOrder?.id) {
        params.id = customerOrder.id;

      }
      if (customerOrder?.code != null) params.code = customerOrder.code;
      if (dataId) {
        params.dataId = dataId;
      }
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
  }, [business, currency, data, dataId, customer, customerOrder, exchangeRate, getSalePrice, onSaveSuccess, shippingCost, vatRate]);

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
        scroll={{ x: 2560 }}
        dataSource={data}
        columns={columns.filter(col => !hideEditColumn || col.key !== 'operation').map(col => ({
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
                    onFocus={selectNumberOnFocus}
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
            <Table.Summary.Cell index={4}></Table.Summary.Cell>
            <Table.Summary.Cell index={5}></Table.Summary.Cell>
            <Table.Summary.Cell index={6} align="right">{totalQuantity}</Table.Summary.Cell>
            <Table.Summary.Cell index={7} align="right">{formatMoney(totalSubOrder)}</Table.Summary.Cell>
            <Table.Summary.Cell index={8} align="right">{formatMoney(totalVat)}</Table.Summary.Cell>
            <Table.Summary.Cell index={9} align="right"><Text strong>{formatMoney(totalOrder)}</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={10}></Table.Summary.Cell>
            <Table.Summary.Cell index={11}></Table.Summary.Cell>
            <Table.Summary.Cell index={12} align="right">{formatCurrencyAmount(totalDiscount, currency)}</Table.Summary.Cell>
            <Table.Summary.Cell index={13} colSpan={hideEditColumn ? 4 : 5}></Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
      <div style={{ marginTop: 25, display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
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
        <div style={{ width: 480, maxWidth: '100%', marginLeft: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginBottom: 12 }}>
            <div>
              <label htmlFor="order-code" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                {customerOrder?.type === 'order' ? 'Mã đơn hàng' : 'Mã cơ hội'}
              </label>
              <Input
                id="order-code"
                size="small"
                value={customerOrder?.code ?? ''}
                maxLength={100}
                placeholder="Nhập mã (để trống để tự tạo)"
                onChange={event => setCustomerOrder(current => ({ ...current, code: event.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="order-shipping-cost" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                Phí vận chuyển ({currency})
              </label>
              <InputNumber
                onFocus={selectNumberOnFocus}
                id="order-shipping-cost"
                size="small"
                min={0}
                value={shippingCost}
                onChange={value => {
                  clearManualSalePrices();
                  setShippingCost(Number(value ?? 0));
                }}
                formatter={formatterInputNumber}
                parser={parserInputNumber}
                controls={false}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <InvoiceTable order={{
            ...customerOrder,
            subtotal: totalSubOrder,
            vat: vatRate,
            total: totalOrder + Math.round(shippingCost * getExchangeRate(currency, exchangeRate)),
            paid: customerOrder?.paid ?? 0,
            priceOff: customerOrder?.priceOff ?? 0,
          }} />
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
