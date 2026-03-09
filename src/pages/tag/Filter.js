/**************************************************************************/
/*  Filter.js                                                             */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui, DuongTM         */
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

const TagFilter = () => {
  return (
    <>
      <Row gutter={16}>
        <Col xl={8} lg={8} md={8} xs={24}>
          <FormInput
            name={'name'}
            placeholder="Tên tag"
            style={{
                border: "1px solid #d9d9d9", 
            }}
          />
        </Col>
        <Col xl={8} lg={8} md={8} xs={24}>
          <FormInput
            name={'slug'}
            placeholder="Slug"
            style={{
                border: "1px solid #d9d9d9", 
            }}
          />
        </Col>
        <Col xl={8} lg={8} md={8} xs={24}>
          <FormInput
            name={'description'}
            placeholder="Mô tả"
            style={{
                border: "1px solid #d9d9d9", 
            }}
          />
        </Col>
      </Row>
    </>
  )
};

export default TagFilter;
