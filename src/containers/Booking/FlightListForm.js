import FormStyles from './styles'
import { Col, Typography } from 'antd';
import FormDatePicker from 'components/form/FormDatePicker';
import FormInputNumber from 'components/form/FormInputNumber';
import FormSelectUser from 'components/form/FormSelectUser';
import FormInput from 'components/form/FormInput';
import FormSelect from 'components/form/FormSelect';
import { FLIGHT_WAY_TYPE } from 'configs/localData';
import UserService from 'services/UserService';

const FlightListForm = ({ field }) => {
  const { name } = field || { name: 0 };
  return <>
    <FormStyles gutter={16}>
      <Col md={12} xs={24}>
        <FormInput
          placeholder={"Từ / From"}
          name={[name, 'from']}
          label='From'
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          placeholder={"Đến / To"}
          name={[name, 'to']}
          label='To'
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelect
          placeholder={"Flight way"}
          name={[name, 'type']}
          label='Chiều bay/ Flight way.'
          titleProp='text'
          valueProp='value'
          resourceData={FLIGHT_WAY_TYPE}
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          placeholder={"Flight no."}
          name={[name, 'flightNo']}
          label='Chuyến bay/ Flight no.'
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          placeholder={"Grade of ticket"}
          name={[name, 'gradeOfTicket']}
          label='Grade of ticket'
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInputNumber
          placeholder={"Estimate price"}
          name={[name, 'estimatePrice']}
          label='Đơn giá/ Estimate price'
        />
      </Col>

      <Col md={12} xs={24}>
        <FormDatePicker
          format='YYYY-MM-DD HH:mm'
          showTime
          required
          label={"Ngày, giờ khởi hành/ Departure time"}
          name={[name, 'departureTime']}
          placeholder="Choise Departure time"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormDatePicker
          format='YYYY-MM-DD HH:mm'
          showTime
          required
          label={"Ngày, giờ tới nơi/ Arrival time"}
          name={[name, 'arrivalTime']}
          placeholder="Choise Arrival time"
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

export default FlightListForm;