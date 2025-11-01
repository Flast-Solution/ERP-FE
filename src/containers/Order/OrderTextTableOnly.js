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

import React, { useCallback, useEffect, useState } from 'react';
import { Table, Typography } from "antd";
import styled from "styled-components";
import { arrayEmpty, formatMoney } from 'utils/dataUtils';
import { ShowSkuDetail } from 'containers/Product/SkuView';

const { Text } = Typography;
const COL_SPAN_0 = { props: { colSpan: 0 } };
const COL_SPAN_4 = { props: { colSpan: 4 } };

const StyledTable = styled.div`
	.main-row td:first-child {
		position: relative;
	}

	/* Đường viền nằm dưới cùng của ô STT (dưới dòng phụ) */
	.main-row td:first-child::after {
		content: "";
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		border-bottom: 1px solid #d9d9d9;
	}
`;

const OrderTextTableOnly = ({ details }) => {

	const [rawData, setRawData] = useState([]);
	const generateRaws = useCallback((datas) => {
		let raws = [];
		if (arrayEmpty(datas)) {
			return []
		}
		let key = 0;
		for (let detail of datas) {
			key++;
			let raw = { ...detail, isNoiDungMoRong: false, key: `${key}-main` }
			raws.push(raw);
			raws.push({
				isNoiDungMoRong: true,
				key: `${key}-sub`,
				mSkuDetails: detail.mSkuDetails
			});
		}
		return raws;
	}, []);

	useEffect(() => {
		let raws = generateRaws(details);
		setRawData(raws);
		/* eslint-disable-next-line */
	}, [details]);

	const columns = [
		{
			title: "STT",
			dataIndex: "key",
			width: 60,
			align: "center",
			render: (_, record, index) => {
				if (record.isNoiDungMoRong) {
					return { ...COL_SPAN_0 };
				}
				return {
					children: Math.floor(index / 2) + 1,
					props: { rowSpan: 2 }
				};
			}
		},
		{
			title: "Nội dung",
			key: "noidung",
			render: (_, record) => {
				if (record.isNoiDungMoRong) {
					return {
						children: <ShowSkuDetail skuInfo={record.mSkuDetails} />,
						...COL_SPAN_4
					};
				}
				return <Text>{record.productName}</Text>
			}
		},
		{
			title: "Số lượng",
			dataIndex: "quantity",
			align: "center",
			render: (text, record) =>
				record.isNoiDungMoRong ? COL_SPAN_0 : text
		},
		{
			title: "Đơn giá",
			dataIndex: "price",
			align: "center",
			render: (price, record) => record.isNoiDungMoRong ? COL_SPAN_0 : (
				<>
					{formatMoney(price)}
					{record.discountAmount > 0 &&
						<strong><br />Giảm: ({formatMoney(record.discountAmount)}) </strong>
					}
				</>
			)
		},
		{
			title: "Thành tiền",
			dataIndex: "totalPrice",
			align: "center",
			render: (totalPrice, record) => record.isNoiDungMoRong ? COL_SPAN_0 : (
				<Text strong>{record.discountAmount > 0
					? formatMoney(totalPrice - record.discountAmount)
					: formatMoney(totalPrice)}
				</Text>
			)
		}
	];

	return (
		<StyledTable>
			<Table
				columns={columns}
				dataSource={rawData}
				pagination={false}
				bordered
				rowClassName={(record) => (record.isNoiDungMoRong ? "sub-row" : "main-row")}
			/>
		</StyledTable>
	)
};

export default OrderTextTableOnly;