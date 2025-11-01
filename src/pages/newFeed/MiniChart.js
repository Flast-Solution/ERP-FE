/**************************************************************************/
/*  MiniLineChart.js                                                      */
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
import { Area } from '@ant-design/plots';


const MiniLineChart = ({
    data
}) => {
    const chartData = data.map((y, index) => ({ x: index, y }));

    const config = {
        data: chartData,
        xField: 'x',
        yField: 'y',
        height: 36,
        padding: [0, 0, 0, 0],
        smooth: true,
        xAxis: false,
        yAxis: false,
        tooltip: false,
        line: {
            style: {
                stroke: '#2f3e94',
                lineWidth: 2,
            },
        },
        areaStyle: () => {
            return {
                fill: 'l(270) 0:#ffffff 0.4:#c5d1f4 0.8:#9fb4f4 1:#ffffff00',
            };
        },
        animation: false,
    };

    return <Area {...config} />;
};

export default MiniLineChart;
