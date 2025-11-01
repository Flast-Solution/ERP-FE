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

import { Row, Col } from 'antd';
import FormInput from 'components/form/FormInput';
import FormSelectUser from 'components/form/FormSelectUser';

const CustomerFilter = ({ taxCode = false }) => (
  <Row gutter={16}>
    {taxCode && 
      <Col xl={6} lg={6} md={6} xs={24}>
        <FormInput
          name={'tax'}
          placeholder="Mã số thuế"
        />
      </Col>
    }
    <Col xl={6} lg={6} md={6} xs={24}>
      <FormInput
        name={'name'}
        placeholder="Tìm theo tên"
      />
    </Col>
    <Col xl={6} lg={6} md={6} xs={24}>
      <FormInput
        name={'phone'}
        placeholder="Số điện thoại"
      />
    </Col>
    <Col xl={6} lg={6} md={6} xs={24}>
      <FormInput
        name={'email'}
        placeholder="Email"
      />
    </Col>
    <Col xl={6} lg={6} md={6} xs={24}>
      <FormSelectUser
        required={false}
        name="saleId"
        label="Sale"
        placeholder="Sale"
        valueProp="id"
        titleProp="fullName"
      />
    </Col>
  </Row>
)

export default CustomerFilter;