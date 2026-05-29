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

  b { font-weight: 600; }
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