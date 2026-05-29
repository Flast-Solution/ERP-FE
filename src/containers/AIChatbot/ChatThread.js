/*
 * ChatThread.js
 *
 * Danh sách message + typing indicator.
 * Tự scroll xuống cuối khi có message mới.
 */

import { useEffect, useRef } from 'react'
import { RobotOutlined } from '@ant-design/icons'
import DiffCard from './DiffCard'
import {
  ThreadWrapper,
  BubbleRow,
  Bubble,
  BubbleMeta,
  TypingDots,
  EmptyThread,
} from './ChatThread.style'

/* Format timestamp ngắn */
function formatTs(ts) {
  return new Date(ts).toLocaleTimeString('vi-VN', {
    hour  : '2-digit',
    minute: '2-digit',
  })
}

const ChatThread = ({ messages = [], streaming, onApplyDiff, onViewDiff }) => {
  const bottomRef = useRef(null)

  /* Auto-scroll khi có message mới hoặc đang stream */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streaming])

  if (!messages.length && !streaming) {
    return (
      <ThreadWrapper>
        <EmptyThread>
          <RobotOutlined style={{ fontSize: 22 }} />
          Hãy bắt đầu bằng cách gửi một tin nhắn
        </EmptyThread>
      </ThreadWrapper>
    )
  }

  return (
    <ThreadWrapper>
      {messages.map(msg => (
        <BubbleRow key={msg.id} $role={msg.role}>
          <Bubble
            $role={msg.role}
            dangerouslySetInnerHTML={{ __html: msg.text }}
          />

          {/* Diff card — chỉ hiện trong assistant bubble */}
          {msg.role === 'assistant' && msg.diff && (
            <DiffCard
              diff={msg.diff}
              onApply={() => onApplyDiff?.(msg.diff)}
              onView={() => onViewDiff?.(msg.diff)}
            />
          )}

          <BubbleMeta>{formatTs(msg.ts)}</BubbleMeta>
        </BubbleRow>
      ))}

      {/* Typing indicator khi đang stream và bubble cuối rỗng */}
      {streaming && !messages.at(-1)?.text && (
        <BubbleRow $role="assistant">
          <TypingDots>
            <span /><span /><span />
          </TypingDots>
        </BubbleRow>
      )}

      <div ref={bottomRef} />
    </ThreadWrapper>
  )
}

export default ChatThread