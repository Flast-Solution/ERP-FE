/**************************************************************************/
/*  UserForm.js                                                           */
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

import React from 'react'
import { Col, Row } from 'antd'
import { 
  FormInput, 
  FormHidden, 
  CustomButton,
  FormSelect
} from "@flast-erp/core/components";

import { USER_STATUS } from '@/configs/localData'

const UserForm = ({ listProFile }) => {
	return (
	   <Row gutter={16} style={{ marginTop: 20 }}>
			<FormHidden name={'id'} />
			<Col md={24} xs={12}>
				<FormInput
					required
					label="Họ tên"
					name="fullName"
					placeholder={"Nhập họ tên"}
				/>
			</Col>
			<Col md={12} xs={12}>
				<FormInput
					required
					label="Số điện thoại"
					name="phone"
					placeholder={"Số điện thoại"}
				/>
			</Col>
			<Col md={12} xs={12}>
				<FormInput
					required
					label="Email"
					name="email"
					placeholder={"Số điện thoại"}
				/>
			</Col>
			<Col md={12} xs={12}>
				<FormInput
					required
					label="Tên tài khoản"
					name="ssoId"
					placeholder={"Tên tài khoản"}
				/>
			</Col>
			<Col md={12} xs={12}>
				<FormInput
					required
					label="Mật khẩu"
					name="password"
					placeholder={"Mật khẩu"}
				/>
			</Col>
			<Col md={12} xs={12}>
				<FormSelect 
					label="Trạng thái" 
					name="status"
					resourceData={USER_STATUS}
					titleProp='text'
					valueProp='value'
				/>
			</Col>
			<Col md={12} xs={24}>
				<FormSelect 
					required
					label="user.accountType"
					name="userProfiles"
					messageRequire="user.accountType.validateMsg.required"
					formItemProps={{ required: true }}
					resourceData={listProFile}
					titleProp='type'
					valueProp='id'
					mode="multiple" 
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

export default UserForm
