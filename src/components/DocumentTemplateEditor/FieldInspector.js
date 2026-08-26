import React from 'react'
import axios from 'axios'
import { Button, Checkbox, Col, ColorPicker, Empty, Form, Input, InputNumber, Row, Select, Space, Switch, Upload, message } from 'antd'
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import {
  extractUploadItems,
  resolveRuntimeAssetUrl,
  resolveUploadUrl,
} from '@/containers/PreviewModal/uploadUtils'
import {
  ALIGN_OPTIONS,
  COLUMN_SPAN_OPTIONS,
  COMPONENT_PALETTE,
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

const RichTextBindingEditor = ({ value = '', fields = [], onChange }) => {
  const textAreaRef = React.useRef(null)
  const [selectedPath, setSelectedPath] = React.useState()
  const [manualPath, setManualPath] = React.useState('customerOrder.customerNote')
  const selectionRef = React.useRef({ start: value.length, end: value.length })

  const getTextArea = () => textAreaRef.current?.resizableTextArea?.textArea

  const rememberSelection = () => {
    const textArea = getTextArea()
    if (!textArea) return
    selectionRef.current = {
      start: textArea.selectionStart,
      end: textArea.selectionEnd,
    }
  }

  const insertAtSelection = (token) => {
    const start = Math.min(selectionRef.current.start ?? value.length, value.length)
    const end = Math.min(selectionRef.current.end ?? start, value.length)
    const nextValue = `${value.slice(0, start)}${token}${value.slice(end)}`
    const nextCursor = start + token.length

    onChange(nextValue)
    setTimeout(() => {
      const textArea = getTextArea()
      textArea?.focus()
      textArea?.setSelectionRange(nextCursor, nextCursor)
      selectionRef.current = { start: nextCursor, end: nextCursor }
    }, 0)
  }

  const insertBinding = () => {
    if (selectedPath) insertAtSelection(`{{ ${selectedPath} }}`)
  }

  const insertManualLine = () => {
    const normalizedPath = manualPath.trim()
    if (normalizedPath) insertAtSelection(`<div>{{ input:${normalizedPath} }}</div>`)
  }

  const insertManualList = () => {
    const normalizedPath = manualPath.trim()
    if (normalizedPath) insertAtSelection(`{{ input-list:${normalizedPath} }}`)
  }

  const options = fields.map(field => ({
    value: field.path,
    label: `${field.label || field.path}${field.group ? ` — ${field.group}` : ''}`,
  }))

  return (
    <>
      <Input.TextArea
        ref={textAreaRef}
        rows={8}
        value={value}
        onChange={event => onChange(event.target.value)}
        onClick={rememberSelection}
        onKeyUp={rememberSelection}
        onSelect={rememberSelection}
      />
      <Space.Compact block style={{ marginTop: 8 }}>
        <Select
          showSearch
          allowClear
          optionFilterProp="label"
          placeholder="Chọn trường dữ liệu"
          value={selectedPath}
          options={options}
          onChange={setSelectedPath}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Button type="primary" disabled={!selectedPath} onClick={insertBinding}>
          Thay / chèn
        </Button>
      </Space.Compact>
      <div style={{ marginTop: 6, color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>
        Bôi đen nội dung cần thay, chọn trường dữ liệu rồi bấm “Thay / chèn”. Nếu không bôi đen, trường sẽ được chèn tại vị trí con trỏ.
      </div>
      <Space.Compact block style={{ marginTop: 10 }}>
        <Input
          value={manualPath}
          placeholder="Key nhập tay, ví dụ: customerOrder.customerNote"
          onChange={event => setManualPath(event.target.value)}
        />
        <Button disabled={!manualPath.trim()} onClick={insertManualLine}>
          Chèn dòng nhập tay
        </Button>
        <Button disabled={!manualPath.trim()} onClick={insertManualList}>
          Chèn danh sách nhập tay
        </Button>
      </Space.Compact>
      <div style={{ marginTop: 6, color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>
        Dòng nhập tay có dạng {'{{ input:customerOrder.customerNote }}'}. Danh sách nhập tay có dạng {'{{ input-list:customerOrder.customerNote }}'};
        khi mở Báo giá, nhấn Enter để thêm một mục mới.
      </div>
    </>
  )
}

const DocumentImageUploader = ({ node, onChange }) => {
  const uploadImage = async ({ file, onSuccess, onError }) => {
    if (!String(file.type ?? '').startsWith('image/')) {
      const error = new Error('Chỉ hỗ trợ file ảnh')
      message.error(error.message)
      onError(error)
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      const error = new Error('Ảnh không được vượt quá 8 MB')
      message.error(error.message)
      onError(error)
      return
    }

    try {
      const formData = new FormData()
      formData.append('files', file)
      formData.append('folder', node.type === COMPONENT_TYPES.LOGO
        ? 'document-template/logo'
        : 'document-template/image')
      const response = await axios.post('/upload/folder/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploaded = extractUploadItems(response.data)[0]
      const src = resolveUploadUrl(uploaded)
      if (!src) throw new Error('API upload không trả về đường dẫn ảnh')
      onChange({ src, asset: uploaded })
      onSuccess(uploaded)
      message.success(node.type === COMPONENT_TYPES.LOGO ? 'Tải logo thành công' : 'Tải ảnh thành công')
    } catch (error) {
      message.error(error?.response?.data?.message || error.message || 'Upload ảnh thất bại')
      onError(error)
    }
  }

  return (
    <div style={{ marginBottom: 14 }}>
      {node.src ? (
        <div style={{ marginBottom: 10, padding: 10, border: '1px solid #e5e7eb', borderRadius: 6, background: '#f8fafc', textAlign: 'center' }}>
          <img src={resolveRuntimeAssetUrl(node.src)} alt={node.alt || ''} style={{ display: 'block', maxWidth: '100%', maxHeight: 120, margin: '0 auto', objectFit: 'contain' }} />
        </div>
      ) : null}
      <Space wrap>
        <Upload accept="image/*" maxCount={1} showUploadList={false} customRequest={uploadImage}>
          <Button icon={<UploadOutlined />}>
            {node.src
              ? (node.type === COMPONENT_TYPES.LOGO ? 'Thay logo' : 'Thay ảnh')
              : (node.type === COMPONENT_TYPES.LOGO ? 'Tải logo lên' : 'Tải ảnh lên')}
          </Button>
        </Upload>
        {node.src ? (
          <Button danger icon={<DeleteOutlined />} onClick={() => onChange({ src: '', asset: null })}>
            Xóa ảnh
          </Button>
        ) : null}
      </Space>
      <div style={{ marginTop: 6, color: '#6b7280', fontSize: 12 }}>PNG, JPG, JPEG hoặc WebP; tối đa 8 MB.</div>
    </div>
  )
}

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

  if (layout.mode === 'absolute') {
    return (
      <InspectorBody>
        <InspectorSection>
          <InspectorTitle>PDF đã chuyển đổi</InspectorTitle>
          <div style={{ padding: 12, borderRadius: 6, background: '#eef2ff', color: '#3730a3', lineHeight: 1.6 }}>
            <strong>{template?.importedPdf?.name || 'PDF import'}</strong><br />
            {template?.pages?.length || 1} trang · {template?.nodes?.length || 0} block chỉnh sửa
          </div>
          <div style={{ marginTop: 10, color: '#64748b', fontSize: 12, lineHeight: 1.6 }}>
            Chọn một block trên trang để sửa nội dung, vị trí và giao diện. Có thể kéo block trực tiếp trên canvas.
          </div>
        </InspectorSection>
        <InspectorSection>
          <InspectorTitle>Loại chứng từ</InspectorTitle>
          <Form.Item label="Loại chứng từ">
            <Select value={template?.documentType ?? 'invoice'} options={DOCUMENT_TYPE_OPTIONS} onChange={documentType => onTemplateChange({ documentType })} />
          </Form.Item>
        </InspectorSection>
      </InspectorBody>
    )
  }

  return (
    <InspectorBody>
      <InspectorSection>
        <InspectorTitle>Loại chứng từ</InspectorTitle>
        <Form.Item label="Loại chứng từ">
          <Select
            value={template?.documentType ?? 'invoice'}
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
        <Form.Item label="Hướng trang">
          <Select
            value={template?.page?.orientation ?? 'portrait'}
            options={[{ value: 'portrait', label: 'Dọc' }, { value: 'landscape', label: 'Ngang' }]}
            onChange={orientation => onTemplateChange({ page: { ...(template?.page ?? {}), orientation } })}
          />
        </Form.Item>
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

const FieldInspector = ({ node, template, dataSchema = [], onChange, onTemplateChange, onAddChild, onSelectNode }) => {
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
          inputMode: 'binding',
          placeholder: '',
          format: field?.dataType === 'number' ? 'number' : 'text',
          align: field?.dataType === 'number' ? 'right' : 'left',
        },
      ],
    })
  }

  const updateHeaderCell = (rowId, cellId, changes) => onChange({
    headerRows: (node.headerRows ?? []).map(row => row.id === rowId
      ? { ...row, cells: row.cells.map(cell => cell.id === cellId ? { ...cell, ...changes } : cell) }
      : row),
  })

  const addHeaderRow = () => onChange({
    headerRows: [
      ...(node.headerRows ?? []),
      {
        id: createNodeId(),
        cells: (node.columns ?? []).map(column => ({
          id: createNodeId(),
          title: column.title,
          colSpan: 1,
          rowSpan: 1,
          align: 'center',
        })),
      },
    ],
  })

  const addSummaryRow = () => onChange({
    summaryRows: [
      ...(node.summaryRows ?? []),
      {
        id: createNodeId(),
        label: 'TỔNG CỘNG',
        formula: `SUM(${node.columns?.[Math.max((node.columns?.length ?? 1) - 1, 0)]?.binding || 'amount'})`,
        format: 'number',
        labelColSpan: Math.max((node.columns?.length ?? 1) - 1, 1),
        backgroundColor: '#f3f4f6',
      },
    ],
  })

  const updateSummaryRow = (summaryId, changes) => onChange({
    summaryRows: (node.summaryRows ?? []).map(summary => (
      summary.id === summaryId ? { ...summary, ...changes } : summary
    )),
  })

  const updateDirectChild = (childId, changes) => onChange({
    children: (node.children ?? []).map(child => (
      child.id === childId ? { ...child, ...changes } : child
    )),
  })

  const applyChildColumnPreset = columnCount => {
    const gridColumns = node.grid?.columns ?? 12
    const columnSpan = Math.max(Math.floor(gridColumns / columnCount), 1)
    onChange({
      children: (node.children ?? []).map(child => ({
        ...child,
        layout: {
          ...(child.layout ?? {}),
          columnSpan,
          startNewRow: false,
        },
      })),
    })
  }

  const applyChildRowPreset = rowCount => {
    const children = node.children ?? []
    if (!children.length) return
    const gridColumns = node.grid?.columns ?? 12
    const itemsPerRow = Math.max(Math.ceil(children.length / rowCount), 1)
    const columnSpan = Math.max(Math.floor(gridColumns / itemsPerRow), 1)
    onChange({
      grid: { ...(node.grid ?? {}), rows: rowCount },
      children: children.map((child, index) => ({
        ...child,
        layout: {
          ...(child.layout ?? {}),
          columnSpan,
          rowSpan: 1,
          startNewRow: index % itemsPerRow === 0,
        },
      })),
    })
  }

  const stackChildrenByRow = () => onChange({
    grid: { ...(node.grid ?? {}), rows: node.children?.length || null },
    children: (node.children ?? []).map(child => ({
      ...child,
      layout: {
        ...(child.layout ?? {}),
        columnSpan: node.grid?.columns ?? 12,
        rowSpan: 1,
        startNewRow: true,
      },
    })),
  })

  return (
    <SidePanel $side="right">
      <PanelHeader>Thuộc tính</PanelHeader>
      <InspectorBody>
        <InspectorSection>
          <InspectorTitle>Bố cục item</InspectorTitle>
          {template?.layout?.mode === 'absolute' ? (
            <>
              <Form.Item label="Trang">
                <InputNumber
                  min={1}
                  max={template?.pages?.length || 1}
                  value={node.layout?.absolute?.page ?? 1}
                  onChange={page => onChange({ layout: { ...(node.layout ?? {}), absolute: { ...(node.layout?.absolute ?? {}), page: page || 1 } } })}
                />
              </Form.Item>
              <Row gutter={8}>
                <Col span={12}><Form.Item label="X"><InputNumber min={0} precision={1} value={node.layout?.absolute?.x ?? 0} onChange={x => onChange({ layout: { ...(node.layout ?? {}), absolute: { ...(node.layout?.absolute ?? {}), x: x || 0 } } })} /></Form.Item></Col>
                <Col span={12}><Form.Item label="Y"><InputNumber min={0} precision={1} value={node.layout?.absolute?.y ?? 0} onChange={y => onChange({ layout: { ...(node.layout ?? {}), absolute: { ...(node.layout?.absolute ?? {}), y: y || 0 } } })} /></Form.Item></Col>
                <Col span={12}><Form.Item label="Rộng"><InputNumber min={1} precision={1} value={node.layout?.absolute?.width ?? 100} onChange={width => onChange({ layout: { ...(node.layout ?? {}), absolute: { ...(node.layout?.absolute ?? {}), width: width || 1 } } })} /></Form.Item></Col>
                <Col span={12}><Form.Item label="Cao"><InputNumber min={1} precision={1} value={node.layout?.absolute?.height ?? 24} onChange={height => onChange({ layout: { ...(node.layout ?? {}), absolute: { ...(node.layout?.absolute ?? {}), height: height || 1 } } })} /></Form.Item></Col>
              </Row>
              <Form.Item label="Góc xoay">
                <InputNumber min={-360} max={360} precision={1} addonAfter="°" value={node.layout?.absolute?.rotation ?? 0} onChange={rotation => onChange({ layout: { ...(node.layout ?? {}), absolute: { ...(node.layout?.absolute ?? {}), rotation: rotation || 0 } } })} />
              </Form.Item>
              <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>Có thể kéo trực tiếp block trên trang để đổi vị trí.</div>
            </>
          ) : (
            <>
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
          <div style={{ marginTop: 10 }}>
            <Checkbox
              checked={node.layout?.avoidPageBreak !== false}
              onChange={event => onChange({ layout: { ...(node.layout ?? {}), avoidPageBreak: event.target.checked } })}
            >
              Không ngắt giữa phần tử khi in
            </Checkbox>
          </div>
            </>
          )}
        </InspectorSection>

        <InspectorSection>
          <InspectorTitle>Nội dung</InspectorTitle>
          {node.type === COMPONENT_TYPES.TEXT && (
            <Form.Item label="Văn bản"><Input.TextArea value={node.content} onChange={event => onChange({ content: event.target.value })} /></Form.Item>
          )}
          {node.type === COMPONENT_TYPES.RICH_TEXT && (
            <Form.Item
              label="Nội dung HTML"
              extra="Hỗ trợ strong, b, em, u, span và binding dạng {{ path.to.field }}."
            >
              <RichTextBindingEditor
                value={node.content}
                fields={scalarFields}
                onChange={content => onChange({ content })}
              />
            </Form.Item>
          )}
          {node.type === COMPONENT_TYPES.CONTAINER && (
            <>
              <Row gutter={8}>
                <Col span={8}><Form.Item label="Số cột"><InputNumber min={1} max={24} value={node.grid?.columns ?? 12} onChange={columns => onChange({ grid: { ...(node.grid ?? {}), columns } })} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Số hàng"><InputNumber min={1} max={50} placeholder="Tự động" value={node.grid?.rows} onChange={rows => onChange({ grid: { ...(node.grid ?? {}), rows } })} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Cao mỗi hàng"><InputNumber min={20} max={1000} value={node.grid?.rowHeight ?? 80} onChange={rowHeight => onChange({ grid: { ...(node.grid ?? {}), rowHeight } })} style={{ width: '100%' }} /></Form.Item></Col>
              </Row>
              <Row gutter={8}>
                <Col span={12}><Form.Item label="Gap cột"><InputNumber min={0} max={60} value={node.grid?.columnGap ?? 0} onChange={columnGap => onChange({ grid: { ...(node.grid ?? {}), columnGap } })} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={12}><Form.Item label="Gap hàng"><InputNumber min={0} max={60} value={node.grid?.rowGap ?? 0} onChange={rowGap => onChange({ grid: { ...(node.grid ?? {}), rowGap } })} style={{ width: '100%' }} /></Form.Item></Col>
              </Row>
              <div style={{ padding: 10, borderRadius: 6, background: '#f3f4f6', color: '#6b7280', fontSize: 12 }}>
                Container đang có {node.children?.length ?? 0} phần tử.
              </div>
              <InspectorTitle style={{ marginTop: 16 }}>Thêm nhanh block con</InspectorTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                {COMPONENT_PALETTE.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.type}
                      icon={<Icon />}
                      onClick={() => onAddChild?.(item.type)}
                      style={{ height: 'auto', minHeight: 40, padding: '7px 9px', whiteSpace: 'normal', textAlign: 'left' }}
                    >
                      {item.label}
                    </Button>
                  )
                })}
              </div>
              <div style={{ marginTop: 8, color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>
                Block mới được thêm trực tiếp vào container này. Có thể chọn block con trên canvas để chỉnh độ rộng và nội dung.
              </div>

              <InspectorTitle style={{ marginTop: 18 }}>Chia cột block con</InspectorTitle>
              <Space wrap style={{ marginBottom: 10 }}>
                <Button size="small" onClick={() => applyChildColumnPreset(1)}>1 cột</Button>
                <Button size="small" onClick={() => applyChildColumnPreset(2)}>2 cột</Button>
                <Button size="small" onClick={() => applyChildColumnPreset(3)}>3 cột</Button>
                <Button size="small" onClick={() => applyChildColumnPreset(4)}>4 cột</Button>
              </Space>
              <InspectorTitle>Chia hàng block con</InspectorTitle>
              <Space wrap style={{ marginBottom: 10 }}>
                <Button size="small" onClick={() => applyChildRowPreset(1)}>Xếp 1 hàng</Button>
                <Button size="small" onClick={() => applyChildRowPreset(2)}>Xếp 2 hàng</Button>
                <Button size="small" onClick={() => applyChildRowPreset(3)}>Xếp 3 hàng</Button>
                <Button size="small" onClick={stackChildrenByRow}>Mỗi block 1 hàng</Button>
              </Space>
              {(node.children ?? []).length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {node.children.map((child, index) => {
                    const childMeta = COMPONENT_PALETTE.find(item => item.type === child.type)
                    return (
                      <div key={child.id} style={{ padding: 8, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 92px 92px', alignItems: 'center', gap: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                        <Button type="link" onClick={() => onSelectNode?.(child.id)} style={{ minWidth: 0, height: 'auto', padding: 0, justifyContent: 'flex-start', whiteSpace: 'normal', textAlign: 'left' }}>
                          {index + 1}. {childMeta?.label || child.type}
                        </Button>
                        <InputNumber
                          min={1}
                          max={node.grid?.columns ?? 12}
                          addonAfter={`/${node.grid?.columns ?? 12}`}
                          value={child.layout?.columnSpan ?? node.grid?.columns ?? 12}
                          onChange={columnSpan => updateDirectChild(child.id, {
                            layout: { ...(child.layout ?? {}), columnSpan: columnSpan || 1 },
                          })}
                          style={{ width: '100%' }}
                        />
                        <InputNumber
                          min={1}
                          max={50}
                          addonAfter="hàng"
                          value={child.layout?.rowSpan ?? 1}
                          onChange={rowSpan => updateDirectChild(child.id, {
                            layout: { ...(child.layout ?? {}), rowSpan: rowSpan || 1 },
                          })}
                          style={{ width: '100%' }}
                        />
                        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 130px', alignItems: 'center', gap: 8 }}>
                          <InputNumber
                            min={0}
                            max={2000}
                            addonBefore="Cao"
                            addonAfter="px"
                            placeholder="Tự động"
                            value={child.layout?.minHeight}
                            onChange={minHeight => updateDirectChild(child.id, {
                              layout: { ...(child.layout ?? {}), minHeight },
                            })}
                            style={{ width: '100%' }}
                          />
                          <Checkbox
                            checked={child.layout?.startNewRow === true}
                            onChange={event => updateDirectChild(child.id, {
                              layout: { ...(child.layout ?? {}), startNewRow: event.target.checked },
                            })}
                          >
                            Xuống hàng mới
                          </Checkbox>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: 12 }}>Thêm block con để cấu hình số cột.</div>
              )}
            </>
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
              <DocumentImageUploader node={node} onChange={onChange} />
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
              <Row gutter={8}>
                <Col span={8}><Form.Item label="Viền bảng"><InputNumber min={0} max={8} value={node.tableStyle?.borderWidth ?? 1} onChange={borderWidth => onChange({ tableStyle: { ...(node.tableStyle ?? {}), borderWidth } })} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Padding ô"><InputNumber min={0} max={40} value={node.tableStyle?.cellPadding ?? 8} onChange={cellPadding => onChange({ tableStyle: { ...(node.tableStyle ?? {}), cellPadding } })} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Màu viền"><ColorPicker value={node.tableStyle?.borderColor ?? '#111827'} onChange={(_, borderColor) => onChange({ tableStyle: { ...(node.tableStyle ?? {}), borderColor } })} /></Form.Item></Col>
              </Row>
              <Form.Item label="Màu nền header"><ColorPicker value={node.tableStyle?.headerBackgroundColor ?? '#f3f4f6'} onChange={(_, headerBackgroundColor) => onChange({ tableStyle: { ...(node.tableStyle ?? {}), headerBackgroundColor } })} /></Form.Item>
              <InspectorTitle>Cột dữ liệu</InspectorTitle>
              {(node.columns ?? []).map(column => (
                <div key={column.id} style={{ padding: 8, marginBottom: 8, background: '#f8fafc', borderRadius: 6 }}>
                  <Row gutter={6}>
                    <Col span={20}><Input value={column.title} onChange={event => updateColumn(column.id, { title: event.target.value })} /></Col>
                    <Col span={4}><Button danger type="text" icon={<DeleteOutlined />} onClick={() => onChange({ columns: node.columns.filter(item => item.id !== column.id) })} /></Col>
                  </Row>
                  <Select
                    style={{ width: '100%', marginTop: 6 }}
                    value={column.inputMode || 'binding'}
                    options={[
                      { value: 'binding', label: 'Lấy từ dữ liệu tự động' },
                      { value: 'manual', label: 'Cho nhập text bằng tay' },
                    ]}
                    onChange={inputMode => updateColumn(column.id, { inputMode })}
                  />
                  {column.inputMode === 'manual' ? (
                    <>
                      <Input
                        style={{ marginTop: 6 }}
                        value={column.binding}
                        placeholder="Key nhận dữ liệu, ví dụ: note"
                        onChange={event => updateColumn(column.id, { binding: event.target.value.trim() })}
                      />
                      <Input
                        style={{ marginTop: 6 }}
                        value={column.placeholder}
                        placeholder="Placeholder khi nhập báo giá"
                        onChange={event => updateColumn(column.id, { placeholder: event.target.value })}
                      />
                    </>
                  ) : (
                    <>
                      <Select
                        showSearch
                        optionFilterProp="label"
                        style={{ width: '100%', marginTop: 6 }}
                        value={column.binding || undefined}
                        options={tableFields.map(field => ({ value: field.relativePath, label: field.label }))}
                        onChange={binding => updateColumn(column.id, {
                          binding,
                          skuAttributeLabel: String(binding).startsWith('skuDetails.')
                            ? column.skuAttributeLabel
                            : undefined,
                        })}
                      />
                      {String(column.binding || '').startsWith('skuDetails.') && (
                        <Input
                          style={{ marginTop: 6 }}
                          value={column.skuAttributeLabel}
                          addonBefore="Thuộc tính SKU"
                          placeholder="Ví dụ: DẠNG KẾT CẤU"
                          onChange={event => updateColumn(column.id, { skuAttributeLabel: event.target.value })}
                        />
                      )}
                    </>
                  )}
                  <Row gutter={6} style={{ marginTop: 6 }}>
                    <Col span={8}><InputNumber min={1} max={100} addonAfter="%" placeholder="Rộng" value={column.width} onChange={width => updateColumn(column.id, { width })} style={{ width: '100%' }} /></Col>
                    <Col span={8}><Select value={column.align || 'left'} options={ALIGN_OPTIONS} onChange={align => updateColumn(column.id, { align })} /></Col>
                    <Col span={8}><Select value={column.format || 'text'} options={FORMAT_OPTIONS} onChange={format => updateColumn(column.id, { format })} /></Col>
                  </Row>
                  <Input.TextArea
                    rows={2}
                    style={{ marginTop: 6 }}
                    value={column.cellTemplate}
                    placeholder="Mẫu ô nâng cao, ví dụ: <strong>{{ name }}</strong><br/>{{ description }}"
                    onChange={event => updateColumn(column.id, { cellTemplate: event.target.value })}
                  />
                </div>
              ))}
              <Button block icon={<PlusOutlined />} onClick={addColumn}>Thêm cột</Button>

              <InspectorTitle style={{ marginTop: 18 }}>Header nhiều tầng / ô gộp</InspectorTitle>
              {(node.headerRows ?? []).map((headerRow, rowIndex) => (
                <div key={headerRow.id} style={{ padding: 8, marginBottom: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>Hàng {rowIndex + 1}</strong>
                    <Button danger size="small" type="text" icon={<DeleteOutlined />} onClick={() => onChange({ headerRows: node.headerRows.filter(row => row.id !== headerRow.id) })} />
                  </Space>
                  {(headerRow.cells ?? []).map(cell => (
                    <Row key={cell.id} gutter={6} style={{ marginBottom: 6 }}>
                      <Col span={12}><Input value={cell.title} placeholder="Tiêu đề ô" onChange={event => updateHeaderCell(headerRow.id, cell.id, { title: event.target.value })} /></Col>
                      <Col span={5}><InputNumber min={1} max={24} addonBefore="C" value={cell.colSpan || 1} onChange={colSpan => updateHeaderCell(headerRow.id, cell.id, { colSpan })} style={{ width: '100%' }} /></Col>
                      <Col span={5}><InputNumber min={1} max={20} addonBefore="R" value={cell.rowSpan || 1} onChange={rowSpan => updateHeaderCell(headerRow.id, cell.id, { rowSpan })} style={{ width: '100%' }} /></Col>
                      <Col span={2}><Button danger type="text" icon={<DeleteOutlined />} onClick={() => onChange({ headerRows: node.headerRows.map(row => row.id === headerRow.id ? { ...row, cells: row.cells.filter(item => item.id !== cell.id) } : row) })} /></Col>
                    </Row>
                  ))}
                  <Button size="small" block icon={<PlusOutlined />} onClick={() => onChange({ headerRows: node.headerRows.map(row => row.id === headerRow.id ? { ...row, cells: [...row.cells, { id: createNodeId(), title: 'Ô mới', colSpan: 1, rowSpan: 1, align: 'center' }] } : row) })}>Thêm ô</Button>
                </div>
              ))}
              <Button block icon={<PlusOutlined />} onClick={addHeaderRow}>Thêm hàng header</Button>

              <InspectorTitle style={{ marginTop: 18 }}>Dòng tổng / công thức</InspectorTitle>
              {(node.summaryRows ?? []).map(summary => (
                <div key={summary.id} style={{ padding: 8, marginBottom: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  <Row gutter={6}>
                    <Col span={20}><Input value={summary.label} placeholder="Nhãn" onChange={event => updateSummaryRow(summary.id, { label: event.target.value })} /></Col>
                    <Col span={4}><Button danger type="text" icon={<DeleteOutlined />} onClick={() => onChange({ summaryRows: node.summaryRows.filter(item => item.id !== summary.id) })} /></Col>
                  </Row>
                  <Input style={{ marginTop: 6 }} value={summary.formula} placeholder="SUM(amount) hoặc SUMPRODUCT(quantity, price)" onChange={event => updateSummaryRow(summary.id, { formula: event.target.value })} />
                  <Row gutter={6} style={{ marginTop: 6 }}>
                    <Col span={8}><InputNumber min={1} max={Math.max(node.columns?.length ?? 1, 1)} value={summary.labelColSpan} onChange={labelColSpan => updateSummaryRow(summary.id, { labelColSpan })} style={{ width: '100%' }} /></Col>
                    <Col span={8}><Select value={summary.format || 'number'} options={FORMAT_OPTIONS} onChange={format => updateSummaryRow(summary.id, { format })} /></Col>
                    <Col span={8}><ColorPicker value={summary.backgroundColor || '#f3f4f6'} onChange={(_, backgroundColor) => updateSummaryRow(summary.id, { backgroundColor })} /></Col>
                  </Row>
                </div>
              ))}
              <Button block icon={<PlusOutlined />} onClick={addSummaryRow}>Thêm dòng tổng</Button>
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
          <Form.Item label="Khoảng cách dòng" extra="1.0 là sát; 1.2–1.4 phù hợp chứng từ; 1.5 trở lên là thoáng.">
            <InputNumber
              min={0.8}
              max={3}
              step={0.1}
              value={node.style?.lineHeight ?? 1.4}
              onChange={value => updateStyle('lineHeight', value)}
              style={{ width: '100%' }}
            />
          </Form.Item>
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
          <Row gutter={8}>
            <Col span={6}><Form.Item label="Trên"><InputNumber min={0} max={8} value={node.style?.borderTopWidth ?? node.style?.borderWidth ?? 0} onChange={value => updateStyle('borderTopWidth', value)} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item label="Phải"><InputNumber min={0} max={8} value={node.style?.borderRightWidth ?? node.style?.borderWidth ?? 0} onChange={value => updateStyle('borderRightWidth', value)} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item label="Dưới"><InputNumber min={0} max={8} value={node.style?.borderBottomWidth ?? node.style?.borderWidth ?? 0} onChange={value => updateStyle('borderBottomWidth', value)} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item label="Trái"><InputNumber min={0} max={8} value={node.style?.borderLeftWidth ?? node.style?.borderWidth ?? 0} onChange={value => updateStyle('borderLeftWidth', value)} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item label="Màu viền"><ColorPicker value={node.style?.borderColor} onChange={(_, value) => updateStyle('borderColor', value)} /></Form.Item>
        </InspectorSection>
      </InspectorBody>
    </SidePanel>
  )
}

export default FieldInspector
