import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button, Form, Image, Modal, Spin, Upload, message } from 'antd'
import { EyeOutlined } from '@ant-design/icons'

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
  const [preview, setPreview] = useState({
    open: false,
    url: '',
    name: '',
    image: false,
    loading: false,
    error: '',
  })

  useEffect(() => {
    setFileList(current => {
      if (current.some(file => file.status === 'uploading')) return current
      return (Array.isArray(formValue) ? formValue : (formValue ? [formValue] : [])).map(toUploadFile)
    })
  }, [formValue])

  useEffect(() => () => {
    if (preview.url?.startsWith('blob:')) URL.revokeObjectURL(preview.url)
  }, [preview.url])

  const closePreview = () => {
    setPreview(current => ({ ...current, open: false }))
  }

  const openPreview = async (file) => {
    const sourceUrl = file.url ?? file.thumbUrl ?? resolveUploadUrl(file.response)
    if (!sourceUrl) {
      message.warning('Không tìm thấy đường dẫn xem trước của file.')
      return
    }
    const filename = String(file.name ?? sourceUrl).split(/[?#]/)[0]
    const isImage = /\.(avif|bmp|gif|heic|heif|ico|jpe?g|png|svg|webp)$/i.test(filename)
    setPreview({
      open: true,
      url: '',
      name: file.name || 'Xem trước file',
      image: isImage,
      loading: true,
      error: '',
    })

    try {
      // Dùng Blob URL để bỏ qua Content-Disposition: attachment của API.
      const response = await axios.get(sourceUrl, { responseType: 'blob' })
      let blob = response.data
      const extension = filename.split('.').pop()?.toLowerCase()
      const mimeByExtension = {
        pdf: 'application/pdf',
        txt: 'text/plain;charset=utf-8',
        csv: 'text/csv;charset=utf-8',
        json: 'application/json;charset=utf-8',
        xml: 'application/xml;charset=utf-8',
      }
      if ((!blob.type || blob.type === 'application/octet-stream') && mimeByExtension[extension]) {
        blob = new Blob([blob], { type: mimeByExtension[extension] })
      }
      const blobUrl = URL.createObjectURL(blob)
      setPreview(current => ({ ...current, url: blobUrl, loading: false }))
    } catch (error) {
      setPreview(current => ({
        ...current,
        loading: false,
        error: 'Không thể tải nội dung để xem trước.',
      }))
    }
  }

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
          onPreview={openPreview}
          itemRender={(originNode, file) => (
            <div style={{ position: 'relative' }}>
              {originNode}
              {file.status === 'done' && (
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  title="Xem nhanh"
                  aria-label={`Xem nhanh ${file.name || 'file'}`}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    openPreview(file)
                  }}
                  style={{
                    position: 'absolute',
                    right: 38,
                    top: '50%',
                    zIndex: 2,
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
            </div>
          )}
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
      <Modal
        title={preview.name}
        open={preview.open}
        width="min(960px, calc(100vw - 32px))"
        footer={null}
        destroyOnHidden
        onCancel={closePreview}
      >
        {preview.loading ? (
          <div style={{ display: 'flex', minHeight: 240, alignItems: 'center', justifyContent: 'center' }}>
            <Spin tip="Đang tải nội dung..." />
          </div>
        ) : preview.error ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#ff4d4f' }}>{preview.error}</div>
        ) : preview.image ? (
          <div style={{ display: 'flex', justifyContent: 'center', maxHeight: '75vh', overflow: 'auto' }}>
            <Image src={preview.url} alt={preview.name} style={{ maxHeight: '72vh', objectFit: 'contain' }} />
          </div>
        ) : (
          <iframe
            src={preview.url}
            title={preview.name}
            style={{ width: '100%', height: '72vh', border: 0 }}
          />
        )}
      </Modal>
    </>
  )
}

export default FormFileUpload
