/**************************************************************************/
/*  Filter.js                                                             */
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
import FormInput from '@erp/shared/dist/components/form/FormInput'
import FormAutoCompleteInfinite from '@erp/shared/dist/components/form/AutoCompleteInfinite/FormAutoCompleteInfinite'
import FormSelectInfiniteBusinessUser from '@erp/shared/dist/components/form/SelectInfinite/FormSelectInfiniteBusinessUser'
import { useGetAllProductQuery } from '@erp/shared/dist/hooks/useData'
import FormDatePicker from '@erp/shared/dist/components/form/FormDatePicker'

const Filter = () => {
  return (
    <Row gutter={16}>
      <Col xl={6} lg={6} md={6} xs={24}>
        <FormInput
          name={'code'}
          placeholder="Mã đơn"
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
          placeholder="Đến ngày"
        />
      </Col>
      <Col xl={6} lg={6} md={6} xs={24}>
        <FormInput
          name={'customerMobile'}
          placeholder="Số ĐT"
        />
      </Col>
      <Col xl={6} lg={6} md={6} xs={24}>
        <FormAutoCompleteInfinite
          useGetAllQuery={useGetAllProductQuery}
          label="Sản phẩm"
          filterField="name"
          name="productName"
          valueProp="name"
          searchKey="name"
          required={false}
          placeholder="Tìm kiếm Sản phẩm"
        />
      </Col>
      <Col xl={6} lg={6} md={6} xs={24}>
        <FormSelectInfiniteBusinessUser
          placeholder="Kinh doanh"
          name="userCreatedId"
        />
      </Col>
    </Row>
  )
}

export default Filter
