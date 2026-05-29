/**
 * FieldTypeList.js
 *
 * Sidebar trái của Form Builder.
 * Hiển thị 14 loại field (từ FIELD_TYPES), mỗi item có thể kéo vào canvas.
 *
 * Drag strategy:
 *   - Dùng @dnd-kit/core: mỗi item wrap trong <Draggable id="type:{type}">
 *   - id dạng "type:number", "type:select" — FieldCanvas nhận drop và parse ra type
 *   - DragOverlay (render ở FormBuilder/index.js) dùng activeDragType để hiện ghost
 */

import {
  EditOutlined,
  MenuOutlined,
  NumberOutlined,
  CalculatorOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CaretDownOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  UploadOutlined,
  PictureOutlined,
  FontSizeOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useDraggable } from '@dnd-kit/core'
import { FIELD_TYPES } from '@/utils/fieldTypes'
import {
  SidebarWrapper,
  SidebarHeader,
  SidebarTitle,
  SidebarBody,
  FieldTypeItem,
  FieldTypeIcon,
  FieldTypeLabel,
  FieldTypeDragHandle,
} from './FieldTypeList.style'

// ─── Icon map (icon string → component) ──────────────────────────────────────

const ICON_MAP = {
  EditOutlined,
  MenuOutlined,
  NumberOutlined,
  CalculatorOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CaretDownOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  UploadOutlined,
  PictureOutlined,
  FontSizeOutlined,
  SearchOutlined,
}

// ─── Single draggable item ────────────────────────────────────────────────────

const DraggableFieldType = ({ fieldType }) => {
  const dragId = `type:${fieldType.type}`

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id  : dragId,
    data: { type: fieldType.type },   // payload truyền sang FieldCanvas
  })

  const IconComponent = ICON_MAP[fieldType.icon]

  return (
    <FieldTypeItem
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...listeners}
      {...attributes}
    >
      <FieldTypeIcon>
        {IconComponent && <IconComponent />}
      </FieldTypeIcon>

      <FieldTypeLabel>{fieldType.label}</FieldTypeLabel>

      <FieldTypeDragHandle>
        <img src="/img/icon-sidebar-right.svg" alt="" draggable={false} />
      </FieldTypeDragHandle>
    </FieldTypeItem>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const FieldTypeList = () => {
  return (
    <SidebarWrapper>
      <SidebarHeader>
        <SidebarTitle>Loại field</SidebarTitle>
      </SidebarHeader>

      <SidebarBody>
        {FIELD_TYPES.map(fieldType => (
          <DraggableFieldType key={fieldType.type} fieldType={fieldType} />
        ))}
      </SidebarBody>
    </SidebarWrapper>
  )
}

export default FieldTypeList