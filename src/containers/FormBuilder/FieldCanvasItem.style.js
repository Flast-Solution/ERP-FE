import styled from 'styled-components'

// ─── Wrapper ──────────────────────────────────────────────────────────────────

export const ItemWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0;
  padding: 0 16px 0 8px;
  border-radius: 6px;
  border: 1.5px solid ${({ $selected }) => ($selected ? '#1677ff' : 'transparent')};
  background: ${({ $selected }) => ($selected ? '#f0f7ff' : '#fff')};
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: ${({ $selected }) => ($selected ? '#1677ff' : '#d9d9d9')};
    background: ${({ $selected }) => ($selected ? '#f0f7ff' : '#fafafa')};
  }
`

// ─── Drag handle (trái) ───────────────────────────────────────────────────────

export const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  padding-top: 30px;        /* căn với label của Form.Item */
  flex-shrink: 0;
  color: #bfbfbf;
  font-size: 14px;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.12s;

  ${ItemWrapper}:hover & {
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
  }
`

// ─── Preview area (giữa) ──────────────────────────────────────────────────────

export const PreviewArea = styled.div`
  flex: 1;
  min-width: 0;
  padding: 8px 0;

  /* Form.Item: stack label trên input */
  .ant-form-item {
    margin-bottom: 0;
  }

  .ant-form-item-row {
    flex-direction: column !important;
  }

  .ant-form-item-label {
    text-align: left !important;
    padding-bottom: 4px;
  }

  .ant-form-item-control {
    width: 100% !important;
    max-width: 100% !important;
    flex: none !important;
  }

  .ant-form-item-control-input {
    width: 100%;
  }

  .ant-form-item-control-input-content {
    width: 100%;
  }

  /* Ép full width cho tất cả component antd */
  .ant-input,
  .ant-input-affix-wrapper,
  .ant-input-number,
  .ant-picker,
  .ant-select,
  .ant-upload-wrapper {
    width: 100% !important;
    max-width: 100% !important;
  }

  /* Disabled style, pointer-events off */
  .ant-input,
  .ant-input-number,
  .ant-picker,
  .ant-select-selector,
  .ant-upload-wrapper {
    pointer-events: none;
    background: #fafafa !important;
  }
`

// ─── Field key badge (hiện dưới preview) ─────────────────────────────────────

export const FieldKeyBadge = styled.code`
  display: inline-block;
  font-size: 11px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  color: #8c8c8c;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 3px;
  padding: 1px 5px;
  margin-top: 2px;
  margin-bottom: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

// ─── Required badge ───────────────────────────────────────────────────────────

export const RequiredDot = styled.span`
  color: #ff4d4f;
  margin-left: 2px;
  font-size: 12px;
`

// ─── Action buttons (phải) ────────────────────────────────────────────────────

export const ActionGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  padding-top: 28px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.12s;

  ${ItemWrapper}:hover & {
    opacity: 1;
  }
`

export const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  color: #8c8c8c;
  font-size: 13px;
  padding: 0;
  transition: background 0.1s, color 0.1s;

  &:hover {
    background: ${({ $danger }) => ($danger ? '#fff1f0' : '#f0f0f0')};
    color: ${({ $danger }) => ($danger ? '#ff4d4f' : '#262626')};
  }
`

export const BlockChildrenWrap = styled.div`
  margin-top: 12px;
  padding: 12px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
`

export const BlockDropZone = styled.div`
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px dashed ${({ $isOver }) => ($isOver ? '#1677ff' : '#d9d9d9')};
  border-radius: 8px;
  background: ${({ $isOver }) => ($isOver ? '#e6f4ff' : '#fff')};
  color: ${({ $isOver }) => ($isOver ? '#1677ff' : '#8c8c8c')};
  text-align: center;
  font-size: 13px;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
`

export const BlockChildrenHint = styled.div`
  font-size: 12px;
  color: #8c8c8c;
  text-align: center;
  padding: 48px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`
