import React, { useEffect } from 'react';
import { Row, Col, Form, message } from 'antd';
import FormSelectInfiniteProduct from 'components/form/SelectInfinite/FormSelectInfiniteProduct';
import FormSelectInfiniteService from 'components/form/SelectInfinite/FormSelectInfiniteService';
import FormSelect from 'components/form/FormSelect';
import CustomButton from 'components/CustomButton';
import FormInput from 'components/form/FormInput';
import { CHANNEL_SOURCE } from 'configs/localData';
import FormHidden from 'components/form/FormHidden';
import FormTextArea from 'components/form/FormTextArea';
import RequestUtils from 'utils/RequestUtils';
import { f5List } from 'utils/dataUtils';

const LeadCollectionForm = ({ data }) => {
  const [ form ] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(data);
  }, [data, form]);

  const onFinish = async (values) => {
    const { message: MSG } = await RequestUtils.Post("/data-collection/save", values);
    f5List("data-collection/fetch");
    message.info(MSG);
  }

  return (
    <Form form={form} layout='vertical' onFinish={onFinish}>
      <Row gutter={16} style={{marginTop: 20}}>
        <FormHidden name={'id'} />
        <Col md={12} xs={24}>
          <FormInput
            required
            name={'fullName'}
            label="Người dùng"
            placeholder="Nhập Người dùng"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            required
            name={'mobile'}
            label="SĐT"
            placeholder="Nhập SĐT"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelectInfiniteProduct 
            label="Sản phẩm"
            placeholder="Chọn sản phẩm"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelectInfiniteService
            label="Dịch vụ"
            name={'service'}
            required
            placeholder="Dịch vụ"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelect
            label="Kênh thu thập"
            name={'channel'}
            required
            placeholder="Kênh thu thập"
            resourceData={CHANNEL_SOURCE}
            valueProp="id"
            titleProp="name"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            name={'address'}
            label="Địa chỉ"
            placeholder="Địa chỉ nếu có"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            name={'profileLink'}
            label="Link Online"
            placeholder="Link Online nếu có"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            name={'email'}
            label="Email"
            placeholder="Email nếu có"
          />
        </Col>
        <Col md={24} xs={24}>
          <FormTextArea 
            rows={4}
            label="Ghi chú"
            placeholder="Ghi chú"
            name={'note'}
          />
        </Col>
        <Col md={24} xs={24}>
          <CustomButton htmlType="submit" />
        </Col>
      </Row>
    </Form>
  )
};

export default LeadCollectionForm;