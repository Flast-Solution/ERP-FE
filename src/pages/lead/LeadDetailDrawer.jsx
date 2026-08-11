import React, { useMemo } from 'react'
import {
  AimOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  LockOutlined,
  RiseOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Drawer, Empty, Tag, Timeline, Typography } from 'antd'
import moment from 'moment'

import { CHANNEL_SOURCE_MAP_KEYS } from '@/configs/localData'

import './LeadDetailDrawer.less'

const { Text, Title } = Typography
const LEAD_STAGES = ['NEW', 'QUALIFYING', 'QUALIFIED', 'CONTACTED', 'NEGOTIATING', 'WON']

const formatDateTime = value => {
  if (!value) return 'Chưa có'
  const parsed = moment(value)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : String(value)
}

const normalizeActivities = lead => {
  const values = lead?.leadActivities ?? lead?.activities ?? lead?.activityHistory ?? lead?.histories
  return Array.isArray(values) ? values : []
}

const normalizeScoreItems = value => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).map(([label, points]) => ({ label, points }))
}

const getProducts = lead => {
  if (Array.isArray(lead?.products)) {
    return lead.products.map(item => item?.name ?? item?.title ?? item).filter(Boolean).join(', ')
  }
  return lead?.productName ?? lead?.productNames ?? 'Chưa có'
}

const LeadStageTracker = ({ currentStage }) => {
  const normalizedCurrent = String(currentStage || 'NEW').toUpperCase()
  const currentIndex = LEAD_STAGES.indexOf(normalizedCurrent)
  const isBranchStage = ['NURTURE', 'LOST'].includes(normalizedCurrent)

  return (
    <>
      <div className="lead-detail-stage">
        {LEAD_STAGES.map((stage, index) => {
          const completed = currentIndex >= 0 && index < currentIndex
          const current = index === currentIndex
          return (
            <div className={`lead-detail-stage__item${completed ? ' is-done' : ''}${current ? ' is-current' : ''}`} key={stage}>
              {index ? <span className="lead-detail-stage__line" /> : null}
              <span className="lead-detail-stage__bullet">{completed ? <CheckOutlined /> : index + 1}</span>
              <span className="lead-detail-stage__label">{stage}</span>
            </div>
          )
        })}
      </div>
      {isBranchStage ? <Tag color={normalizedCurrent === 'LOST' ? 'error' : 'gold'}>{normalizedCurrent}</Tag> : null}
    </>
  )
}

const LeadDetailDrawer = ({ open, lead, listSale = [], onClose, onWorkflowAction }) => {
  const activities = useMemo(() => normalizeActivities(lead), [lead])
  const scoreGroups = useMemo(() => {
    const details = lead?.scoreDetails ?? lead?.scoreBreakdown ?? {}
    return [
      ['Intent', details.intent ?? lead?.intentScores],
      ['Engagement', details.engagement ?? lead?.engagementScores],
      ['Profile', details.profile ?? lead?.profileScores],
      ['Behavior', details.behavior ?? lead?.behaviorScores],
    ].map(([label, values]) => ({ label, items: normalizeScoreItems(values) }))
      .filter(group => group.items.length)
  }, [lead])
  const sale = listSale.find(item => String(item.id) === String(lead?.saleId))
  const saleName = sale?.fullName ?? sale?.name ?? sale?.username ?? lead?.assignTo ?? 'Chưa phân công'
  const sourceName = CHANNEL_SOURCE_MAP_KEYS[lead?.source]?.name ?? lead?.source ?? 'Chưa có'
  const score = lead?.score ?? lead?.leadScore ?? 0
  const products = getProducts(lead)

  return (
    <Drawer
      className="lead-detail-drawer"
      open={open}
      onClose={onClose}
      width="min(880px, calc(100vw - 16px))"
      destroyOnHidden
      title={(
        <div>
          <Text className="lead-detail-drawer__eyebrow">CHI TIẾT LEAD</Text>
          <Title level={4}>{lead?.customerName ?? lead?.companyName ?? `Lead #${lead?.id ?? ''}`}</Title>
        </div>
      )}
    >
      <section className="lead-detail-card lead-detail-summary">
        <div className="lead-detail-summary__head">
          <div>
            <Text className="lead-detail-drawer__eyebrow">LEAD</Text>
            <Title level={2}>{lead?.customerName ?? 'Chưa có tên'}{products !== 'Chưa có' ? ` — ${products}` : ''}</Title>
            <div className="lead-detail-summary__meta">
              <Tag>LEAD-{lead?.id ?? '—'}</Tag>
              <Tag color="blue">{lead?.status ?? 'NEW'}</Tag>
              <Text type="secondary">Nguồn: {sourceName} · Sales: {saleName}</Text>
            </div>
          </div>
        </div>

        <LeadStageTracker currentStage={lead?.status} />

        <div className="lead-detail-branches">
          <span>Nhánh phụ: <strong>NURTURE</strong> (từ QUALIFYING)</span>
          <span>Nhánh phụ: <strong>LOST</strong> (từ stage đang hoạt động)</span>
        </div>

        <div className="lead-detail-lock"><LockOutlined /> Stage chỉ được thay đổi thông qua nghiệp vụ workflow.</div>

        <div className="lead-detail-actions">
          <Button type="primary" icon={<AimOutlined />} onClick={() => onWorkflowAction?.('NEGOTIATING')}>
            Bắt đầu đàm phán
          </Button>
          <Button icon={<ClockCircleOutlined />} onClick={() => onWorkflowAction?.('NURTURE')}>
            Đưa vào nurture
          </Button>
          <Button danger icon={<CloseCircleOutlined />} onClick={() => onWorkflowAction?.('LOST')}>
            Đóng lead
          </Button>
        </div>
      </section>

      <section className="lead-detail-card">
        <div className="lead-detail-section-title"><HistoryOutlined /><strong>Lịch sử chuyển stage</strong><Tag>lead_activities</Tag></div>
        {activities.length ? (
          <Timeline
            items={activities.map((activity, index) => ({
              color: index === activities.length - 1 ? 'blue' : 'gray',
              children: (
                <div className="lead-detail-activity">
                  <div className="lead-detail-activity__title">{activity.title ?? activity.name ?? activity.action ?? 'Cập nhật Lead'}</div>
                  {(activity.fromStage || activity.toStage) ? (
                    <div className="lead-detail-activity__stage">{activity.fromStage ?? '—'} → {activity.toStage ?? lead?.status}</div>
                  ) : null}
                  <Text type="secondary">{formatDateTime(activity.createdDate ?? activity.createdAt ?? activity.time)} · {activity.createdByName ?? activity.userName ?? activity.actorName ?? 'Hệ thống'}</Text>
                  {activity.description ?? activity.note ? <div className="lead-detail-activity__note">{activity.description ?? activity.note}</div> : null}
                </div>
              ),
            }))}
          />
        ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch sử chuyển stage" />}
      </section>

      <section className="lead-detail-card">
        <div className="lead-detail-section-title"><RiseOutlined /><strong>Lead score</strong><Tag>score</Tag></div>
        <div className="lead-detail-score-total">
          <span>{score}</span>
          <div><strong>Điểm hiện tại</strong><Text type="secondary">Tổng điểm đánh giá Lead</Text></div>
        </div>
        {scoreGroups.length ? (
          <div className="lead-detail-score-grid">
            {scoreGroups.map(group => (
              <div className="lead-detail-score-box" key={group.label}>
                <h3>{group.label}</h3>
                {group.items.map((item, index) => (
                  <div className="lead-detail-score-row" key={`${item.label ?? item.name}-${index}`}>
                    <span>{item.label ?? item.name ?? item.code}</span>
                    <strong>{Number(item.points ?? item.score ?? item.value) > 0 ? '+' : ''}{item.points ?? item.score ?? item.value ?? 0}</strong>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có chi tiết chấm điểm" />
        )}
      </section>

      <div className="lead-detail-owner"><UserOutlined /> Nhân viên phụ trách: <strong>{saleName}</strong></div>
    </Drawer>
  )
}

export default LeadDetailDrawer
