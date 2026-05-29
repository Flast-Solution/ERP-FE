import styled from 'styled-components'

// ─── Container ────────────────────────────────────────────────────────────────

export const SidebarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  width: 200px;
  flex-shrink: 0;
`

export const SidebarHeader = styled.div`
  padding: 12px 16px 10px;
  border-bottom: 1px dashed #e8e8e8;
  flex-shrink: 0;
`

export const SidebarTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #8c8c8c;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`

export const SidebarBody = styled.div`
  flex: 1;
  overflow-y: auto;
`

// ─── Field type item (draggable) ──────────────────────────────────────────────

export const FieldTypeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px 9px 16px;
  cursor: grab;
  user-select: none;
  border-bottom: 1px dashed #e8e8e8;
  transition: background 0.12s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f5f5f5;
  }

  &:active {
    cursor: grabbing;
    background: #e6f4ff;
  }
`

export const FieldTypeIcon = styled.span`
  font-size: 14px;
  color: #8c8c8c;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 18px;
`

export const FieldTypeLabel = styled.span`
  font-size: 13px;
  color: #262626;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const FieldTypeDragHandle = styled.span`
  display: flex;
  align-items: center;
  flex-shrink: 0;

  img {
    width: 14px;
    height: 14px;
    opacity: 0.35;
    transition: opacity 0.12s;
  }

  ${FieldTypeItem}:hover & img {
    opacity: 0.7;
  }
`