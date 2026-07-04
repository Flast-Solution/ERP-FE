import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import axios from 'axios'
import { FormInputNumber, FormRadioGroup, FormSelect, FormTextArea } from '@flast-erp/core/components'
import { Form, Row, Col, Upload, message } from 'antd'

const RESULT_GRADE_OPTIONS = [
  { label: '5 - Xuất sắc', value: 'excellent' },
  { label: '4 - Tốt', value: 'good' },
  { label: '3 - Khá', value: 'rather' },
  { label: '2 - Kém', value: 'least' },
  { label: '1 - Rất kém', value: 'verypoor' },
]

const extractUploadItems = (response) => {
  const payload = response?.data ?? response
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.files)) return payload.files
  if (Array.isArray(payload?.urls)) return payload.urls
  return payload ? [payload] : []
}

const resolveUploadUrl = (item) => {
  if (typeof item === 'string') return item
  return item?.url ?? item?.fileUrl ?? item?.fileName ?? item?.path ?? item?.fullPath ?? ''
}

const toUploadFile = (item, index) => {
  if (item?.uid) return item
  const url = resolveUploadUrl(item)
  const name = item?.name
    ?? item?.fileName?.split('/').pop()
    ?? item?.path?.split('/').pop()
    ?? url?.split('/').pop()
    ?? `file-${index + 1}`

  return {
    uid: item?.id ?? url ?? `upload-${index}`,
    name,
    status: 'done',
    url,
    response: item,
  }
}

const fileListToValues = (event) => {
  const fileList = Array.isArray(event) ? event : (event?.fileList ?? [])
  return fileList
    .filter(file => file.status === 'done')
    .flatMap(file => extractUploadItems(file.response ?? resolveUploadUrl(file)))
}

const FormFileUpload = ({
  name,
  label,
  required,
  accept,
  folder = 'test',
  image = false,
  maxSizeMB,
}) => {
  const form = Form.useFormInstance()
  const formValue = Form.useWatch(name, form)
  const [fileList, setFileList] = useState([])

  useEffect(() => {
    setFileList(current => {
      if (current.some(file => file.status === 'uploading')) {
        return current
      }
      return (Array.isArray(formValue) ? formValue : (formValue ? [formValue] : [])).map(toUploadFile)
    })
  }, [formValue])

  return (
    <>
      <Form.Item label={label} required={required}>
        <Upload.Dragger
          multiple
          accept={accept}
          fileList={fileList}
          listType={image ? 'picture' : 'text'}
          beforeUpload={(file) => {
            if (maxSizeMB && file.size / 1024 / 1024 > maxSizeMB) {
              message.error(`${file.name} vượt quá ${maxSizeMB}MB`)
              return Upload.LIST_IGNORE
            }
            return true
          }}
          onChange={({ fileList: nextFileList }) => {
            setFileList(nextFileList)
            form.setFieldValue(name, fileListToValues(nextFileList))
          }}
          customRequest={async ({ file, onSuccess, onError }) => {
            try {
              const formData = new FormData()
              formData.append('files', file)
              formData.append('folder', folder)
              const response = await axios.post('/upload/folder/multiple', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              })
              const uploaded = extractUploadItems(response.data)
              onSuccess(uploaded.length === 1 ? uploaded[0] : uploaded)
            } catch (error) {
              message.error('Upload thất bại')
              onError(error)
            }
          }}
        >
          <p className="ant-upload-text">
            {image ? 'Kéo ảnh vào đây hoặc bấm để chọn' : 'Kéo file vào đây hoặc bấm để chọn'}
          </p>
          <p className="ant-upload-hint">Hỗ trợ tải nhiều file cùng lúc</p>
        </Upload.Dragger>
      </Form.Item>
      <Form.Item
        name={name}
        hidden
        getValueProps={() => ({ value: '' })}
        rules={[{
          validator: (_, value) => {
            if (!required || (Array.isArray(value) && value.length > 0)) {
              return Promise.resolve()
            }
            return Promise.reject(new Error('Vui lòng tải file'))
          },
        }]}
      >
        <input type="hidden" />
      </Form.Item>
    </>
  )
}

const KetQuaThuDoBenMau = forwardRef(({
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

    const files = Array.isArray(values.test_image)
      ? values.test_image
      : (values.test_image ? [values.test_image] : [])

    await onSubmit?.({
      ...values,
      test_image: files,
      files,
    }, {
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
          <FormRadioGroup
            name="result_grade"
            label="Cấp độ bền màu (1–5)"
            required
            options={RESULT_GRADE_OPTIONS}
          />
        </Col>
        <Col span={24}>
          <FormInputNumber
            name="weight_gsm"
            label="Định lượng (g/m²)"
            required
            min={0}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          <FormSelect
            name="test_standard"
            label="Tiêu chuẩn áp dụng"
            required
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          <FormFileUpload
            name="test_image"
            label="Ảnh mẫu sau thử"
            accept="image/*"
            folder="test"
            image
          />
        </Col>
        <Col span={24}>
          <FormTextArea
            name="technician_note"
            label="Ghi chú KTV"
          />
        </Col>
      </Row>
    </Form>
  )
})

KetQuaThuDoBenMau.displayName = 'KetQuaThuDoBenMau'

export default KetQuaThuDoBenMau
