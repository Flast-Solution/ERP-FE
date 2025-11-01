/**************************************************************************/
/*  FormSelectUser.js                                                     */
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

import { useState } from 'react';
import FormSelect from './FormSelect';
import RequestUtils from 'utils/RequestUtils';
import { arrayNotEmpty } from 'utils/dataUtils';
import { useEffectAsync } from 'hooks/MyHooks';

const FormSelectUser = ({ name, label, filter, ...props }) => {

	const [data, setData] = useState([]);
	useEffectAsync(async () => {
		const { data } = await RequestUtils.Get('/user/list', filter);
		if (arrayNotEmpty(data?.embedded)) {
			setData(data.embedded);
		}
	}, [filter]);

	return (
		<FormSelect
			label={label}
			placeholder={label}
			name={name || 'ssoId'}
			valueProp="id"
			titleProp="ssoId"
			resourceData={data}
			{...props}
		/>
	);
}

export default FormSelectUser;