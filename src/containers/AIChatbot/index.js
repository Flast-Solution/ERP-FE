/**
 * AIChatbot/index.js
 *
 * Session lifecycle:
 *   - Mỗi mode có 1 sessionId riêng (từ store)
 *   - Khi mode thay đổi → destroy session cũ → tạo ChatSession mới → connect SSE
 *   - Khi user clear → newSession(mode) → sessionId thay đổi → useEffect re-connect
 *   - Component unmount → destroy session
 *
 * Props:
 *   open          {boolean}
 *   mode          {string}   — key trong MODE_CONFIG
 *   context       {object}   — data thô của màn hình hiện tại
 *   unread        {number}
 *   onOpen        {function}
 *   onClose       {function}
 *   onApplyDiff   {function} — (diff) => void
 *   onViewDiff    {function} — (diff) => void
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { Button, Tooltip, message as antdMessage } from 'antd'
import {
  ThunderboltOutlined,
  CloseOutlined,
  PlusOutlined,
  LoadingOutlined,
  DisconnectOutlined,
} from '@ant-design/icons'
import { buildJSX } from '@/containers/PreviewModal/buildJSX'
import { arrayEmpty } from '@flast-erp/core/utils';

import * as AntdIcons from '@ant-design/icons'
import useChatStore       from './useChatStore'
import { getMode }        from './modes'
import { ChatSession }    from './chatService'
import ChatThread         from './ChatThread'
import Composer           from './Composer'
import { parseTemplateSavedMessage } from './templateSavedParser'
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

const DynamicIcon = ({ name, ...props }) => {
  const Icon = AntdIcons[name]
  return Icon ? <Icon {...props} /> : <ThunderboltOutlined {...props} />
}

function buildWelcomeMessages(modeConfig) {
  return modeConfig.welcome.map((text, i) => ({
    id  : `welcome-${i}`,
    role: 'assistant',
    text,
    diff: null,
    ts  : Date.now() + i,
  }))
}


const AIChatbot = ({
  open,
  mode       = 'default',
  context    = null,
  unread     = 0,
  onOpen,
  onClose,
  onApplyDiff,
  onViewDiff,
  onTemplateSaved,
}) => {
  const modeConfig = getMode(mode)

  const threads           = useChatStore(s => s.threads)
  const streaming         = useChatStore(s => s.streaming)
  const pushMessage       = useChatStore(s => s.pushMessage)
  const newSession        = useChatStore(s => s.newSession)
  const getSessionId      = useChatStore(s => s.getSessionId)
  const startStreaming    = useChatStore(s => s.startStreaming)
  const appendChunk       = useChatStore(s => s.appendStreamChunk)
  const finishStreaming   = useChatStore(s => s.finishStreaming)
  const abortStreaming    = useChatStore(s => s.abortStreaming)
  const setActiveMode     = useChatStore(s => s.setActiveMode)

  const sessionRef        = useRef(null)
  const schemaDebounceRef = useRef(null)
  const contextRef        = useRef(context)
  const responseBufferRef = useRef('')
  const onTemplateSavedRef = useRef(onTemplateSaved)
  const appliedTemplateRef = useRef(new Set())

  const messages = threads[mode] ?? []
  const [ sseStatus, setSseStatus ] = useState('idle')

  /* Luôn giữ ref trỏ đến context mới nhất mà không cần re-render */
  useEffect(() => {
    contextRef.current = context
  }, [context])

  useEffect(() => {
    onTemplateSavedRef.current = onTemplateSaved
  }, [onTemplateSaved])

  const applyTemplateSavedFromText = useCallback((rawText, source) => {
    const templateSaved = parseTemplateSavedMessage(rawText)
    console.log(`[AIChatbot] ${source} response`, rawText)
    console.log(`[AIChatbot] ${source} parsed template_saved`, templateSaved)

    if (!templateSaved) {
      return null
    }

    const fingerprint = JSON.stringify({
      fields: templateSaved.fields?.map(field => field.fieldKey),
      codeLength: templateSaved.code?.length ?? 0,
    })

    if (appliedTemplateRef.current.has(fingerprint)) {
      return templateSaved
    }

    appliedTemplateRef.current.add(fingerprint)
    onTemplateSavedRef.current?.(templateSaved)
    antdMessage.success('Đã nhận template từ AI và cập nhật preview.')
    return templateSaved
  }, [])

  const connectSession = useCallback((sessionId, currentMode) => {

    if (sessionRef.current) {
      sessionRef.current.destroy()
      sessionRef.current = null
    }

    setSseStatus('connecting')
    const session = new ChatSession(sessionId)
    sessionRef.current = session

    let diff = null

    session.connect({
      onChunk: (chunk) => {
        responseBufferRef.current += chunk
        appendChunk(currentMode, chunk)
      },
      onCore: (payload) => {
        if (payload) {
          pushMessage(currentMode, {
            role: 'system',
            text: typeof payload === 'string'
              ? payload
              : JSON.stringify(payload),
            ts  : Date.now()
          })
        }
      },
      onDone: () => {
        const rawResponse = responseBufferRef.current
        finishStreaming(currentMode, diff)
        responseBufferRef.current = ''
        applyTemplateSavedFromText(rawResponse, 'assistant')
        diff = null
      },
      onError: (err) => {
        setSseStatus('error')
        abortStreaming(currentMode)
        pushMessage(currentMode, {
          role: 'assistant',
          text: `Lỗi kết nối: ${err.message}`,
          ts  : Date.now(),
        })
      },
      onClose: () => {
        setSseStatus('idle')
      },
      onHistoryLoaded: (messages) => {
        /* Chỉ load nếu thread chưa có tin thật (tránh duplicate khi reconnect) */
        const thread = useChatStore.getState().threads[currentMode] ?? []
        const hasRealMsg = thread.some(m => !m.id?.startsWith('welcome-'))
        if (!hasRealMsg) {
          messages.forEach(msg => pushMessage(currentMode, {
            role: msg.role,
            text: msg.content,
            ts  : Date.now()
          }))
        }
        const latestAssistantTemplate = [...messages]
          .reverse()
          .find(msg => msg.role === 'assistant' && parseTemplateSavedMessage(msg.content))

        if (latestAssistantTemplate) {
          applyTemplateSavedFromText(latestAssistantTemplate.content, 'history')
        }
      },
    }).then(() => {
      setSseStatus('connected')
    }).catch(() => setSseStatus('error'))
    /* eslint-disable-next-line */
  }, [])


  useEffect(() => {
    setActiveMode(mode)

    if (!threads[mode]?.length) {
      const welcomes = buildWelcomeMessages(modeConfig)
      welcomes.forEach(msg => pushMessage(mode, msg))
    }

    const sessionId = getSessionId(mode)
    connectSession(sessionId, mode)

    return () => {
      sessionRef.current?.destroy()
      sessionRef.current = null
      setSseStatus('idle')
    }
    /* sessions[mode] thay đổi khi newSession() được gọi → re-connect */
    /* eslint-disable-next-line */
  }, [mode, useChatStore.getState().sessions[mode]])

  useEffect(() => {
    return () => {
      sessionRef.current?.destroy()
    }
    /* eslint-disable-next-line */
  }, [])

  const handleSend = useCallback(async (text) => {
    if (streaming || !sessionRef.current) {
      return
    }

    pushMessage(mode, { role: 'user', text, ts: Date.now() })
    responseBufferRef.current = ''
    startStreaming(mode)

    try {
      await sessionRef.current.send(text)
    } catch (err) {
      abortStreaming(mode)
      pushMessage(mode, {
        role: 'assistant',
        text: `Lỗi: ${err.message}`,
        ts  : Date.now()
      })
    }
    /* eslint-disable-next-line */
  }, [mode, streaming])

  /* Khi context (fields[]) thay đổi → debounce 2s → gửi schema update lên LLM */
  useEffect(() => {
    if (!context || arrayEmpty(context.fields)) {
      return
    }
    clearTimeout(schemaDebounceRef.current)
    schemaDebounceRef.current = setTimeout(() => {
      if (!sessionRef.current?.isConnected) {
        return
      }
      const ctx = contextRef.current
      const { plain } = buildJSX(ctx)
      sessionRef.current.sendSchemaUpdate({ schema: ctx, jsxCode: plain })
    }, 4000)
    return () => clearTimeout(schemaDebounceRef.current)
    /* eslint-disable-next-line */
  }, [context])


  const handleClear = useCallback(() => {
    abortStreaming(mode)
    newSession(mode)
    const welcomes = buildWelcomeMessages(modeConfig)
    welcomes.forEach(msg => pushMessage(mode, msg))
    /* eslint-disable-next-line */
  }, [mode, modeConfig])

  const contextMeta = modeConfig.getContextMeta?.(context) ?? ''

  const statusBadge = {
    idle       : null,
    connecting : <LoadingOutlined spin style={{ fontSize: 10, color: '#fcd34d' }} />,
    connected  : null,
    error      : <DisconnectOutlined style={{ fontSize: 10, color: '#fca5a5' }} />,
  }[sseStatus]

  return (
    <>
      {/* FAB */}
      <Tooltip title={open ? 'Đóng AI Agent' : 'Mở AI Agent'} placement="left">
        <FABButton onClick={() => open ? onClose?.() : onOpen?.(mode)}>
          {open
            ? <CloseOutlined style={{ fontSize: 16 }} />
            : <ThunderboltOutlined style={{ fontSize: 18 }} />
          }
          {!open && unread > 0 && <FABBadge>{unread}</FABBadge>}
        </FABButton>
      </Tooltip>

      {/* Panel */}
      {open && (
        <PanelWrapper>

          <PanelHeader>
            <HeaderBrand>
              <ThunderboltOutlined style={{ fontSize: 14, color: '#18181b' }} />
              <HeaderTitle>AI Agent</HeaderTitle>
              <HeaderBadge>
                {sseStatus === 'connecting' ? 'Đang kết nối...' :
                 sseStatus === 'error'      ? 'Lỗi kết nối' :
                 'Trực tuyến'}
              </HeaderBadge>
              {statusBadge}
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

          <ChatThread
            messages={messages}
            streaming={streaming}
            onApplyDiff={onApplyDiff}
            onViewDiff={onViewDiff}
          />

          <Composer
            suggestions={modeConfig.suggestions}
            onSend={handleSend}
            disabled={streaming || sseStatus === 'connecting'}
            placeholder={
              sseStatus === 'connecting'
                ? 'Đang kết nối...'
                : mode === 'default'
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
