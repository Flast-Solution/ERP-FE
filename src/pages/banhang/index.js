/**************************************************************************/
/*  index.js                                                           		*/
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

import Order from 'containers/Order';
import { Helmet } from 'react-helmet';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useLocation, useParams } from "react-router-dom";
import { useQueryParams } from '@flast-erp/core/hooks';

const title = 'Tạo cơ hội bán hàng';
const BanHangPage = (props) => {
	const { orderId } = useParams();
	const { state } = useLocation();
	const { get } = useQueryParams();
	const isOrder = get('type') === 'order';
	const pageTitle = isOrder
		? 'Chỉnh sửa đơn hàng'
		: orderId
			? 'Chỉnh sửa cơ hội bán hàng'
			: title;

	return <>
		<Helmet>
			<title>{pageTitle}</title>
		</Helmet>
		<BreadcrumbCustom
			data={[{ title: 'Trang chủ' }, { title: pageTitle }]}
		/>
		<Order
			orderId={orderId}
			dataId={get("dataId")}
			business={state?.business ?? null}
			{...props}
		/>
	</>;
}

export default BanHangPage;
