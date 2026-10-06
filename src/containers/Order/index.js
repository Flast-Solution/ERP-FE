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

import React from 'react';
import { Button, Input, InputNumber, Select, Typography } from 'antd';
import { arrayEmpty, formatterInputNumber, parserInputNumber } from '@flast-erp/core/utils';
import { SaveOutlined, TagOutlined, ShoppingCartOutlined, PlusOutlined, FilePptOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useOrderEditor from './useOrderEditor';
import OrderItemsTable from './OrderItemsTable';
import OrderEditorSummary from './OrderEditorSummary';
import { formatUsdInput, parseUsdInput } from './orderFormatting';
const { Text } = Typography;
const selectNumberOnFocus = event => event.target.select();
const OrderEditorShell = styled.div`
  .ant-input-disabled,
  .ant-input[disabled],
  .ant-input-number-disabled .ant-input-number-input {
    color: #374151;
    -webkit-text-fill-color: #374151;
    opacity: 1;
  }
`;

const BanHangPage = ({
  orderId,
  dataId,
  business,
  onSaveSuccess,
  hideEditColumn = false,
  restrictOrderFields = false,
}) => {

  const editor = useOrderEditor({ orderId, dataId, business, onSaveSuccess, restrictOrderFields });
  const { data, customerOrder, setCustomerOrder, shippingCost, setShippingCost, currency,
    vatRate, isOrder, totalSubOrder, totalOrder,
    formatDisplayAmount, onSubmitOrder, onAddProduct, onAddStock, onOpenFormPayment, onOpenInvoice } = editor;
  const renderOrderAmount = value => <Text style={{ display: 'block', textAlign: 'right', whiteSpace: 'nowrap' }}>
    {formatDisplayAmount(value)}
  </Text>;

  return (
    <OrderEditorShell>
      <OrderItemsTable {...editor} hideEditColumn={hideEditColumn}
        restrictOrderFields={restrictOrderFields} renderOrderAmount={renderOrderAmount} />
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
                disabled={restrictOrderFields}
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
                  setShippingCost(Number(value ?? 0));
                }}
                precision={currency === 'USD' ? 2 : undefined}
                formatter={currency === 'USD' ? formatUsdInput : formatterInputNumber}
                parser={currency === 'USD' ? parseUsdInput : parserInputNumber}
                controls={false}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          {['cohoi', 'opportunity'].includes(customerOrder?.type) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginBottom: 12 }}>
              <div>
                <label htmlFor="order-payment-terms" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Điều kiện thanh toán</label>
                <Select
                  id="order-payment-terms"
                  size="small"
                  allowClear
                  placeholder="Chọn điều kiện thanh toán"
                  style={{ width: '100%' }}
                  value={customerOrder.payOptions?.paymentTerms ?? undefined}
                  options={[
                    { value: 'PREPAID', label: 'Trả trước' },
                    { value: 'POSTPAID', label: 'Trả sau' },
                    { value: 'DEPOSIT', label: 'Đặt cọc' },
                  ]}
                  onChange={value => setCustomerOrder(current => ({ ...current, payOptions: { ...current.payOptions, paymentTerms: value ?? null } }))}
                />
              </div>
              <div>
                <label htmlFor="order-payment-percent" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Thanh toán (%)</label>
                <InputNumber
                  id="order-payment-percent"
                  size="small"
                  min={0}
                  max={100}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  value={customerOrder.payOptions?.paymentPercent}
                  onFocus={selectNumberOnFocus}
                  onChange={value => setCustomerOrder(current => ({ ...current, payOptions: { ...current.payOptions, paymentPercent: value ?? null } }))}
                />
              </div>
            </div>
          )}
          <OrderEditorSummary currency={currency} order={{
            ...customerOrder,
            subtotal: totalSubOrder,
            vat: vatRate,
            total: totalOrder + Number(shippingCost),
            paid: customerOrder?.paid ?? 0,
            priceOff: customerOrder?.priceOff ?? 0,
          }} />
        </div>
      </div>
    </OrderEditorShell>
  );
}

export default BanHangPage;
