/**************************************************************************/
/*  CustomerAddressForm.js                                                */
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

import React, { useState } from "react";
import { Col, Row, Form, message } from "antd";
import FormInput from "components/form/FormInput";
import FormSelect from "components/form/FormSelect";
import RestEditModal from "components/RestLayout/RestEditModal";
import FormDatePicker from "components/form/FormDatePicker";
import FormListAddition from "components/form/FormListAddtion";
import { FormListStyles } from "css/global";
import CustomButton from "components/CustomButton";
import FormSelectInfiniteProvince from "components/form/SelectInfinite/FormSelectInfiniteProvince";
import { useEffectAsync } from "hooks/MyHooks";
import RequestUtils from "utils/RequestUtils";
import FormCheckbox from "components/form/FormCheckbox";
import { dateFormatOnSubmit } from "utils/dataUtils";
import FormHidden from "components/form/FormHidden";
import { SUCCESS_CODE } from "configs";

const CustomerAddressForm = ({ data }) => {

  const { iCustomer, onSave } = data;
  const [ record, setRecord ] = useState({});
  const onSubmit = async (values) => {
    dateFormatOnSubmit(values, ['dateOfBirth'], "YYYY-MM-DD");
    const { customerAddress, ...customer } = values;
    const { errorCode, message: MSG, data } = await RequestUtils.Post("/customer/save", {
      ...customer,
      customerAddress
    });
    message.info(MSG);
    if(errorCode === SUCCESS_CODE) {
      onSave(data);
    }
  }

  useEffectAsync(async () => {
    if(!iCustomer?.id) {
      return;
    }
    const customerAddress = await RequestUtils.GetAsList("/customer/find-address", { id: iCustomer.id});
    setRecord({...iCustomer, customerAddress})
  }, [iCustomer]);

  return (
    <RestEditModal
      isMergeRecordOnSubmit={false}
      updateRecord={(values) => values}
      onSubmit={onSubmit}
      record={record}
    >
      <Row gutter={24}>
        <Col md={24} xs={24}>
          <FormHidden name="id" />
        </Col>
        <Col md={12} xs={24}>
          <FormInput 
            required
            label="Tên khách hàng"
            placeholder="Nhập tên khách hàng"
            name="name" 
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput 
            required
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            name="mobile" 
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            label="Email"
            placeholder="Nhập email"
            name="email" 
          />
        </Col>
        <Col md={12} xs={24}>
          <FormDatePicker 
            label="Ngày sinh"
            placeholder="Ngày sinh nếu có"
            name="dateOfBirth" 
          />
        </Col>
        <Col md={24} xs={24}>
          <FormListAddition
            name="customerAddress"
            textAddNew="Thêm mới địa chỉ"
          >
            <AddressFormItem />
          </FormListAddition>
        </Col>
        <Col md={24} xs={24}>
          <CustomButton htmlType="submit" title="Cập nhật" />
        </Col>
      </Row>
    </RestEditModal>
  )
}

const AddressFormItem = ({ field }) => {

  const { name } = field || { name: 0 };
  const form = Form.useFormInstance();

  const handleDefaultChange = (checked) => {
    if (!checked) {
      return;
    }
    const addresses = form.getFieldValue('customerAddress') || [];
    const updatedAddresses = addresses.map((addr, index) => ({
      ...addr,
      isDefault: index === name ? true : false
    }));
    form.setFieldsValue({ customerAddress: updatedAddresses });
  };

  return (
    <FormListStyles gutter={16}>
      <Col md={24} xs={24}>
        <FormHidden 
          name={[name, 'id']}
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          name={[name, 'receiverName']}
          required
          placeholder="Người liên hệ"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          name={[name, 'mobilePhone']}
          required
          placeholder="Số điện thoại"
        />
      </Col>
      <Col md={12} xs={24} style={{marginTop: 20}}>
        <FormSelectInfiniteProvince
          name={[name, 'provinceId']}
          label="Tỉnh / TP"
          required
          placeholder="Tỉnh / TP"
          initialFilter={{ id: 0 }}
        />
      </Col>
      <Col md={12} xs={24} style={{marginTop: 20}}>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, curValues) => {
            const prevProvinceId = prevValues?.customerAddress?.[name]?.provinceId;
            const curProvinceId = curValues?.customerAddress?.[name]?.provinceId;
            return prevProvinceId !== curProvinceId;
          }}
        >
          {({ getFieldValue }) => (
            <FormWard
              name={name}
              parentId={getFieldValue(['customerAddress', name, 'provinceId'])}
            />
          )}
        </Form.Item>
      </Col>
      <Col md={18} xs={24} style={{marginTop: 20}}>
        <FormInput
          name={[name, 'address']}
          required
          placeholder="Địa chỉ"
        />
      </Col>
      <Col md={6} xs={24} style={{marginTop: 20}}>
        <FormCheckbox
          name={[name, 'isDefault']}
          text="Địa chỉ mặc định"
          onChange={(e) => handleDefaultChange(e.target.checked)}
        />
      </Col>
    </FormListStyles>
  )
};

const FormWard = React.memo(({ parentId, name }) => {

  const [ datas, setData ] = useState([]);
  useEffectAsync(async () => {
    if (!parentId) {
      return;
    }
    const wards = await RequestUtils.GetAsList("/province/find", { id: parentId });
    setData(wards);
  }, [parentId]);

  return (
    <FormSelect
      name={[name, 'wardId']}
      label="Phường / Xã"
      required
      resourceData={datas}
      placeholder="Phường / Xã"
    />
  )
});

export default CustomerAddressForm;