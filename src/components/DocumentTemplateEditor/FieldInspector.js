import React from 'react'
import { Button, Checkbox, Col, ColorPicker, Empty, Form, Input, InputNumber, Row, Select, Switch } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  ALIGN_OPTIONS,
  COLUMN_SPAN_OPTIONS,
  COMPONENT_TYPES,
  DOCUMENT_TYPE_OPTIONS,
  FONT_OPTIONS,
  FORMAT_OPTIONS,
} from './constants'
import { createNodeId } from './utils'
import { InspectorBody, InspectorSection, InspectorTitle, PanelHeader, SidePanel } from './styles'

const BINDABLE_TYPES = new Set([
  COMPONENT_TYPES.DATA_FIELD,
  COMPONENT_TYPES.DATE,
  COMPONENT_TYPES.QR_CODE,
  COMPONENT_TYPES.BARCODE,
])

const PageLayoutInspector = ({ template, onTemplateChange }) => {
  const layout = template?.layout ?? { columns: 12, columnGap: 12, rowGap: 8 }
  const margin = template?.page?.margin ?? { top: 24, right: 24, bottom: 24, left: 24 }
  const updateLayout = changes => onTemplateChange({ layout: { ...layout, ...changes } })
  const updateMargin = changes => onTemplateChange({
    page: {
      ...(template?.page ?? {}),
      margin: { ...margin, ...changes },
    },
  })

  return (
    <InspectorBody>
      <InspectorSection>
        <InspectorTitle>Loại chứng từ</InspectorTitle>
        <Form.Item label="Loại chứng từ">
          <Select
            value={template?.documentType ?? 'QUOTATION'}
            options={DOCUMENT_TYPE_OPTIONS}
            onChange={documentType => onTemplateChange({ documentType })}
          />
        </Form.Item>
      </InspectorSection>
      <InspectorSection>
        <InspectorTitle>Lưới bố cục</InspectorTitle>
        <div style={{ marginBottom: 14, padding: '9px 12px', borderRadius: 6, background: '#f3f4f6', fontWeight: 600 }}>
          Lưới 12 cột
        </div>
        <Row gutter={8}>
          <Col span={12}><Form.Item label="Khoảng cách cột"><InputNumber min={0} max={60} value={layout.columnGap} onChange={columnGap => updateLayout({ columnGap })} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={12}><Form.Item label="Khoảng cách hàng"><InputNumber min={0} max={60} value={layout.rowGap} onChange={rowGap => updateLayout({ rowGap })} style={{ width: '100%' }} /></Form.Item></Col>
        </Row>
        <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.6 }}>
          Mỗi item có thể chiếm từ 1 đến 12 cột. Các item có tổng độ rộng không quá 12 cột sẽ tự nằm cạnh nhau.
        </div>
      </InspectorSection>

      <InspectorSection>
        <InspectorTitle>Lề trang A4</InspectorTitle>
        <Row gutter={8}>
          <Col span={12}><Form.Item label="Trên"><InputNumber min={0} max={120} value={margin.top} onChange={top => updateMargin({ top })} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={12}><Form.Item label="Phải"><InputNumber min={0} max={120} value={margin.right} onChange={right => updateMargin({ right })} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={12}><Form.Item label="Dưới"><InputNumber min={0} max={120} value={margin.bottom} onChange={bottom => updateMargin({ bottom })} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={12}><Form.Item label="Trái"><InputNumber min={0} max={120} value={margin.left} onChange={left => updateMargin({ left })} style={{ width: '100%' }} /></Form.Item></Col>
        </Row>
      </InspectorSection>
    </InspectorBody>
  )
}

const FieldInspector = ({ node, template, dataSchema = [], onChange, onTemplateChange }) => {
  if (!node) {
    return (
      <SidePanel $side="right">
        <PanelHeader>Bố cục trang</PanelHeader>
        {template
          ? <PageLayoutInspector template={template} onTemplateChange={onTemplateChange} />
          : <InspectorBody><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn một thành phần để cấu hình" /></InspectorBody>}
      </SidePanel>
    )
  }

  const updateStyle = (key, value) => onChange({ style: { ...(node.style ?? {}), [key]: value } })
  const scalarFields = dataSchema.filter(field => !field.scope)
  const tableFields = dataSchema.filter(field => field.scope === node.source)
  const collectionOptions = Array.from(dataSchema.reduce((result, field) => {
    if (field.scope && !result.has(field.scope)) {
      result.set(field.scope, {
        value: field.scope,
        label: field.collectionLabel || field.group || field.scope,
      })
    }
    return result
  }, new Map()).values())

  const updateColumn = (columnId, changes) => onChange({
    columns: node.columns.map(column => column.id === columnId ? { ...column, ...changes } : column),
  })

  const addColumn = () => {
    const field = tableFields.find(item => !node.columns?.some(column => column.binding === item.relativePath))
      ?? tableFields[0]
    onChange({
      columns: [
        ...(node.columns ?? []),
        {
          id: createNodeId(),
          title: field?.label ?? 'Cột mới',
          binding: field?.relativePath ?? '',
          format: field?.dataType === 'number' ? 'number' : 'text',
          align: field?.dataType === 'number' ? 'right' : 'left',
        },
      ],
    })
  }

  return (
    <SidePanel $side="right">
      <PanelHeader>Thuộc tính</PanelHeader>
      <InspectorBody>
        <InspectorSection>
          <InspectorTitle>Bố cục item</InspectorTitle>
          <Form.Item label="Độ rộng">
            <Select
              value={node.layout?.columnSpan ?? 12}
              options={COLUMN_SPAN_OPTIONS}
              onChange={columnSpan => onChange({ layout: { ...(node.layout ?? {}), columnSpan } })}
            />
          </Form.Item>
          <Form.Item label="Số cột tùy chỉnh">
            <InputNumber
              min={1}
              max={template?.layout?.columns ?? 12}
              value={node.layout?.columnSpan ?? 12}
              onChange={columnSpan => onChange({ layout: { ...(node.layout ?? {}), columnSpan } })}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                label="Số dòng chiếm"
                extra="Tăng giá trị để giữ cột bên cạnh qua nhiều dòng."
              >
                <InputNumber
                  min={1}
                  max={20}
                  value={node.layout?.rowSpan ?? 1}
                  onChange={rowSpan => onChange({ layout: { ...(node.layout ?? {}), rowSpan: rowSpan || 1 } })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Chiều cao tối thiểu">
                <InputNumber
                  min={0}
                  max={1000}
                  placeholder="Tự động"
                  value={node.layout?.minHeight}
                  onChange={minHeight => onChange({ layout: { ...(node.layout ?? {}), minHeight } })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Checkbox
            checked={node.layout?.startNewRow === true}
            onChange={event => onChange({ layout: { ...(node.layout ?? {}), startNewRow: event.target.checked } })}
          >
            Bắt đầu ở dòng mới
          </Checkbox>
        </InspectorSection>

        <InspectorSection>
          <InspectorTitle>Nội dung</InspectorTitle>
          {node.type === COMPONENT_TYPES.TEXT && (
            <Form.Item label="Văn bản"><Input.TextArea value={node.content} onChange={event => onChange({ content: event.target.value })} /></Form.Item>
          )}
          {BINDABLE_TYPES.has(node.type) && (
            <>
              <Form.Item label="Nhãn"><Input value={node.label} onChange={event => onChange({ label: event.target.value })} /></Form.Item>
              <Form.Item label="Nguồn dữ liệu">
                <Select
                  showSearch
                  optionFilterProp="label"
                  value={node.binding || undefined}
                  options={scalarFields.map(field => ({ value: field.path, label: `${field.group} / ${field.label}` }))}
                  onChange={binding => onChange({ binding })}
                />
              </Form.Item>
              <Form.Item label="Định dạng"><Select value={node.format ?? 'text'} options={FORMAT_OPTIONS} onChange={format => onChange({ format })} /></Form.Item>
              {node.type === COMPONENT_TYPES.DATA_FIELD && (
                <Form.Item
                  label="Giá trị mock khi xem trước"
                  extra="Chỉ dùng khi dữ liệu preview chưa có giá trị cho field đã chọn."
                >
                  <Input
                    value={node.mockValue}
                    placeholder="Nhập dữ liệu minh họa"
                    onChange={event => onChange({ mockValue: event.target.value })}
                  />
                </Form.Item>
              )}
              <Form.Item label="Khi không có dữ liệu"><Input value={node.fallback} onChange={event => onChange({ fallback: event.target.value })} /></Form.Item>
            </>
          )}
          {node.type === COMPONENT_TYPES.MANUAL_FIELD && (
            <>
              <Form.Item label="Nhãn"><Input value={node.label} onChange={event => onChange({ label: event.target.value })} /></Form.Item>
              <Form.Item label="Placeholder"><Input value={node.placeholder} onChange={event => onChange({ placeholder: event.target.value })} /></Form.Item>
              <Form.Item><Checkbox checked={node.required} onChange={event => onChange({ required: event.target.checked })}>Bắt buộc nhập</Checkbox></Form.Item>
            </>
          )}
          {[COMPONENT_TYPES.IMAGE, COMPONENT_TYPES.LOGO].includes(node.type) && (
            <>
              <Form.Item label="Đường dẫn ảnh"><Input value={node.src} onChange={event => onChange({ src: event.target.value })} /></Form.Item>
              <Form.Item label="Chiều cao"><InputNumber min={24} max={600} value={node.height} onChange={height => onChange({ height })} style={{ width: '100%' }} /></Form.Item>
            </>
          )}
          {node.type === COMPONENT_TYPES.SIGNATURE && (
            <>
              <Form.Item label="Tiêu đề"><Input value={node.title} onChange={event => onChange({ title: event.target.value })} /></Form.Item>
              <Form.Item label="Mô tả"><Input value={node.subtitle} onChange={event => onChange({ subtitle: event.target.value })} /></Form.Item>
            </>
          )}
          {node.type === COMPONENT_TYPES.TABLE && (
            <>
              <Form.Item label="Danh sách dữ liệu">
                <Select value={node.source || undefined} options={collectionOptions} onChange={source => onChange({ source, columns: [] })} />
              </Form.Item>
              <Form.Item><Checkbox checked={node.repeatHeader} onChange={event => onChange({ repeatHeader: event.target.checked })}>Lặp tiêu đề khi sang trang</Checkbox></Form.Item>
              <InspectorTitle>Cột dữ liệu</InspectorTitle>
              {(node.columns ?? []).map(column => (
                <div key={column.id} style={{ padding: 8, marginBottom: 8, background: '#f8fafc', borderRadius: 6 }}>
                  <Row gutter={6}>
                    <Col span={20}><Input value={column.title} onChange={event => updateColumn(column.id, { title: event.target.value })} /></Col>
                    <Col span={4}><Button danger type="text" icon={<DeleteOutlined />} onClick={() => onChange({ columns: node.columns.filter(item => item.id !== column.id) })} /></Col>
                  </Row>
                  <Select
                    style={{ width: '100%', marginTop: 6 }}
                    value={column.binding || undefined}
                    options={tableFields.map(field => ({ value: field.relativePath, label: field.label }))}
                    onChange={binding => updateColumn(column.id, { binding })}
                  />
                </div>
              ))}
              <Button block icon={<PlusOutlined />} onClick={addColumn}>Thêm cột</Button>
            </>
          )}
        </InspectorSection>

        <InspectorSection>
          <InspectorTitle>Hiển thị</InspectorTitle>
          <Form.Item label="Hiển thị" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Switch checked={node.visible !== false} onChange={visible => onChange({ visible })} />
          </Form.Item>
          <Form.Item label="Font"><Select value={node.style?.fontFamily} options={FONT_OPTIONS} onChange={value => updateStyle('fontFamily', value)} /></Form.Item>
          <Row gutter={8}>
            <Col span={12}><Form.Item label="Cỡ chữ"><InputNumber min={8} max={72} value={node.style?.fontSize} onChange={value => updateStyle('fontSize', value)} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Độ đậm"><Select value={node.style?.fontWeight} options={[{ value: 400, label: 'Thường' }, { value: 600, label: 'Đậm' }, { value: 700, label: 'Rất đậm' }]} onChange={value => updateStyle('fontWeight', value)} /></Form.Item></Col>
          </Row>
          <Form.Item label="Căn lề"><Select value={node.style?.textAlign} options={ALIGN_OPTIONS} onChange={value => updateStyle('textAlign', value)} /></Form.Item>
          <Row gutter={8}>
            <Col span={12}><Form.Item label="Màu chữ"><ColorPicker value={node.style?.color} onChange={(_, value) => updateStyle('color', value)} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Màu nền"><ColorPicker value={node.style?.backgroundColor === 'transparent' ? '#ffffff' : node.style?.backgroundColor} onChange={(_, value) => updateStyle('backgroundColor', value)} /></Form.Item></Col>
          </Row>
        </InspectorSection>

        <InspectorSection>
          <InspectorTitle>Khoảng cách và đường viền</InspectorTitle>
          <Row gutter={8}>
            <Col span={12}><Form.Item label="Padding"><InputNumber min={0} max={80} value={node.style?.padding} onChange={value => updateStyle('padding', value)} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Margin dưới"><InputNumber min={0} max={80} value={node.style?.marginBottom} onChange={value => updateStyle('marginBottom', value)} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}><Form.Item label="Độ dày viền"><InputNumber min={0} max={8} value={node.style?.borderWidth} onChange={value => updateStyle('borderWidth', value)} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Bo góc"><InputNumber min={0} max={40} value={node.style?.borderRadius} onChange={value => updateStyle('borderRadius', value)} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item label="Màu viền"><ColorPicker value={node.style?.borderColor} onChange={(_, value) => updateStyle('borderColor', value)} /></Form.Item>
        </InspectorSection>
      </InspectorBody>
    </SidePanel>
  )
}

export default FieldInspector
