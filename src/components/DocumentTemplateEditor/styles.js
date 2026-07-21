import styled from 'styled-components'

export const EditorShell = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 112px);
  min-height: 640px;
  overflow: hidden;
  background: #f3f5f8;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
`

export const EditorToolbar = styled.div`
  min-height: 58px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
`

export const EditorBody = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 224px minmax(520px, 1fr) 340px;
  min-height: 0;
  overflow: hidden;

  @media (max-width: 1200px) {
    grid-template-columns: 200px minmax(480px, 1fr) 300px;
  }
`

export const SidePanel = styled.aside`
  min-width: 0;
  overflow-y: auto;
  background: #fff;
  border-${props => props.$side === 'right' ? 'left' : 'right'}: 1px solid #e5e7eb;
`

export const PanelHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 16px;
  font-weight: 700;
  color: #111827;
  background: #fff;
  border-bottom: 1px solid #eef0f3;
`

export const PaletteGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 12px;
`

export const PaletteItem = styled.button`
  width: 100%;
  min-height: 56px;
  padding: 10px 14px;
  border: 1px solid ${props => props.$dragging ? '#4f46e5' : 'transparent'};
  border-radius: 7px;
  background: ${props => props.$dragging ? '#eef2ff' : '#fff'};
  color: #374151;
  cursor: grab;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  transition: 150ms ease;

  .palette-item__icon {
    flex: 0 0 24px;
    width: 24px;
    color: #374151;
    font-size: 24px;
  }

  &:hover {
    color: #4f46e5;
    border-color: #c7d2fe;
    background: #f5f7ff;

    .palette-item__icon {
      color: #4f46e5;
    }
  }

  &:active { cursor: grabbing; }
`

export const CanvasViewport = styled.main`
  overflow: auto;
  padding: 28px;
`

export const A4Page = styled.div`
  width: 794px;
  min-height: 1123px;
  margin: 0 auto 28px;
  padding: ${props => {
    const margin = props.$margin ?? {}
    return `${margin.top ?? 24}px ${margin.right ?? 24}px ${margin.bottom ?? 24}px ${margin.left ?? 24}px`
  }};
  box-sizing: border-box;
  background: #fff;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.12);
  border: 1px solid ${props => props.$over ? '#6366f1' : '#e5e7eb'};
  transition: border-color 150ms ease;
`

export const A4ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.$columns ?? 12}, minmax(0, 1fr));
  column-gap: ${props => props.$columnGap ?? 12}px;
  row-gap: ${props => props.$rowGap ?? 8}px;
  align-items: start;
`

export const EmptyCanvas = styled.div`
  grid-column: 1 / -1;
  min-height: 980px;
  border: 2px dashed #d7dce5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  text-align: center;
  line-height: 1.7;
`

export const CanvasNodeFrame = styled.div`
  position: relative;
  min-width: 0;
  width: 100%;
  opacity: ${props => props.$dragging ? 0.45 : 1};
  outline: ${props => props.$selected ? '2px solid #6366f1' : '1px solid transparent'};
  outline-offset: 2px;
  cursor: pointer;

  &:hover {
    outline-color: ${props => props.$selected ? '#6366f1' : '#c7d2fe'};
  }
`

export const NodeActions = styled.div`
  position: absolute;
  top: -30px;
  right: -2px;
  z-index: 4;
  display: ${props => props.$visible ? 'flex' : 'none'};
  padding: 2px;
  background: #4f46e5;
  border-radius: 5px 5px 0 0;

  button {
    width: 26px;
    height: 24px;
    padding: 0;
    border: 0;
    color: #fff;
    background: transparent;
    cursor: pointer;
  }
`

export const InspectorBody = styled.div`
  padding: 14px;

  .ant-form-item {
    display: block;
    margin-bottom: 14px;
  }

  .ant-form-item-row {
    display: block;
  }

  .ant-form-item-label {
    display: block;
    overflow: visible;
    padding: 0 0 6px;
    text-align: left;
    white-space: normal;

    > label {
      height: auto;
      line-height: 1.4;
      white-space: normal;
    }
  }

  .ant-form-item-control,
  .ant-form-item-control-input,
  .ant-select,
  .ant-input-number {
    width: 100%;
    max-width: 100%;
  }
`

export const InspectorSection = styled.div`
  margin-bottom: 16px;
  padding-bottom: 4px;
  border-bottom: 1px solid #eef0f3;
`

export const InspectorTitle = styled.div`
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: .04em;
`

export const TablePlaceholder = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th, td {
    padding: 8px;
    border: 1px solid #d1d5db;
  }

  th { background: #f3f4f6; }
`

export const CodePreview = styled.pre`
  max-height: calc(100vh - 190px);
  overflow: auto;
  padding: 16px;
  border-radius: 8px;
  background: #111827;
  color: #d1fae5;
  font-size: 12px;
  white-space: pre-wrap;
`
