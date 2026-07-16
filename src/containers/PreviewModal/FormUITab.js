import { Button, Col, Form, Row } from 'antd'
import { CheckOutlined } from '@ant-design/icons'

import FieldPreview from './FieldPreview'
import { FormCard, FormCardFooter } from './index.style'

const FormUITab = ({ schema, viewport }) => {
  const [form] = Form.useForm()
  const { fields = [] } = schema

  return (
    <FormCard $viewport={viewport}>
      <Form form={form} layout="vertical">
        <Row gutter={[16, 0]}>
          {fields.map(field => (
            <Col key={field._id ?? field.fieldKey} span={field.colSpan ?? 24}>
              <FieldPreview field={field} />
            </Col>
          ))}
        </Row>
      </Form>

      <FormCardFooter>
        <Button>Hủy</Button>
        <Button type="primary" icon={<CheckOutlined />}>
          Nộp kết quả
        </Button>
      </FormCardFooter>
    </FormCard>
  )
}

export default FormUITab
