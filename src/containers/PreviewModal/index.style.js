import styled, { keyframes } from 'styled-components'

const modalPop = keyframes`
  from { transform: translateY(8px) scale(0.98); opacity: 0; }
  to   { transform: translateY(0)   scale(1);    opacity: 1; }
`

// ─── Scrim + modal ────────────────────────────────────────────────────────────

export const Scrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`

export const ModalWrapper = styled.div`
  background: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 960px;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.20),
    0  4px 16px rgba(0, 0, 0, 0.10);
  animation: ${modalPop} 180ms cubic-bezier(0.22, 1, 0.36, 1);
`

// ─── Header ───────────────────────────────────────────────────────────────────

export const ModalHeader = styled.div`
  padding: 16px 20px 14px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;
`

export const HeaderText = styled.div``

export const ModalTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #18181b;
  line-height: 1.4;
`

export const ModalSubtitle = styled.div`
  font-size: 12px;
  color: #71717a;
  margin-top: 2px;
`

// ─── Tab bar ──────────────────────────────────────────────────────────────────

export const TabBar = styled.div`
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  gap: 0;
`

export const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px 10px;
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? '#1d4ed8' : 'transparent')};
  background: none;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ $active }) => ($active ? '#1d4ed8' : '#71717a')};
  cursor: pointer;
  transition: color 0.1s;
  white-space: nowrap;
  margin-bottom: -1px;

  .anticon { font-size: 12px; }

  &:hover {
    color: ${({ $active }) => ($active ? '#1d4ed8' : '#3f3f46')};
  }
`

export const TabBarRight = styled.div`
  margin-left: auto;
  font-size: 12px;
  color: #71717a;
  padding-right: 2px;
`

// ─── Pane ─────────────────────────────────────────────────────────────────────

export const PaneWrapper = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

// ─── Form UI pane ─────────────────────────────────────────────────────────────

export const FormUIPane = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #f9fafb;
  padding: 20px 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`

export const ViewportControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  overflow: hidden;
`

export const ViewportBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: none;
  background: ${({ $active }) => ($active ? '#eff6ff' : '#fff')};
  color: ${({ $active }) => ($active ? '#1d4ed8' : '#71717a')};
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
  white-space: nowrap;

  &:hover {
    background: ${({ $active }) => ($active ? '#eff6ff' : '#f4f4f5')};
  }
`

export const FormCard = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.04);
  width: 100%;
  max-width: ${({ $viewport }) => ($viewport === 'mobile' ? '360px' : '640px')};
  transition: max-width 0.2s ease;
`

export const FormCardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
`

// ─── JSX code pane ────────────────────────────────────────────────────────────

export const CodePane = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #0f172a;
  display: flex;
  flex-direction: column;
`

export const CodeSubHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
`

export const CodePath = styled.span`
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 11px;
  color: #94a3b8;
`

/* CodeBlock giữ lại để không break import cũ — alias sang CodeHighlight */
export const CodeBlock = styled.pre`
  flex: 1;
  overflow: auto;
  margin: 0;
  padding: 16px 20px 24px;
  font-family: 'SFMono-Regular', Consolas, 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.6;
  color: #e2e8f0;
  background: transparent;

  .tk-tag     { color: #93c5fd; }
  .tk-attr    { color: #c4b5fd; }
  .tk-string  { color: #86efac; }
  .tk-number  { color: #fca5a5; }
  .tk-boolean { color: #fcd34d; }
  .tk-comment { color: #6b7280; font-style: italic; }
  .tk-punct   { color: #94a3b8; }
`

// ─── Code editor — textarea thuần ───────────────────────────────────────────

export const CodeEditorWrapper = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
`

export const CodeTextarea = styled.textarea`
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 16px 20px;
  font-family: 'SFMono-Regular', Consolas, 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.6;
  color: #e2e8f0;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  overflow: auto;
  white-space: pre;
  tab-size: 2;
  box-sizing: border-box;
  caret-color: #e2e8f0;

  &::selection {
    background: #1e40af;
    color: #e2e8f0;
  }

  &::-webkit-scrollbar { width: 6px; height: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
`

/* Không dùng nữa — giữ export để không break import */
export const CodeHighlight = styled.pre`display: none;`

export const BuildStatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  background: #0f172a;
  border-top: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
  gap: 8px;
`

export const BuildStatusText = styled.span`
  font-size: 11px;
  color: ${({ $status }) =>
    $status === 'done'     ? '#86efac' :
    $status === 'error'    ? '#fca5a5' :
    $status === 'building' ? '#fcd34d' :
    '#6b7280'};
  display: flex;
  align-items: center;
  gap: 5px;
`

// ─── Footer ───────────────────────────────────────────────────────────────────

export const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: #fff;
`

export const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #a1a1aa;
`

export const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`