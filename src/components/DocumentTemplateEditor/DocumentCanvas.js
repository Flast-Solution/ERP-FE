import React from 'react'
import { CopyOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons'
import { useDroppable } from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DOCUMENT_CANVAS_ID } from './constants'
import DocumentNodeContent from './DocumentNodeContent'
import {
  AbsoluteNodeFrame,
  A4Page,
  A4ContentGrid,
  CanvasNodeFrame,
  CanvasViewport,
  EmptyCanvas,
  ImportedPageLabel,
  NodeActions,
} from './styles'

const AbsoluteDocumentNode = ({ node, selectedNodeId, data, onSelect, onRemove, onDuplicate, onUpdate }) => {
  const position = node.layout?.absolute ?? {}
  const handlePointerDown = (event) => {
    if (event.button !== 0 || event.target.closest('button')) return
    event.preventDefault()
    event.stopPropagation()
    onSelect(node.id)
    const startX = event.clientX
    const startY = event.clientY
    const originX = Number(position.x) || 0
    const originY = Number(position.y) || 0

    const handlePointerMove = (moveEvent) => {
      onUpdate(node.id, {
        layout: {
          ...(node.layout ?? {}),
          absolute: {
            ...position,
            x: Math.max(0, originX + moveEvent.clientX - startX),
            y: Math.max(0, originY + moveEvent.clientY - startY),
          },
        },
      })
    }
    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  return (
    <AbsoluteNodeFrame
      style={{
        left: position.x ?? 0,
        top: position.y ?? 0,
        width: position.width ?? 100,
        height: position.height ?? 24,
        transform: `rotate(${position.rotation ?? 0}deg)`,
        transformOrigin: '0 0',
        zIndex: selectedNodeId === node.id ? 3 : 1,
      }}
      $selected={selectedNodeId === node.id}
      onPointerDown={handlePointerDown}
      onClick={event => event.stopPropagation()}
      data-pdf-avoid-break="true"
    >
      <NodeActions $visible={selectedNodeId === node.id}>
        <button type="button" aria-label="Di chuyển"><DragOutlined /></button>
        <button type="button" aria-label="Nhân bản" onClick={(event) => { event.stopPropagation(); onDuplicate(node.id) }}><CopyOutlined /></button>
        <button type="button" aria-label="Xóa" onClick={(event) => { event.stopPropagation(); onRemove(node.id) }}><DeleteOutlined /></button>
      </NodeActions>
      <DocumentNodeContent node={node} data={data} />
    </AbsoluteNodeFrame>
  )
}

const SortableDocumentNode = ({ node, selectedNodeId, data, onSelect, onRemove, onDuplicate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    data: { kind: 'canvas-node', nodeType: node.type },
  })

  return (
    <CanvasNodeFrame
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        gridColumn: node.layout?.startNewRow
          ? `1 / span ${node.layout?.columnSpan ?? 12}`
          : `span ${node.layout?.columnSpan ?? 12}`,
        gridRow: node.layout?.rowStart
          ? `${node.layout.rowStart} / span ${node.layout?.rowSpan ?? 1}`
          : `span ${node.layout?.rowSpan ?? 1}`,
        minHeight: node.layout?.minHeight || undefined,
      }}
      $selected={selectedNodeId === node.id}
      $dragging={isDragging}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(node.id)
      }}
      data-pdf-avoid-break="true"
    >
      <NodeActions $visible={selectedNodeId === node.id}>
        <button type="button" aria-label="Di chuyển" {...attributes} {...listeners}><DragOutlined /></button>
        <button type="button" aria-label="Nhân bản" onClick={(event) => { event.stopPropagation(); onDuplicate(node.id) }}><CopyOutlined /></button>
        <button type="button" aria-label="Xóa" onClick={(event) => { event.stopPropagation(); onRemove(node.id) }}><DeleteOutlined /></button>
      </NodeActions>
      <DocumentNodeContent
        node={node}
        data={data}
        renderChildren={(children) => children.length ? (
          <SortableContext items={children.map(child => child.id)} strategy={rectSortingStrategy}>
            {children.map(child => (
              <SortableDocumentNode
                key={child.id}
                node={child}
                data={data}
                selectedNodeId={selectedNodeId}
                onSelect={onSelect}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
              />
            ))}
          </SortableContext>
        ) : (
          <div style={{ gridColumn: '1 / -1', minHeight: 120, padding: 16, display: 'grid', placeItems: 'center', color: '#64748b', border: '2px dashed #94a3b8', borderRadius: 6, background: '#f8fafc', textAlign: 'center', lineHeight: 1.6 }}>
            <div>
              <strong>Container đang trống</strong><br />
              Chọn container và dùng “Thêm nhanh block con” ở bảng thuộc tính
            </div>
          </div>
        )}
      />
    </CanvasNodeFrame>
  )
}

const DocumentCanvas = ({ template, data, selectedNodeId, onSelect, onRemove, onDuplicate, onUpdate }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: DOCUMENT_CANVAS_ID,
    data: { kind: 'canvas' },
  })
  const nodes = template.nodes ?? []

  if (template.layout?.mode === 'absolute') {
    const pages = template.pages?.length
      ? template.pages
      : [{ pageNumber: 1, width: 794, height: 1123 }]
    return (
      <CanvasViewport onClick={() => onSelect(null)}>
        {pages.map(page => (
          <A4Page
            key={page.pageNumber}
            $customWidth={page.width}
            $customHeight={page.height}
            $margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <ImportedPageLabel>Trang {page.pageNumber}</ImportedPageLabel>
            {nodes.filter(node => (node.layout?.absolute?.page ?? 1) === page.pageNumber).map(node => (
              <AbsoluteDocumentNode
                key={node.id}
                node={node}
                data={data}
                selectedNodeId={selectedNodeId}
                onSelect={onSelect}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
                onUpdate={onUpdate}
              />
            ))}
          </A4Page>
        ))}
      </CanvasViewport>
    )
  }

  return (
    <CanvasViewport onClick={() => onSelect(null)}>
      <A4Page ref={setNodeRef} $over={isOver} $margin={template.page?.margin} $orientation={template.page?.orientation}>
        <A4ContentGrid
          $columns={template.layout?.columns}
          $columnGap={template.layout?.columnGap}
          $rowGap={template.layout?.rowGap}
        >
          {nodes.length ? (
            <SortableContext items={nodes.map(node => node.id)} strategy={rectSortingStrategy}>
              {nodes.map(node => (
                <SortableDocumentNode
                  key={node.id}
                  node={node}
                  data={data}
                  selectedNodeId={selectedNodeId}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  onDuplicate={onDuplicate}
                />
              ))}
            </SortableContext>
          ) : (
            <EmptyCanvas>
              <div>Kéo thành phần vào trang A4<br />hoặc bấm thành phần ở thanh bên trái</div>
            </EmptyCanvas>
          )}
        </A4ContentGrid>
      </A4Page>
    </CanvasViewport>
  )
}

export default DocumentCanvas
