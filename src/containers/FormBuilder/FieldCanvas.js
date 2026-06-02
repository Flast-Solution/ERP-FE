/**
 * FieldCanvas.js
 *
 * Canvas giữa của Form Builder.
 * Nhận drop từ FieldTypeList (type mới) và sắp xếp lại các field hiện có.
 *
 * Drag & Drop:
 *   - useDroppable(id="canvas") — nhận drag từ FieldTypeList (id dạng "type:xxx")
 *   - SortableContext — reorder các field đã có trong canvas
 *   - onDragEnd (xử lý ở FormBuilder/index.js, truyền xuống qua DndContext chung)
 *     → nếu dragging "type:xxx" + over "canvas" → addField(type)
 *     → nếu dragging field._id + over field._id khác → reorderFields(newOrder)
 *
 * Header:
 *   - Hiện templateMeta.name và domain (từ store)
 *
 * Empty state:
 *   - Khi fields=[] → EmptyDropZone với $isOver highlight
 *
 * Add button:
 *   - Nút "+ Kéo field vào đây hoặc bấm để thêm" ở cuối list
 *   - Click → không làm gì (placeholder, có thể mở modal chọn type sau)
 */

import { PlusOutlined, FormOutlined } from '@ant-design/icons'
import { Row, Col } from 'antd'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import useFormBuilderStore from '@/store/useFormBuilderStore'
import FieldCanvasItem from './FieldCanvasItem'
import {
  CanvasWrapper,
  CanvasHeader,
  CanvasTitle,
  CanvasSubtitle,
  CanvasBody,
  FormCard,
  EmptyDropZone,
  EmptyDropIcon,
  EmptyDropText,
  EmptyDropHint,
  SortableList,
  AddFieldBtn,
} from './FieldCanvas.style'

// ─── Canvas drop zone id ──────────────────────────────────────────────────────

export const CANVAS_DROPPABLE_ID = 'canvas'

// ─── Main component ───────────────────────────────────────────────────────────

const FieldCanvas = () => {
  const fields       = useFormBuilderStore(s => s.fields)
  const templateMeta = useFormBuilderStore(s => s.templateMeta)

  // Canvas là droppable — nhận drag từ FieldTypeList
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROPPABLE_ID })

  // ids cho SortableContext — dùng _id (FE internal)
  const sortableIds = fields.map(f => f._id)

  return (
    <CanvasWrapper>

      {/* ── Header ── */}
      <CanvasHeader>
        <CanvasTitle>
          {templateMeta.name || 'Form chưa đặt tên'}
        </CanvasTitle>

        {templateMeta.domain && (
          <CanvasSubtitle>
            KTV sẽ điền form này tại bước{' '}
            <code>{templateMeta.domain}</code>.
            Tiêu chuẩn TCVN 1748:2007.
          </CanvasSubtitle>
        )}
      </CanvasHeader>

      {/* ── Body ── */}
      <CanvasBody>

        {fields.length === 0 ? (

          // ── Empty drop zone ──
          <EmptyDropZone ref={setNodeRef} $isOver={isOver}>
            <EmptyDropIcon $isOver={isOver}>
              <FormOutlined />
            </EmptyDropIcon>
            <EmptyDropText $isOver={isOver}>
              {isOver ? 'Thả để thêm field' : 'Kéo field vào đây để bắt đầu'}
            </EmptyDropText>
            <EmptyDropHint>
              Chọn loại field từ danh sách bên trái
            </EmptyDropHint>
          </EmptyDropZone>

        ) : (

          // ── Sortable list ──
          <FormCard ref={setNodeRef}>
            <SortableContext
              items={sortableIds}
              strategy={rectSortingStrategy}
            >
              <SortableList>
                <Row gutter={[8, 0]}>
                  {fields.map(field => (
                    <Col key={field._id} span={field.colSpan ?? 24}>
                      <FieldCanvasItem field={field} />
                    </Col>
                  ))}
                </Row>
              </SortableList>
            </SortableContext>

            {/* Add field button */}
            <AddFieldBtn
              onClick={e => e.preventDefault()}
              title="Kéo field từ bên trái hoặc bấm để thêm"
            >
              <PlusOutlined />
              Kéo field vào đây hoặc bấm để thêm
            </AddFieldBtn>
          </FormCard>

        )}

      </CanvasBody>
    </CanvasWrapper>
  )
}

export default FieldCanvas
