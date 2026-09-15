import React from 'react'
import { Form, Input, InputNumber, Select } from 'antd'
import { FORMAT_OPTIONS } from './constants'
import {
  configureImportedText,
  createImportedManualContent,
  getImportedManualPath,
  getImportedSkuContent,
  getImportedSkuSettings,
  getImportedTextMode,
} from './importedTextBindings'
import { InspectorSection, InspectorTitle } from './styles'

const ImportedTextInspector = ({ node, dataSchema = [], onChange }) => {
  const mode = getImportedTextMode(node)
  const { source, rowIndex } = getImportedSkuSettings(node)
  const collections = new Map([['customerOrder.details', { value: 'customerOrder.details', label: 'Chi tiết đơn hàng' }]])
  dataSchema.forEach(field => {
    if (field.scope) collections.set(field.scope, { value: field.scope, label: field.collectionLabel || field.group || field.scope })
  })
  const updateSku = (nextSource, nextRowIndex) => onChange({
    pdfSkuSource: nextSource,
    pdfSkuRowIndex: nextRowIndex,
    binding: `${nextSource}.${nextRowIndex}.skuDetails.values.text`,
  })

  return (
    <InspectorSection>
      <InspectorTitle>Nguồn nội dung</InspectorTitle>
      <Form.Item label="Cách điền nội dung">
        <Select
          aria-label="Cách điền nội dung"
          value={mode}
          options={[
            { value: 'static', label: 'Nội dung cố định' },
            { value: 'manual', label: 'Nhập tay khi mở báo giá' },
            { value: 'binding', label: 'Lấy từ dữ liệu tự động' },
            { value: 'sku', label: 'Lấy thuộc tính SKU' },
          ]}
          onChange={nextMode => onChange(configureImportedText(node, nextMode, dataSchema))}
        />
      </Form.Item>
      {mode === 'manual' ? (
        <Form.Item label="Key nhập tay" extra="Mỗi ô dùng một key riêng. Ví dụ: customerOrder.details.0.moq cho MOQ dòng sản phẩm thứ 1.">
          <Input
            aria-label="Key nhập tay"
            value={getImportedManualPath(node)}
            onChange={event => {
              const pdfManualPath = event.target.value.trim()
              onChange({ pdfManualPath, content: createImportedManualContent(pdfManualPath) })
            }}
          />
        </Form.Item>
      ) : null}
      {mode === 'binding' ? (
        <>
          <Form.Item label="Trường dữ liệu">
            <Select
              showSearch
              optionFilterProp="label"
              value={node.binding || undefined}
              options={dataSchema.map(field => ({ value: field.path, label: `${field.group || 'Dữ liệu'} / ${field.label || field.path}` }))}
              onChange={binding => onChange({ binding, pdfFieldBinding: binding })}
            />
          </Form.Item>
          <Form.Item label="Định dạng">
            <Select value={node.format || 'text'} options={FORMAT_OPTIONS} onChange={format => onChange({ format })} />
          </Form.Item>
        </>
      ) : null}
      {mode === 'sku' ? (
        <>
          <Form.Item label="Danh sách sản phẩm">
            <Select value={source} options={[...collections.values()]} onChange={nextSource => updateSku(nextSource, rowIndex)} />
          </Form.Item>
          <Form.Item label="Dòng sản phẩm" extra="Tính từ 1, theo thứ tự chi tiết trong đơn hàng.">
            <InputNumber aria-label="Dòng sản phẩm" min={1} precision={0} value={rowIndex + 1} onChange={value => updateSku(source, Math.max((value || 1) - 1, 0))} />
          </Form.Item>
          <Form.Item label="Thuộc tính SKU" extra="Đối chiếu với skuDetails[].text. Để trống để lấy tất cả thuộc tính của dòng sản phẩm.">
            <Input aria-label="Thuộc tính SKU" value={node.skuAttributeLabel} placeholder="Ví dụ: DẠNG KẾT CẤU" onChange={event => onChange({ skuAttributeLabel: event.target.value })} />
          </Form.Item>
          <Form.Item
            label="Nội dung HTML kết hợp SKU"
            extra={'Ví dụ: Composition: {{ skuDetails.values.text }}. Token dùng dòng sản phẩm và thuộc tính đã chọn ở trên. Hỗ trợ cả skuDetails.value.text.'}
          >
            <Input.TextArea
              aria-label="Nội dung HTML kết hợp SKU"
              rows={5}
              value={getImportedSkuContent(node)}
              onChange={event => onChange({
                ...configureImportedText(node, 'sku'),
                content: event.target.value,
                pdfSkuContent: event.target.value,
              })}
              placeholder="<strong>Composition:</strong> {{ skuDetails.values.text }}"
            />
          </Form.Item>
        </>
      ) : null}
      <div style={{ color: '#64748b', fontSize: 12 }}>Giữ nguyên vị trí và kiểu chữ của block PDF. Chọn Nội dung cố định để quay lại văn bản gốc.</div>
    </InspectorSection>
  )
}

export default ImportedTextInspector
