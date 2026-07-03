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
  ResizeHandle,
} from './index.style'

const DEFAULT_PANEL_WIDTH = 420
const MIN_PANEL_WIDTH = 360
const PANEL_WIDTH_STORAGE_KEY = 'flast_ai_chat_panel_width'

const clampPanelWidth = (value) => {
  const viewportLimit = typeof window === 'undefined'
    ? Number.MAX_SAFE_INTEGER
    : Math.max(MIN_PANEL_WIDTH, window.innerWidth)

  return Math.min(Math.max(value, MIN_PANEL_WIDTH), viewportLimit)
}

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
  embedded   = false,
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
  const [ panelWidth, setPanelWidth ] = useState(() => {
    const storedWidth = typeof window === 'undefined'
      ? DEFAULT_PANEL_WIDTH
      : Number(window.localStorage.getItem(PANEL_WIDTH_STORAGE_KEY))

    return clampPanelWidth(Number.isFinite(storedWidth) && storedWidth > 0
      ? storedWidth
      : DEFAULT_PANEL_WIDTH
    )
  })
  const [ resizing, setResizing ] = useState(false)
  const [ humanInput, setHumanInput ] = useState(null)

  const resizeStateRef = useRef(null)
  const panelWidthRef = useRef(panelWidth)

  /* Luôn giữ ref trỏ đến context mới nhất mà không cần re-render */
  useEffect(() => {
    contextRef.current = context
  }, [context])

  useEffect(() => {
    onTemplateSavedRef.current = onTemplateSaved
  }, [onTemplateSaved])

  useEffect(() => {
    panelWidthRef.current = panelWidth
  }, [panelWidth])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handleResize = () => {
      setPanelWidth(width => {
        const nextWidth = clampPanelWidth(width)
        panelWidthRef.current = nextWidth
        window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(nextWidth))
        return nextWidth
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [open])

  useEffect(() => {
    if (!resizing) {
      return undefined
    }

    const handleMouseMove = (event) => {
      const resizeState = resizeStateRef.current
      if (!resizeState) {
        return
      }

      const nextWidth = clampPanelWidth(
        resizeState.startWidth + resizeState.startX - event.clientX
      )
      panelWidthRef.current = nextWidth
      setPanelWidth(nextWidth)
    }

    const handleMouseUp = () => {
      setResizing(false)
      resizeStateRef.current = null
      window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(panelWidthRef.current))
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [resizing])

  const applyTemplateSavedFromText = useCallback((rawText, source) => {
    const templateSaved = parseTemplateSavedMessage(rawText)

    if (!templateSaved) {
      return null
    }

    const fingerprint = JSON.stringify({
      fields: templateSaved.fields?.map(field => field.fieldKey),
      code: templateSaved.code ?? '',
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
      onOpen: () => {
        if (sessionRef.current === session) {
          setSseStatus('connected')
        }
      },
      onChunk: (chunk) => {
        responseBufferRef.current += chunk
        appendChunk(currentMode, chunk)
      },
      onHumanInput: (payload) => setHumanInput(payload),
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
        setHumanInput(null)
        const rawResponse = responseBufferRef.current
        finishStreaming(currentMode, diff)
        responseBufferRef.current = ''
        applyTemplateSavedFromText(rawResponse, 'assistant')
        diff = null
      },
      onBuild: (payload) => {
        window.dispatchEvent(new CustomEvent('flast-ai-build', {
          detail: payload,
        }))
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
    }).catch(() => setSseStatus('error'))
    /* eslint-disable-next-line */
  }, [])


  useEffect(() => {
    if (!open) {
      sessionRef.current?.destroy()
      sessionRef.current = null
      setSseStatus('idle')
      return undefined
    }

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
  }, [open, mode, useChatStore.getState().sessions[mode]])

  useEffect(() => {
    return () => {
      sessionRef.current?.destroy()
    }
    /* eslint-disable-next-line */
  }, [])

  const handleSend = useCallback(async (text) => {
    if (streaming || !sessionRef.current || !sessionRef.current.isConnected) {
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
    if (!open || !context || arrayEmpty(context.fields)) {
      return
    }
    clearTimeout(schemaDebounceRef.current)
    schemaDebounceRef.current = setTimeout(() => {
      if (!sessionRef.current?.isConnected) {
        return
      }
      const ctx = contextRef.current
      const { plain } = buildJSX(ctx)
      sessionRef.current.sendSchemaUpdate({
        templateId: context.templateId,
        schema: ctx, 
        jsxCode: plain, 
        type: "FORM", 
        title: "FormTemplate có SCHEMA như sau:" 
      })
    }, 2000)
    return () => clearTimeout(schemaDebounceRef.current)
    /* eslint-disable-next-line */
  }, [open, context])


  const handleClear = useCallback(() => {
    abortStreaming(mode)
    newSession(mode)
    const welcomes = buildWelcomeMessages(modeConfig)
    welcomes.forEach(msg => pushMessage(mode, msg))
    /* eslint-disable-next-line */
  }, [mode, modeConfig])

  const handleResizeStart = useCallback((event) => {
    event.preventDefault()
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: panelWidth,
    }
    setResizing(true)
  }, [panelWidth])

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
      {!embedded && !open && (
        <Tooltip title="Mở AI Agent" placement="left">
          <FABButton onClick={() => onOpen?.(mode)}>
            <ThunderboltOutlined style={{ fontSize: 18 }} />
            {unread > 0 && <FABBadge>{unread}</FABBadge>}
          </FABButton>
        </Tooltip>
      )}

      {/* Panel */}
      {open && (
        <PanelWrapper $width={panelWidth} $embedded={embedded}>
          <ResizeHandle
            $active={resizing}
            onMouseDown={handleResizeStart}
            aria-label="Kéo để đổi kích thước AI Agent"
            role="separator"
          />

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
            disabled={streaming || sseStatus !== 'connected'}
            placeholder={
              sseStatus === 'connecting'
                ? 'Đang kết nối...'
                : sseStatus === 'error'
                ? 'Kết nối lỗi, vui lòng tạo cuộc trò chuyện mới...'
                : mode === 'default'
                ? 'Hỏi bất cứ điều gì…'
                : 'Mô tả thay đổi mong muốn…'
            }
            humanInput={humanInput}
            onHumanInputReply={(requestId, answer) => {
              sessionRef?.current?.sendHumanInput(requestId, answer)
              setHumanInput(null)
            }}
          />

        </PanelWrapper>
      )}
    </>
  )
}

export default AIChatbot
