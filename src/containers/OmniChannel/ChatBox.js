/**************************************************************************/
/*  @/containers/OmniChannel/ChatBox.js                                   */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Button, Dropdown, Input, Select, Spin, Tooltip } from 'antd'
import {
  CheckOutlined,
  ClockCircleOutlined,
  DropboxOutlined,
  EllipsisOutlined,
  FileOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  PaperClipOutlined,
  PictureOutlined,
  SendOutlined,
  StopOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import moment from 'moment'
import {
  useActiveConversation,
  useActiveMessages,
  useActiveContext,
  useOmniStore,
  CONVERSATION_STATUS,
  DIRECTION,
  MSG_TYPE,
  SEND_STATE,
  getWindowRemaining,
} from '@/store/omniStore'
import {
  ChatPane,
  ChatHeader,
  WindowBar,
  Thread,
  DayDivider,
  SystemLine,
  Bubble,
  Composer,
  ChatEmpty,
  ACCENT,
} from './chatStyles'

/* Chấm màu trong ô chọn trạng thái — nhìn thấy màu trước khi đọc chữ */
const STATUS_OPTIONS = [
  { value: CONVERSATION_STATUS.NEW, label: 'Mới', color: '#1677ff' },
  { value: CONVERSATION_STATUS.PROCESSING, label: 'Đang xử lý', color: '#fa8c16' },
  { value: CONVERSATION_STATUS.DONE, label: 'Đã xong', color: '#52c41a' },
]

const URGENT_THRESHOLD = 3 * 3600_000
/* Hai tin cùng người, cách nhau dưới 3 phút thì gom nhóm, bớt khoảng trắng */
const GROUP_GAP = 3 * 60_000

const initialsOf = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const dayLabel = (date) => {
  const d = moment(date)
  if (d.isSame(moment(), 'day')) return 'Hôm nay'
  if (d.isSame(moment().subtract(1, 'day'), 'day')) return 'Hôm qua'
  return d.format('DD/MM/YYYY')
}

const formatRemaining = (ms) => {
  const totalMinutes = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  return hours > 0 ? `${hours} giờ` : `${totalMinutes} phút`
}

/* Đếm ngược tính tại chỗ. Nhét deadline vào store thì mỗi nhịp
   sẽ kéo cả ba cột render lại. */
const useCountdown = (conversation) => {
  const [remaining, setRemaining] = useState(() => getWindowRemaining(conversation))
  useEffect(() => {
    setRemaining(getWindowRemaining(conversation))
    if (!conversation) return undefined
    const timer = setInterval(() => setRemaining(getWindowRemaining(conversation)), 60_000)
    return () => clearInterval(timer)
  }, [conversation])
  return remaining
}

/* ---------------------------------------------------------------- */

const MessageItem = ({ item, grouped, onRetry }) => {
  if (item.msgType === MSG_TYPE.SYSTEM) {
    return (
      <SystemLine>
        {item.content} · {moment(item.sentAt).format('HH:mm')}
      </SystemLine>
    )
  }

  const outbound = item.direction === DIRECTION.OUTBOUND
  const failed = item.sendState === SEND_STATE.FAILED

  return (
    <Bubble $outbound={outbound} $failed={failed} $grouped={grouped}>
      {outbound && !grouped && item.senderName && <div className="sender">{item.senderName}</div>}

      <div className="content">
        {item.msgType === MSG_TYPE.IMAGE && item.attachments?.length ? (
          item.attachments.map((a, i) => (
            <img key={i} src={a.localUrl || a.url} alt={a.name || ''} />
          ))
        ) : item.msgType === MSG_TYPE.FILE && item.attachments?.length ? (
          <a className="file" href={item.attachments[0].url} target="_blank" rel="noreferrer">
            <FileOutlined /> {item.attachments[0].name}
          </a>
        ) : (
          item.content
        )}
      </div>

      <div className="meta">
        {item.sendState === SEND_STATE.SENDING && 'Đang gửi'}
        {failed && (
          <>
            Gửi lỗi
            <button type="button" className="retry" onClick={() => onRetry(item)}>
              Gửi lại
            </button>
          </>
        )}
        {!failed && item.sendState !== SEND_STATE.SENDING && (
          <>
            {moment(item.sentAt).format('HH:mm')}
            {outbound && (
              <span className={item.sendState === SEND_STATE.READ ? 'read' : ''}>
                <CheckOutlined style={{ fontSize: 10 }} />
                {item.sendState === SEND_STATE.READ && (
                  <CheckOutlined style={{ fontSize: 10, marginLeft: -4 }} />
                )}
              </span>
            )}
          </>
        )}
      </div>
    </Bubble>
  )
}

/* ---------------------------------------------------------------- */

const ChatBox = ({
  onSend,
  onTyping,
  onChangeStatus,
  onToggleContext,
  onAssign,
  contextOpen,
  mobileActive,
}) => {
  const conversation = useActiveConversation()
  const context = useActiveContext()
  const messages = useActiveMessages()
  const loading = useOmniStore((s) => (s.activeId ? s.messagesMeta[s.activeId]?.loading : false))

  const [draft, setDraft] = useState('')
  const threadRef = useRef(null)
  const remaining = useCountdown(conversation)
  const windowOpen = remaining > 0

  /* Cuộn đáy khi đổi hội thoại hoặc có tin mới */
  useLayoutEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [conversation?.id, messages.length])

  /* Chèn dải ngày + đánh dấu tin gom nhóm, tính một lần cho cả danh sách */
  const rendered = useMemo(() => {
    const out = []
    let lastDay = null
    let prev = null

    messages.forEach((item) => {
      const day = moment(item.sentAt).format('YYYY-MM-DD')
      if (day !== lastDay) {
        out.push({ kind: 'day', key: `d-${day}`, label: dayLabel(item.sentAt) })
        lastDay = day
        prev = null
      }

      const grouped =
        prev &&
        prev.msgType !== MSG_TYPE.SYSTEM &&
        item.msgType !== MSG_TYPE.SYSTEM &&
        prev.direction === item.direction &&
        prev.senderUserId === item.senderUserId &&
        new Date(item.sentAt) - new Date(prev.sentAt) < GROUP_GAP

      out.push({ kind: 'msg', key: item.id, item, grouped })
      prev = item
    })

    return out
  }, [messages])

  const handleSend = useCallback(() => {
    const content = draft.trim()
    if (!content || !windowOpen) return
    setDraft('')
    onSend({ content, files: [] })
  }, [draft, windowOpen, onSend])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleRetry = useCallback(
    (item) => onSend({ content: item.content, files: [] }),
    [onSend]
  )

  if (!conversation) {
    return (
      <ChatPane $mobileActive={mobileActive}>
        <ChatEmpty>
          Chọn một hội thoại để bắt đầu.
          <span style={{ fontSize: 12 }}>Tin chưa trả lời được xếp lên đầu danh sách.</span>
        </ChatEmpty>
      </ChatPane>
    )
  }

  const windowState = !windowOpen ? 'closed' : remaining < URGENT_THRESHOLD ? 'urgent' : 'ok'
  const limitHours = conversation.channelType === 2 ? 24 : 48
  const customerName = context?.customer?.name
  const headline = context?.customer?.companyName
    ? `${customerName} — ${context.customer.companyName}`
    : customerName || conversation.displayName

  const moreItems = [
    { key: 'mark-done', label: 'Đánh dấu đã xong' },
    { key: 'open-customer', label: 'Mở hồ sơ khách hàng', disabled: !context?.customer },
    { type: 'divider' },
    { key: 'reload', label: 'Tải lại lịch sử tin' },
  ]

  return (
    <ChatPane $mobileActive={mobileActive}>
      <ChatHeader $channelType={conversation.channelType} $avatarBg={ACCENT}>
        <div className="face">
          {conversation.avatar ? (
            <img src={conversation.avatar} alt="" />
          ) : (
            initialsOf(headline)
          )}
        </div>

        <div className="title">
          <div className="name">{headline}</div>
          <div className="sub">
            <span className="dot" />
            {conversation.channelType === 2 ? 'Facebook' : 'Zalo OA'} ·{' '}
            {conversation.channelAccountName}
          </div>
        </div>

        <div className="actions">
          <Select
            size="small"
            style={{ width: 150 }}
            value={conversation.status}
            onChange={(status) => onChangeStatus(conversation.id, status)}
            options={STATUS_OPTIONS.map((o) => ({
              value: o.value,
              label: (
                <span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      marginRight: 6,
                      verticalAlign: 'middle',
                      background: o.color,
                    }}
                  />
                  {o.label}
                </span>
              ),
            }))}
          />

          <Tooltip title="Giao cho nhân viên">
            <Button type="text" icon={<UserAddOutlined />} onClick={onAssign} />
          </Tooltip>

          <Tooltip title="Thông tin khách hàng">
            <Button
              type={contextOpen ? 'primary' : 'text'}
              ghost={contextOpen}
              icon={<InfoCircleOutlined />}
              onClick={onToggleContext}
            />
          </Tooltip>

          <Dropdown menu={{ items: moreItems }} trigger={['click']}>
            <Button type="text" icon={<EllipsisOutlined />} />
          </Dropdown>
        </div>
      </ChatHeader>

      <WindowBar $state={windowState}>
        <ClockCircleOutlined />
        {windowOpen ? (
          <>
            <span className="strong">Còn {formatRemaining(remaining)} để trả lời</span>
            <span className="hint">
              Giới hạn {limitHours} giờ kể từ tin cuối của khách.
            </span>
          </>
        ) : (
          <>
            <span className="strong">Đã quá hạn trả lời</span>
            <span className="hint">Chờ khách nhắn lại mới gửi tiếp được.</span>
          </>
        )}
      </WindowBar>

      <Thread ref={threadRef}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 12 }}>
            <Spin size="small" />
          </div>
        )}

        {rendered.map((node) =>
          node.kind === 'day' ? (
            <DayDivider key={node.key}>{node.label}</DayDivider>
          ) : (
            <MessageItem
              key={node.key}
              item={node.item}
              grouped={node.grouped}
              onRetry={handleRetry}
            />
          )
        )}
      </Thread>

      <Composer>
        {windowOpen ? (
          <>
            <div className="box">
              <Input.TextArea
                value={draft}
                variant="borderless"
                autoSize={{ minRows: 2, maxRows: 6 }}
                placeholder="Nhập tin nhắn..."
                onChange={(e) => {
                  setDraft(e.target.value)
                  onTyping()
                }}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="toolbar">
              <Tooltip title="Gửi ảnh">
                <button type="button" className="tool">
                  <PictureOutlined />
                </button>
              </Tooltip>
              <Tooltip title="Đính kèm tệp">
                <button type="button" className="tool">
                  <PaperClipOutlined />
                </button>
              </Tooltip>
              <Tooltip title="Trả lời nhanh">
                <button type="button" className="tool">
                  <MessageOutlined />
                </button>
              </Tooltip>
              <Tooltip title="Chèn sản phẩm">
                <button type="button" className="tool">
                  <DropboxOutlined />
                </button>
              </Tooltip>

              <span className="grow" />
              <span className="hint">Enter để gửi · Shift+Enter xuống dòng</span>

              <Button
                type="primary"
                className="send"
                icon={<SendOutlined />}
                disabled={!draft.trim()}
                onClick={handleSend}
              >
                Gửi
              </Button>
            </div>
          </>
        ) : (
          <div className="locked">
            <StopOutlined style={{ fontSize: 16, flexShrink: 0 }} />
            <span>
              Đã quá {limitHours} giờ kể từ tin cuối của khách, nền tảng không cho gửi tin nữa.
              Hội thoại sẽ mở lại ngay khi khách nhắn tiếp.
            </span>
          </div>
        )}
      </Composer>
    </ChatPane>
  )
}

export default ChatBox
