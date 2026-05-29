/*
 * AIChatbot/index.js
 *
 * Component gốc — mount 1 lần duy nhất ở App level.
 * Gồm: FAB (floating action button) + panel popover.
 *
 * Props:
 *   open          {boolean}
 *   mode          {string}   — key trong MODE_CONFIG
 *   context       {object}   — data thô của màn hình hiện tại
 *   unread        {number}   — badge count trên FAB
 *   onOpen        {function} — (mode) => void  — FAB click
 *   onClose       {function} — () => void
 *   onApplyDiff   {function} — (diff) => void  — màn hình cha xử lý
 *   onViewDiff    {function} — (diff) => void  — xem file thay đổi
 *
 * Luồng:
 *   1. Mở panel (open=true, mode=X) → load welcome messages nếu thread rỗng
 *   2. User gửi tin → isFirstMessage? gửi kèm context : chỉ gửi message + history
 *   3. SSE stream → appendStreamChunk → finishStreaming(diff?)
 *   4. User bấm clear → clearThread(mode)
 */

import { useEffect, useRef, useCallback } from 'react'
import { Button, Tooltip } from 'antd'
import {
  ThunderboltOutlined,
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import * as AntdIcons from '@ant-design/icons'
import useChatStore       from './useChatStore'
import { getMode }        from './modes'
import { sendMessage }    from './chatService'
import ChatThread         from './ChatThread'
import Composer           from './Composer'
import {
  FABButton,
  FABBadge,
  PanelWrapper,
  PanelHeader,
  HeaderBrand,
  HeaderTitle,
  HeaderBadge,
  HeaderActions,
  ContextStrip,
  ContextLabel,
  ContextMeta,
  ContextDot,
} from './index.style'

/* Render icon antd theo tên string */
const DynamicIcon = ({ name, ...props }) => {
  const Icon = AntdIcons[name]
  return Icon ? <Icon {...props} /> : <ThunderboltOutlined {...props} />
}

/* ── Welcome messages ────────────────────────────────────────────────────── */

function buildWelcomeMessages(modeConfig) {
  return modeConfig.welcome.map((text, i) => ({
    id  : `welcome-${i}`,
    role: 'assistant',
    text,
    diff: null,
    ts  : Date.now() + i,
  }))
}

/* ── AIChatbot ───────────────────────────────────────────────────────────── */

const AIChatbot = ({
  open,
  mode       = 'default',
  context    = null,
  unread     = 0,
  onOpen,
  onClose,
  onApplyDiff,
  onViewDiff,
}) => {
  const modeConfig = getMode(mode)

  /* Store */
  const threads         = useChatStore(s => s.threads)
  const streaming       = useChatStore(s => s.streaming)
  const pushMessage     = useChatStore(s => s.pushMessage)
  const clearThread     = useChatStore(s => s.clearThread)
  const startStreaming  = useChatStore(s => s.startStreaming)
  const appendChunk     = useChatStore(s => s.appendStreamChunk)
  const finishStreaming  = useChatStore(s => s.finishStreaming)
  const abortStreaming   = useChatStore(s => s.abortStreaming)
  const setActiveMode   = useChatStore(s => s.setActiveMode)

  const messages = threads[mode] ?? []

  /* Abort controller ref — cancel stream khi đóng/reset */
  const abortRef = useRef(null)

  /* Khi mode thay đổi → set active mode + load welcome nếu thread rỗng */
  useEffect(() => {
    setActiveMode(mode)
    if (!threads[mode]?.length) {
      const welcomes = buildWelcomeMessages(modeConfig)
      welcomes.forEach(msg => pushMessage(mode, msg))
    }
    /* eslint-disable-next-line */
  }, [mode])

  /* Cleanup khi unmount */
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  /* ── Send message ── */
  const handleSend = useCallback((text) => {
    if (streaming) return

    /* Push user message */
    pushMessage(mode, { role: 'user', text })

    /* Xác định isFirstMessage: chỉ welcome messages → đây là message đầu tiên thực */
    const realMessages = messages.filter(m => !m.id?.startsWith('welcome-'))
    const isFirstMessage = realMessages.length === 0

    /* Start streaming placeholder */
    startStreaming(mode)

    /* Gọi server */
    let diff = null
    abortRef.current = sendMessage({
      mode,
      message        : text,
      history        : messages.filter(m => !m.id?.startsWith('welcome-')),
      context        : isFirstMessage ? context : undefined,
      isFirstMessage,
      onChunk        : (chunk) => appendChunk(mode, chunk),
      onDiff         : (d)     => { diff = d },
      onDone         : ()      => finishStreaming(mode, diff),
      onError        : (err)   => {
        finishStreaming(mode, null)
        pushMessage(mode, {
          role: 'assistant',
          text: `Lỗi: ${err.message}. Vui lòng thử lại.`,
        })
      },
    })
  }, [mode, streaming, messages, context]) // eslint-disable-line

  /* ── Clear thread ── */
  const handleClear = () => {
    abortRef.current?.abort()
    abortStreaming(mode)
    clearThread(mode)
    /* Re-load welcome */
    const welcomes = buildWelcomeMessages(modeConfig)
    welcomes.forEach(msg => pushMessage(mode, msg))
  }

  const contextMeta = modeConfig.getContextMeta?.(context) ?? ''

  return (
    <>
      {/* ── FAB ── */}
      <Tooltip
        title={open ? 'Đóng AI Agent' : 'Mở AI Agent'}
        placement="left"
      >
        <FABButton onClick={() => open ? onClose?.() : onOpen?.(mode)}>
          {open
            ? <CloseOutlined style={{ fontSize: 16 }} />
            : <ThunderboltOutlined style={{ fontSize: 18 }} />
          }
          {!open && unread > 0 && <FABBadge>{unread}</FABBadge>}
        </FABButton>
      </Tooltip>

      {/* ── Panel ── */}
      {open && (
        <PanelWrapper>

          {/* Header */}
          <PanelHeader>
            <HeaderBrand>
              <ThunderboltOutlined style={{ fontSize: 14, color: '#18181b' }} />
              <HeaderTitle>AI Agent</HeaderTitle>
              <HeaderBadge>Trực tuyến</HeaderBadge>
            </HeaderBrand>

            <HeaderActions>
              <Tooltip title="Cuộc trò chuyện mới">
                <Button
                  size="small"
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={handleClear}
                  style={{ color: '#71717a' }}
                />
              </Tooltip>
              <Tooltip title="Xóa lịch sử">
                <Button
                  size="small"
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={handleClear}
                  style={{ color: '#71717a' }}
                />
              </Tooltip>
              <Button
                size="small"
                type="text"
                icon={<CloseOutlined />}
                onClick={onClose}
                style={{ color: '#71717a' }}
              />
            </HeaderActions>
          </PanelHeader>

          {/* Context strip */}
          <ContextStrip>
            <DynamicIcon
              name={modeConfig.contextIcon}
              style={{ fontSize: 12, color: '#71717a' }}
            />
            <ContextLabel>{modeConfig.contextLabel}</ContextLabel>
            {contextMeta && (
              <>
                <ContextDot>·</ContextDot>
                <ContextMeta>{contextMeta}</ContextMeta>
              </>
            )}
          </ContextStrip>

          {/* Thread */}
          <ChatThread
            messages={messages}
            streaming={streaming}
            onApplyDiff={onApplyDiff}
            onViewDiff={onViewDiff}
          />

          {/* Composer */}
          <Composer
            suggestions={modeConfig.suggestions}
            onSend={handleSend}
            disabled={streaming}
            placeholder={
              mode === 'default'
                ? 'Hỏi bất cứ điều gì…'
                : 'Mô tả thay đổi mong muốn…'
            }
          />

        </PanelWrapper>
      )}
    </>
  )
}

export default AIChatbot