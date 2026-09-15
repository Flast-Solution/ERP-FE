import React, { useMemo } from 'react'
import { Button, Drawer } from 'antd'
import moment from 'moment'

import { CHANNEL_SOURCE_MAP_KEYS } from '@/configs/localData'

import './LeadDetailDrawer.less'

const ASSET_BASE_URL = 'http://view.user.flast.vn/assets/icons'
const LEAD_STAGES = ['QUALIFYING', 'CONTACTED', 'NEGOTIATING', 'WON']

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

const getActivityDate = value => {
  const parsed = moment(value)
  if (!value || !parsed.isValid()) return { date: '—', time: '—' }
  return {
    date: parsed.format('DD/MM'),
    time: parsed.format('HH:mm'),
  }
}

const getInitials = value => String(value || 'Hệ thống')
  .trim()
  .split(/\s+/)
  .slice(-2)
  .map(word => word.charAt(0).toUpperCase())
  .join('')

const getScoreValue = item => item?.points ?? item?.score ?? item?.value ?? 0

const LeadStageTracker = ({ currentStage }) => {
  const normalizedCurrent = String(currentStage || 'NEW').toUpperCase()
  const currentIndex = LEAD_STAGES.indexOf(normalizedCurrent)

  return (
    <div className="pl-tracker">
      {LEAD_STAGES.map((stage, index) => {
        const completed = currentIndex >= 0 && index < currentIndex
        const current = index === currentIndex
        return (
          <div
            className={`pl-tracker__step${completed ? ' is-done' : ''}${current ? ' is-current' : ''}`}
            key={stage}
          >
            {index ? <span className="pl-tracker__line" /> : null}
            <span className="pl-tracker__bullet">
              {completed
                ? <img src={`${ASSET_BASE_URL}/check.svg`} alt="" />
                : current
                  ? '●'
                  : index + 1}
            </span>
            <span className="pl-tracker__label">{stage}</span>
          </div>
        )
      })}
    </div>
  )
}

const LeadTimeline = ({ activities, currentStage }) => (
  <div className="pl-timeline">
    {activities.map((activity, index) => {
      const activityDate = getActivityDate(activity.createdDate ?? activity.createdAt ?? activity.time)
      const actorName = activity.createdByName ?? activity.userName ?? activity.actorName ?? 'Hệ thống'
      const fromStage = activity.fromStage ?? '—'
      const toStage = activity.toStage ?? currentStage
      return (
        <div className="pl-timeline__item" key={activity.id ?? `${activityDate.date}-${activityDate.time}-${index}`}>
          <span className="pl-timeline__time">
            <span className="d">{activityDate.date}</span>
            <span className="t">{activityDate.time}</span>
          </span>
          <span className="pl-timeline__dot-col"><span className="pl-timeline__dot" /></span>
          <div className="pl-timeline__body">
            <div className="pl-timeline__title">
              {activity.title ?? activity.name ?? activity.action ?? 'Cập nhật Lead'}
            </div>
            {(activity.fromStage || activity.toStage) ? (
              <div className="pl-timeline__stages">
                {fromStage}
                <img src={`${ASSET_BASE_URL}/arrow-right.svg`} alt="" />
                {toStage}
              </div>
            ) : null}
            <div className="pl-timeline__meta">
              <span className="pl-timeline__avatar">{getInitials(actorName)}</span>
              {actorName}
            </div>
            {activity.description ?? activity.note ? (
              <div className="pl-timeline__extra">{activity.description ?? activity.note}</div>
            ) : null}
          </div>
        </div>
      )
    })}
  </div>
)

const LeadScore = ({ score, scoreGroups }) => (
  <>
    <div className="pl-score-total">
      <span className="v">{score}</span>
      <div className="lbl">
        <span className="t-body-strong">Điểm hiện tại</span>
        <span className="t-caption">Cộng dồn từ Intent, Engagement, Profile, Behavior</span>
      </div>
    </div>

    {scoreGroups.map(group => (
      <div className="pl-score-group" key={group.label}>
        <h3 className="t-h3 pl-score-group__title">{group.label}</h3>
        <div className="pl-score-box">
          <button className="pl-score-copy" type="button">
            <img src={`${ASSET_BASE_URL}/list.svg`} alt="Copy" />
          </button>
          {group.items.map((item, index) => {
            const value = getScoreValue(item)
            return (
              <div className="pl-score-row" key={`${item.label ?? item.name ?? item.code}-${index}`}>
                <span>{item.label ?? item.name ?? item.code}</span>
                <span className="pts">{Number(value) > 0 ? '+' : ''}{value}</span>
              </div>
            )
          })}
        </div>
      </div>
    ))}
  </>
)

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
  const displayName = lead?.customerName ?? lead?.companyName ?? `Lead #${lead?.id ?? ''}`
  const status = lead?.status ?? 'NEW'

  return (
    <Drawer
      className="lead-detail-drawer"
      open={open}
      onClose={onClose}
      width="min(750px, calc(100vw - 16px))"
      destroyOnHidden
      title="CHI TIẾT LEAD"
    >
      <link rel="stylesheet" href="http://view.user.flast.vn/colors_and_type.css" />
      <link rel="stylesheet" href="http://view.user.flast.vn/pipe_lead.css" />

      <div className="pl-detail-page">
        <div className="pl-detail">
          <div>
            <div className="pl-detail-head">
              <div>
                <div className="t-eyebrow">Lead</div>
                <h1 className="t-h1 lead-detail-name">{displayName}{products !== 'Chưa có' ? ` — ${products}` : ''}</h1>
                <div className="pl-detail-head__meta">
                  <span className="code-chip">LEAD-{lead?.id ?? '—'}</span>
                  <span className="badge badge--mid">{status}</span>
                  <span className="t-small lead-detail-meta">Nguồn: {sourceName} · Sales: {saleName}</span>
                </div>
              </div>
            </div>

            <LeadStageTracker currentStage={status} />

            <div className="pl-tracker__branches">
              <span className="pl-tracker__branch">
                <img src={`${ASSET_BASE_URL}/clock.svg`} alt="" /> Nhánh phụ: NURTURE (từ QUALIFYING)
              </span>
              <span className="pl-tracker__branch">
                <img src={`${ASSET_BASE_URL}/circle-x.svg`} alt="" /> Nhánh phụ: LOST (từ bất kỳ stage đang hoạt động)
              </span>
            </div>

            <div className="pl-lockrow">
              <img src={`${ASSET_BASE_URL}/shield.svg`} alt="" />
              <span>Stage không thể sửa trực tiếp — chỉ đổi qua các action bên dưới.</span>
              <span className="lockval">stage (read-only)</span>
            </div>

            <div className="pl-actions">
              <Button className="btn btn--primary" onClick={() => onWorkflowAction?.('NEGOTIATING')}>
                <img src={`${ASSET_BASE_URL}/target.svg`} alt="" width="14" height="14" /> Bắt đầu đàm phán
              </Button>
              <Button className="btn btn--secondary" onClick={() => onWorkflowAction?.('NURTURE')}>
                <img src={`${ASSET_BASE_URL}/clock.svg`} alt="" width="14" height="14" /> Đưa vào nurture
              </Button>
              <Button className="btn btn--danger" onClick={() => onWorkflowAction?.('LOST')}>
                <img src={`${ASSET_BASE_URL}/circle-x.svg`} alt="" width="14" height="14" /> Đóng lead
              </Button>
            </div>
          </div>

          <div>
            <div className="pl-section__head lead-detail-section-head">
              <img src={`${ASSET_BASE_URL}/history.svg`} alt="" width="15" height="15" />
              <span className="t-body-strong">Lịch sử chuyển stage</span>
              <span className="code-chip">lead_activities</span>
            </div>
            <LeadTimeline activities={activities} currentStage={status} />
          </div>

          <div>
            <div className="pl-section__head lead-detail-section-head">
              <img src={`${ASSET_BASE_URL}/bar-chart-3.svg`} alt="" width="15" height="15" />
              <span className="t-body-strong">Lead score</span>
              <span className="code-chip">score</span>
            </div>
            <LeadScore score={score} scoreGroups={scoreGroups} />
          </div>
        </div>
      </div>
    </Drawer>
  )
}

export default LeadDetailDrawer
