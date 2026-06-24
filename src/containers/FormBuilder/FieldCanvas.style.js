import styled from 'styled-components'

// ─── Container ────────────────────────────────────────────────────────────────

export const CanvasWrapper = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #f5f5f5;
`

export const CanvasHeader = styled.div`
  padding: 8px 24px 8px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
`

export const CanvasTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
`

export const CanvasSubtitle = styled.div`
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;

  code {
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: 11px;
    background: #f5f5f5;
    border: 1px solid #e8e8e8;
    border-radius: 3px;
    padding: 1px 5px;
    color: #595959;
  }
`

// ─── Scrollable body ──────────────────────────────────────────────────────────

export const CanvasBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 40px;
`

// ─── Form card ────────────────────────────────────────────────────────────────

export const FormCard = styled.div`
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  min-height: 200px;
  padding: 8px 0;
`

// ─── Drop zone (hiện khi drag over canvas mà chưa có field nào) ──────────────

export const EmptyDropZone = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 2px dashed ${({ $isOver }) => ($isOver ? '#1677ff' : '#d9d9d9')};
  border-radius: 8px;
  background: ${({ $isOver }) => ($isOver ? '#e6f4ff' : '#fafafa')};
  transition: border-color 0.2s, background 0.2s;
  padding: 40px 20px;
  gap: 8px;
`

export const EmptyDropIcon = styled.div`
  font-size: 32px;
  color: ${({ $isOver }) => ($isOver ? '#1677ff' : '#bfbfbf')};
  line-height: 1;
  transition: color 0.2s;
`

export const EmptyDropText = styled.div`
  font-size: 14px;
  color: ${({ $isOver }) => ($isOver ? '#1677ff' : '#8c8c8c')};
  font-weight: ${({ $isOver }) => ($isOver ? 600 : 400)};
  transition: color 0.2s;
`

export const EmptyDropHint = styled.div`
  font-size: 12px;
  color: #bfbfbf;
`

// ─── Sortable list ────────────────────────────────────────────────────────────

export const SortableList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

// ─── Drop indicator (line giữa 2 item khi đang hover) ────────────────────────

export const DropLine = styled.div`
  height: 2px;
  border-radius: 2px;
  background: #1677ff;
  margin: 0 16px;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.1s;
`

// ─── Add field button (bottom) ────────────────────────────────────────────────

export const AddFieldBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: calc(100% - 32px);
  margin: 8px 16px 4px;
  padding: 10px;
  border: 1.5px dashed #d9d9d9;
  border-radius: 6px;
  background: none;
  color: #8c8c8c;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;

  &:hover {
    border-color: ${({ disabled }) => (disabled ? '#d9d9d9' : '#1677ff')};
    color: ${({ disabled }) => (disabled ? '#8c8c8c' : '#1677ff')};
    background: ${({ disabled }) => (disabled ? 'none' : '#f0f7ff')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`
