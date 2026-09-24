/**************************************************************************/
/*  OrderPayment.js                                                       */
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

import { Checkbox, Col, Form, message, Modal, Row } from 'antd'

import {
  FormDatePicker,
  FormInputNumber,
  FormSelect,
  FormAutoComplete,
  BtnSubmit
} from '@flast-erp/core/components';

import { RequestUtils } from '@flast-erp/core/utils'
import OrderTextTableOnly from './OrderTextTableOnly';

import { SUCCESS_CODE } from '@/configs';
import { useCallback, useEffect, useRef, useState } from 'react';
import useGetMe from '@/hooks/useGetMe';

const OptionPrice = [
  { title: 'Tiền mặt', name: 'tienmat' },
  { title: 'MoMo', name: 'momo' },
  { title: 'VNpay', name: 'vnpay' }
]

const VATOPTIONS = [
  { name: 'VAT 0%', value: 0 },
  { name: 'VAT 8%', value: 8 },
  { name: 'VAT 10%', value: 10 }
]

const CURRENCY_VND = 'VND';
const CURRENCY_USD = 'USD';
const CURRENCY_OPTIONS = [
  { name: CURRENCY_VND, title: 'VND - Việt Nam đồng' },
  { name: CURRENCY_USD, title: 'USD - Đô la Mỹ' }
];

const normalizeCurrency = value => value === CURRENCY_USD ? CURRENCY_USD : CURRENCY_VND;
const normalizeExchangeRate = (currency, value) => {
  if (currency === CURRENCY_VND) return 1;
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : 1;
};
const toVnd = (value, currency, exchangeRate) => (
  Number(value ?? 0) * (currency === CURRENCY_USD ? exchangeRate : 1)
);
const fromVnd = (value, currency, exchangeRate) => (
  Number(value ?? 0) / (currency === CURRENCY_USD ? exchangeRate : 1)
);
const formatCurrency = (value, currency) => Number(value ?? 0).toLocaleString(
  currency === CURRENCY_USD ? 'en-US' : 'vi-VN',
  {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === CURRENCY_USD ? 2 : 0,
    maximumFractionDigits: currency === CURRENCY_USD ? 2 : 0
  }
);
const roundCurrency = (value, currency) => (
  currency === CURRENCY_USD
    ? Math.round(Number(value ?? 0) * 100) / 100
    : Math.round(Number(value ?? 0))
);

const OrderPayment = ({ data, readOnly = false, closeModalAfterSubmit }) => {

  const [form] = Form.useForm();
  const { hasPermission } = useGetMe();
  const watchedVat = Form.useWatch('vat', form);
  const watchedShip = Form.useWatch('shippingCost', form);
  const watchedPaymentCurrency = Form.useWatch('currency', form);

  const { onSave, details, customer, customerOrder } = data;
  const [convertedToOrder, setConvertedToOrder] = useState(customerOrder?.type === 'order');
  const [convertingToOrder, setConvertingToOrder] = useState(false);
  const canConvertToOrder = hasPermission(['sales.opportunity.save', 'sales.opportunity.update']);
  const orderCurrency = normalizeCurrency(customerOrder?.currency);
  const exchangeRate = normalizeExchangeRate(orderCurrency, customerOrder?.exchangeRate);
  const displayCurrency = readOnly
    ? orderCurrency
    : normalizeCurrency(watchedPaymentCurrency ?? orderCurrency);
  const paymentCurrencyRef = useRef(orderCurrency);

  useEffect(() => {
    setConvertedToOrder(customerOrder?.type === 'order');
  }, [customerOrder?.id, customerOrder?.type]);

  useEffect(() => {
    if (readOnly) return;
    form.setFieldValue('vat', customerOrder.vat);
    form.setFieldValue('shippingCost', customerOrder.shippingCost);
    form.setFieldValue('currency', orderCurrency);
    paymentCurrencyRef.current = orderCurrency;
  }, [form, customerOrder, orderCurrency, readOnly]);

  const onSubmitPayment = useCallback(async (values) => {
    const paymentCurrency = normalizeCurrency(values.currency);
    const originalAmount = Number(values.amount ?? 0);
    const amount = roundCurrency(toVnd(originalAmount, paymentCurrency, exchangeRate), CURRENCY_VND);
    const remaining = Math.max(Number(customerOrder?.total ?? 0) - Number(customerOrder?.paid ?? 0), 0);

    if (amount <= 0) {
      message.error('Số tiền thanh toán phải lớn hơn 0.');
      return;
    }
    if (amount > remaining) {
      message.error(`Số tiền thanh toán không được vượt quá ${formatCurrency(fromVnd(remaining, paymentCurrency, exchangeRate), paymentCurrency)}.`);
      return;
    }

    const { data, errorCode, message: MSG } = await RequestUtils.Post("/pay/manual", {
      orderId: customerOrder.id,
      ...values,
      amount,
      currency: paymentCurrency,
      exchangeRate,
      currencyAmount: originalAmount
    })
    message.info(MSG);
    if (errorCode === SUCCESS_CODE) {
      onSave?.(data);
      closeModalAfterSubmit?.();
    }
  }, [closeModalAfterSubmit, onSave, customerOrder, exchangeRate]);

  const onConvertToOrder = useCallback(async () => {
    if (convertedToOrder || convertingToOrder) return;

    setConvertingToOrder(true);
    try {
      const normalizedDetails = (details ?? []).map(({ mSkuDetails, ...detail }) => ({
        ...detail,
        id: detail?.id ?? detail?.detailId,
        skuDetails: detail?.skuDetails ?? mSkuDetails ?? [],
        total: detail?.total ?? detail?.totalPrice,
        priceOff: detail?.priceOff ?? detail?.discountAmount ?? 0
      }));
      const response = await RequestUtils.Post('/order/save', {
        ...customerOrder,
        customer,
        details: normalizedDetails,
        type: 'order'
      });

      if (Number(response?.errorCode) !== SUCCESS_CODE && response?.success !== true) {
        throw new Error(response?.message || 'Không thể chuyển thành đơn hàng');
      }

      setConvertedToOrder(true);
      message.success(response?.message || 'Đã chuyển thành đơn hàng');
      onSave?.(response?.data);
      closeModalAfterSubmit?.();
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Không thể chuyển thành đơn hàng');
    } finally {
      setConvertingToOrder(false);
    }
  }, [closeModalAfterSubmit, convertedToOrder, convertingToOrder, customer, customerOrder, details, onSave]);

  const onRequestConvertToOrder = useCallback((event) => {
    if (!event.target.checked || convertedToOrder || convertingToOrder) return;

    Modal.confirm({
      title: 'Xác nhận chuyển thành đơn hàng',
      content: 'Cơ hội bán hàng sẽ được chuyển thành đơn hàng. Bạn có chắc chắn muốn tiếp tục?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      centered: true,
      onOk: onConvertToOrder
    });
  }, [convertedToOrder, convertingToOrder, onConvertToOrder]);

  const subtotal = customerOrder?.subtotal || 0;
  const paid = customerOrder?.paid || 0;
  const vatValue = readOnly ? (customerOrder?.vat || 0) : (watchedVat || 0);
  const shipValue = readOnly ? (customerOrder?.shippingCost || 0) : (watchedShip || 0);
  const monneyVAT = subtotal * (vatValue / 100);
  const shippingCostVnd = toVnd(shipValue, orderCurrency, exchangeRate);
  const calculatedTotal = subtotal + monneyVAT + shippingCostVnd;
  const total = Number(customerOrder?.total ?? calculatedTotal);
  const displayAmount = value => formatCurrency(
    fromVnd(value, displayCurrency, exchangeRate),
    displayCurrency
  );

  const handlePaymentCurrencyChange = (nextValue) => {
    const nextCurrency = normalizeCurrency(nextValue);
    const currentCurrency = paymentCurrencyRef.current;
    const currentAmount = form.getFieldValue('amount');

    if (currentAmount !== undefined && currentAmount !== null && currentAmount !== '') {
      const amountVnd = toVnd(currentAmount, currentCurrency, exchangeRate);
      form.setFieldValue('amount', roundCurrency(
        fromVnd(amountVnd, nextCurrency, exchangeRate),
        nextCurrency
      ));
    }
    paymentCurrencyRef.current = nextCurrency;
  };

  const summaryBox = (
    <Row style={{ marginTop: 20, padding: 15, border: '0.5px dashed #bdafaf' }}>
      {!readOnly ? (
        <>
          <Col md={10} xs={24}>
            <FormSelect
              label="Chọn VAT"
              name={"vat"}
              valueProp="value"
              placeholder='Chọn VAT'
              resourceData={VATOPTIONS}
            />
          </Col>
          <Col md={2} />
          <Col md={10} xs={24}>
            <FormInputNumber
              placeholder='Phí vận chuyển (nếu có)'
              label="Phí vận chuyển"
              name={"shippingCost"}
            />
          </Col>
        </>
      ) : (
        <>
          <Col md={12} xs={12}>
            <p>Chọn VAT: VAT {vatValue}%</p>
          </Col>
          <Col md={12} xs={12}>
            <p>Phí vận chuyển: {displayAmount(shippingCostVnd)}</p>
          </Col>
        </>
      )}
      <Col md={12} xs={12}>
        <p>Tổng đơn: {displayAmount(subtotal)}</p>
      </Col>
      <Col md={12} xs={12}>
        <p>VAT: {displayAmount(monneyVAT)}</p>
      </Col>
      <Col md={12} xs={12}>
        <p>Tổng chi phí: {displayAmount(total)}</p>
      </Col>
      <Col md={12} xs={12}>
        <p>Phí vận chuyển: {displayAmount(shippingCostVnd)}</p>
      </Col>
      <Col md={12} xs={12}>
        <p>Đã thanh toán: {displayAmount(paid)}</p>
      </Col>
      <Col md={12} xs={12}>
        <p>Chiết khấu: {displayAmount(customerOrder?.priceOff || 0)}</p>
      </Col>
      <Col md={12} xs={12}>
        <strong>Còn lại: {displayAmount(Math.max(total - paid, 0))}</strong>
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: 15 }}>
      <p><strong>Thông tin đơn hàng #{customerOrder?.code || ''}</strong></p>
      <Row gutter={16} style={{ marginBottom: 12 }}>
        <Col md={12} xs={24}>
          <span>Loại tiền đơn hàng: <strong>{orderCurrency}</strong></span>
        </Col>
        <Col md={12} xs={24}>
          <span>Tỷ giá: <strong>{orderCurrency === CURRENCY_USD
            ? `1 USD = ${exchangeRate.toLocaleString('vi-VN')} VND`
            : '1 VND = 1 VND'}</strong></span>
        </Col>
      </Row>
      {!readOnly && canConvertToOrder ? (
        <div style={{ marginBottom: 16 }}>
          <Checkbox
            checked={convertedToOrder}
            disabled={convertedToOrder || convertingToOrder}
            onChange={onRequestConvertToOrder}
          >
            {convertingToOrder ? 'Đang chuyển thành đơn hàng...' : 'Chuyển thành đơn hàng'}
          </Checkbox>
        </div>
      ) : null}
      <OrderTextTableOnly
        details={details}
        currency={displayCurrency}
        orderCurrency={orderCurrency}
        exchangeRate={exchangeRate}
      />

      {readOnly ? summaryBox : (
        <Form form={form} layout="vertical" onFinish={onSubmitPayment}>
          {summaryBox}
          <Row gutter={16} style={{ marginTop: 20 }}>
            <Col md={8} xs={24}>
              <FormSelect
                required
                name="method"
                label="Hình thức"
                placeholder="Hình thức thanh toán"
                resourceData={OptionPrice}
                valueProp="name"
                titleProp="title"
              />
            </Col>
            <Col md={8} xs={24}>
              <FormSelect
                required
                name="currency"
                label="Loại tiền thanh toán"
                resourceData={CURRENCY_OPTIONS}
                valueProp="name"
                titleProp="title"
                onChange={handlePaymentCurrencyChange}
              />
            </Col>
            <Col md={8} xs={24}>
              <FormInputNumber
                required
                label={`Số tiền (${displayCurrency})`}
                min="0"
                name="amount"
                placeholder={"Số tiền thanh toán"}
              />
            </Col>
            <Col md={12} xs={24}>
              <FormDatePicker
                name="date"
                format='DD/MM/YYYY'
                label="Ngày thanh toán"
                placeholder={"Chọn ngày"}
              />
            </Col>
            <Col md={12} xs={24}>
              <FormAutoComplete
                resourceData={[{ name: 'Đặt cọc' }, { name: 'Tất toán' }]}
                valueProp='name'
                titleProp='name'
                label='Nội dung'
                name='content'
                placeholder={'Nội dung thanh toán'}
              />
            </Col>
            <Col md={24} xs={24}>
              <BtnSubmit text="Hoàn thành" />
            </Col>
          </Row>
        </Form>
      )}
    </div>
  )
}

export default OrderPayment
