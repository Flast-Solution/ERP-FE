/**************************************************************************/
/*  index.js                                                          		*/
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
import { Table } from 'antd';
import { formatMoney, formatTime } from 'utils/dataUtils';

const DuyetTienPage = ({ data }) => {
	const CUSTOM_ACTION = [
		{
			title: "Code",
			dataIndex: 'code',
		},
		{
			title: "Thời gian",
			dataIndex: 'confirmTime',
			ellipsis: true,
			render: (confirmTime) => formatTime(confirmTime)
		},
		{
			title: "Nội dung",
			dataIndex: 'content',
			ellipsis: true
		},
		{
			title: "Trạng thái",
			dataIndex: 'isConfirm',
			ellipsis: true,
			render: (isConfirm) => isConfirm ? 'Đã duyệt': 'Chưa duyệt'
		},
		{
			title: "Phương thức",
			dataIndex: 'method',
			ellipsis: true
		},
		{
			title: "Tổng tiền",
			dataIndex: 'amount',
			ellipsis: true,
			render: (amount) => formatMoney(amount)
		},
	];

	return (
		<div>
			<p><strong>Danh sách chi tiết thanh toán</strong></p>
			<Table 
				dataSource={data} 
				pagination={false} 
				scroll={{ x: 1700 }} 
				columns={CUSTOM_ACTION} 
			/>
		</div>
	)
}

export default DuyetTienPage;