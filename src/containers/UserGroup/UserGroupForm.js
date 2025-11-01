/**************************************************************************/
/*  ProductForm.js                                                        */
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

import React, { useContext } from 'react'
import { Col, Row } from 'antd'
import CustomButton from 'components/CustomButton'
import FormHidden from 'components/form/FormHidden'
import FormInput from 'components/form/FormInput'
import FormSelect from 'components/form/FormSelect'
import FormSelectInfiniteBusinessUser from 'components/form/SelectInfinite/FormSelectInfiniteBusinessUser'
import { ACTIVE_TYPES, DEPARTMENT } from 'configs/localData'
import { FormContextCustom } from 'components/context/FormContextCustom'

const UserGroupForm = () => {
	const { record } = useContext(FormContextCustom);
	return (
		<Row gutter={16} style={{ marginTop: 20 }}>
			<FormHidden name={'id'} />
			<Col md={12} xs={12}>
				<FormInput
					required
					label="Tên nhóm"
					name="name"
					placeholder={"Nhập họ tên"}
				/>
			</Col>
			<Col md={12} xs={12}>
				<FormSelect 
					required
					name="department"
					label="Phòng ban"
					placeholder='Chọn phòng ban'
					resourceData={DEPARTMENT}
					titleProp='name'
					valueProp='name'
				/>
			</Col>
			<Col md={12} xs={12}>
				<FormSelectInfiniteBusinessUser 
					disabled={ (record?.leaderId || '') !== ''}
					label="Trưởng nhóm" 
					name="leaderId"
					required
					placeholder="Vui lòng chọn User"
				/>
			</Col>
			<Col md={12} xs={12}>
				<FormSelect 
					required
					name="status"
					label="Trạng thái"
					placeholder='Vui lòng chọn Trạng thái'
					resourceData={ACTIVE_TYPES}
					titleProp='text'
					valueProp='value'
				/>
			</Col>
			<Col md={24} xs={24}>
				<FormSelectInfiniteBusinessUser 
					mode="multiple"
					label="Thành viên" 
					name="listMember"
					required
					placeholder="Vui lòng chọn Thành viên"
				/>
			</Col>
			<Col md={24} xs={24}>
				<CustomButton
					htmlType="submit"
					title="Hoàn thành"
					color="danger"
					variant="solid"
				/>
			</Col>
		</Row>
	)
}

export default UserGroupForm
