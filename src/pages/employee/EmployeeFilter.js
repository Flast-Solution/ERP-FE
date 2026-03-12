import { Row, Col } from 'antd';
import FormInput from 'components/form/FormInput';
import FormCheckbox from 'components/form/FormCheckbox';

const EmployeeFilter = () => {
  return (
    <>
      <Row gutter={16}>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormInput
            name={'phone'}
            placeholder="Number Phone"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormInput
            name={'name'}
            placeholder="Account Name"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span>Chỉ lấy ON</span>
            <FormCheckbox name={'status'} />
          </div>
        </Col>
      </Row>
    </>
  );
}

export default EmployeeFilter;