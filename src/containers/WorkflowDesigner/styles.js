import styled from 'styled-components'
import { Layout, Card } from 'antd'

const { Sider } = Layout

// ─── Layout shells ────────────────────────────────────────────────────────────

export const DesignerLayout = styled(Layout)`
  height: calc(100vh - 170px);
  overflow: hidden;
  background: #f5f5f5;
`

export const LeftSider = styled(Sider)`
  background: #fff !important;
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
  overflow-x: hidden;

  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
`

export const RightSider = styled(Sider)`
  background: #fff !important;
  border-left: 1px solid #f0f0f0;
  overflow-y: auto;
  overflow-x: hidden;

  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
`

export const CanvasWrapper = styled.div`
  flex: 1;
  height: 100%;
  position: relative;

  .react-flow__renderer {
    background: #fafafa;
  }

  .react-flow__background {
    background: #fafafa;
  }
`

// ─── Panel headers ────────────────────────────────────────────────────────────

export const PanelHeader = styled.div`
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
`

export const PanelTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

export const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ $padding }) => $padding ?? '12px'};
`

export const PanelFooter = styled.div`
  padding: 10px 12px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  display: flex;
  gap: 8px;
`

// ─── StepNode ─────────────────────────────────────────────────────────────────

export const StepNodeWrapper = styled.div`
  background: ${({ $bgColor }) => $bgColor};
  border: 2px solid ${({ $borderColor, $selected }) =>
    $selected ? '#1677ff' : $borderColor};
  border-radius: 10px;
  padding: 10px 14px;
  min-width: 140px;
  max-width: 200px;
  cursor: pointer;
  box-shadow: ${({ $selected }) =>
    $selected ? '0 0 0 3px rgba(22,119,255,0.15)' : '0 1px 4px rgba(0,0,0,0.08)'};
  transition: box-shadow 0.15s, border-color 0.15s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }
`

export const StepNodeLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ $color }) => $color};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const StepNodeCode = styled.div`
  font-size: 10px;
  font-family: monospace;
  color: ${({ $color }) => $color};
  opacity: 0.65;
  margin-top: 1px;
`

export const StepNodeDesc = styled.div`
  font-size: 11px;
  color: ${({ $color }) => $color};
  opacity: 0.55;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const StepNodeBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 6px;
`

// ─── StepPanel ────────────────────────────────────────────────────────────────

export const StepTypeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 7px;
  border: 1px dashed ${({ $borderColor }) => $borderColor};
  background: ${({ $bgColor }) => $bgColor};
  cursor: grab;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ $color }) => $color};
  transition: opacity 0.15s;
  user-select: none;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    cursor: grabbing;
  }
`

export const StepListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 7px;
  cursor: pointer;
  margin-bottom: 2px;
  transition: background 0.12s;
  background: ${({ $active }) => ($active ? '#e6f4ff' : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? '#91caff' : 'transparent')};

  &:hover {
    background: ${({ $active }) => ($active ? '#e6f4ff' : '#f5f5f5')};
  }
`

// ─── Detail panel ─────────────────────────────────────────────────────────────

export const EmptySelection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #bfbfbf;
  font-size: 13px;
  text-align: center;
  padding: 24px;
  gap: 8px;
`

export const GuardCard = styled(Card)`
  margin-bottom: 8px;
  border-radius: 8px;

  .ant-card-body {
    padding: 12px;
  }

  border-color: #ffe7ba;
  background: #fffbe6;
`

export const ActionCard = styled(Card)`
  margin-bottom: 8px;
  border-radius: 8px;

  .ant-card-body {
    padding: 12px;
  }

  border-color: #d9f7be;
  background: #f6ffed;
`

export const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  margin-top: ${({ $mt }) => $mt ?? '0px'};
`

// ─── Toolbar ──────────────────────────────────────────────────────────────────

export const ToolbarWrapper = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 5px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`
