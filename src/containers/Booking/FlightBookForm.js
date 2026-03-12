import { Row, Col, Form } from 'antd';
import FormHidden from 'components/form/FormHidden';
import CustomButton from 'components/CustomButton';
import { HourglassOutlined } from '@ant-design/icons';
import { FormContextCustom } from 'components/context/FormContextCustom';
import { useCallback, useContext } from 'react';
import FormListAddition from 'components/form/FormListAddtion';
import FormTextArea from 'components/form/FormTextArea';
import FlightListForm from './FlightListForm';
import FormDatePicker from 'components/form/FormDatePicker';

const FlightBookForm = () => {

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
        shouldUpdate={(prevValues, curValues) => prevValues.preview !== curValues.preview}
      >
        {({ getFieldValue }) => {
          const preview = getFieldValue('preview');
          return preview ? "" : (
            <>
              <Col md={24} xs={24}>
                <FormListAddition name="scheduleBusList">
                  <FlightListForm />
                </FormListAddition>
              </Col>

              <Col md={24} xs={24}>
                <FormTextArea
                  required
                  rows={3}
                  label={"Mục đích công tác / Purpose"}
                  placeholder={"Purpose"}
                  name="note"
                />
              </Col>

              <Col md={12} xs={24}>
                <FormDatePicker
                  format='YYYY-MM-DD HH:mm'
                  showTime
                  required
                  placeholder={"Start Expenses"}
                  label={"Thời gian bắt đầu C.Tác Phí"}
                  name="start_expenses"
                />
              </Col>
              <Col md={12} xs={24}>
                <FormDatePicker
                  format='YYYY-MM-DD HH:mm'
                  showTime
                  required
                  placeholder={"End Expenses"}
                  label={"Thời gian kết thúc C.Tác Phí"}
                  name="end_expenses"
                />
              </Col>
            </>
          )
        }}
      </Form.Item>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, curValues) => prevValues.preview !== curValues.preview}
      >
        {({ getFieldValue }) => {
          const preview = getFieldValue('preview');
          return (
            <Col md={24} xs={24}>
              <div style={{ display: 'flex', justifyContent: 'end' }}>
                <CustomButton
                  onClick={() => onClickPreview()}
                  title={`(${preview ? 'Close' : 'Preview'})`}
                  icon={<HourglassOutlined />}
                  type='primary'
                />
                <CustomButton
                  htmlType="submit"
                  title="Gửi duyệt"
                  color="danger"
                  variant="solid"
                  style={{ marginLeft: 20 }}
                />
              </div>
            </Col>
          )
        }}
      </Form.Item>
    </Row>
  )
}

export default FlightBookForm;