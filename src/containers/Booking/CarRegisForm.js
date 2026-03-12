import FormCheckbox from 'components/form/FormCheckbox';
import FormStyles from './styles'
import { Form, Row, Col, Typography } from 'antd';
import FormDatePicker from 'components/form/FormDatePicker';
import FormInput from 'components/form/FormInput';
import FormInputNumber from 'components/form/FormInputNumber';
import FormSelectUser from 'components/form/FormSelectUser';
import FormSelect from 'components/form/FormSelect';
import { REGISTER_WORK_TYPE } from 'configs/localData';
import FormTextArea from 'components/form/FormTextArea';
import UserService from 'services/UserService';
import FormListAddition from 'components/form/FormListAddtion';
import { EnvironmentOutlined } from '@ant-design/icons';
import CarService from 'services/CarService';
import FormAutoComplete from 'components/form/FormAutoComplete';

const CarListPickUp = ({ field }) => {
  const { name } = field || { name: 0 };
  return (
    <FormStyles gutter={16}>
      <Col md={12} xs={24}>
        <FormDatePicker
          format='YYYY-MM-DD HH:mm'
          showTime
          required
          name={[name, 'pickupTime']}
          placeholder="Choise date"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormAutoComplete
          required
          placeholder={"Pick up Location"}
          name={[name, 'name']}
          resourceData={CarService.getAllDiemDon()}
          titleProp='name'
          valueProp='name'
        />
      </Col>
      <Col md={24} xs={24} style={{ marginTop: 10 }}>
        <FormSelectUser
          api="/user/list"
          titleProp='fullName'
          valueProp='fullName'
          mode="tags"
          name={[name, 'userId']}
          onChange={(values) => {
            UserService.loadByIds(values)
          }}
          onData={(data) => Array.isArray(data) ? data : []}
          placeholder="Staff"
        />
      </Col>
    </FormStyles>
  )
}

const CarListDestinations = ({ field }) => {
  const { name } = field || { name: 0 };
  return (
    <FormStyles gutter={16}>
      <Col md={8} xs={24}>
        <FormDatePicker
          format='YYYY-MM-DD HH:mm'
          showTime
          required
          name={[name, 'pickupTime']}
          placeholder="Choise date"
        />
      </Col>
      <Col md={16} xs={24}>
        <FormAutoComplete
          required
          placeholder={"Destination"}
          name={[name, 'name']}
          resourceData={CarService.getAllDiemTra()}
          titleProp='name'
          valueProp='name'
        />
      </Col>
    </FormStyles>
  )
}

const CarRegisForm = ({ field }) => {
  const { name } = field || { name: 0 };
  return <>
    <FormStyles gutter={16}>
      <Col md={12} xs={24}>
        <FormDatePicker
          format='YYYY-MM-DD HH:mm'
          showTime
          required
          label={"Ngày sử dụng (Use date)"}
          name={[name, 'pickupTime']}
          placeholder="Choise date time"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelectUser
          required
          api="/info/fetch-supplier"
          label="Đối tác cung cấp dịch vụ/Supplier"
          placeholder={'Supplier'}
          name={[name, 'supplier']}
          valueProp="name"
          titleProp="name"
        />
      </Col>

      <Col md={12} xs={24}>
        <FormSelectUser
          required
          api="/info/fetch-type-car"
          label="Chủng loại xe/ Car type"
          placeholder={"Car type"}
          name={[name, 'typeCar']}
          valueProp="name"
          titleProp="name"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInputNumber
          label="Số lượng người"
          name={[name, 'amountOfGuest']}
          placeholder={"Amount Of Guest"}
        />
      </Col>

      <Col md={12} xs={24}>
        <FormInputNumber
          required
          label="Đơn giá/ Estimate cost"
          name={[name, 'price']}
          placeholder={"Estimate cost"}
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelect
          placeholder={"Type"}
          name={[name, 'status']}
          label='Hình thức / Type'
          titleProp='text'
          valueProp='value'
          resourceData={REGISTER_WORK_TYPE}
        />
      </Col>

      <Col md={24} xs={24}>
        <Typography.Title level={5}>
          Khách hàng / Nhân viên đi cùng
        </Typography.Title>
      </Col>
      <Col md={6} xs={24}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <FormCheckbox name={[name, 'employeType']} />
          <span>Nội bộ</span>
        </div>
      </Col>
      <Col md={18} xs={24}>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, curValues) =>
            prevValues.scheduleBusList[name]?.employeType !== curValues.scheduleBusList[name]?.employeType
          }
        >
          {({ getFieldValue }) => {
            let listProperties = getFieldValue('scheduleBusList');
            const employeType = listProperties[name]?.employeType ?? false;
            return employeType ?
              <Row gutter={16}>
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
              </Row>
              :
              <Row gutter={16}>
                <Col md={12} xs={24}>
                  <FormInput
                    required
                    name={[name, 'nameGuest']}
                    placeholder="Name Guest"
                  />
                </Col>
                <Col md={12} xs={24}>
                  <FormInput
                    required
                    name={[name, 'companyGuest']}
                    placeholder="Company Of Guest"
                  />
                </Col>
              </Row>
          }}
        </Form.Item>
      </Col>

      <Col md={24} xs={24}>
        <FormListAddition
          name={[name, 'listPickup']}
          text="Thêm điểm đón"
          title={"Địa điểm đón/ Pick up Location"}
          placeholder="Pick up Location"
          icon={<EnvironmentOutlined />}
          showBtnInLeft={false}
        >
          <CarListPickUp />
        </FormListAddition>
      </Col>

      <Col md={24} xs={24}>
        <FormListAddition
          name={[name, 'listDestinations']}
          text="Thêm lịch trình mới"
          title={"Địa điểm đến/ Destination"}
          icon={<EnvironmentOutlined />}
          showBtnInLeft={false}
        >
          <CarListDestinations />
        </FormListAddition>
      </Col>
      <Col md={24} xs={24}>
        <FormTextArea
          row={2}
          name={'noteWorkProgree'}
          placeholder="Note Work Progree"
        />
      </Col>
    </FormStyles>
  </>
}

export default CarRegisForm;