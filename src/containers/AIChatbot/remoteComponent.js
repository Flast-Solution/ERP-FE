import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import axios from 'axios'
import { FormInputNumber, FormRadioGroup, FormSelect, FormTextArea } from '@flast-erp/core/components'
import { Form, Row, Col, Upload, message } from 'antd'

const extractUploadItems = (response) => {
  const payload = response?.data ?? response
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.files)) return payload.files
  if (Array.isArray(payload?.urls)) return payload.urls
  if (Array.isArray(payload?.fileNames)) return payload.fileNames
  if (Array.isArray(payload?.filenames)) return payload.filenames
  if (Array.isArray(payload?.paths)) return payload.paths
  return payload ? [payload] : []
}

const isAbsoluteUploadUrl = (value = '') => /^https?:\/\//i.test(String(value)) || String(value).startsWith('/api/')

const resolveUploadFilename = (item) => {
  if (typeof item === 'string') return item
  return item?.filename
    ?? item?.file_name
    ?? item?.fileName
    ?? item?.file_name_path
    ?? item?.path
    ?? item?.fullPath
    ?? item?.full_path
    ?? item?.url
    ?? item?.fileUrl
    ?? item?.file_url
    ?? ''
}

const resolveUploadUrl = (item) => {
  const filename = resolveUploadFilename(item)
  if (!filename) return ''
  if (isAbsoluteUploadUrl(filename)) return filename
  const baseUrl = String(axios.defaults.baseURL || '/api').replace(/\/$/, '')
  return `${baseUrl}/upload/folder/view?filename=${encodeURIComponent(filename)}`
}

const toUploadFile = (item, index) => {
  if (item?.uid) return item
  const filename = resolveUploadFilename(item)
  const url = resolveUploadUrl(item)
  const name = item?.name ?? filename?.split('/').pop() ?? `file-${index + 1}`
  return { uid: item?.id ?? filename ?? url ?? `upload-${index}`, name, status: 'done', url, thumbUrl: url, response: item }
}

const fileListToValues = (event) => {
  const fileList = Array.isArray(event) ? event : (event?.fileList ?? [])
  return fileList
    .filter(file => file.status === 'done')
    .flatMap(file => extractUploadItems(file.response ?? resolveUploadUrl(file)))
}

const FormFileUpload = ({ name, label, required, accept, folder = 'test', image = false, maxSizeMB }) => {
  const form = Form.useFormInstance()
  const formValue = Form.useWatch(name, form)
  const [fileList, setFileList] = React.useState([])

  React.useEffect(() => {
    setFileList(current => {
      if (current.some(file => file.status === 'uploading')) return current
      return (Array.isArray(formValue) ? formValue : (formValue ? [formValue] : [])).map(toUploadFile)
    })
  }, [formValue])

  return (
    <>
      <Form.Item label={label} required={required}>
        <Upload.Dragger
          multiple
          accept={accept || undefined}
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
          onPreview={(file) => {
            const url = file.url ?? file.thumbUrl ?? resolveUploadUrl(file.response)
            if (url) {
              window.open(url, '_blank', 'noopener,noreferrer')
            }
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
          <p className="ant-upload-text">{image ? 'Kéo ảnh vào đây hoặc bấm để chọn' : 'Kéo file vào đây hoặc bấm để chọn'}</p>
          <p className="ant-upload-hint">Hỗ trợ tải nhiều file cùng lúc</p>
        </Upload.Dragger>
      </Form.Item>
      <Form.Item
        name={name}
        hidden
        getValueProps={() => ({ value: '' })}
        rules={[{
          validator: (_, value) => {
            if (!required || (Array.isArray(value) && value.length > 0)) return Promise.resolve()
            return Promise.reject(new Error('Vui lòng tải file'))
          },
        }]}
      >
        <input type="hidden" />
      </Form.Item>
    </>
  )
}

const UPLOAD_FIELD_NAMES = ["test_image"]

const TEST_STANDARD_OPTIONS = [
  { label: 'ISO 105-C06', value: 'ISO_105_C06' },
  { label: 'ISO 105-X12', value: 'ISO_105_X12' },
  { label: 'ISO 105-E04', value: 'ISO_105_E04' },
  { label: 'ISO 105-B02', value: 'ISO_105_B02' },
  { label: 'AATCC 61', value: 'AATCC_61' },
  { label: 'AATCC 8', value: 'AATCC_8' },
  { label: 'AATCC 15', value: 'AATCC_15' },
  { label: 'TCVN 7698', value: 'TCVN_7698' },
  { label: 'TCVN 5793', value: 'TCVN_5793' },
]

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

    const files = UPLOAD_FIELD_NAMES.flatMap((fieldName) => {
      const value = values[fieldName]
      return Array.isArray(value) ? value : (value ? [value] : [])
    })
    const submitValues = files.length > 0 ? { ...values, files } : values

    await onSubmit?.(submitValues, {
      order: contextData,
      record: contextData,
      data: contextData,
      step,
      formTemplate,
    })
    return submitValues
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
          {/* source: user; action: edited */}
          <FormRadioGroup
            name="result_grade"
            label="Cấp độ bền màu (1–5)"
            required
            options={[
                {
                  "value": "excellent",
                  "label": "5 - Xuất sắc"
                },
                {
                  "value": "good",
                  "label": "4 - Tốt"
                },
                {
                  "value": "rather",
                  "label": "3 - Khá"
                },
                {
                  "value": "least",
                  "label": "2 - Kém"
                },
                {
                  "value": "verypoor",
                  "label": "1 - Rất kém"
                }
              ]}
            valueProp="value"
            titleProp="label"
          />
        </Col>
        <Col span={24}>
          {/* source: user; action: edited */}
          <FormInputNumber
            name="weight_gsm"
            label="Định lượng (g/m²)"
            required
            min={0}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          {/* source: user; action: edited */}
          <FormSelect
            name="test_standard"
            label="Tiêu chuẩn áp dụng"
            required
            resourceData={TEST_STANDARD_OPTIONS}
            valueProp="value"
            titleProp="label"
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={24}>
          {/* source: user; action: edited */}
          <FormFileUpload
            name="test_image"
            label="Ảnh mẫu sau thử"
            folder="test"
            maxSizeMB={5}
          />
        </Col>
        <Col span={24}>
          {/* source: user; action: edited */}
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