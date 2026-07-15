import React, { useMemo } from 'react'
import { Button, Divider, Spin } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { formatMoney } from '@flast-erp/core/utils'

import {
  buildDetailDescription,
  calculateOrderSummary,
  getDetailTotal,
} from '../helpers'
import {
  CompleteButton,
  OrderLine,
  OrderLineHeader,
  SummaryPanel,
  SummaryRow,
  SummaryTitle,
} from '../styles'

const OrderSummaryPanel = ({
  order,
  details,
  loading,
  submitting,
  isEditing,
  onSubmit,
  onBack,
}) => {
  const summary = useMemo(
    () => calculateOrderSummary(order, details),
    [order, details],
  )

  return (
    <SummaryPanel>
      <SummaryTitle>
        Thông tin đơn hàng #{order?.code || ''}
      </SummaryTitle>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : (
        <>
          <OrderLineHeader>
            <span>STT</span>
            <span>Nội dung</span>
            <span style={{ textAlign: 'right' }}>SL</span>
            <span style={{ textAlign: 'right' }}>Thành tiền</span>
          </OrderLineHeader>

          {details.map((detail, index) => {
            const description = buildDetailDescription(detail)
            return (
              <OrderLine key={detail.key ?? index}>
                <span>{index + 1}</span>
                <div>
                  <div className="line-name">{detail.productName || '-'}</div>
                  {description ? (
                    <div className="line-desc">{description}</div>
                  ) : null}
                </div>
                <div className="line-qty">{detail.quantity || 0}</div>
                <div className="line-money">{formatMoney(getDetailTotal(detail))}</div>
              </OrderLine>
            )
          })}

          <Divider />

          <SummaryRow>
            <span>Chọn VAT</span>
            <strong>VAT {summary.vatPercent}%</strong>
          </SummaryRow>
          <SummaryRow>
            <span>Phí vận chuyển</span>
            <strong>{formatMoney(summary.shippingCost)}</strong>
          </SummaryRow>
          <SummaryRow>
            <span>Tổng đơn</span>
            <strong>{formatMoney(summary.subtotal)}</strong>
          </SummaryRow>
          <SummaryRow>
            <span>VAT</span>
            <strong>{formatMoney(summary.vatMoney)}</strong>
          </SummaryRow>
          <SummaryRow className="total">
            <span>Tổng chi phí</span>
            <strong>{formatMoney(summary.grandTotal)}</strong>
          </SummaryRow>

          <Divider />

          <SummaryRow>
            <span>Chiết khấu</span>
            <strong>{formatMoney(summary.priceOff)}</strong>
          </SummaryRow>
          <SummaryRow>
            <span>Đã thanh toán</span>
            <strong>{formatMoney(summary.paid)}</strong>
          </SummaryRow>
          <SummaryRow className="remaining">
            <span>Còn lại</span>
            <strong>{formatMoney(summary.remaining)}</strong>
          </SummaryRow>

          <CompleteButton
            type="primary"
            loading={submitting}
            disabled={submitting}
            icon={<CheckCircleOutlined />}
            onClick={onSubmit}
          >
            {isEditing ? 'Cập nhật' : 'Hoàn thành'}
          </CompleteButton>
        </>
      )}

      <Button
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        style={{ marginTop: 12, width: '100%' }}
      >
        Quay lại
      </Button>
    </SummaryPanel>
  )
}

export default OrderSummaryPanel
