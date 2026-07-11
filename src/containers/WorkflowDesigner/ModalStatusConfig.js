import React, { useEffect } from 'react'
import { Col, Form, Row, Typography, message } from 'antd'
import { DeleteOutlined, PlusCircleOutlined, SaveOutlined } from '@ant-design/icons'
import {
  CustomButton,
  CustomButtonIcon,
  FormInput,
  FormRadioGroup,
  FormSelect,
} from '@flast-erp/core/components'
import styled from 'styled-components'

const { Text, Title } = Typography

const SCOPE_OPTIONS = [
  { value: 'current', name: 'Một trong các Workflow' },
  { value: 'all', name: 'Tất cả Workflow' },
]

const StatusConfigStyles = styled.div`
  .config-header { padding-bottom: 14px; border-bottom: 1px solid #f0f0f0; margin-bottom: 16px; }
  .config-header .ant-typography { margin: 0; }
  .config-description { display: block; margin-top: 4px; font-size: 12px; color: #8c8c8c; }
  .config-card { padding: 16px; margin-bottom: 12px; border: 1px solid #e4e4e4; border-radius: 8px; background: #fafafa; }
  .config-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .config-card-title { font-size: 11px; font-weight: 700; color: #8c8c8c; text-transform: uppercase; }
  .ant-form-item { margin-bottom: 12px; }
  .scope-field .ant-form-item { margin-bottom: 12px; }
  .scope-field .ant-radio-group { display: flex; flex-wrap: wrap; gap: 16px; }
  .add-config { display: flex; justify-content: center; padding: 10px; border: 1px dashed #d9d9d9; border-radius: 6px; }
  .add-config .custom-button { display: block !important; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 16px; margin-top: 16px; border-top: 1px solid #f0f0f0; }
  .modal-actions .custom-button { display: block !important; }
`

const StatusConfigRow = ({ field, index, stepOptions, remove }) => (
  <div className="config-card">
    <div className="config-card-head">
      <span className="config-card-title">Mục #{index + 1}</span>
      <CustomButtonIcon
        title="Xóa cấu hình"
        icon={<DeleteOutlined />}
        handleClick={() => remove(field.name)}
        buttonProps={{ danger: true, size: 'small' }}
      />
    </div>
    <FormSelect
      required
      mode="multiple"
      name={[field.name, 'stepTypeIds']}
      label="Chọn nhóm công việc"
      placeholder="Chọn nhóm công việc"
      resourceData={stepOptions}
      valueProp="value"
      titleProp="name"
    />
    <div className="scope-field">
      <FormRadioGroup
        required
        name={[field.name, 'scope']}
        label="Điều kiện áp dụng"
        resourceData={SCOPE_OPTIONS}
        valueProp="value"
        titleProp="name"
      />
    </div>
    <FormInput
      required
      name={[field.name, 'statusName']}
      label="Trạng thái đơn hàng"
      placeholder="Nhập trạng thái đơn hàng"
    />
  </div>
)

const ModalStatusConfig = ({ stepTypes = [], configurations = [], onSave, closeModal }) => {
  const [form] = Form.useForm()
  const stepOptions = stepTypes.map((item) => ({
    value: item.id ?? item.key,
    name: item.label,
  }))

  useEffect(() => {
    form.setFieldsValue({
      configurations: configurations.length > 0 ? configurations : [{ scope: 'current' }],
    })
  }, [configurations, form])

  const handleSubmit = ({ configurations: values = [] }) => {
    onSave?.(values)
    message.success('Đã lưu cấu hình trạng thái.')
    closeModal?.()
  }

  return (
    <StatusConfigStyles>
      <div className="config-header">
        <Title level={4}>Cấu hình trạng thái đơn hàng</Title>
        <Text className="config-description">Thiết lập nhóm công việc và trạng thái tương ứng cho quy trình xử lý đơn hàng.</Text>
      </div>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.List name="configurations">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <StatusConfigRow key={field.key} field={field} index={index} stepOptions={stepOptions} remove={remove} />
              ))}
              <div className="add-config">
                <CustomButton
                  title="Thêm cấu hình mới"
                  icon={<PlusCircleOutlined />}
                  variant="text"
                  color="default"
                  inRigth={false}
                  onClick={() => add({ scope: 'current' })}
                />
              </div>
            </>
          )}
        </Form.List>
        <Row className="modal-actions" gutter={8}>
          <Col><CustomButton title="Hủy bỏ" variant="text" color="default" inRigth={false} onClick={closeModal} /></Col>
          <Col><CustomButton title="Lưu cấu hình" type="primary" htmlType="submit" icon={<SaveOutlined />} inRigth={false} /></Col>
        </Row>
      </Form>
    </StatusConfigStyles>
  )
}

export default ModalStatusConfig
