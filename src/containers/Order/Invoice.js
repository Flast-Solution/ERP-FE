/**************************************************************************/
/*  Invoice.js                                                         		*/
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

import React, { useRef, useState } from 'react';
import { Row, Col, Table, Typography } from 'antd';
import OrderTextTableOnly from './OrderTextTableOnly';
import { useReactToPrint } from "react-to-print";
import CustomButton from 'components/CustomButton';
import { formatMoney } from 'utils/dataUtils';
import { formatPhoneNumber } from 'utils/tools';
import { useEffectAsync } from 'hooks/MyHooks';
import UserService from 'services/UserService';
import HeaderCompany from 'components/common/HeaderCompany';
import { StyledHeaderInvoice } from "css/global";

const { Title, Text } = Typography;

const InvoicePage = ({
	customer,
	customerOrder
}) => {
	const { userCreateId } = customerOrder;
	const [user, setUser] = useState();

	useEffectAsync(async () => {
		const [error, data] = await UserService.findId(userCreateId);
		if (!error) {
			setUser(data);
		}
	}, [userCreateId]);

	return (
		<StyledHeaderInvoice style={{ background: '#fff', marginBottom: 40 }}>
			<HeaderCompany />
			<Title level={3} style={{ textAlign: 'center', marginTop: '20px' }}>
				HÓA ĐƠN BÁN HÀNG
			</Title>

			<Row gutter={4} style={{ marginTop: '20px' }}>
				<Col span={12}>
					<p className='title'>THÔNG TIN KHÁCH HÀNG</p>
					<Table
						className='row_padding_small'
						showHeader={false}
						dataSource={[
							{ key: '1', label: 'Công ty:', value: customer.companyName || 'N/A' },
							{ key: '2', label: 'Địa chỉ:', value: customer.address || '' },
							{ key: '3', label: 'Số điện thoại:', value: formatPhoneNumber(customer.mobile) },
							{ key: '4', label: 'Người liên hệ:', value: customer.name }
						]}
						columns={[
							{ dataIndex: 'label', key: 'label' },
							{ dataIndex: 'value', key: 'value' }
						]}
						pagination={false}
						bordered
					/>
				</Col>
				<Col span={12}>
					<p className='title'>
						THÔNG TIN ĐẠI DIỆN
					</p>
					<Table
						className='row_padding_small'
						showHeader={false}
						dataSource={[
							{ key: '1', label: 'Bộ phận:', value: 'Phòng kinh doanh' },
							{ key: '2', label: 'Đại diện:', value: user?.ssoId },
							{ key: '3', label: 'Số điện thoại:', value: formatPhoneNumber(user?.phone) },
							{ key: '4', label: 'Email:', value: user?.email }
						]}
						columns={[
							{ dataIndex: 'label', key: 'label' },
							{ dataIndex: 'value', key: 'value' }
						]}
						pagination={false}
						bordered
					/>
				</Col>
			</Row>
		</StyledHeaderInvoice>
	)
};

const Invoice = ({ data }) => {

	const contentRef = useRef();
	const reactToPrintFn = useReactToPrint({ contentRef });

	const { customer, details, customerOrder } = data;
	const monneyVAT = customerOrder.subtotal * (customerOrder.vat || 0) / 100;

	return <>
		<div ref={contentRef} style={{ padding: 25, marginTop: 20 }}>
			<InvoicePage
				customer={customer}
				customerOrder={customerOrder}
			/>
			<p><strong>Đơn hàng #{customerOrder?.code || ''}</strong></p>
			<OrderTextTableOnly details={details} />
			<table
				id="pay__order__info"
				cellSpacing={0}
				cellPadding={0}
				border={0}
				width="100%"
				style={{ textAlign: "right", marginTop: 30 }}
			>
				<tbody>
					<tr id="tpri">
						<td align="right" width="70%" style={{ padding: "4px 12px" }}>
							Tổng chi phí:
						</td>
						<td className="total" width="30%" style={{ padding: "4px 12px" }}>
							{formatMoney(customerOrder.subtotal)}
						</td>
					</tr>
					<tr>
						<td align="right" width="70%" style={{ padding: "4px 12px" }}>
							Chiết khấu:
						</td>
						<td className="ck" width="30%" style={{ padding: "4px 12px" }}>
							{formatMoney(customerOrder.priceOff)}
						</td>
					</tr>
					<tr>
						<td align="right" width="70%" style={{ padding: "4px 12px" }}>
							Phí vận chuyển:
						</td>
						<td width="30%" style={{ padding: "4px 12px" }}>
							{formatMoney(customerOrder.shippingCost)}
						</td>
					</tr>
					<tr>
						<td align="right" width="70%" style={{ padding: "4px 12px" }}>
							Phí VAT:
						</td>
						<td className="vt" width="30%" style={{ padding: "4px 12px" }}>
							{formatMoney(monneyVAT)}
						</td>
					</tr>
					<tr id="vorh">
						<td align="right" width="70%" style={{ padding: "12px 12px 0" }}>
							<b>Tổng thanh toán:</b>
						</td>
						<td className="total" width="30%" style={{ padding: "12px 12px 0" }}>
							<div style={{ fontSize: 16, fontWeight: 700 }}>{formatMoney(customerOrder.total)}</div>
						</td>
					</tr>
				</tbody>
			</table>
			<Row justify="space-between" style={{ marginTop: '40px', padding: '10px 0' }}>
				<Col style={{ textAlign: 'center' }} span={8}>
					<Text strong>Khách hàng</Text>
				</Col>
				<Col span={8} offset={8}>
					<Text strong>Người lập hóa đơn</Text>
					<div style={{ height: 80 }} />
					<Text style={{ display: 'block', marginTop: '5px' }}>Ngày .... tháng .... năm 202..</Text>
				</Col>
			</Row>
		</div>
		<div style={{ display: 'flex', justifyContent: 'end', marginTop: 20 }}>
			<CustomButton onClick={reactToPrintFn} title="In PDF" />
		</div>
	</>
}

export default Invoice;