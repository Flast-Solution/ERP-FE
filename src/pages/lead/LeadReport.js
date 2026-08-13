import React, { useEffect, useMemo, useState } from 'react'
import { Button, Select, Spin } from 'antd'
import {
  BarChartOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { RequestUtils } from '@flast-erp/core/utils'
import useGetMe from '@/hooks/useGetMe'
import { CHANNEL_SOURCE_MAP_KEYS } from '@/configs/localData'
import {
  fetchLeadBreakdowns,
  fetchLeadReport,
  getBreakdownValue,
} from './leadReportService'
import {
  STAGE_ORDER,
  countStage,
  createReportFilters,
  formatCompactMoney,
  formatNumber,
  formatPercent,
  getAggregateValue,
  getGroups,
  getInitials,
  getReportRanges,
  percent,
  percentChange,
  rawStageValues,
} from './leadReportUtils'
import './LeadReport.less'

const ICON_ROOT = 'http://view.user.flast.vn/assets/icons'

const LOST_REASON_LABELS = {
  HIGH_PRICE: 'Giá cao',
  COMPETITOR: 'Chọn đối thủ',
  NO_NEED: 'Không có nhu cầu',
  UNREACHABLE: 'Không liên lạc được',
  NO_BUDGET: 'Không đủ ngân sách',
  WRONG_PRODUCT: 'Không đúng sản phẩm',
  PROJECT_DELAYED: 'Hoãn dự án',
  OTHER: 'Khác',
}

const BarRow = ({ label, value, maximum, tone, displayValue }) => (
  <div className="pl-chart-row">
    <span className="lbl">{label}</span>
    <div className="track">
      <div
        className={`fill${tone ? ` fill--${tone}` : ''}`}
        style={{ width: `${percent(value, maximum)}%` }}
      />
    </div>
    <span className="val">{displayValue ?? formatNumber(value)}</span>
  </div>
)

const Delta = ({ current, previous, point = false }) => {
  const delta = point ? current - previous : percentChange(current, previous)
  const up = delta >= 0
  return (
    <div className={`delta ${up ? 'up' : 'down'}`}>
      <RiseOutlined
        className="lead-report-delta-icon"
        style={up ? undefined : { transform: 'rotate(180deg)' }}
      />
      {delta > 0 ? '+' : ''}{new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(delta)}{point ? ' đpt' : '%'}
    </div>
  )
}

const SectionHead = ({ icon, iconNode, title, caption }) => (
  <div className="pl-section__head" style={{ marginBottom: 16 }}>
    {iconNode || <img src={`${ICON_ROOT}/${icon}.svg`} alt="" width="15" height="15" style={{ color: 'var(--fg-muted)' }} />}
    <span className="t-body-strong">{title}</span>
    {caption ? <span className="t-caption">{caption}</span> : null}
  </div>
)

const LeadReport = () => {
  const { user } = useGetMe()
  const [rangeDays, setRangeDays] = useState(30)
  const [report, setReport] = useState(null)
  const [breakdowns, setBreakdowns] = useState({})
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState([])
  const [reloadKey, setReloadKey] = useState(0)
  const bizId = user?.bizId

  useEffect(() => {
    let active = true
    RequestUtils.GetAsList('/user/list-name-id')
      .then(data => active && setUsers(Array.isArray(data) ? data : []))
      .catch(() => active && setUsers([]))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!bizId) return undefined
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      setWarnings([])
      try {
        const ranges = getReportRanges(rangeDays)
        const filters = {
          today: createReportFilters(bizId, ranges.today),
          current: createReportFilters(bizId, ranges.current),
          previous: createReportFilters(bizId, ranges.previous),
        }
        const result = await fetchLeadReport(filters)
        if (!active) return
        setReport(result.data)
        setWarnings(result.errors)

        const sourceGroups = getGroups(result.data?.sources).sort((a, b) => b.count - a.count)
        const saleGroups = getGroups(result.data?.sales).sort((a, b) => b.count - a.count)
        const statusGroups = result.data?.currentStatus
        const detail = await fetchLeadBreakdowns({
          currentFilters: filters.current,
          sourceGroups,
          saleGroups,
          qualifiedStatusValues: rawStageValues(statusGroups, 'QUALIFIED'),
          wonStatusValues: rawStageValues(statusGroups, 'WON'),
        })
        if (active) setBreakdowns(detail)
      } catch (requestError) {
        if (active) setError(requestError?.response?.data?.message || requestError?.message || 'Không tải được báo cáo Lead.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [bizId, rangeDays, reloadKey])

  const model = useMemo(() => {
    if (!report) return null
    const todayStatus = report.todayStatus
    const currentStatus = report.currentStatus
    const previousStatus = report.previousStatus
    const currentTotal = getAggregateValue(report.currentTotal)
    const previousTotal = getAggregateValue(report.previousTotal)
    const currentWon = countStage(currentStatus, 'WON')
    const previousWon = countStage(previousStatus, 'WON')
    const currentCloseRate = percent(currentWon, currentTotal)
    const previousCloseRate = percent(previousWon, previousTotal)
    const sourceGroups = getGroups(report.sources).sort((a, b) => b.count - a.count).slice(0, 8)
    const saleGroups = getGroups(report.sales).sort((a, b) => b.count - a.count).slice(0, 10)
    const funnel = STAGE_ORDER.map(stage => ({ stage, count: countStage(currentStatus, stage) }))
    const funnelDrops = funnel.slice(1).map((item, index) => ({
      from: funnel[index].stage,
      to: item.stage,
      value: funnel[index].count ? 100 - percent(item.count, funnel[index].count) : 0,
    }))
    const bottleneck = [...funnelDrops].sort((a, b) => b.value - a.value)[0]
    const sourceRows = sourceGroups.map((item, index) => ({
      key: item.groupValue,
      name: CHANNEL_SOURCE_MAP_KEYS[item.groupValue]?.name || String(item.groupValue || 'Chưa xác định'),
      leads: item.count,
      qualified: getBreakdownValue(breakdowns, 'source', index, 'qualified'),
      won: getBreakdownValue(breakdowns, 'source', index, 'won'),
      revenue: getBreakdownValue(breakdowns, 'source', index, 'revenue'),
    }))
    const userMap = users.reduce((map, item) => {
      map[String(item.id ?? item.value)] = item.name || item.fullName || item.title || item.username
      return map
    }, {})
    const saleRows = saleGroups.map((item, index) => ({
      key: item.groupValue,
      name: userMap[String(item.groupValue)] || `Nhân viên #${item.groupValue}`,
      assigned: item.count,
      won: getBreakdownValue(breakdowns, 'sale', index, 'won'),
      revenue: getBreakdownValue(breakdowns, 'sale', index, 'revenue'),
    }))
    const lostReasons = getGroups(report.lostReasons).filter(item => item.groupValue).sort((a, b) => b.count - a.count)

    return {
      today: [
        { label: 'New leads', value: getAggregateValue(report.todayTotal) },
        { label: 'Qualified', value: countStage(todayStatus, 'QUALIFIED') },
        { label: 'Hot leads', value: getGroups(report.todayInterest).filter(item => ['HIGH', 'HOT'].includes(String(item.groupValue).toUpperCase())).reduce((sum, item) => sum + item.count, 0) },
        { label: 'Negotiating', value: countStage(todayStatus, 'NEGOTIATING') },
        { label: 'Won', value: countStage(todayStatus, 'WON'), tone: 'done' },
        { label: 'Lost', value: countStage(todayStatus, 'LOST'), tone: 'error' },
      ],
      currentTotal,
      previousTotal,
      currentCloseRate,
      previousCloseRate,
      currentRevenue: getAggregateValue(report.currentRevenue),
      previousRevenue: getAggregateValue(report.previousRevenue),
      currentAverageDeal: getAggregateValue(report.currentAverageDeal),
      previousAverageDeal: getAggregateValue(report.previousAverageDeal),
      todayRevenue: getAggregateValue(report.todayRevenue),
      todayPipeline: getAggregateValue(report.todayPipeline),
      funnel,
      funnelDrops,
      bottleneck,
      nurture: countStage(currentStatus, 'NURTURE'),
      lost: countStage(currentStatus, 'LOST'),
      sourceRows,
      saleRows,
      lostReasons,
    }
  }, [breakdowns, report, users])

  if (loading && !model) {
    return <div className="lead-report-shell lead-report-loading"><Spin size="large" /></div>
  }

  if (error && !model) {
    return (
      <div className="lead-report-shell lead-report-empty">
        <div className="lead-report-empty__icon"><BarChartOutlined /></div>
        <h2>Chưa có dữ liệu báo cáo</h2>
        <p>Dữ liệu Lead chưa sẵn sàng. Bạn có thể thử tải lại sau ít phút.</p>
        <Button icon={<ReloadOutlined />} onClick={() => setReloadKey(value => value + 1)}>
          Thử lại
        </Button>
      </div>
    )
  }

  if (!model) return null

  const todayMax = Math.max(...model.today.map(item => item.value), 1)
  const funnelMax = Math.max(...model.funnel.map(item => item.count), 1)
  const channelLeadMax = Math.max(...model.sourceRows.map(item => item.leads), 1)
  const channelRevenueMax = Math.max(...model.sourceRows.map(item => item.revenue), 1)
  const saleRevenueMax = Math.max(...model.saleRows.map(item => item.revenue), 1)
  const lostTotal = model.lostReasons.reduce((sum, item) => sum + item.count, 0)
  const lostMax = Math.max(...model.lostReasons.map(item => item.count), 1)
  const bestChannel = [...model.sourceRows].sort((a, b) => b.revenue - a.revenue)[0]

  return (
    <div className="lead-report-shell">
      <link rel="stylesheet" href="http://view.user.flast.vn/colors_and_type.css" />
      <link rel="stylesheet" href="http://view.user.flast.vn/pipe_lead.css" />
      <div className="pl-report-page" data-screen-label="Pipe Lead · 9 Báo cáo">
        <div className="pl-report">
          {warnings.length ? (
            <div className="lead-report-notice">
              <InfoCircleOutlined />
              <span>Một số chỉ số nâng cao chưa có dữ liệu trong kỳ này.</span>
            </div>
          ) : null}

          <div className="pl-report-head">
            <div>
              <div className="t-eyebrow">Báo cáo</div>
              <h1 className="t-h1" style={{ margin: '4px 0 0' }}>Lead Pipeline</h1>
              <div className="t-small pl-report-head__sub">Trả lời: đang có bao nhiêu lead tốt, kênh/nhân viên nào hiệu quả, pipeline nghẽn ở đâu, vì sao mất đơn, và tốc độ chốt đơn.</div>
            </div>
            <div className="pl-report-range">
              <img src={`${ICON_ROOT}/calendar.svg`} alt="" />
              <Select
                value={rangeDays}
                onChange={setRangeDays}
                variant="borderless"
                options={[7, 30, 90].map(value => ({ value, label: `${value} ngày qua` }))}
              />
            </div>
          </div>

          <div className="pl-detail-card">
            <SectionHead icon="zap" title="Hôm nay" />
            <div className="pl-chart">
              {model.today.map(item => <BarRow key={item.label} {...item} maximum={todayMax} />)}
            </div>
            <div className="pl-stat-cards" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 'var(--s-4)' }}>
              <div className="pl-stat-card"><div className="lbl">Revenue</div><div className="v">{formatCompactMoney(model.todayRevenue)}</div></div>
              <div className="pl-stat-card"><div className="lbl">Pipeline</div><div className="v">{formatCompactMoney(model.todayPipeline)}</div></div>
            </div>
          </div>

          <div className="pl-detail-card">
            <SectionHead iconNode={<RiseOutlined className="lead-report-section-icon" />} title="So với kỳ trước" />
            <div className="pl-stat-cards">
              <div className="pl-stat-card"><div className="lbl">New leads</div><div className="v">{formatNumber(model.currentTotal)}</div><Delta current={model.currentTotal} previous={model.previousTotal} /></div>
              <div className="pl-stat-card"><div className="lbl">Tỷ lệ chốt (Won/New)</div><div className="v">{formatPercent(model.currentCloseRate)}</div><Delta current={model.currentCloseRate} previous={model.previousCloseRate} point /></div>
              <div className="pl-stat-card"><div className="lbl">Doanh thu</div><div className="v">{formatCompactMoney(model.currentRevenue)}</div><Delta current={model.currentRevenue} previous={model.previousRevenue} /></div>
              <div className="pl-stat-card"><div className="lbl">Giá trị deal trung bình</div><div className="v">{formatCompactMoney(model.currentAverageDeal)}</div><Delta current={model.currentAverageDeal} previous={model.previousAverageDeal} /></div>
            </div>
          </div>

          <div className="pl-detail-card">
            <SectionHead icon="filter" title="Pipeline nghẽn ở đâu — Funnel theo stage" caption={`${rangeDays} ngày qua`} />
            <div className="pl-funnel">
              {model.funnel.map((item, index) => {
                const drop = model.funnelDrops[index - 1]?.value
                return (
                  <div className="pl-funnel-row" key={item.stage}>
                    <span className="stage">{item.stage}</span>
                    <div className="track"><div className="fill" style={{ width: `${percent(item.count, funnelMax)}%`, ...(item.stage === 'WON' ? { background: 'var(--status-done-fg)' } : {}) }} /></div>
                    <span className="cnt">{formatNumber(item.count)}</span>
                    <span className="drop">{index === 0 ? '—' : `-${formatPercent(drop)}`}</span>
                  </div>
                )
              })}
            </div>
            <div className="pl-funnel-branches">
              <span>Rẽ NURTURE: <strong>{formatNumber(model.nurture)}</strong></span>
              <span>Rẽ LOST: <strong>{formatNumber(model.lost)}</strong></span>
              {model.bottleneck ? <span>Điểm nghẽn lớn nhất: <strong style={{ color: 'var(--status-error-fg)' }}>{model.bottleneck.from} → {model.bottleneck.to} (-{formatPercent(model.bottleneck.value)})</strong></span> : null}
            </div>
          </div>

          <div className="pl-detail-card">
            <SectionHead icon="git-branch" title="Channel performance" caption="Kênh nào đáng đầu tư thêm" />
            <div className="pl-chart-legend">
              <span><span className="dot" style={{ background: 'var(--brand-300)' }} /> Leads</span>
              <span><span className="dot" style={{ background: 'var(--brand-600)' }} /> Qualified</span>
              <span><span className="dot" style={{ background: 'var(--status-done-fg)' }} /> Won</span>
            </div>
            <div className="pl-chart-groups">
              {model.sourceRows.map(item => (
                <div key={item.key}>
                  <div className="pl-chart-group__name">{item.name}</div>
                  <div className="pl-chart-group__rows">
                    {[
                      ['Leads', item.leads, 'var(--brand-300)'],
                      ['Qualified', item.qualified, 'var(--brand-600)'],
                      ['Won', item.won, 'var(--status-done-fg)'],
                    ].map(([label, value, color]) => (
                      <div className="pl-chart-group__row" key={label}>
                        <span className="k">{label}</span>
                        <div className="track"><div className="fill" style={{ width: `${percent(value, channelLeadMax)}%`, background: color }} /></div>
                        <span className="v">{formatNumber(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="t-caption" style={{ margin: 'var(--s-4) 0 8px' }}>Revenue theo kênh</div>
            <div className="pl-chart">
              {model.sourceRows.map(item => <BarRow key={item.key} label={item.name} value={item.revenue} maximum={channelRevenueMax} displayValue={formatCompactMoney(item.revenue)} />)}
            </div>
            {bestChannel ? <div className="field-help" style={{ marginTop: 'var(--s-3)' }}>{bestChannel.name} đang có doanh thu cao nhất trong kỳ đã chọn.</div> : null}
          </div>

          <div className="pl-detail-card">
            <SectionHead icon="users" title="Hiệu suất nhân viên" caption={`${rangeDays} ngày qua`} />
            <table className="pl-table">
              <thead><tr><th>Nhân viên</th><th className="num">Lead được giao</th><th className="num">Đã chốt</th><th className="num">Doanh thu</th><th className="num">Tỷ lệ chốt</th></tr></thead>
              <tbody>
                {model.saleRows.map(item => (
                  <tr key={item.key}>
                    <td><div className="rep"><span className="av">{getInitials(item.name)}</span> {item.name}</div></td>
                    <td className="num">{formatNumber(item.assigned)}</td>
                    <td className="num">{formatNumber(item.won)}</td>
                    <td className="num">{formatCompactMoney(item.revenue)}</td>
                    <td className="num" style={{ color: percent(item.won, item.assigned) >= 15 ? 'var(--status-done-fg)' : undefined }}>{formatPercent(percent(item.won, item.assigned))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="t-caption" style={{ margin: 'var(--s-4) 0 8px' }}>Doanh thu theo nhân viên</div>
            <div className="pl-chart">
              {model.saleRows.map(item => <BarRow key={item.key} label={item.name} value={item.revenue} maximum={saleRevenueMax} displayValue={formatCompactMoney(item.revenue)} />)}
            </div>
          </div>

          <div className="pl-detail-card">
            <SectionHead icon="clock" title="Tốc độ chốt đơn" caption="Thời gian trung bình giữa các stage" />
            <div className="pl-stat-cards">
              {['NEW → QUALIFIED', 'QUALIFIED → CONTACTED', 'NEGOTIATING → WON', 'NEW → WON (toàn trình)'].map(label => (
                <div className="pl-stat-card" key={label}><div className="lbl">{label}</div><div className="v">—</div></div>
              ))}
            </div>
          </div>

          <div className="pl-detail-card">
            <SectionHead icon="circle-x" title="Vì sao mất đơn" caption={`${formatNumber(model.lost)} lead LOST trong ${rangeDays} ngày qua`} />
            <div className="pl-chart">
              {model.lostReasons.map(item => (
                <BarRow
                  key={item.groupValue}
                  label={LOST_REASON_LABELS[String(item.groupValue).toUpperCase()] || String(item.groupValue)}
                  value={item.count}
                  maximum={lostMax}
                  tone="error"
                  displayValue={formatPercent(percent(item.count, lostTotal))}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeadReport
