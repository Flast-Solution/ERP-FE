/**************************************************************************/
/* pages.ketoan.DuyetTien.js                                              */
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

import React, { useCallback, useState } from 'react';
import { Button } from 'antd';
import { Helmet } from 'react-helmet';
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import RestList from 'components/RestLayout/RestList';
import Filter from './Filter';
import useGetList from "hooks/useGetList";
import { dateFormatOnSubmit } from 'utils/dataUtils';
import { ORDER_COLUMN_ACTION } from 'containers/Order/utils';
import { HASH_MODAL } from 'configs';
import { InAppEvent } from 'utils/FuseUtils';
import OrderService from 'services/OrderService';

const DuyetTienPage = () => {

	const [ title ] = useState("Đơn hàng duyệt lệnh thanh toán");
	const onClickViewDetail = (customerOrder) => InAppEvent.emit(HASH_MODAL, {
		hash: "#order.tabs",
		title: "Thông tin đơn hàng " + customerOrder.code,
		data: { customerOrder }
	});

  const CUSTOM_ACTION = [
		...ORDER_COLUMN_ACTION,
		{
			title: 'Action',
			fixed: 'right',
			width: 100,
			render: (record) => (
				<Button
					type="primary"
					size="small"
					onClick={() => onClickViewDetail(record)}
				>
					Duyệt lệnh
				</Button>
			)
		}
  ];

  const beforeSubmitFilter = useCallback((values) => {
		dateFormatOnSubmit(values, ['from', 'to']);
		return values;
  }, []);

  const onData = useCallback(async (response) => {
		return OrderService.viewInTable(response);
  }, []);

  return (
		<div>
			<Helmet>
				<title>{title}</title>
			</Helmet>
			<CustomBreadcrumb
				data={[{ title: 'Trang chủ' }, { title: title }]}
			/>
			<RestList
				xScroll={1200}
				onData={onData}
				initialFilter={{ limit: 10, page: 1 }}
				filter={<Filter />}
				beforeSubmitFilter={beforeSubmitFilter}
				useGetAllQuery={useGetList}
				hasCreate={false}
				apiPath={'pay/list-order-payment'}
				columns={CUSTOM_ACTION}
			/>
		</div>
  )
}

export default DuyetTienPage
