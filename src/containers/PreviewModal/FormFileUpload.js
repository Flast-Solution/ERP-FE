import { useEffect, useState } from 'react'
import axios from 'axios'
import { Form, Upload, message } from 'antd'

import {
  extractUploadItems,
  fileListToValues,
  resolveUploadUrl,
  toUploadFile,
} from './uploadUtils'

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
            if (url) window.open(url, '_blank', 'noopener,noreferrer')
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

export default FormFileUpload
