import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { FormDatePicker, FormInput, FormSelect } from '@flast-erp/core/components'
import { Form, Row, Col } from 'antd'

const TEST_STANDARD_OPTIONS = [
  { label: 'TCVN 8042', value: 'TCVN_8042' },
  { label: 'ISO 3801', value: 'ISO_3801' },
  { label: 'ASTM D3776', value: 'ASTM_D3776' },
]

const TEST_METHOD_OPTIONS = [
  { label: 'Cắt mẫu tròn', value: 'CIRCULAR_SAMPLE' },
  { label: 'Cắt mẫu vuông', value: 'SQUARE_SAMPLE' },
  { label: 'Toàn khổ vải', value: 'FULL_WIDTH' },
]

const EQUIPMENT_OPTIONS = [
  { label: 'Cân điện tử', value: 'DIGITAL_SCALE' },
  { label: 'Dao cắt GSM', value: 'GSM_CUTTER' },
  { label: 'Máy đo GSM tự động', value: 'AUTO_GSM_MACHINE' },
]

const RESULT_EVALUATION_OPTIONS = [
  { label: 'Đạt', value: 'PASS' },
  { label: 'Không đạt', value: 'FAIL' },
  { label: 'Cần kiểm tra lại', value: 'RECHECK' },
]

const FormDoDinhLuong = forwardRef(({
  initialValues,
  onSubmit,
  onSubmitError,
  submitSignal,
  order,
  record,
  data,
  step,
  formTemplate,
}, ref) => {
  const [form] = Form.useForm()
  const previousSubmitSignalRef = useRef(submitSignal)
  const contextData = data ?? record ?? order ?? {}

  const submit = useCallback(async () => {
    let values
    try {
      values = await form.validateFields()
    } catch (error) {
      error.remoteFormHandled = true
      onSubmitError?.(error)
      throw error
    }

    await onSubmit?.(values, {
      order: contextData,
      record: contextData,
      data: contextData,
      step,
      formTemplate,
    })
    return values
  }, [contextData, form, formTemplate, onSubmit, onSubmitError, step])

  useImperativeHandle(ref, () => ({
    submit,
    getValues: () => form.getFieldsValue(true),
    reset: () => form.resetFields(),
  }), [form, submit])

  useEffect(() => {
    if (initialValues && typeof initialValues === 'object') {
      form.setFieldsValue(initialValues)
    }
  }, [form, initialValues])

  useEffect(() => {
    if (submitSignal === undefined || submitSignal === null) {
      previousSubmitSignalRef.current = submitSignal
      return
    }
    if (previousSubmitSignalRef.current === submitSignal) {
      return
    }
    previousSubmitSignalRef.current = submitSignal
    submit().catch(() => undefined)
  }, [submit, submitSignal])

  return (
    <Form form={form} layout="vertical">
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <FormSelect
            name="test_standard"
            label="Tiêu chuẩn áp dụng"
            resourceData={TEST_STANDARD_OPTIONS}
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          <FormSelect
            name="test_method"
            label="Phương pháp đo"
            resourceData={TEST_METHOD_OPTIONS}
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          <FormSelect
            name="equipment"
            label="Thiết bị sử dụng"
            resourceData={EQUIPMENT_OPTIONS}
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          <FormInput
            name="technician"
            label="Người thực hiện"
          />
        </Col>
        <Col span={24}>
          <FormDatePicker
            name="measurement_date"
            label="Ngày đo"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={12}>
          <FormInputNumber
            name="sample_length_cm"
            label="Chiều dài mẫu (cm)"
            min={0}
          />
        </Col>

        <Col span={12}>
          <FormInputNumber
            name="sample_width_cm"
            label="Chiều rộng mẫu (cm)"
            min={0}
          />
        </Col>

        <Col span={12}>
          <FormInputNumber
            name="sample_area_cm2"
            label="Diện tích mẫu (cm²)"
            min={0}
          />
        </Col>

        <Col span={12}>
          <FormInputNumber
            name="sample_weight_g"
            label="Khối lượng mẫu (g)"
            min={0}
          />
        </Col>

        <Col span={12}>
          <FormInputNumber
            name="gsm_result"
            label="Định lượng vải (g/m²)"
            min={0}
          />
        </Col>

        <Col span={12}>
          <FormInputNumber
            name="gsm_average"
            label="Định lượng trung bình (g/m²)"
            min={0}
          />
        </Col>

        <Col span={12}>
          <FormInputNumber
            name="gsm_tolerance"
            label="Sai số cho phép (%)"
            min={0}
          />
        </Col>

        <Col span={12}>
          <FormSelect
            name="result_evaluation"
            label="Kết luận"
            resourceData={RESULT_EVALUATION_OPTIONS}
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>

        <Col span={24}>
          <FormTextArea
            name="note"
            label="Ghi chú"
            rows={3}
          />
        </Col>
      </Row>
    </Form>
  )
})

FormDoDinhLuong.displayName = 'FormDoDinhLuong'

export default FormDoDinhLuong
