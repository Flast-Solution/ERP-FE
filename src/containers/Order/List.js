/**************************************************************************/
/*  List.js                                                         		  */
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

import React, { useState, useCallback } from 'react';
import { Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import RestList from "components/RestLayout/RestList";
import useGetList from "hooks/useGetList";
import Filter from './Filter';
import { dateFormatOnSubmit, formatMoney, formatTime } from 'utils/dataUtils';
import OrderService from 'services/OrderService';
import { InAppEvent } from 'utils/FuseUtils';
import { HASH_MODAL } from 'configs';
import { renderArrayColor } from './utils';

const copyToClipboard = (text, setCopiedIndex, index) => {
  navigator.clipboard.writeText(text).then(() => {
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    message.success('Đã copy vào lệnh Ctrl+C');
  })
};

const ListOrder = ({ filter }) => {

  const [ copiedIndex, setCopiedIndex ] = useState(null);
  const onClickViewDetail = (customerOrder) => InAppEvent.emit(HASH_MODAL, {
    hash: "#order.tabs",
    title: "Thông tin đơn hàng " + customerOrder.code,
    data: { customerOrder }
  });

  const columns = [
    {
      title: 'Kinh doanh',
      dataIndex: 'userCreateUsername',
      key: 'userCreateUsername',
      width: 120,
      ellipsis: true
    },
    {
      title: 'Mã đơn',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      ellipsis: true,
      render: (text, record, index) => (
        <span
          onClick={() => copyToClipboard(text, setCopiedIndex, index)}
          style={{
            cursor: 'pointer',
            color: copiedIndex === index ? '#52c41a' : 'inherit',
            transition: 'color 0.3s ease',
          }}
        >
          <CopyOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      )
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'products',
      key: 'products',
      width: 150,
      ellipsis: true,
      render: (products, record) => renderArrayColor(products, record.detailstatus)
    },
    {
      title: 'T.Thái',
      dataIndex: 'detailstatus',
      key: 'detailstatus',
      width: 150,
      ellipsis: true,
      render: (array, record) => renderArrayColor(array, record.detailstatus)
    },
    {
      title: 'T.G Chốt',
      dataIndex: 'opportunityAt',
      key: 'opportunityAt',
      width: 120,
      ellipsis: true,
      render: (time) => formatTime(time)
    },
    {
      title: 'Họ tên',
      dataIndex: 'customerReceiverName',
      key: 'customerReceiverName',
      width: 130,
      ellipsis: true
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'customerMobilePhone',
      key: 'customerMobilePhone',
      width: 130,
      ellipsis: true
    },
    {
      title: 'Tỉnh/T.P',
      dataIndex: 'customerAddress',
      key: 'customerAddress',
      width: 120,
      ellipsis: true,
      render: (address) => address || '(Chưa có)'
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      ellipsis: true,
      render: (time) => formatTime(time)
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      ellipsis: true,
      render: (total) => formatMoney(total)
    },
    {
      title: 'Giảm giá',
      dataIndex: 'priceOff',
      key: 'priceOff',
      width: 130,
      ellipsis: true,
      render: (priceOff) => formatMoney(priceOff)
    },
    {
      title: 'Phí ship',
      dataIndex: 'shippingCost',
      key: 'shippingCost',
      width: 130,
      ellipsis: true,
      render: (shippingCost) => formatMoney(shippingCost)
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paid',
      key: 'paid',
      width: 130,
      ellipsis: true,
      render: (paid) => formatMoney(paid)
    },
    {
      title: 'Còn lại',
      key: 'remainingAmount',
      width: 130,
      ellipsis: true,
      render: (record) => formatMoney(record.total - record.paid)
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (record) => (
        <span style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            size="small"
            onClick={() => onClickViewDetail(record)}
          >
            Chi tiết
          </Button>
          <Button size="small" style={{ color: "#fa8c16" }}>
            Báo giá
          </Button>
        </span>
      )
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onData = useCallback(async (response) => {
    return OrderService.viewInTable(response);
  }, []);

  return (
    <RestList
      rowKey="id"
      bordered
      xScroll={1800}
      onData={onData}
      initialFilter={{ limit: 10, page: 1, ...filter }}
      filter={<Filter />}
      hasCreate={false}
      beforeSubmitFilter={beforeSubmitFilter}
      useGetAllQuery={useGetList}
      apiPath={'order/fetch'}
      columns={columns}
    />
  )
};

export default ListOrder;