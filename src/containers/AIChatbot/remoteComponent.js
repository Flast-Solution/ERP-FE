import React, { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react'
import { FormDatePicker, FormInput, FormSelect } from '@flast-erp/core/components'
import { Form, Row, Col } from 'antd'

const FormDeNghiTaiKiemDinh = forwardRef(({
  initialValues,
  onSubmit,
  onSubmitError,
  submitSignal,
}, ref) => {
  const [form] = Form.useForm()

  const submit = useCallback(async () => {
    let values
    try {
      values = await form.validateFields()
    } catch (error) {
      error.remoteFormHandled = true
      onSubmitError?.(error)
      throw error
    }

    await onSubmit?.(values)
    return values
  }, [form, onSubmit, onSubmitError])

  useImperativeHandle(ref, () => ({
    submit,
    getValues: () => form.getFieldsValue(true),
    reset: () => form.resetFields(),
  }))

  useEffect(() => {
    if (submitSignal === undefined || submitSignal === null) {
      return
    }
    submit().catch(() => undefined)
  }, [submit, submitSignal])

  return (
    <Form form={form} layout="vertical" initialValues={initialValues}>
      <Row gutter={[16, 0]}>
        <Col span={12}>
          <FormInput
            name="request_code"
            label="Mã đề nghị"
            readOnly
          />
        </Col>
        <Col span={12}>
          <FormDatePicker
            name="request_date"
            label="Ngày đề nghị"
            format="DD-MM-YYYY"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={12}>
          <FormSelect
            name="requester"
            label="Người đề nghị"
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={12}>
          <FormSelect
            name="department"
            label="Đơn vị"
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          <FormSelect
            name="request_type"
            label="Loại đề nghị"
            resourceData={[
              { value: 'CUSTOMER_REQUEST', label: 'Khách hàng yêu cầu' },
              { value: 'INTERNAL_REQUEST', label: 'Nội bộ yêu cầu' },
              { value: 'ISO_REQUIREMENT', label: 'Theo quy trình ISO' },
              { value: 'QUALITY_REVIEW', label: 'Theo đánh giá chất lượng' },
            ]}
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          <FormSelect
            name="priority"
            label="Mức độ ưu tiên"
            resourceData={[
              { value: 'LOW', label: 'Thấp' },
              { value: 'NORMAL', label: 'Bình thường' },
              { value: 'HIGH', label: 'Cao' },
              { value: 'URGENT', label: 'Khẩn' },
            ]}
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>
      </Row>
    </Form>
  )
})

FormDeNghiTaiKiemDinh.displayName = 'FormDeNghiTaiKiemDinh'

export default FormDeNghiTaiKiemDinh
