import React from 'react'
import { CopyOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons'
import { useDroppable } from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DOCUMENT_CANVAS_ID } from './constants'
import DocumentNodeContent from './DocumentNodeContent'
import {
  A4Page,
  A4ContentGrid,
  CanvasNodeFrame,
  CanvasViewport,
  EmptyCanvas,
  NodeActions,
} from './styles'

const SortableDocumentNode = ({ node, selected, data, onSelect, onRemove, onDuplicate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    data: { kind: 'canvas-node' },
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
        gridRow: `span ${node.layout?.rowSpan ?? 1}`,
        minHeight: node.layout?.minHeight || undefined,
      }}
      $selected={selected}
      $dragging={isDragging}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(node.id)
      }}
    >
      <NodeActions $visible={selected}>
        <button type="button" aria-label="Di chuyển" {...attributes} {...listeners}><DragOutlined /></button>
        <button type="button" aria-label="Nhân bản" onClick={(event) => { event.stopPropagation(); onDuplicate(node.id) }}><CopyOutlined /></button>
        <button type="button" aria-label="Xóa" onClick={(event) => { event.stopPropagation(); onRemove(node.id) }}><DeleteOutlined /></button>
      </NodeActions>
      <DocumentNodeContent node={node} data={data} />
    </CanvasNodeFrame>
  )
}

const DocumentCanvas = ({ template, data, selectedNodeId, onSelect, onRemove, onDuplicate }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: DOCUMENT_CANVAS_ID,
    data: { kind: 'canvas' },
  })
  const nodes = template.nodes ?? []

  return (
    <CanvasViewport onClick={() => onSelect(null)}>
      <A4Page ref={setNodeRef} $over={isOver} $margin={template.page?.margin}>
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
                  selected={selectedNodeId === node.id}
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
