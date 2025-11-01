/**************************************************************************/
/*  HistoryPay.js                                                         */
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

import { Table } from "antd";
import { useEffect, useState } from "react";
import { arrayNotEmpty, dataArray, formatMoney, formatTime } from "utils/dataUtils";
import RequestUtils from "utils/RequestUtils";

const HistoryPay = ({ orderId }) => {
  const [historyPayment, setData] = useState([]);
  useEffect(() => {
    if (orderId) {
      RequestUtils.Get("/pay/list-by-order-id", { orderId: orderId }).then(dataArray).then(setData);
    }
  }, [orderId]);

  const CUSTOM_ACTION = [
    {
      title: "Thanh toán",
      dataIndex: 'monney',
      render: (paid) => formatMoney(paid)
    },
    {
      title: "Thời gian",
      dataIndex: 'inTime',
      render: (inTime) => formatTime(inTime)
    },
    {
      title: "Trạng thái",
      dataIndex: 'isConfirm',
      render: (isConfirm) => isConfirm === 0 ? 'Chưa confirm' : 'Đã confirm'
    }
  ];
  return arrayNotEmpty(historyPayment) ? (
    <Table rowKey={'inTime'} columns={CUSTOM_ACTION} dataSource={historyPayment} pagination={false} />
  ) : (<p style={{ padding: '15px 0px', textAlign: 'center' }}>Chưa có thông tin thanh toán được nhập .!</p>);
}

export default HistoryPay;