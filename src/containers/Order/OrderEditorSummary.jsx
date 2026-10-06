import React from 'react';
import { Table } from 'antd';
import { CURRENCY_USD } from './orderEditorModel';
import { formatOrderCurrency as formatCurrencyAmount } from './orderFormatting';
const OrderEditorSummary = ({
  order, currency = CURRENCY_USD
}) => {
  const displayAmount = value => formatCurrencyAmount(Number(value ?? 0), currency);
  const { subtotal, vat, priceOff, total, paid } = order;
  const data = [
    {
      key: '1',
      leftLabel: 'Tổng chưa VAT',
      leftValue: displayAmount(subtotal),
      rightLabel: 'VAT',
      rightValue: displayAmount(subtotal * (vat / 100))
    },
    {
      key: '2',
      leftLabel: 'C.Khấu | Voucher',
      leftValue: displayAmount(priceOff),
      rightLabel: 'Tổng tiền',
      rightValue: displayAmount(total)
    },
    {
      key: '3',
      leftLabel: 'Đã thanh toán',
      leftValue: displayAmount(paid),
      rightLabel: 'Còn lại',
      rightValue: displayAmount(total - paid)
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

export default OrderEditorSummary;
