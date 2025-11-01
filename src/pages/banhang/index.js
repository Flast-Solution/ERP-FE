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
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import { useParams } from "react-router-dom";
import { useQueryParams } from 'hooks/useQueryParams';

const title = 'Tạo cơ hội bán hàng';
const BanHangPage = (props) => {
	const { orderId } = useParams();
	const { get } = useQueryParams();

	return <>
		<Helmet>
			<title>{title}</title>
		</Helmet>
		<CustomBreadcrumb
			data={[{ title: 'Trang chủ' }, { title: title }]}
		/>
		<Order
			orderId={orderId}
			dataId={get("dataId")}
			{...props}
		/>
	</>;
}

export default BanHangPage;