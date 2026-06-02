import styled, { keyframes } from 'styled-components'

export const ThreadWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

/* ── Bubbles ── */

export const BubbleRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${({ $role }) => $role === 'user' ? 'flex-end' : 'flex-start'};
`

export const Bubble = styled.div`
  max-width: 88%;
  padding: 8px 11px;
  border-radius: ${({ $role }) =>
    $role === 'user'
      ? '12px 12px 3px 12px'
      : '12px 12px 12px 3px'};
  font-size: 12.5px;
  line-height: 1.55;
  word-break: break-word;

  background: ${({ $role }) => $role === 'user' ? '#1677ff' : '#f4f4f5'};
  color:      ${({ $role }) => $role === 'user' ? '#fff'    : '#18181b'};

  b, strong { font-weight: 600; }

  /* Markdown styles bên trong bubble assistant */
  p          { margin: 0 0 6px; &:last-child { margin-bottom: 0; } }
  h1,h2,h3   { font-size: 13px; font-weight: 700; margin: 8px 0 4px; }
  ul, ol     { margin: 4px 0 6px; padding-left: 16px; }
  li         { margin-bottom: 2px; }
  code       { font-family: 'SFMono-Regular', Consolas, monospace;
               font-size: 11px; background: rgba(0,0,0,0.08);
               border-radius: 3px; padding: 1px 4px; }
  pre        { background: rgba(0,0,0,0.10); border-radius: 6px;
               padding: 8px 10px; overflow-x: auto; margin: 6px 0;
               code { background: none; padding: 0; } }
  a          { color: inherit; text-decoration: underline; opacity: 0.85; }
  hr         { border: none; border-top: 1px solid rgba(0,0,0,0.1); margin: 8px 0; }
  blockquote { border-left: 3px solid rgba(0,0,0,0.15); margin: 4px 0;
               padding-left: 8px; opacity: 0.8; }
  table      { border-collapse: collapse; font-size: 11px; width: 100%; margin: 6px 0; }
  th, td     { border: 1px solid rgba(0,0,0,0.12); padding: 4px 8px; }
  th         { background: rgba(0,0,0,0.06); font-weight: 600; }
`

export const BubbleMeta = styled.div`
  font-size: 10px;
  color: #a1a1aa;
  margin-top: 3px;
  padding: 0 2px;
`

/* ── Typing indicator ── */

const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0); }
  30%           { transform: translateY(-4px); }
`

export const TypingDots = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 10px 14px;
  background: #f4f4f5;
  border-radius: 12px 12px 12px 3px;
  width: fit-content;

  span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #a1a1aa;
    animation: ${bounce} 1.1s infinite;

    &:nth-child(2) { animation-delay: 0.15s; }
    &:nth-child(3) { animation-delay: 0.30s; }
  }
`

/* ── Empty state ── */

export const EmptyThread = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 6px;
  color: #a1a1aa;
  font-size: 12px;
  padding: 20px;
  text-align: center;
`
