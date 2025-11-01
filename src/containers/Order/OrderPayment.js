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

import { Col, Form, message, Row } from 'antd'
import FormDatePicker from 'components/form/FormDatePicker';
import FormInputNumber from 'components/form/FormInputNumber';
import FormSelect from 'components/form/FormSelect';
import { formatMoney } from 'utils/dataUtils'
import OrderTextTableOnly from './OrderTextTableOnly';
import BtnSubmit from 'components/CustomButton/BtnSubmit';
import RequestUtils from 'utils/RequestUtils';
import { SUCCESS_CODE } from 'configs';
import { useCallback, useEffect } from 'react';
import FormAutoComplete from 'components/form/FormAutoComplete';

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

const OrderPayment = ({ data }) => {

  const [form] = Form.useForm();
  const watchedVat = Form.useWatch('vat', form);
  const watchedShip = Form.useWatch('shippingCost', form);

  const { onSave, details, customerOrder } = data;

  useEffect(() => {
    form.setFieldValue('vat', customerOrder.vat);
    form.setFieldValue('shippingCost', customerOrder.shippingCost);
  }, [form, customerOrder]);

  const onSubmitPayment = useCallback(async (values) => {
    const { data, errorCode, message: MSG } = await RequestUtils.Post("/pay/manual", {
      orderId: customerOrder.id,
      ...values
    })
    message.info(MSG);
    if (errorCode === SUCCESS_CODE) {
      onSave(data);
    }
  }, [onSave, customerOrder]);

  const subtotal = customerOrder?.subtotal || 0;
  const paid = customerOrder?.paid || 0;
  const monneyVAT = subtotal * ((watchedVat || 0) / 100);
  const total = (watchedShip || 0) + (subtotal + monneyVAT);

  return (
    <div style={{ padding: 15 }}>
      <p><strong>Thông tin đơn hàng #{customerOrder?.code || ''}</strong></p>
      <OrderTextTableOnly details={details} />

      <Form form={form} layout="vertical" onFinish={onSubmitPayment}>
        <Row style={{ marginTop: 20, padding: 15, border: '0.5px dashed #bdafaf' }}>
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
          <Col md={12} xs={12}>
            <p>Tổng đơn: {formatMoney(subtotal)}</p>
          </Col>
          <Col md={12} xs={12}>
            <p>VAT: {formatMoney(monneyVAT)}</p>
          </Col>
          <Col md={12} xs={12}>
            <p>Tổng chi phí: {formatMoney(total)}</p>
          </Col>
          <Col md={12} xs={12}>
            <p>Phí vận chuyển:{formatMoney(watchedShip)}</p>
          </Col>
          <Col md={12} xs={12}>
            <p>Đã thanh toán: {formatMoney(paid)}</p>
          </Col>
          <Col md={12} xs={12}>
            <p>Chiết khấu: {formatMoney(customerOrder?.priceOff || 0)}</p>
          </Col>
          <Col md={12} xs={12}>
            <strong>Còn lại: {formatMoney(total - paid)}</strong>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 20 }}>
          <Col md={12} xs={24}>
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
          <Col md={12} xs={24}>
            <FormInputNumber
              required={false}
              label="Số tiền"
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
    </div>
  )
}

export default OrderPayment
