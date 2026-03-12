import FormStyles from './styles'
import { Col } from 'antd';
import FormDatePicker from 'components/form/FormDatePicker';
import { OVERTIME_META } from 'configs/constant';
import FormSelect from 'components/form/FormSelect';
import FormTextArea from 'components/form/FormTextArea';

const RegisForm = ({ field }) => {
  const { name } = field || { name: 0 };
  return <>
    <FormStyles gutter={16}>
      <Col span={24}>
        <FormTextArea
          rows={3}
          name={[name, 'jobs']}
          label="Tên công việc (Jobs)"
          placeholder="Jobs details"
          required
        />
      </Col>
      <Col md={8} xs={24}>
        <FormSelect 
          required
          name={[name, 'type']}
          resourceData={OVERTIME_META}
          placeholder="Chọn hình thức (Type)"
          valueProp='id'
          titleProp='name'
        />
      </Col>
      <Col md={8} xs={24}>
        <FormDatePicker
          format='YYYY-MM-DD HH:mm'
          showTime
          name={[name, 'startTime']}
          placeholder="Choise start time"
          required
        />
      </Col>
      <Col md={8} xs={24}>
        <FormDatePicker
          format='YYYY-MM-DD HH:mm'
          showTime
          required
          name={[name, 'endTime']}
          placeholder="Choise end time"
        />
      </Col>
    </FormStyles>
  </>
}

export default RegisForm;