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

import { Row, Col } from 'antd';
import FormInput from '@/components/form/FormInput';
import FormSelect from '@/components/form/FormSelect';
import FormDatePicker from '@/components/form/FormDatePicker';
import { ACTIVE_TYPES } from '@/configs/localData';
import FormCategoryPost from '@/components/form/SelectInfinite/FormCategoryPost';

const ProductFilter = () => {
  return (
    <>
      <Row gutter={16}>
        <Col xl={4} lg={4} md={4} xs={24}>
          <FormInput
            name={'name'}
            placeholder="Tên bài viết"
          />
        </Col>
        <Col xl={5} lg={5} md={5} xs={24}>
          <FormCategoryPost
            name={'cateId'}
            placeholder="Danh mục bài"
          />
        </Col>
        <Col xl={5} lg={5} md={5} xs={24}>
          <FormSelect
            label="Trạng thái"
            valueProp="value"
            titleProp='text'
            resourceData={ACTIVE_TYPES}
            placeholder='Lọc theo trạng thái'
          />
        </Col>
        <Col xl={5} lg={5} md={5} xs={24}>
          <FormDatePicker
            format='YYYY-MM-DD'
            name='from'
            placeholder="Từ ngày"
          />
        </Col>
        <Col xl={5} lg={5} md={5} xs={24}>
          <FormDatePicker
            format='YYYY-MM-DD'
            name='to'
            placeholder="Đến ngày"
          />
        </Col>
      </Row>
    </>
  )
};

export default ProductFilter;