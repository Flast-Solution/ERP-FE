/**************************************************************************/
/*  Filter.js                                                           	*/
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
import FormDatePicker from '@/components/form/FormDatePicker'
import FormInput from '@/components/form/FormInput'
import FormSelectInfiniteBusinessUser from '@/components/form/SelectInfinite/FormSelectInfiniteBusinessUser'

const Filter = () => {
  return (
    <div>
      <Row gutter={16}>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormInput
            name={'name'}
            placeholder="Tên vật liệu"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormSelectInfiniteBusinessUser
            name="ssoId"
            label="Sale"
            valueProp="id"
            titleProp='fullName'
            placeholder='Nhân viên'
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormDatePicker
            format='YYYY-MM-DD'
            name='from'
            placeholder="Ngày bắt đầu"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormDatePicker
            format='YYYY-MM-DD'
            name='to'
            placeholder="Ngày kết thúc"
          />
        </Col>
      </Row>
    </div>
  )
};

export default Filter;
