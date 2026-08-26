import React, { useState } from 'react'
import { Alert, Button, Form, Input, InputNumber, Select, Space, Switch } from 'antd'
import { DOCUMENT_TYPE_OPTIONS, FORMAT_OPTIONS } from '../constants'
import HtmlTemplateContent from './HtmlTemplateContent'
import { HTML_MODES } from './model'
import { CanvasViewport, InspectorBody, PanelHeader, SidePanel } from '../styles'

const HtmlTemplateDesigner = ({ template, onChange, dataSchema = [], sampleData = {} }) => {
  const [selectedId, setSelectedId] = useState('')
  const [showSample, setShowSample] = useState(true)
  const definition = template.htmlTemplate
  const field = definition.fields[selectedId]
  const update = changes => onChange({ htmlTemplate: { ...definition, fields: { ...definition.fields, [selectedId]: { ...field, ...changes } } } })
  const options = dataSchema.filter(item => field?.repeatId ? item.scope === definition.repeats[field.repeatId].source : !item.scope)
    .map(item => ({ value: field?.repeatId ? item.relativePath : item.path, label: item.label }))
  const data = showSample ? (Object.keys(sampleData).length ? sampleData : definition.sampleData || {}) : {}
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(400px, 1fr) 320px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <SidePanel>
        <PanelHeader>Trường trong mẫu HTML</PanelHeader>
        <div style={{ padding: 12 }}>
          <Alert type="info" message="Bố cục được giữ nguyên" description="Bấm vào vùng đánh dấu để đổi nguồn dữ liệu. Sửa layout bên ngoài rồi import lại gói ZIP." />
          <Space direction="vertical" style={{ marginTop: 12, width: '100%' }}>
            {Object.entries(definition.fields).map(([id, item]) => <Button key={id} block type={id === selectedId ? 'primary' : 'default'} onClick={() => setSelectedId(id)} style={{ height: 'auto', whiteSpace: 'normal', textAlign: 'left' }}>{item.label}</Button>)}
          </Space>
        </div>
      </SidePanel>
      <CanvasViewport>
        <div style={{ marginBottom: 16 }}><Switch checked={showSample} onChange={setShowSample} /> Dữ liệu minh họa — không dùng cho đơn hàng thực tế</div>
        <HtmlTemplateContent template={template} data={data} onSelectField={setSelectedId} selectedFieldId={selectedId} />
      </CanvasViewport>
      <SidePanel $side="right">
        <PanelHeader>Cấu hình trường</PanelHeader>
        <InspectorBody>
          <Form layout="vertical">
            <Form.Item label="Loại chứng từ"><Select aria-label="Loại chứng từ" value={template.documentType} options={DOCUMENT_TYPE_OPTIONS} onChange={documentType => onChange({ documentType })} /></Form.Item>
            <Form.Item label="Khổ A4"><Select aria-label="Khổ A4" value={template.page.orientation} options={[{ value: 'portrait', label: 'Dọc' }, { value: 'landscape', label: 'Ngang' }]} onChange={orientation => onChange({ page: { ...template.page, orientation } })} /></Form.Item>
            {!field ? <Alert message="Chọn trường bên trái hoặc trên mẫu" type="info" /> : <>
              <Form.Item label="Mã trường"><Input aria-label="Mã trường" value={selectedId} disabled /></Form.Item>
              <Form.Item label="Tên hiển thị"><Input aria-label="Tên hiển thị" value={field.label} onChange={event => update({ label: event.target.value })} /></Form.Item>
              <Form.Item label="Nguồn nội dung"><Select aria-label="Nguồn nội dung" value={field.mode} options={HTML_MODES.filter(item => field.allowedModes.includes(item.value))} onChange={mode => update({ mode })} /></Form.Item>
              {field.repeatId && <Alert style={{ marginBottom: 12 }} message="Trường lấy theo từng dòng sản phẩm trong vùng lặp" />}
              {['binding', 'sum'].includes(field.mode) && <>
                {options.length > 0 && field.mode === 'binding' && <Form.Item label="Chọn từ danh sách dữ liệu"><Select showSearch optionFilterProp="label" value={field.path || undefined} options={options} onChange={path => update({ path })} /></Form.Item>}
                <Form.Item label={field.repeatId || field.mode === 'sum' ? 'Đường dẫn trong mỗi dòng' : 'Đường dẫn dữ liệu'} extra={field.repeatId ? 'Ví dụ: productName, quantity, price' : 'Ví dụ: customer.name, customerOrder.code'}><Input aria-label="Đường dẫn dữ liệu" value={field.path} onChange={event => update({ path: event.target.value.trim() })} /></Form.Item>
              </>}
              {(field.mode === 'sum' || (field.mode === 'sku' && !field.repeatId)) && <Form.Item label="Danh sách sản phẩm"><Input aria-label="Danh sách sản phẩm" value={field.source} onChange={event => update({ source: event.target.value.trim() })} /></Form.Item>}
              {field.mode === 'sku' && <>
                {!field.repeatId && <Form.Item label="Dòng sản phẩm"><InputNumber aria-label="Dòng sản phẩm" min={1} max={10001} value={field.rowIndex + 1} onChange={value => update({ rowIndex: Math.max(0, (value || 1) - 1) })} /></Form.Item>}
                <Form.Item label="Tên thuộc tính SKU"><Input aria-label="Tên thuộc tính SKU" placeholder="Thành phần, Màu, Khổ..." value={field.attribute} onChange={event => update({ attribute: event.target.value })} /></Form.Item>
              </>}
              {['manual', 'static'].includes(field.mode) && <Form.Item label={field.mode === 'manual' ? 'Giá trị mặc định (không bắt buộc)' : 'Nội dung cố định'}><Input.TextArea aria-label="Nội dung mặc định" rows={3} value={field.value} onChange={event => update({ value: event.target.value })} /></Form.Item>}
              <Form.Item label="Định dạng"><Select aria-label="Định dạng" value={field.format} options={FORMAT_OPTIONS} onChange={format => update({ format })} /></Form.Item>
              {field.mode === 'manual' && <Alert type="info" message="Khi mở báo giá có quyền sửa, người dùng nhập trực tiếp tại trường này. Giá trị được lưu vào quoteConfig." />}
            </>}
          </Form>
        </InspectorBody>
      </SidePanel>
    </div>
  )
}
export default HtmlTemplateDesigner
