/**************************************************************************/
/*  LeadFilter.js                                                         */
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
import FormDatePicker from 'components/form/FormDatePicker';
import FormInput from 'components/form/FormInput';
import FormSelect from 'components/form/FormSelect';
import { STATUS_LEAD } from 'configs/constant';
import { CHANNEL_SOURCE } from 'configs/localData';

const statusData = [
  { id: STATUS_LEAD.CREATE_DATA, name: 'Tạo dữ liệu' },
  { id: STATUS_LEAD.DO_NOT_MANUFACTORY, name: 'Không sản xuất' },
  { id: STATUS_LEAD.IS_CONTACT, name: 'Đang liên lạc' },
  { id: STATUS_LEAD.CONTACT_LATER, name: 'Liên hệ sau' },
  { id: STATUS_LEAD.KO_LIEN_HE_DUOC, name: 'Không liên hệ được' },
  { id: STATUS_LEAD.THANH_CO_HOI, name: 'Thành cơ hội' },
]

const LeadFilter = () => {
  return (
    <>
      <Row gutter={16}>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormInput
            name={'customerMobile'}
            placeholder="Số điện thoại"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormInput
            name={'customerEmail'}
            placeholder="Email"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormSelect
            name="source"
            label="Nguồn"
            placeholder="Chọn Nguồn"
            resourceData={CHANNEL_SOURCE}
            valueProp="id"
            titleProp="name"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormSelect
            name="status"
            label="Trạng thái"
            valueProp="id"
            titleProp='name'
            resourceData={statusData || []}
            placeholder='Lọc theo trạng thái'
          />
        </Col>

        <Col xl={6} lg={6} md={6} xs={24}>
          <FormDatePicker
            format='YYYY-MM-DD'
            name='from'
            placeholder="Từ ngày"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormDatePicker
            format='YYYY-MM-DD'
            name='to'
            placeholder="Đến ngày"
          />
        </Col>
      </Row>
    </>
  );
}

export default LeadFilter;