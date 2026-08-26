import React, { useState } from 'react'
import { Button, Input, message, Modal, Space, Tooltip, Upload } from 'antd'
import {
  ArrowLeftOutlined,
  EyeOutlined,
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import ComponentPalette from './ComponentPalette'
import DocumentCanvas from './DocumentCanvas'
import FieldInspector from './FieldInspector'
import PreviewDrawer from './PreviewDrawer'
import useDocumentTemplateEditor from './useDocumentTemplateEditor'
import { DOCUMENT_CANVAS_ID } from './constants'
import { importPdfAsTemplate } from './pdfImport'
import { EditorBody, EditorShell, EditorToolbar } from './styles'
import HtmlTemplateDesigner from './html/HtmlTemplateDesigner'
import { normalizeHtmlDefinition } from './html/model'
import { downloadTemplateBytes, exportHtmlTemplateZip, importHtmlTemplateZip } from './html/package'

/**
 * Reusable document template editor.
 * The component is domain-agnostic: callers provide schema, sample data and persistence callbacks.
 */
const DocumentTemplateEditor = ({
  documentType = 'DOCUMENT',
  initialTemplate,
  dataSchema = [],
  sampleData = {},
  saving = false,
  onSave,
  onCancel,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [activeComponentType, setActiveComponentType] = useState(null)
  const [importingPdf, setImportingPdf] = useState(false)
  const [importingHtml, setImportingHtml] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const editor = useDocumentTemplateEditor({ initialTemplate, dataSchema, documentType })
  const isHtml = editor.template.layout?.mode === 'html'
  const handleHtmlImport = async file => {
    setImportingHtml(true)
    try {
      const imported = await importHtmlTemplateZip(file)
      Modal.confirm({
        title: `Import mẫu ${imported.name}?`,
        content: `Có ${Object.keys(imported.htmlTemplate.fields).length} trường cấu hình. Bố cục hiện tại sẽ được thay thế; có thể Hoàn tác.`,
        okText: 'Import mẫu', cancelText: 'Hủy',
        onOk: () => editor.replaceTemplate(imported),
      })
    } catch (error) { message.error(error.message || 'Không thể đọc gói HTML + JSON') }
    finally { setImportingHtml(false) }
    return false
  }
  const exportHtml = () => {
    try { downloadTemplateBytes(exportHtmlTemplateZip(editor.serializedTemplate), 'document-template.zip') }
    catch (error) { message.error(error.message) }
  }
  const saveTemplate = () => {
    try {
      const template = editor.serializedTemplate
      onSave?.(isHtml ? { ...template, htmlTemplate: normalizeHtmlDefinition(template.htmlTemplate) } : template)
    } catch (error) { message.error(error.message) }
  }

  const handlePdfImport = async (file) => {
    const confirmed = await new Promise(resolve => {
      Modal.confirm({
        title: 'Chuyển PDF thành các block chỉnh sửa?',
        content: 'Thao tác này sẽ thay thế các block hiện tại. Có thể dùng Hoàn tác ngay sau khi import.',
        okText: 'Import PDF',
        cancelText: 'Hủy',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
    if (!confirmed) return false
    setImportingPdf(true)
    try {
      const importedTemplate = await importPdfAsTemplate(file, editor.template)
      editor.replaceTemplate(importedTemplate)
      message.success(`Đã chuyển ${importedTemplate.importedPdf.pageCount} trang thành ${importedTemplate.nodes.length} block`)
    } catch (error) {
      message.error(error?.message || 'Không thể đọc nội dung PDF')
    } finally {
      setImportingPdf(false)
    }
    return false
  }

  const handleDragStart = ({ active }) => {
    setActiveComponentType(active.data.current?.componentType ?? null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveComponentType(null)
    if (!over) return

    if (active.data.current?.kind === 'palette') {
      if (over.data.current?.nodeType === 'container') {
        editor.addNode(active.data.current.componentType, undefined, over.id)
        return
      }
      const index = over.id === DOCUMENT_CANVAS_ID
        ? editor.template.nodes.length
        : editor.template.nodes.findIndex(node => node.id === over.id)
      editor.addNode(active.data.current.componentType, index < 0 ? undefined : index, '__root__')
      return
    }

    if (active.data.current?.kind === 'canvas-node') {
      editor.moveNode(active.id, over.id)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveComponentType(null)}
    >
      <EditorShell>
        <EditorToolbar>
          <Space wrap>
            <Tooltip title="Quay lại"><Button icon={<ArrowLeftOutlined />} onClick={onCancel} /></Tooltip>
            <Input
              value={editor.template.name}
              onChange={event => editor.updateTemplate({ name: event.target.value })}
              style={{ width: 260, fontWeight: 600 }}
              placeholder="Tên template"
            />
            <Tooltip title="Hoàn tác"><Button icon={<UndoOutlined />} disabled={!editor.canUndo} onClick={editor.undo} /></Tooltip>
            <Tooltip title="Làm lại"><Button icon={<RedoOutlined />} disabled={!editor.canRedo} onClick={editor.redo} /></Tooltip>
          </Space>
          <Space wrap>
            <Button href={`${process.env.PUBLIC_URL || ''}/document-templates/htk-commercial-invoice.zip`} download icon={<DownloadOutlined />}>Tải mẫu HTML HTK</Button>
            <Upload accept=".zip,application/zip" showUploadList={false} beforeUpload={handleHtmlImport}>
              <Button icon={<UploadOutlined />} loading={importingHtml}>Import HTML + JSON</Button>
            </Upload>
            {isHtml && <Button icon={<DownloadOutlined />} onClick={exportHtml}>Xuất gói HTML</Button>}
            <Upload accept="application/pdf,.pdf" showUploadList={false} beforeUpload={handlePdfImport}>
              <Button icon={<UploadOutlined />} loading={importingPdf}>Import PDF</Button>
            </Upload>
            <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>Xem trước</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveTemplate}>Lưu chứng từ</Button>
          </Space>
        </EditorToolbar>

        {isHtml ? <HtmlTemplateDesigner template={editor.template} onChange={editor.updateTemplate} dataSchema={dataSchema} sampleData={sampleData} /> : <EditorBody>
          <ComponentPalette onAdd={editor.addNode} />
          <DocumentCanvas
            template={editor.template}
            data={sampleData}
            selectedNodeId={editor.selectedNodeId}
            onSelect={editor.setSelectedNodeId}
            onRemove={editor.removeNode}
            onDuplicate={editor.duplicateNode}
            onUpdate={editor.updateNode}
          />
          <FieldInspector
            node={editor.selectedNode}
            template={editor.template}
            dataSchema={dataSchema}
            onChange={changes => editor.updateNode(editor.selectedNodeId, changes)}
            onTemplateChange={editor.updateTemplate}
            onAddChild={type => editor.addNode(type, undefined, editor.selectedNodeId, false)}
            onSelectNode={editor.setSelectedNodeId}
          />
        </EditorBody>}
      </EditorShell>

      <DragOverlay dropAnimation={null}>
        {activeComponentType ? (
          <div style={{ padding: '10px 14px', border: '1px solid #6366f1', borderRadius: 8, background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,.15)' }}>
            Thêm thành phần
          </div>
        ) : null}
      </DragOverlay>

      <PreviewDrawer
        open={previewOpen}
        template={editor.serializedTemplate}
        data={isHtml && !Object.keys(sampleData).length ? editor.template.htmlTemplate.sampleData : sampleData}
        onClose={() => setPreviewOpen(false)}
      />
    </DndContext>
  )
}

export default DocumentTemplateEditor
export {
  createDocumentNode,
  createEmptyTemplate,
} from './utils'
