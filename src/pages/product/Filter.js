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

import { useEffect } from 'react';
import { Row, Col } from 'antd';
import {
  FormInput,
  FormSelectUser,
  FormSelect,
  FormDatePicker
} from '@flast-erp/core/components';
import { RequestUtils } from '@flast-erp/core/utils';

const PRODUCT_STATUS_OPTIONS = [
  { id: 1, name: 'Kích hoạt' },
  { id: 0, name: 'Ngưng' }
];

const ProductFilter = () => {
  useEffect(() => {
    let active = true;

    RequestUtils.Get('/entity-status/list-by-type', { type: 'PRODUCT' })
      .then((response) => {
        if (active) {
          console.log('[ProductFilter] entity status response:', response);
        }
      })
      .catch((error) => {
        if (active) {
          console.error('[ProductFilter] entity status error:', error);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Row gutter={16}>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormInput
            name={'name'}
            placeholder="Tên sản phẩm"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormInput
            label="Tìm theo dữ liệu workflow"
            name="workflowDataKeyword"
            placeholder="Tìm theo dữ liệu workflow"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormInput
            label="Tên thiết lập"
            name="attributedName"
            placeholder="Nhập tên thiết lập"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormInput
            label="Giá trị thiết lập"
            name="attributedValue"
            placeholder="Nhập giá trị thiết lập"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormSelectUser
            name="createdBy"
            label="Nhân viên"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormSelect
            label="Trạng thái"
            name="status"
            valueProp="id"
            titleProp='name'
            resourceData={PRODUCT_STATUS_OPTIONS}
            placeholder='Lọc theo trạng thái'
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormDatePicker
            format='YYYY-MM-DD'
            name='from'
            placeholder="Start date filter"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormDatePicker
            format='YYYY-MM-DD'
            name='to'
            placeholder="End date filter"
          />
        </Col>
      </Row>
    </>
  );
}

export default ProductFilter;
