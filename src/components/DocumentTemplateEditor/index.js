import React, { useState } from 'react'
import { Button, Input, Space, Tooltip } from 'antd'
import {
  ArrowLeftOutlined,
  EyeOutlined,
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
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
import { EditorBody, EditorShell, EditorToolbar } from './styles'

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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const editor = useDocumentTemplateEditor({ initialTemplate, dataSchema, documentType })

  const handleDragStart = ({ active }) => {
    setActiveComponentType(active.data.current?.componentType ?? null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveComponentType(null)
    if (!over) return

    if (active.data.current?.kind === 'palette') {
      const index = over.id === DOCUMENT_CANVAS_ID
        ? editor.template.nodes.length
        : editor.template.nodes.findIndex(node => node.id === over.id)
      editor.addNode(active.data.current.componentType, index < 0 ? undefined : index)
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
          <Space>
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
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>Xem trước</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => onSave?.(editor.serializedTemplate)}>Lưu bản nháp</Button>
          </Space>
        </EditorToolbar>

        <EditorBody>
          <ComponentPalette onAdd={editor.addNode} />
          <DocumentCanvas
            template={editor.template}
            data={sampleData}
            selectedNodeId={editor.selectedNodeId}
            onSelect={editor.setSelectedNodeId}
            onRemove={editor.removeNode}
            onDuplicate={editor.duplicateNode}
          />
          <FieldInspector
            node={editor.selectedNode}
            template={editor.template}
            dataSchema={dataSchema}
            onChange={changes => editor.updateNode(editor.selectedNodeId, changes)}
            onTemplateChange={editor.updateTemplate}
          />
        </EditorBody>
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
        data={sampleData}
        onClose={() => setPreviewOpen(false)}
      />
    </DndContext>
  )
}

export default DocumentTemplateEditor
export {
  buildDraftStorageKey,
  createDocumentNode,
  createEmptyTemplate,
  readTemplateDraft,
  writeTemplateDraft,
} from './utils'
