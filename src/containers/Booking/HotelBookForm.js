import { Row, Col, Form, Typography } from 'antd';
import FormHidden from 'components/form/FormHidden';
import CustomButton from 'components/CustomButton';
import { HourglassOutlined } from '@ant-design/icons';
import { FormContextCustom } from 'components/context/FormContextCustom';
import { useCallback, useContext } from 'react';
import FormListAddition from 'components/form/FormListAddtion';
import HotelUserForm from './HotelUserForm';
import FormTextArea from 'components/form/FormTextArea';
import FormInput from 'components/form/FormInput';
import FormRadioGroup from 'components/form/FormRadioGroup';
import { HOTEL_ROOM_PAY_TYPE } from 'configs/localData';
import FormAutoComplete from 'components/form/FormAutoComplete';
import HotelService from 'services/HotelService';

const HotelBookForm = () => {

  const { form } = useContext(FormContextCustom);
  const onClickPreview = useCallback(() => {
    const preview = form.getFieldValue('preview');
    form.setFieldValue('preview', !preview ? true : false);
  }, [form]);

  return (
    <Row gutter={16} style={{ marginTop: 20 }}>
      <FormHidden name={'id'} />
      <FormHidden name={'preview'} />
      <Form.Item
        noStyle
        shouldUpdate={
          (prevValues, curValues) => prevValues.preview !== curValues.preview
            || prevValues.nameHotel !== curValues.nameHotel
        }
      >
        {({ getFieldValue }) => {
          const preview = getFieldValue('preview');
          const name = getFieldValue('nameHotel');
          const address = HotelService.fetchAddressByName(name);
          if (address) {
            form.setFieldValue('address', address);
            form.setFieldValue('contract', HotelService.getAll().find(i => i.name === name)?.phone ?? '');
          }
          return preview ? "" : (
            <>
              <Col md={24} xs={24}>
                <FormAutoComplete
                  required
                  label={"Tên khách sạn  / Hotel name"}
                  placeholder={"Hotel Name"}
                  name="nameHotel"
                  resourceData={HotelService.getAll()}
                  titleProp='name'
                  valueProp='name'
                />
              </Col>
              <Col md={24} xs={24}>
                <FormInput
                  required
                  label={"Địa chỉ / Address"}
                  placeholder={"Address"}
                  name="address"
                />
              </Col>
              <Col md={12} xs={24}>
                <FormInput
                  required
                  label={"Liên hệ / Contact"}
                  placeholder={"Contact"}
                  name="contract"
                />
              </Col>
              <Col md={12} xs={24}>
                <FormInput
                  required
                  label={"Số lượng phòng / Room No"}
                  placeholder={"Room No"}
                  name="roomNo"
                />
              </Col>
              <Col md={24} xs={24}>
                <Typography.Title level={5}>Hình thức thanh toán / Paid type</Typography.Title>
              </Col>
              <Col md={24} xs={24}>
                <FormRadioGroup
                  resourceData={HOTEL_ROOM_PAY_TYPE}
                  name={"payment"}
                  required
                  titleProp='text'
                  valueProp='value'
                />
              </Col>
              <Col md={24} xs={24}>
                <FormTextArea
                  required
                  rows={2}
                  placeholder={"Purpose"}
                  label={"Mục đích công tác / Purpose"}
                  name="note"
                />
              </Col>
              <Col md={24} xs={24}>
                <FormListAddition
                  name="bookingList"
                  text='Checkin - Checkout'
                >
                  <HotelUserForm />
                </FormListAddition>
              </Col>
            </>
          )
        }}
      </Form.Item>

      <Col md={24} xs={24}>
        <div style={{ display: 'flex', justifyContent: 'end' }}>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, curValues) => prevValues.preview !== curValues.preview}
          >
            {({ getFieldValue }) => {
              const preview = getFieldValue('preview');
              return (
                <CustomButton
                  onClick={() => onClickPreview()}
                  title={`(${preview ? 'Close' : 'Preview'})`}
                  icon={<HourglassOutlined />}
                  type='primary'
                />
              )
            }}
          </Form.Item>
          <CustomButton
            htmlType="submit"
            title="Gửi duyệt"
            color="danger"
            variant="solid"
            style={{ marginLeft: 20 }}
          />
        </div>
      </Col>
    </Row>
  )
}

export default HotelBookForm;