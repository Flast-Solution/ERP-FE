/**************************************************************************/
/*  ChartActivityRevenue.js                                               */
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
import { Column } from '@ant-design/plots';

const formatDate = (dateStr) => {
  const [month, day] = dateStr.split('-');
  return `${day}-${month}`;
};

const ChartActivityRevenue = ({ activityRevenue }) => {

  const dataRevenue = Array.from({ length: 6 }, (_, idx) => {
    const date = new Date(2024, idx, 1);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedInput = `${month}-${day}`;
    return {
      year: formatDate(formattedInput),
      value: (100000 * (idx + 1)).toLocaleString('vi-VN'),
      type: 'Doanh số hoàn thành thực tế',
    };
  });

  const config = {
    data: dataRevenue,
    isGroup: true,
    xField: 'year',
    yField: 'value',
    seriesField: 'type',
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    legend: {
      position: 'bottom',
    },
    tooltip: {
      formatter: (datum) => ({
        name: datum.type,
        value: datum.type === 'Doanh thu'
          ? `${datum.value.toLocaleString('vi-VN')} ₫`
          : datum.value.toLocaleString('vi-VN'),
      }),
    },
    color: (type) => {
      return '#5B8FF9';
    }
  }
  return (
    <div style={{ height: '100%' }}>
      <Column {...config} />
    </div>
  )
};

export default ChartActivityRevenue;
