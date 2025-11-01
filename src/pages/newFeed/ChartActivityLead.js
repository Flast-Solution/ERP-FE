/**************************************************************************/
/*  ChartActivityLead.js                                                  */
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

import React, { useEffect, useState } from 'react';
import { Column } from '@ant-design/plots';
import RequestUtils from 'utils/RequestUtils';

const ChartActivityLead = ({ activityLead }) => {
  const [listSale, setListSale] = useState([]);
  const result = [];

  useEffect(() => {
    (async () => {
      const { data } = await RequestUtils.Get('/user/list-sale');
      if (data) {
        setListSale(data);
      }
    })()
  }, [])

  activityLead?.forEach((item) => {
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    // Ví dụ kết quả: "20/05"    
    item.data.forEach((entry) => {
      const nameSale = listSale.find(f => f.id === entry.saleId);

      result.push({
        name: nameSale?.ssoId, // hoặc dùng entry.saleId nếu bạn muốn giữ nguyên
        day: dateStr,
        value: entry.total,
        type: nameSale?.ssoId,
      });
    });
  });

  const config = {
    data: result || [],
    xField: 'day',
    yField: 'value',
    isGroup: true,
    isStack: true,
    seriesField: 'type',
    groupField: 'name',
    columnWidthRatio: 1,
  };

  return (
    <div>
      <Column {...config} />
    </div>
  )
}

export default ChartActivityLead
