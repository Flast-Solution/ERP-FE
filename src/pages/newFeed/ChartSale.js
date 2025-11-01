/**************************************************************************/
/*  ChartSale.js                                                          */
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
import { Line } from '@ant-design/plots';

const ChartSale = ({ activityRevenue }) => {

    const data = [
        {
            step: 'Phương án/ Báo giá',
            value: 1,
        },
        {
            step: 'Xác minh khách hàng',
            value: 4,
        },
    ];
    if (!data || data.length === 0) return <></>
    const config = {
        data,
        xField: 'step',
        yField: 'value',
        smooth: true,
        lineStyle: {
            stroke: '#2B6CB0', // Màu xanh dương
            lineWidth: 3,
        },
        point: {
            size: 4,
            shape: 'circle',
            style: {
                fill: '#2B6CB0',
                stroke: '#fff',
                lineWidth: 1,
            },
        },
        tooltip: {
            formatter: (datum) => ({
                name: 'Số tiền',
                value: `${datum.value.toLocaleString('vi-VN')} ₫`,
            }),
        },
        yAxis: {
            label: {
                formatter: (v) => `${Number(v).toLocaleString('vi-VN')} ₫`,
            },
            title: {
                text: 'Số tiền',
            },
        },
        xAxis: {
            title: {
                text: '',
            },
        },
    };
    return (
        <div style={{ height: '100%' }}>
            <Line {...config} />
        </div>
    );
};

export default ChartSale;
