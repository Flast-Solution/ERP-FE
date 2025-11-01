/**************************************************************************/
/*  useGetList.js                                                 				*/
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

import { useCallback, useEffect, useState, useContext } from "react";
import RequestUtils from "utils/RequestUtils";
import MyContext from 'DataContext';
import { useUpdateEffect } from "hooks/MyHooks";

function useGetList({
	queryParams: filter,
	onData
}) {

	const { f5List } = useContext(MyContext)
	const [ loading, setLoading ] = useState(true);
	const [ data, setData ] = useState();

	const fetchResource = useCallback((values) => {
		const { apiPath, ...params } = values;
		setLoading(true);
		RequestUtils.Get('/' + apiPath, params).then(async ({ data, errorCode }) => {
			if (errorCode !== 200) {
				return Promise.reject("Get not success from server .!");
			}
			Promise.resolve(onData(data)).then(setData);
			setLoading(false);
		}).catch(e => {
			console.log('[hook.useGetList] Error ', e);
			setLoading(false);
		});
	}, [onData]);

	useEffect(() => {
		fetchResource(filter);
		/* eslint-disable-next-line */
	}, [filter]);

	useUpdateEffect(() => {
		if (f5List?.apiPath === filter.apiPath) {
			fetchResource(filter);
		}
	}, [f5List, filter]);

	return {
		data,
		loading
	};
}

export default useGetList;
