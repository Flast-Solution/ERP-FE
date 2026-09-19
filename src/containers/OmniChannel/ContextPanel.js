/**************************************************************************/
/*  @/containers/OmniChannel/ContextPanel.js                              */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/

import { useMemo } from 'react'
import { Button, Skeleton } from 'antd'
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeInvisibleOutlined,
  InboxOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  ShoppingOutlined,
  UserAddOutlined,
  UserOutlined,
  CalendarOutlined,
  FacebookFilled,
  StarOutlined,
  ThunderboltOutlined,
  WechatOutlined,
  ChromeOutlined
} from '@ant-design/icons'
import moment from 'moment'
import {
  useActiveContext,
  useOmniStore,
  CHANNEL_TYPE,
  REF_TYPE,
  getWindowRemaining,
} from '@/store/omniStore'
import {
  ContextPane,
  IdentityHead,
  IconLine,
  CallToAction,
  SectionTitle,
  ChannelRow,
  WindowChip,
  FactRow,
  StatRow,
  StatCard,
  DealCard,
  EmptyCard,
} from './contextStyles'
import EmptyState from './EmptyState'

const REF_META = {
  [REF_TYPE.LEAD]:  { accent: '#1677ff', tint: '#e6f4ff', icon: <ThunderboltOutlined />, codeLabel: null },
  [REF_TYPE.COHOI]: { accent: '#722ed1', tint: '#f9f0ff', icon: <StarOutlined />,        codeLabel: '' },
  [REF_TYPE.ORDER]: { accent: '#389e0d', tint: '#f6ffed', icon: <ShoppingOutlined />,    codeLabel: '' },
}

/* Icon theo CHANNEL_SOURCE của ERP */
const SOURCE_ICON = {
  1: <FacebookFilled style={{ color: '#1877f2' }} />,
  2: <WechatOutlined style={{ color: '#0068ff' }} />,
  3: <PhoneOutlined />,
  4: <CalendarOutlined />,
  11: <ChromeOutlined />
}

const fullMoney = (value) =>
  typeof value === 'number' ? `${value.toLocaleString('vi-VN')} đ` : null

const URGENT_THRESHOLD = 3 * 3600_000

/* Rút gọn tiền: 8.400.000 -> 8,4tr · 620.000.000 -> 620tr · 1.2 tỷ -> 1,2 tỷ
   Cột phải hẹp 330px, số đầy đủ sẽ tràn dòng. */
const shortMoney = (value) => {
  if (typeof value !== 'number') return null
  if (value === 0) return '0 đ'
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1).replace('.', ',').replace(',0', '')} tỷ`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')}tr`
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return `${value} đ`
}

const initialsOf = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  '#7265e6', '#00a2ae', '#f56a00', '#1677ff',
  '#eb2f96', '#13c2c2', '#0f7b6c', '#fa8c16',
]

const colorOf = (text = '') => {
  let sum = 0
  for (let i = 0; i < text.length; i += 1) sum += text.charCodeAt(i)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

const channelInitial = (channelType) => (channelType === CHANNEL_TYPE.FACEBOOK ? 'f' : 'Z')
const shortRemaining = (ms) => {
  const minutes = Math.floor(ms / 60_000)
  const hours = Math.floor(minutes / 60)
  if (hours >= 6) {
    return `${hours} giờ`
  }
  return hours > 0 ? `${hours}g${String(minutes % 60).padStart(2, '0')}` : `${minutes}p`
}

/* ---------------------------------------------------------------- */

const ChannelLine = ({ item, onOpen }) => {

  const remaining = getWindowRemaining(item)
  const state = remaining <= 0 ? 'closed' : remaining < URGENT_THRESHOLD ? 'urgent' : 'ok'

  return (
    <ChannelRow
      $channelType={item.channelType}
      $clickable={Boolean(onOpen)}
      onClick={() => onOpen?.(item.conversationId)}
    >
      <span className="badge">{channelInitial(item.channelType)}</span>
      <span className="grow">{item.channelAccountName}</span>
      {state === 'closed' ? (
        <WindowChip $state="closed">Hết hạn</WindowChip>
      ) : state === 'urgent' ? (
        <WindowChip $state="urgent">
          <ClockCircleOutlined />
          còn {shortRemaining(remaining)}
        </WindowChip>
      ) : (
        /* Còn nhiều thời gian: chữ xám */
        <span style={{ fontSize: 12, color: '#8c8c8c', flexShrink: 0 }}>
          còn {shortRemaining(remaining)}
        </span>
      )}
    </ChannelRow>
  )
}

/* ---------------------------------------------------------------- */

const ContextPanel = ({
  open,
  onCreateLead,
  onFindCustomer,
  onCreateOpportunity,
  onOpenSibling,
  onReloadContext,
}) => {
  const context = useActiveContext()
  const loading = useOmniStore((s) => s.contextLoading)
  const error = useOmniStore((s) => s.contextError)
  const activeId = useOmniStore((s) => s.activeId)

  const channelLines = useMemo(() => {
    if (!context) return []
    const { identity, siblingIdentities = [] } = context
    return [
      {
        key: `self-${identity.id}`,
        conversationId: null,
        channelType: identity.channelType,
        channelAccountName: identity.channelAccountName,
        lastInboundAt: identity.lastInboundAt,
      },
      ...siblingIdentities.map((s) => ({ ...s, key: `sib-${s.identityId}` })),
    ]
  }, [context])

  if (!activeId) {
    return (
      <ContextPane $open={open}>
        <EmptyState
          icon={<UserOutlined />}
          title="Chưa có khách"
          description="Thông tin khách, công nợ và lịch sử đơn sẽ hiện ở đây."
        />
      </ContextPane>
    )
  }

  if (loading && !context) {
    return (
      <ContextPane $open={open}>
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      </ContextPane>
    )
  }

  /* Chỉ vào đây khi gọi API thất bại thật (mạng, 500).
     Hội thoại chưa có khách KHÔNG phải lỗi — nó trả customer = null
     và rơi vào nhánh "Khách chưa gắn" bên dưới. */
  if (error) {
    return (
      <ContextPane $open={open}>
        <EmptyState
          icon={<ExclamationCircleOutlined />}
          title="Không tải được thông tin"
          description={error}
          action={
            onReloadContext && (
              <Button icon={<ReloadOutlined />} onClick={onReloadContext}>
                Thử lại
              </Button>
            )
          }
        />
      </ContextPane>
    )
  }

  if (!context) {
    return <ContextPane $open={open} />
  }

  const { identity, customer, timeline = [] } = context
  const channelLabel = identity.channelType === CHANNEL_TYPE.FACEBOOK ? 'Facebook' : 'Zalo'

  const DealItem = ({ item, index }) => (
    <div className="item">
      <div className="body">
        <div className="name">
          {index + 1}. {item.name}
        </div>
        <div className="spec">
          SL: {item.quantity} {item.unit} · Đơn giá: {fullMoney(item.unitPrice)}/{item.unit}
        </div>
      </div>
      <div className="amount">{fullMoney(item.amount)}</div>
    </div>
  )

  const DealCardItem = ({ item }) => {

    const meta = REF_META[item.refType]
    const metaText = item.refType === REF_TYPE.COHOI ? 'Cơ hội' : 'Đ.Hàng'
    const isLead = item.refType === REF_TYPE.LEAD

    return (
      <DealCard $accent={meta.accent} $tint={meta.tint} $ownerColor={colorOf(item.owner?.name || '')}>
        <div className="head">
          { meta.codeLabel && 
            <span className="code-label">{meta.codeLabel}</span>
          }
          <span className="code">{item.code}</span>
          <span className="kind">{isLead ? 'Lead tiềm năng' : metaText}</span>
          <span className="when">
            {meta.icon}
            {moment(item.createdAt).format('DD/MM · HH:mm')}
          </span>
        </div>

        {isLead ? (
          <>
            <div className="lead-name">
              Sản phẩm: {item.requirement}
            </div>
            {item.tags?.length > 0 && (
              <div className="tags">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {item.items?.length > 0 && (
              <div className="items">
                {item.items.map((line, i) => (
                  <DealItem key={i} item={line} index={i} />
                ))}
              </div>
            )}

            {item.totalAmount != null && (
              <div className="total">
                <span className="label">Tổng tiền</span>
                <span className="value">{fullMoney(item.totalAmount)}</span>
              </div>
            )}
          </>
        )}

        <div className="foot">
          {item.owner?.name && (
            <span className="owner">
              <span className="face">{item.owner.initials || initialsOf(item.owner.name)}</span>
              {item.owner.name}
            </span>
          )}
          {item.sourceLabel && (
            <span className="source">
              {SOURCE_ICON[item.sourceType]}
              {item.sourceLabel}
            </span>
          )}
          <span className="spacer" />
          {!isLead && item.detailUrl && (
            <Button size="small" href={item.detailUrl}>
              {item.refType === REF_TYPE.ORDER ? 'Xem đơn' : 'Xem deal'}
            </Button>
          )}
        </div>
      </DealCard>
    )
  }

  return (
    <ContextPane $open={open}>
      <IdentityHead
        $unlinked={!customer}
        $bg={customer ? colorOf(customer.name) : undefined}
      >
        <div className="face">
          {identity.avatar ? (
            <img src={identity.avatar} alt="" />
          ) : (
            initialsOf(customer?.name || identity.displayName)
          )}
        </div>
        <div className="info">
          <div className="name">
            {customer ? <a href={customer.detailUrl}>{customer.name}</a> : identity.displayName}
          </div>
          <div className="sub">
            {customer ? customer.code || 'Khách hàng' : 'Chưa có trong hệ thống'}
          </div>
        </div>
      </IdentityHead>

      {/* ---------- Chưa gắn ---------- */}
      {!customer && (
        <CallToAction>
          <div className="icon">
            <EyeInvisibleOutlined />
          </div>
          <div className="title">Khách chưa gắn</div>
          <div className="desc">
            Chỉ có tên {channelLabel}. Tạo lead để lưu SĐT, nguồn và giao việc cho nhân viên.
          </div>
          <div className="actions">
            <Button
              type="primary"
              className="primary"
              icon={<UserAddOutlined />}
              onClick={onCreateLead}
            >
              Tạo lead
            </Button>
            <Button icon={<SearchOutlined />} onClick={onFindCustomer}>
              Tìm khách cũ
            </Button>
          </div>
        </CallToAction>
      )}

      {/* ---------- Đã gắn ---------- */}
      {customer && (
        <>
          <div style={{ marginTop: 12 }}>
            {customer.companyName && (
              <IconLine>
                <ShopOutlined className="ico" />
                <span className="text">{customer.companyName}</span>
              </IconLine>
            )}
            <IconLine>
              <PhoneOutlined className="ico" />
              <a className="text" href={`tel:${customer.mobile}`}>
                {customer.mobile}
              </a>
            </IconLine>
            <IconLine>
              <UserOutlined className="ico" />
              <span className="text">Phụ trách: {customer.ownerName}</span>
            </IconLine>
          </div>

          <StatRow>
            <StatCard>
              <div className="label">
                <ShoppingOutlined />
                Đơn hàng
              </div>
              <div className="value">
                {customer.totalOrderCount}
                <span className="unit">Đơn</span>
              </div>
              <div className="caption">
                {customer.totalOrderCount > 0 && customer.lastOrderAt
                  ? `Ngày gần nhất ${moment(customer.lastOrderAt).format('DD/MM')}`
                  : `khách mới ${moment(customer.createdAt).format('DD/MM')}`}
              </div>
            </StatCard>

            <StatCard $alert={customer.overdueInvoiceCount > 0}>
              <div className="label">
                <ExclamationCircleOutlined />
                Công nợ
              </div>
              <div className="value">{shortMoney(customer.debtAmount)}</div>
              <div className="caption">
                {customer.overdueInvoiceCount > 0
                  ? `${customer.overdueInvoiceCount} hoá đơn quá hạn`
                  : customer.debtAmount > 0
                    ? 'Trong hạn thanh toán'
                    : 'không có nợ'}
              </div>
            </StatCard>
          </StatRow>
        </>
      )}

      {/* ---------- Kênh liên hệ ---------- */}
      <SectionTitle>Còn nhắn được từ</SectionTitle>
      {channelLines.map((line) => (
        <ChannelLine
          key={line.key}
          item={line}
          onOpen={line.conversationId ? onOpenSibling : null}
        />
      ))}

      {/* ---------- Thông tin ---------- */}
      <SectionTitle>Thông tin</SectionTitle>
      {customer ? (
        <>
          <FactRow>
            <span className="label">Nhóm giá</span>
            <span className={`value ${customer.priceGroup ? '' : 'muted'}`}>
              {customer.priceGroup || 'Mặc định'}
            </span>
          </FactRow>
          <FactRow>
            <span className="label">Nguồn</span>
            <span className="value">{customer.source || `${channelLabel} OA`}</span>
          </FactRow>
          <FactRow>
            <span className="label">Đơn gần nhất</span>
            <span className={`value ${customer.lastOrderCode ? '' : 'muted'}`}>
              {customer.lastOrderCode
                ? `${customer.lastOrderCode} · ${moment(customer.lastOrderAt).format('DD/MM')}`
                : 'Chưa có'}
            </span>
          </FactRow>
        </>
      ) : (
        <>
          <FactRow>
            <span className="label">Tên {channelLabel}</span>
            <span className="value">{identity.displayName}</span>
          </FactRow>
          <FactRow>
            <span className="label">Nhắn lần đầu</span>
            <span className="value">
              {identity.firstMessageAt
                ? moment(identity.firstMessageAt).format('DD/MM HH:mm')
                : '—'}
            </span>
          </FactRow>
          <FactRow>
            <span className="label">Quảng cáo</span>
            <span className={`value ${identity.referralLabel ? '' : 'muted'}`}>
              {identity.referralLabel || 'Không rõ nguồn'}
            </span>
          </FactRow>
        </>
      )}

      {/* ---------- Lịch sử tương tác ---------- */}
      {customer && (
        <>
          <SectionTitle>Lịch sử tương tác</SectionTitle>

          {timeline.length === 0 ? (
            <EmptyCard>
              <div className="icon">
                <InboxOutlined />
              </div>
              <div className="title">Chưa có tương tác</div>
              <div className="desc">
                Khách đã gắn vào hệ thống nhưng chưa có lead, cơ hội hay đơn hàng nào.
              </div>
              <Button
                type="primary"
                className="primary"
                icon={<PlusOutlined />}
                onClick={onCreateOpportunity}
              >
                Tạo cơ hội
              </Button>
            </EmptyCard>
          ) : (
            timeline.map((item) => (
              <DealCardItem key={`${item.refType}-${item.refId}`} item={item} />
            ))
          )}
        </>
      )}
    </ContextPane>
  )
};

export default ContextPanel;
