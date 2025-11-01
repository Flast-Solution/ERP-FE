/**************************************************************************/
/*  containers.material.index.js                                          */
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

import React, { useEffect } from "react";
import { Form, Row, Col, message } from "antd";
import { isEmpty } from "lodash";
import FormHidden from "components/form/FormHidden";
import CustomButton from "components/CustomButton";
import RequestUtils from "utils/RequestUtils";
import FormInput from "components/form/FormInput";
import FormSelect from "components/form/FormSelect";
import { MATERIAL_UNIT_TYPE } from "configs/localData";
import FormInputNumber from "components/form/FormInputNumber";
import FormTextArea from "components/form/FormTextArea";

const MaterialForm = ({ onSave, material }) => {

  const [ form ] = Form.useForm();
  const onSubmitForm = async (values) => {
    const { message: MSG, data } = await RequestUtils.Post("/material/save", values);
    message.info(MSG);
    onSave(data);
  }

  useEffect(() => {
    if (isEmpty(material)) {
      form.resetFields();
    } else {
      form.setFieldsValue(material);
    }
  }, [material, form])

  return (
    <Form form={form} layout="vertical" onFinish={onSubmitForm}>
      <Row gutter={16}>
        <Col md={24} xs={24}>
          <FormHidden name={"id"} />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            name={'name'}
            label="Tên nguyên vật liệu"
            required
            placeholder={"Nhập tên nguyên vật liệu"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelect 
            label="Kiểu đơn vị tính"
            name={'unitType'}
            valueProp="value"
            resourceData={MATERIAL_UNIT_TYPE}
            required
            placeholder={"Chọn kiểu đơn vị tính"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            name={'unit'}
            label="Tên đơn vị"
            required
            placeholder={"Nhập tên đơn vị"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInputNumber
            style={{ width: '100%' }}
            name={'pricePerUnit'}
            label="Giá theo đơn vị"
            required
            placeholder={"Nhập giá theo đơn vị"}
          />
        </Col>
        <Col md={24} xs={24}>
          <FormTextArea 
            name={'description'}
            label="Mô tả"
            placeholder="Nhập mô tả"
            rows={3}
            maxLength={500}
          />
        </Col>
        <Col md={24} xs={24}>
          <CustomButton
            htmlType="submit"
          />
        </Col>
      </Row>
    </Form>
  )
};

export default MaterialForm;