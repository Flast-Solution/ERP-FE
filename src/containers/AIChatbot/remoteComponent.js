import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { FormCheckbox, FormInput, FormInputNumber, FormRadioGroup, FormSelect } from '@flast-erp/core/components'
import { Form, Row, Col } from 'antd'

const REMOTE_DEBUG_PREFIX = '[RemoteForm][FormTiepNhanMau]'

const DROPDOWN_OPTIONS = {
  defect_level: [
    { value: 'NONE', label: 'Không có lỗi' },
    { value: 'MINOR', label: 'Nhẹ' },
    { value: 'MAJOR', label: 'Trung bình' },
    { value: 'CRITICAL', label: 'Nghiêm trọng' },
  ],
  color_uniformity: [
    { value: 'EXCELLENT', label: 'Rất đồng đều' },
    { value: 'GOOD', label: 'Đồng đều' },
    { value: 'FAIR', label: 'Hơi lệch màu' },
    { value: 'POOR', label: 'Không đồng đều' },
  ],
  surface_condition: [
    { value: 'NORMAL', label: 'Bình thường' },
    { value: 'WRINKLED', label: 'Nhăn' },
    { value: 'PILLING', label: 'Xù lông' },
    { value: 'DIRTY', label: 'Bám bẩn' },
    { value: 'TORN', label: 'Rách' },
    { value: 'HOLED', label: 'Thủng' },
    { value: 'DEFORMED', label: 'Biến dạng' },
  ],
  defects: [
    { value: 'COLOR_VARIATION', label: 'Lệch màu' },
    { value: 'STAIN', label: 'Vết bẩn' },
    { value: 'PIN_HOLE', label: 'Lỗ kim' },
    { value: 'BROKEN_YARN', label: 'Đứt sợi' },
    { value: 'PILLING', label: 'Xù lông' },
    { value: 'WRINKLE', label: 'Nhăn' },
    { value: 'WEAVING_DEFECT', label: 'Lỗi dệt' },
    { value: 'DYEING_DEFECT', label: 'Lỗi nhuộm' },
    { value: 'PRINT_DEFECT', label: 'Lỗi in' },
    { value: 'TEAR', label: 'Rách' },
    { value: 'HOLE', label: 'Thủng' },
    { value: 'OTHER', label: 'Khác' },
  ],
}

const DROPDOWN_NAMES = Object.keys(DROPDOWN_OPTIONS)

const pickDropdownValues = (values = {}) => (
  DROPDOWN_NAMES.reduce((result, name) => {
    result[name] = values[name] ?? null
    return result
  }, {})
)

const logDropdownOptions = (context = 'mount') => {
  console.group(`${REMOTE_DEBUG_PREFIX} dropdown options (${context})`)
  DROPDOWN_NAMES.forEach((name) => {
    console.log(name, DROPDOWN_OPTIONS[name])
  })
  console.log('allDropdownOptions', DROPDOWN_OPTIONS)
  console.groupEnd()
}

const logDropdownValues = (values, context = 'change') => {
  const dropdownValues = pickDropdownValues(values)
  console.group(`${REMOTE_DEBUG_PREFIX} dropdown values (${context})`)
  DROPDOWN_NAMES.forEach((name) => {
    console.log(name, dropdownValues[name])
  })
  console.log('allDropdownValues', dropdownValues)
  console.groupEnd()
  return dropdownValues
}

const FormTiepNhanMau = forwardRef(({
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

    logDropdownValues(values, 'submit')
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
    logDropdownOptions('mount')
    logDropdownValues(form.getFieldsValue(true), 'initial')
  }, [form])

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

  const handleValuesChange = useCallback((changedValues, allValues) => {
    const changedDropdown = DROPDOWN_NAMES.filter((name) => Object.prototype.hasOwnProperty.call(changedValues, name))
    if (!changedDropdown.length) {
      return
    }
    logDropdownValues(allValues, `change:${changedDropdown.join(',')}`)
  }, [])

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
    >
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <FormRadioGroup
            name="inspection_result"
            label="Kết quả kiểm tra"
            options={[
              { label: 'Đạt', value: 'PASS' },
              { label: 'Không đạt', value: 'FAIL' },
            ]}
            valueProp="value"
            titleProp="label"
          />
        </Col>
        <Col span={24}>
          <FormSelect
            name="defect_level"
            label="Mức độ lỗi"
            resourceData={DROPDOWN_OPTIONS.defect_level}
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          <FormInput
            name="sample_color"
            label="Màu sắc mẫu"
          />
        </Col>
        <Col span={24}>
          <FormSelect
            name="color_uniformity"
            label="Độ đồng đều màu"
            resourceData={DROPDOWN_OPTIONS.color_uniformity}
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          <FormSelect
            name="surface_condition"
            label="Tình trạng bề mặt"
            resourceData={DROPDOWN_OPTIONS.surface_condition}
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          <FormCheckbox
            name="has_defect"
            label="Có khuyết tật"
            valueProp="value"
            titleProp="label"
          />
        </Col>
        <Col span={24}>
          <FormSelect
            name="defects"
            label="Danh sách khuyết tật"
            mode="multiple"
            resourceData={DROPDOWN_OPTIONS.defects}
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          <FormInputNumber
            name="defect_count"
            label="Số lượng lỗi"
            min={0}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>
    </Form>
  )
})

FormTiepNhanMau.displayName = 'FormTiepNhanMau'

export default FormTiepNhanMau
