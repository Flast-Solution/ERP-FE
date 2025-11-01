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
import FormInfiniteShipStatus from 'components/form/SelectInfinite/FormInfiniteShipStatus';
import FormInfiniteStock from 'components/form/SelectInfinite/FormInfiniteStock';
import FormSelectInfiniteBusinessUser from 'components/form/SelectInfinite/FormSelectInfiniteBusinessUser';
import FormSelectInfiniteProduct from 'components/form/SelectInfinite/FormSelectInfiniteProduct';

const ShipFilter = () => (
  <Row gutter={16}>
    <Col xl={6} lg={6} md={6} xs={24}>
      <FormSelectInfiniteProduct
        placeholder="Sản phẩm"
      />
    </Col>
    <Col xl={6} lg={6} md={6} xs={24}>
      <FormInfiniteStock
        placeholder="Kho"
      />
    </Col>
    <Col xl={6} lg={6} md={6} xs={24}>
      <FormInput
        name="orderCode"
        placeholder="Mã đơn"
      />
    </Col>
    <Col xl={6} lg={6} md={6} xs={24}>
      <FormSelectInfiniteBusinessUser
        name="userId"
        placeholder="Nhân viên"
      />
    </Col>
    <Col xl={6} lg={6} md={6} xs={24}>
      <FormInput
        name="detailCode"
        placeholder="Mã con"
      />
    </Col>
    <Col xl={6} lg={6} md={6} xs={24}>
      <FormInput
        name="transporterCode"
        placeholder="Mã vận đơn"
      />
    </Col>
    <Col xl={6} lg={6} md={6} xs={24}>
      <FormInfiniteShipStatus
        placeholder="Chọn trạng thái"
      />
    </Col>
  </Row>
)

export default ShipFilter;