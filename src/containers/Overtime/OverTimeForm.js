import { Row, Col, Form } from 'antd';
import {
  CustomButton,
  FormHidden,
  FormListAddtion,
  FormContextCustom
} from "@flast-erp/core/components";
import { HourglassOutlined } from '@ant-design/icons';
import { useCallback, useContext } from 'react';
import RegisForm from './RegisForm';

const OvertimeForm = () => {

  const { form } = useContext(FormContextCustom);
  const onClickPreview = useCallback(() => {
    const preview = form.getFieldValue('preview');
    form.setFieldValue('preview', !preview ? true : false);
  }, [form]);

  return (
    <Row gutter={16} style={{marginTop: 20}}>
      <FormHidden name={'id'} />
      <FormHidden name={'preview'} />
      <Col md={24} xs={24}>
        <FormListAddtion name="listRegis">
          <RegisForm />
        </FormListAddtion>
      </Col>
      <Col md={24} xs={24}>
        <div style={{display: 'flex', justifyContent:'end'}}>
          <Form.Item
            noStyle
            shouldUpdate={ (prevValues, curValues) => prevValues.preview !== curValues.preview }
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
            style={{marginLeft: 20}}
          />
        </div>
      </Col>
    </Row>
  )
}

export default OvertimeForm;