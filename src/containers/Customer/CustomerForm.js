/**************************************************************************/
/*  CustomerForm.js                                                       */
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

import { useEffect, useCallback, useState } from "react";
import { Col, Form, Row } from "antd";
import { FormContextCustom } from 'components/context/FormContextCustom';
import FormSelectInfiniteCustomer from "components/form/SelectInfinite/FormSelectInfiniteCustomer";
import FormInput from "components/form/FormInput";
import BtnSubmit from 'components/CustomButton/BtnSubmit';
import FormSelect from "components/form/FormSelect";
import { CHANNEL_SOURCE } from "configs/localData";
import { arrayEmpty } from "utils/dataUtils";
import RequestUtils from "utils/RequestUtils";
import { SUCCESS_CODE } from "configs";
import { InAppEvent } from "utils/FuseUtils";

function mapFields(source, mapping) {
  let result = {};
  for (const [sourceKey, targetKey] of Object.entries(mapping)) {
    if (source[sourceKey])
      result[targetKey] = source[sourceKey];
  }
  return result;
}

const CustomerForm = ({
  details,
  customer,
  onSave
}) => {

  const [form] = Form.useForm();
  const [record, setRecord] = useState({});

  useEffect(() => {
    setRecord(customer);
  }, [customer]);

  const onFinish = async (values) => {
    /* Tạo Lead mới nếu khách chưa tốn tại */
    if (values.id) {
      onSave(values);
      return;
    }
    if (arrayEmpty(details)) {
      return;
    }

    let [ product ] = details;
    const defindMappingSchema = {
      name: "customerName",
      mobile: "customerMobile",
      email: "customerEmail",
      facebookId: "customerFacebook",
      address: "provinceName",
      sourceId: "source"
    };

    const customerFields = mapFields(values, defindMappingSchema);
    const payload = {
      productId: product.productId,
      productName: product.productName,
      ...customerFields
    };

    const { errorCode, data } = await RequestUtils.Post("/data/create", payload);
    if (errorCode !== SUCCESS_CODE) {
      InAppEvent.normalError("Lỗi tạo mới dữ liệu khách hàng !");
      return;
    }

    const { mCustomer } = data;
    values.id = mCustomer.id;
    onSave(values);
  }

  const updateRecord = useCallback((values) => {
    setRecord(pre => ({ ...pre, ...values }));
  }, []);

  const onChangeGetSelectedItem = (value, mCustomer) => {
    form.setFieldsValue(mCustomer);
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <FormContextCustom.Provider value={{ form, record, updateRecord }}>
        <Row gutter={16}>
          <Col span={12}>
            <FormSelectInfiniteCustomer
              formatText={(_, item) => item.name + " (" + item.mobile + ")"}
              name="id"
              label='Chọn khách hàng'
              placeholder='Chọn khách hàng'
              onChangeGetSelectedItem={onChangeGetSelectedItem}
            />
          </Col>
          <Col span={12}>
            <FormInput
              label={"Tên khách hàng"}
              placeholder='Họ tên'
              name={"name"}
              required
            />
          </Col>
          <Col span={12}>
            <FormInput
              placeholder='Số điện thoại'
              label={"Số điện thoại"}
              name={"mobile"}
              required
            />
          </Col>
          <Col span={12}>
            <FormInput
              placeholder='Email'
              label={"Email"}
              name={"email"}
            />
          </Col>
          <Col span={12}>
            <FormInput
              label={"Địa chỉ (Nếu có)"}
              placeholder='Địa chỉ'
              name={"address"}
            />
          </Col>
          <Col span={12}>
            <FormInput
              placeholder='Link facebook'
              label={"Facebook"}
              name={"facebookId"}
            />
          </Col>
          <Col span={12}>
            <FormSelect
              required
              placeholder='Chọn nguồn'
              resourceData={CHANNEL_SOURCE}
              label={"Nguồn"}
              name={"sourceId"}
            />
          </Col>
          <Col span={12}>
            <BtnSubmit marginTop={30} text='Hoàn thành' />
          </Col>
        </Row>
      </FormContextCustom.Provider>
    </Form>
  )
}

export default CustomerForm;