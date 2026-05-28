import styled from 'styled-components'

// ─── Outer layout ─────────────────────────────────────────────────────────────

export const BuilderLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
`

// ─── Top toolbar ──────────────────────────────────────────────────────────────

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  gap: 12px;
`

export const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`

export const ToolbarCenter = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`

export const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

export const ToolbarTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
`

export const ToolbarDomain = styled.code`
  font-size: 11px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 3px;
  padding: 2px 7px;
  color: #595959;
  flex-shrink: 0;
`

// ─── Three-column body ────────────────────────────────────────────────────────

export const BuilderBody = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`

// ─── Drag overlay ghost ───────────────────────────────────────────────────────

export const DragGhost = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #fff;
  border: 1.5px solid #1677ff;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  color: #1677ff;
  font-weight: 500;
  pointer-events: none;
  white-space: nowrap;
`

export const DragGhostIcon = styled.span`
  font-size: 14px;
  display: flex;
  align-items: center;
`