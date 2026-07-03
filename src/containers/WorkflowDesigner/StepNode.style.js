import styled from 'styled-components'

export const NodeWrapper = styled.div`
  background: #ffffff;
  border: 1.5px solid ${({ $selected }) => ($selected ? '#1677ff' : '#e4e4e4')};
  border-radius: 12px;
  padding: 10px 12px 10px 12px;
  min-width: 180px;
  max-width: 240px;
  cursor: pointer;
  box-shadow: ${({ $selected }) =>
    $selected
      ? '0 0 0 3px rgba(22,119,255,0.12), 0 2px 8px rgba(0,0,0,0.08)'
      : '0 1px 4px rgba(0,0,0,0.06)'};
  transition: box-shadow 0.15s, border-color 0.15s;
  position: relative;

  &:hover {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    border-color: ${({ $selected }) => ($selected ? '#1677ff' : '#d0d0d0')};
  }
`

// Header row: [GroupBadge] [Label]  [DragHandle]
export const NodeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
`

// Pill badge nhóm — màu sắc theo config
export const GroupBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px;
  border-radius: 20px;
  background: ${({ $bgColor }) => $bgColor ?? '#f0f0f0'};
  font-size: 11px;
  font-weight: 500;
  color: ${({ $color }) => $color ?? '#595959'};
  white-space: nowrap;
  flex-shrink: 0;
`

export const GroupBadgeDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color ?? '#8c8c8c'};
  display: inline-block;
  flex-shrink: 0;
`

export const NodeLabel = styled.div`
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`

export const DragHandle = styled.div`
  flex-shrink: 0;
  color: #c0c0c0;
  font-size: 14px;
  line-height: 1;
  cursor: grab;
  padding-left: 4px;
  letter-spacing: -1px;

  &:active {
    cursor: grabbing;
  }
`

export const NodeDeleteButton = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${({ $disabled }) => ($disabled ? '#d9d9d9' : '#8c8c8c')};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: ${({ $disabled }) => ($disabled ? '#d9d9d9' : '#ff4d4f')};
    background: ${({ $disabled }) => ($disabled ? 'transparent' : '#fff1f0')};
  }
`

export const NodeCode = styled.div`
  font-size: 11px;
  font-family: monospace;
  color: #b0b0b0;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

// Footer badges row: ⚡ 1 on_enter  📋 1 form
export const NodeFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`

export const FooterBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #8c8c8c;
  white-space: nowrap;
`
