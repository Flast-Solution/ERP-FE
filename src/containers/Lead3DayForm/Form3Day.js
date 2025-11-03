/**************************************************************************/
/*  Form3Day.js                                                           */
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
import { Col, Row, Form, Slider, Checkbox } from 'antd'
import CustomButton from 'components/CustomButton'
import FormSelect from 'components/form/FormSelect'
import FormTextArea from 'components/form/FormTextArea'
import FormInputNumber from 'components/form/FormInputNumber'
import GroupStyles from './style'
import { PRIORITY_TYPE_TAGS } from 'configs/localData'
import FormSelectInfiniteBusinessUser from 'components/form/SelectInfinite/FormSelectInfiniteBusinessUser'
import FormDatePicker from 'components/form/FormDatePicker'

const CAUSE_3_DAY = [
  { name: "Đang trao đổi " },
  { name: "Chi phí cao " },
  { name: "Tư vấn lại" },
  { name: "Không chia sẻ" },
  { name: "Hoãn" },
  { name: "Chờ duyệt" },
]

const Form3Day = () => {
  return (
    <Row gutter={16} style={{ marginTop: 20 }}>
      <Col md={12} xs={24}>
        <Form.Item
          name="rating"
          label="Điểm đánh giá (5 - 10)"
          rules={[{ required: true, message: 'Vui lòng chọn điểm đánh giá!' }]}
        >
          <Slider min={5} max={10} marks={{ 5: '5', 10: '10' }} step={1} />
        </Form.Item>
      </Col>
      <Col md={12} xs={24}>
        <FormInputNumber
          style={{ width: '100%' }}
          min={0} 
          max={100} 
          addonAfter="%"
          label="Hoặc % hài lòng"
          name="satisfactionPercent"
          placeholder={"Nhập % hài lòng"}
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelect
          required
          name="cause"
          label="Nguyên nhân"
          placeholder="Chọn nguyên nhân"
          resourceData={CAUSE_3_DAY}
          valueProp="name"
          titleProp="name"
        />
      </Col>
      <Col md={12} xs={24}>
        <Form.Item name="issues" label="Sự cố sản phẩm / dịch vụ">
          <GroupStyles>
            <Row gutter={16}>
              <Col span={8}><Checkbox value="product">Sản phẩm</Checkbox></Col>
              <Col span={8}><Checkbox value="service">Dịch vụ</Checkbox></Col>
              <Col span={8}><Checkbox value="needResolution">Giải quyết</Checkbox></Col>
            </Row>
          </GroupStyles>
        </Form.Item>
      </Col>
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, curValues) => prevValues.issues !== curValues.issues}
      >
        {({ getFieldValue }) => (
          <Col md={24} xs={24}>
            <FormResolution issues={getFieldValue('issues')} />
          </Col>
        )}
      </Form.Item>
      <Col md={24} xs={24}>
        <FormSelect
          required
          name="priority"
          label="Ưu tiên"
          placeholder="Chọn ưu tiên"
          resourceData={PRIORITY_TYPE_TAGS}
          valueProp="value"
          titleProp="text"
        />
      </Col>
      <Col md={24} xs={24}>
        <FormTextArea 
          label="Tính năng mới / dịch vụ bổ sung"
          name="newFeatures"
          placeholder="Khách hàng cần tính năng mới / dịch vụ bổ sung"
          rows={2}
        />
        <FormTextArea 
          label="Yêu cầu hỗ trợ cụ thể"
          name="supportRequest"
          placeholder="Khách hàng cần hỗ trợ gì?"
          rows={2}
        />
      </Col>
      <Col md={24} xs={24}>
        <FormTextArea
          rows={3}
          required
          name="action"
          label="Tóm tắt nội dụng cuộc gọi"
          placeholder="Nhập ý kiến"
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
};

const FormResolution = ({ issues }) => {
  if (!issues || !issues.includes('needResolution')) {
    return null;
  }
  return (
    <Row gutter={16}>
      <Col md={12} xs={24}>
        <FormSelectInfiniteBusinessUser 
          required
          label="Người phụ trách giải quyết"
          placeholder="Chọn người phụ trách"
          name={['active', 'ssoId']}
        />
      </Col>
      <Col md={12} xs={24}>
        <FormDatePicker 
          required
          label="Thời gian"
          placeholder="Chọn thời gian"
          name={['active', 'inTime']}
        />
      </Col>
    </Row>
  )
};

export default Form3Day
