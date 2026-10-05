import React from 'react';
import { Table } from 'antd';
import { formatMoneyAmount } from '../../utils/formatCurrency';
import { getPaymentLineTotal } from './paymentAmounts';
import { parseOrderLine } from './orderLine';

/**************************************************************************/
/*  OrderTextTableOnly.js                                                 */
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


const OrderTextTableOnly = ({ details = [], currency = 'VND', orderCurrency = 'VND', exchangeRate = 1 }) => {
  const displayVnd = value => formatMoneyAmount(currency === 'USD' ? value / exchangeRate : value, currency);
  const columns = [
    { title: 'STT', width: 60, align: 'center', render: (_, record, index) => index + 1 },
    {
      title: 'Nội dung',
      dataIndex: 'productName',
      render: (name, detail) => (
        <div style={{ overflowWrap: 'anywhere' }}>
          <div>{name}</div>
          {Object.entries(parseOrderLine(detail.orderLine)).map(([label, value]) => (
            <div key={label} style={{ marginTop: 4 }}>
              <strong>{label}: </strong>
              {value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
            </div>
          ))}
        </div>
      ),
    },
    { title: 'Số lượng', dataIndex: 'quantity', align: 'right', width: 110 },
    { title: 'Đơn vị', dataIndex: 'unit', width: 85, render: value => value || '—' },
    { title: 'Đơn giá', dataIndex: 'price', align: 'right', render: value => displayVnd(Number(value ?? 0)) },
    { title: 'Thành tiền', align: 'right', render: (_, detail) => <strong>{displayVnd(getPaymentLineTotal(detail, orderCurrency, exchangeRate))}</strong> },
  ];
  return <Table size="small" bordered pagination={false} columns={columns} dataSource={details ?? []} rowKey={record => record.id ?? record.detailId ?? record.key} scroll={{ x: 680 }} />;
};

export default OrderTextTableOnly;
