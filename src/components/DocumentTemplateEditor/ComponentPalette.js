import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { COMPONENT_PALETTE } from './constants'
import { PaletteGrid, PaletteItem, PanelHeader, SidePanel } from './styles'

const DraggablePaletteItem = ({ item, onAdd }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { kind: 'palette', componentType: item.type },
  })
  const Icon = item.icon

  return (
    <PaletteItem
      ref={setNodeRef}
      type="button"
      $dragging={isDragging}
      onClick={() => onAdd(item.type)}
      {...listeners}
      {...attributes}
    >
      <Icon className="palette-item__icon" />
      <span>{item.label}</span>
    </PaletteItem>
  )
}

const ComponentPalette = ({ onAdd }) => (
  <SidePanel>
    <PanelHeader>Thành phần</PanelHeader>
    <PaletteGrid>
      {COMPONENT_PALETTE.map(item => (
        <DraggablePaletteItem key={item.type} item={item} onAdd={onAdd} />
      ))}
    </PaletteGrid>
  </SidePanel>
)

export default ComponentPalette
