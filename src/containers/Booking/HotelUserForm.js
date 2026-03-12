import FormStyles from './styles'
import { Form, Col, Typography } from 'antd';
import FormDatePicker from 'components/form/FormDatePicker';
import FormInputNumber from 'components/form/FormInputNumber';
import FormSelectUser from 'components/form/FormSelectUser';
import FormInput from 'components/form/FormInput';
import UserService from 'services/UserService';
import FormAutoComplete from 'components/form/FormAutoComplete';
import HotelService from 'services/HotelService';

const HotelUserForm = ({ field }) => {
  const { name } = field || { name: 0 };
  return <>
    <FormStyles gutter={16}>
      <Col md={12} xs={24}>
        <FormDatePicker
          format='YYYY-MM-DD HH:mm'
          showTime
          required
          label={"Giờ vào (checkIn)"}
          name={[name, 'checkIn']}
          placeholder="Choise time checkIn"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormDatePicker
          format='YYYY-MM-DD HH:mm'
          showTime
          required
          label={"Giờ ra (checkOut)"}
          name={[name, 'checkOut']}
          placeholder="Choise time checkOut"
        />
      </Col>

      <Col md={8} xs={24}>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, curValues) => prevValues.nameHotel !== curValues.nameHotel}
        >
          {({ getFieldValue }) => {
            const nameHotel = getFieldValue('nameHotel') || '';
            return (
              <FormAutoComplete
                required
                label='Loại phòng / Type'
                placeholder={"Room type"}
                name={[name, 'typeRoom']}
                resourceData={HotelService.getAll()}
                titleProp='name'
                valueProp='name'
                onData={(values) => {
                  return (values?.find(i => i.name === nameHotel)?.listTypeRoom || []).map(f => ({ name: f, value: f }));
                }}
                filter={{ name: nameHotel }}
              />
            )
          }}
        </Form.Item>
      </Col>
      <Col md={8} xs={24}>
        <FormInputNumber
          required
          placeholder={"Nights"}
          name={[name, 'nights']}
          label='Số đêm nghỉ / nights'
        />
      </Col>
      <Col md={8} xs={24}>
        <FormInputNumber
          required
          placeholder={"Estimate price"}
          name={[name, 'estimatePrice']}
          label='Đơn giá (dự tính)'
        />
      </Col>

      <Col md={24} xs={24}>
        <FormInput
          placeholder={"Special Request"}
          name={[name, 'specialRequest']}
          label='Yêu cầu đặc biệt'
        />
      </Col>
      <Col md={24} xs={24}>
        <Typography.Title level={5}>
          Khách hàng / Nhân viên
        </Typography.Title>
      </Col>
      <Col md={24} xs={24}>
        <FormSelectUser
          mode="multiple"
          api="/user/list"
          titleProp='fullName'
          name={[name, 'userId']}
          onChange={(values) => {
            UserService.loadByIds(values)
          }}
          onData={(data) => Array.isArray(data) ? data : []}
          placeholder="Chọn tài khoản nhân viên"
        />
      </Col>
    </FormStyles>
  </>
}

export default HotelUserForm;