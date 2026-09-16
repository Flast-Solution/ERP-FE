/**************************************************************************/
/*  @/containers/OmniChannel/ConversationList.js                          */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input, Select, Spin } from 'antd'
import {
  ApiOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  SearchOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import moment from 'moment'
import {
  useConversationList,
  useActiveId,
  useFilters,
  useChannels,
  useCounts,
  useSortMode,
  useOmniStore,
  CHANNEL_STATUS,
  CHANNEL_TYPE,
  CONVERSATION_STATUS,
  SCOPE,
  SORT_MODE,
  getWindowRemaining,
} from '@/store/omniStore'
import {
  ListPane,
  FilterBar,
  ScopeTabs,
  ChannelAlert,
  ListMeta,
  ScrollArea,
  Row,
  AvatarSlot,
  RowBody,
  StatusChip,
  UnlinkedChip,
  AssigneeChip,
  WindowChip,
  UnreadDot,
} from './listStyles'
import EmptyState from './EmptyState'

/* ---------------------------------------------------------------- */

const STATUS_CHIP = {
  [CONVERSATION_STATUS.NEW]: { text: 'Mới', color: '#0958d9', bg: '#e6f4ff' },
  [CONVERSATION_STATUS.PROCESSING]: { text: 'Đang xử lý', color: '#ad6800', bg: '#fffbe6' },
  [CONVERSATION_STATUS.DONE]: { text: 'Đã xong', color: '#389e0d', bg: '#f6ffed' },
}

/* Màu avatar chọn theo tên — mỗi khách giữ một màu cố định qua các
   lần tải, không nhảy màu mỗi lần render */
const AVATAR_COLORS = [
  '#7265e6', '#00a2ae', '#f56a00', '#1677ff',
  '#eb2f96', '#13c2c2', '#52c41a', '#fa8c16',
]

const colorOf = (text = '') => {
  let sum = 0
  for (let i = 0; i < text.length; i += 1) sum += text.charCodeAt(i)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

/* Tên tiếng Việt thường 3-4 từ, lấy chữ đầu của từ đầu + từ cuối */
const initialsOf = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const channelInitial = (channelType) => (channelType === CHANNEL_TYPE.FACEBOOK ? 'f' : 'Z')

/* Ba mức hiển thị theo độ gấp. Dưới 10 phút thì đếm từng giây —
   lúc đó con số nhảy liên tục chính là tín hiệu "phải trả lời ngay",
   mạnh hơn bất kỳ màu nào. */
const shortRemaining = (ms) => {
  const totalSeconds = Math.floor(ms / 1000)
  if (totalSeconds < CRITICAL_THRESHOLD / 1000) {
    const m = Math.floor(totalSeconds / 60)
    const sec = totalSeconds % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }
  const minutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `${hours}g${String(minutes % 60).padStart(2, '0')}` : `${minutes}p`
}

const URGENT_THRESHOLD = 3 * 3600_000
/* Dưới mốc này thì đếm từng giây */
const CRITICAL_THRESHOLD = 10 * 60_000

/* ---------------------------------------------------------------- */

const ConversationRow = memo(({ item, active, onOpen, tick }) => {
  const unread = item.unreadCount > 0
  const status = STATUS_CHIP[item.status]

  /* tick chỉ để ép tính lại mỗi phút, giá trị thực lấy từ helper */
  const remaining = useMemo(() => getWindowRemaining(item), [item, tick])
  const windowState =
    remaining <= 0
      ? 'closed'
      : remaining < CRITICAL_THRESHOLD
        ? 'critical'
        : remaining < URGENT_THRESHOLD
          ? 'urgent'
          : 'ok'

  return (
    <Row $active={active} $unread={unread} onClick={() => onOpen(item.id)}>
      <AvatarSlot
        $bg={colorOf(item.displayName)}
        $channelType={item.channelType}
        $unlinked={!item.customerId}
      >
        <div className="face">
          {item.avatar ? <img src={item.avatar} alt="" /> : initialsOf(item.displayName)}
        </div>
        <span className="channel">{channelInitial(item.channelType)}</span>
      </AvatarSlot>

      <RowBody $unread={unread}>
        <div className="line-name">
          <span className="name">{item.displayName}</span>
          {!item.customerId && <UnlinkedChip>Chưa gắn</UnlinkedChip>}
          <span className="time">{moment(item.lastMessageAt).fromNow(true)}</span>
        </div>

        <div className="snippet">{item.lastMessageSnippet}</div>

        <div className="line-chips">
          {status && (
            <StatusChip $color={status.color} $bg={status.bg}>
              {status.text}
            </StatusChip>
          )}

          {item.assignedUserName && (
            <AssigneeChip $bg={colorOf(item.assignedUserName)}>
              <span className="dot">{initialsOf(item.assignedUserName)[0]}</span>
              <span className="who">{item.assignedUserName}</span>
            </AssigneeChip>
          )}

          {unread && <UnreadDot>{item.unreadCount}</UnreadDot>}

          <WindowChip $state={windowState}>
            {windowState === 'closed' ? (
              'Hết hạn'
            ) : (
              <>
                <ClockCircleOutlined />
                {windowState === 'critical' ? '' : 'còn '}
                {shortRemaining(remaining)}
              </>
            )}
          </WindowChip>
        </div>
      </RowBody>
    </Row>
  )
})
ConversationRow.displayName = 'ConversationRow'

/* ---------------------------------------------------------------- */

const ConversationList = ({
  onOpen,
  onLoadMore,
  onFilter,
  onReconnect,
  onOpenChannelSetting,
  mobileActive,
}) => {
  const conversations = useConversationList()
  const activeId = useActiveId()
  const filters = useFilters()
  const channels = useChannels()
  const counts = useCounts()
  const sortMode = useSortMode()
  const loading = useOmniStore((s) => s.conversationsLoading)
  const hasMore = useOmniStore((s) => s.hasMore)
  const setSortMode = useOmniStore((s) => s.setSortMode)

  const scrollRef = useRef(null)

  /* "Chưa có tin nào" chỉ đúng khi người dùng chưa lọc gì.
     Có lọc mà rỗng là chuyện khác hẳn. */
  const isPristine =
    !filters.keyword &&
    !filters.channelAccountId &&
    filters.status === null &&
    filters.scope === SCOPE.ALL

  /* MỘT đồng hồ cho cả danh sách — mỗi dòng tự setInterval thì
     50 hội thoại là 50 timer chạy song song.
     Nhịp thích ứng: chỉ chạy từng giây khi thực sự có hội thoại
     sắp hết hạn, còn lại 30 giây một nhịp cho nhẹ. */
  const [tick, setTick] = useState(0)
  const [fastTick, setFastTick] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTick((v) => v + 1), fastTick ? 1000 : 30_000)
    return () => clearInterval(timer)
  }, [fastTick])

  /* Xét lại nhịp sau mỗi lần tick hoặc khi danh sách đổi */
  useEffect(() => {
    const needFast = conversations.some((c) => {
      const remaining = getWindowRemaining(c)
      return remaining > 0 && remaining < CRITICAL_THRESHOLD
    })
    setFastTick((prev) => (prev === needFast ? prev : needFast))
  }, [conversations, tick])

  const brokenChannel = useMemo(() => channels.find((c) => c.status === CHANNEL_STATUS.TOKEN_ERROR), [channels])

  /* Sắp xếp ở client — dữ liệu đã có sẵn, không cần gọi lại API */
  const sorted = useMemo(() => {
    if (sortMode === SORT_MODE.RECENT) return conversations
    return [...conversations].sort((a, b) => {
      const ra = getWindowRemaining(a)
      const rb = getWindowRemaining(b)
      /* Hết hạn đẩy xuống cuối: không làm gì được nữa thì không chiếm chỗ trên đầu */
      if (ra <= 0 && rb > 0) return 1
      if (rb <= 0 && ra > 0) return -1
      return ra - rb
    })
  }, [conversations, sortMode, tick])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || loading || !hasMore) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 150) onLoadMore()
  }, [loading, hasMore, onLoadMore])

  const scopeTabs = [
    { key: SCOPE.UNREPLIED, label: 'Chưa trả lời', count: counts.unreplied },
    { key: SCOPE.MINE, label: 'Của tôi', count: counts.mine },
    { key: SCOPE.ALL, label: 'Tất cả', count: counts.all },
  ]

  const channelOptions = channels.map((c) => ({
    value: c.id,
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
            background: c.channelType === CHANNEL_TYPE.FACEBOOK ? '#1877f2' : '#0068ff',
          }}
        />
        {c.name}
      </span>
    ),
  }))

  /* Ba ca rỗng khác nhau, xử lý khác nhau:
     chưa nối kênh -> dẫn sang cấu hình; đã nối mà chưa có tin -> chờ;
     có tin nhưng bộ lọc không khớp -> gợi ý bỏ lọc. */
  const renderEmpty = () => {
    if (channels.length === 0) {
      return (
        <EmptyState
          icon={<ApiOutlined />}
          title="Chưa nối kênh nào"
          description="Nối Zalo OA hoặc Facebook fanpage để tin nhắn khách chảy về đây."
          action={
            <Button type="primary" onClick={onOpenChannelSetting}>
              Nối kênh
            </Button>
          }
        />
      )
    }

    if (isPristine) {
      return (
        <EmptyState
          icon={<InboxOutlined />}
          title="Chưa có tin nhắn nào"
          description="Zalo OA và Facebook đã nối xong. Tin nhắn mới của khách sẽ hiện ở đây."
        />
      )
    }

    return (
      <EmptyState
        icon={<SearchOutlined />}
        title={
          filters.scope === SCOPE.UNREPLIED
            ? 'Không còn tin chờ trả lời'
            : 'Không có hội thoại nào khớp'
        }
        description={
          filters.scope === SCOPE.UNREPLIED
            ? 'Mọi khách đã được trả lời. Xem tab Tất cả để duyệt lại.'
            : 'Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm.'
        }
      />
    )
  }

  return (
    <ListPane $mobileActive={mobileActive}>
      <FilterBar>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Tìm tên, SĐT, mã đơn..."
          onPressEnter={(e) => onFilter({ keyword: e.target.value })}
          onChange={(e) => !e.target.value && onFilter({ keyword: '' })}
        />

        <div className="select-row">
          <Select
            allowClear
            placeholder="Tất cả kênh"
            value={filters.channelAccountId}
            onChange={(v) => onFilter({ channelAccountId: v ?? null })}
            options={channelOptions}
          />
          <Select
            allowClear
            placeholder="Tất cả trạng thái"
            value={filters.status}
            onChange={(v) => onFilter({ status: v ?? null })}
            options={Object.entries(STATUS_CHIP).map(([value, { text }]) => ({
              value: Number(value),
              label: text,
            }))}
          />
        </div>
      </FilterBar>

      <ScopeTabs>
        {scopeTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            data-active={filters.scope === tab.key}
            onClick={() => onFilter({ scope: tab.key })}
          >
            {tab.label}
            <span className="count">{tab.count}</span>
          </button>
        ))}
      </ScopeTabs>

      {brokenChannel && (
        <ChannelAlert>
          <ApiOutlined className="icon" />
          <span className="grow">
            {brokenChannel.name} hết hạn token — tin mới không tải về từ{' '}
            {moment(brokenChannel.tokenExpireAt).format('HH:mm')}.
          </span>
          <Button size="small" onClick={() => onReconnect?.(brokenChannel)}>
            Nối lại
          </Button>
        </ChannelAlert>
      )}

      <ListMeta>
        <span className="total">{sorted.length} hội thoại</span>
        <button
          type="button"
          className="sort"
          onClick={() =>
            setSortMode(sortMode === SORT_MODE.URGENT ? SORT_MODE.RECENT : SORT_MODE.URGENT)
          }
        >
          <SwapOutlined rotate={90} />
          {sortMode === SORT_MODE.URGENT ? 'Gấp nhất trước' : 'Mới nhất trước'}
        </button>
      </ListMeta>

      <ScrollArea ref={scrollRef} onScroll={handleScroll}>
        {sorted.map((item) => (
          <ConversationRow
            key={item.id}
            item={item}
            tick={tick}
            active={item.id === activeId}
            onOpen={onOpen}
          />
        ))}

        {loading && (
          <div style={{ padding: 16, textAlign: 'center' }}>
            <Spin size="small" />
          </div>
        )}

        {!loading && sorted.length === 0 && renderEmpty()}
      </ScrollArea>
    </ListPane>
  )
}

export default ConversationList
