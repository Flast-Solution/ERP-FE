import React, { Component, lazy, Suspense, useEffect, useState } from 'react'
import axios from 'axios'
import { Alert, Image, Modal, Spin } from 'antd'
import { resolveUploadUrl } from '../../containers/PreviewModal/uploadUtils'

const PdfPreview = lazy(() => import('./PdfPreview'))
const DocxPreview = lazy(() => import('./DocxPreview'))
const SpreadsheetPreview = lazy(() => import('./SpreadsheetPreview'))
const VIEWERS = { pdf: PdfPreview, docx: DocxPreview, xlsx: SpreadsheetPreview, xls: SpreadsheetPreview, csv: SpreadsheetPreview }
const IMAGE_TYPES = /^(avif|bmp|gif|ico|jpe?g|png|webp)$/
const Loading = () => <div style={{ padding: 48, textAlign: 'center' }}><Spin /></div>

class PreviewErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) return <Alert type="error" showIcon message="Không tải được trình xem. Vui lòng đóng và mở lại tệp." />
    return this.props.children
  }
}

const UploadedFilePreview = ({ file, onClose }) => {
  const [preview, setPreview] = useState({ loading: true })
  useEffect(() => {
    if (!file) return undefined
    let active = true
    let objectUrl
    const controller = new AbortController()
    setPreview({ loading: true, file })
    const load = async () => {
      try {
        const url = file.url ?? file.thumbUrl ?? resolveUploadUrl(file.response)
        if (!url) throw new Error('Không tìm thấy đường dẫn của tệp.')
        const extension = String(file.name || url).split(/[?#]/)[0].split('.').pop().toLowerCase()
        if (!VIEWERS[extension] && !IMAGE_TYPES.test(extension)) {
          throw new Error('Định dạng này chưa hỗ trợ xem trực tiếp. Với Word .doc, vui lòng dùng bản .docx hoặc PDF.')
        }
        // Asset URLs already contain the API prefix.
        const response = await axios.get(url, { baseURL: '', responseType: 'arraybuffer', signal: controller.signal })
        if (!active) return
        if (IMAGE_TYPES.test(extension)) {
          objectUrl = URL.createObjectURL(new Blob([response.data], { type: `image/${extension === 'jpg' ? 'jpeg' : extension}` }))
          setPreview({ file, url: objectUrl })
          return
        }
        setPreview({ file, buffer: response.data, extension })
      } catch (error) {
        if (active) setPreview({ file, error: error.message || 'Không thể tải nội dung tệp.' })
      }
    }
    load()
    return () => {
      active = false
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file])
  const Viewer = VIEWERS[preview.extension]
  let content = <Loading />
  if (preview.file === file && !preview.loading) {
    if (preview.error) content = <Alert type="error" showIcon message={preview.error} />
    else if (preview.url) content = <Image src={preview.url} alt={file?.name} />
    else if (Viewer) content = <PreviewErrorBoundary key={`${file?.uid || file?.name}-${preview.extension}`}>
      <Suspense fallback={<Loading />}><Viewer buffer={preview.buffer} name={file?.name} /></Suspense>
    </PreviewErrorBoundary>
  }
  return <Modal title={file?.name || 'Xem tệp'} open={Boolean(file)} onCancel={onClose}
    footer={null} width="calc(100vw - 32px)" style={{ top: 16 }} destroyOnHidden>
    {file && content}
  </Modal>
}

export default UploadedFilePreview
