import styled from 'styled-components'

// ─── Outer layout ─────────────────────────────────────────────────────────────

export const BuilderLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 170px);
  overflow: hidden;
  background: #f5f5f5;
`

// ─── Toolbar ─────────────────────────────────────────────────────────────────

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  gap: 12px;
`

export const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
`

export const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`

export const ToolbarTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
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

// ─── Preview split button ─────────────────────────────────────────────────────
// Thiết kế: 2 nửa liền mạch, ngăn cách bằng đường dọc 1px
// Height 28px theo design spec

export const PreviewSplitBtn = styled.div`
  display: flex;
  align-items: stretch;
  height: 28px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
`

export const PreviewMainBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
  border: none;
  border-right: 1px solid #d9d9d9;
  background: #fff;
  color: #3f3f46;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s;

  .anticon {
    font-size: 12px;
    color: #595959;
  }

  &:hover {
    background: #f5f5f5;
  }
`

export const PreviewChevronBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  border: none;
  background: #fff;
  color: #8c8c8c;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.12s;
  padding: 0;

  &:hover {
    background: #f5f5f5;
  }
`

// ─── AI Agent CTA button ──────────────────────────────────────────────────────
// Dark button, phân biệt với primary brand

export const AIAgentBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 12px 0 8px;
  border: 1px solid #18181b;
  border-radius: 6px;
  background: #18181b;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.12s, border-color 0.12s;

  .anticon {
    font-size: 13px;
  }

  &:hover {
    background: #27272a;
    border-color: #27272a;
  }
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
