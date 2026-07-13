import styled from 'styled-components'

export const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`

// Row chứa title + icon action bên phải
export const SectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 8px;
  flex-shrink: 0;
`

export const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #8c8c8c;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`

// Nút icon + nhỏ bên phải section header
export const AddIconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid #d9d9d9;
  background: transparent;
  color: #8c8c8c;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: #1677ff;
    color: #1677ff;
  }
`

// ─── Palette "Thêm bước" ──────────────────────────────────────────────────────

// Wrapper có max-height + scroll khi danh sách loại bước dài > 250px
export const PaletteWrapper = styled.div`
  max-height: 250px;
  overflow-y: auto;
  flex-shrink: 0;
  padding-bottom: 4px;
`

export const TypePill = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  margin: 0 10px 6px;
  border-radius: 20px;
  background: ${({ $bgColor }) => $bgColor};
  cursor: grab;
  user-select: none;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.82;
  }
  &:active {
    cursor: grabbing;
  }
`

export const TypePillLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
`

export const TypePillDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`

export const TypePillLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ $color }) => $color};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const TypePillIcon = styled.img`
  width: 16px;
  height: 16px;
  opacity: 0.45;
  flex-shrink: 0;
  margin-left: 6px;
`

export const PaletteDivider = styled.div`
  height: 1px;
  background: #f0f0f0;
  margin: 6px 0 0;
  flex-shrink: 0;
`

// ─── Danh sách "Bước trong quy trình" ────────────────────────────────────────

export const StepListWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`

export const WorkflowStatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 12px 12px;
  padding: 9px 10px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
  flex-shrink: 0;

  .workflow-status-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .status-config-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: #8c8c8c;
    cursor: pointer;
  }

  .status-config-button:hover {
    color: #1677ff;
    background: #e6f4ff;
  }
`

export const WorkflowStatusText = styled.div`
  min-width: 0;
`

export const WorkflowStatusLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #262626;
`

export const WorkflowStatusValue = styled.div`
  margin-top: 2px;
  font-size: 11px;
  color: #8c8c8c;
`

export const StepRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? '#e6f4ff' : 'transparent')};
  transition: background 0.1s;

  &:hover {
    background: ${({ $active }) => ($active ? '#e6f4ff' : '#f5f5f5')};
  }
`

export const StepRowDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`

export const StepRowLabel = styled.div`
  flex: 1;
  font-size: 13px;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`

export const StepRowCode = styled.div`
  font-size: 11px;
  font-family: monospace;
  color: #8c8c8c;
  white-space: nowrap;
  flex-shrink: 0;
`
