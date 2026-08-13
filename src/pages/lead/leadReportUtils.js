import dayjs from 'dayjs'
import { createLeadFilter } from './leadReportService'

export const STAGE_ORDER = [
  'NEW',
  'QUALIFYING',
  'QUALIFIED',
  'CONTACTED',
  'NEGOTIATING',
  'WON',
]

const STAGE_ALIASES = {
  0: 'NEW',
  1: 'LOST',
  2: 'CONTACTED',
  4: 'LOST',
  6: 'NURTURE',
  7: 'QUALIFIED',
  MOI: 'NEW',
  NEW_LEAD: 'NEW',
  DANG_TU_VAN: 'CONTACTED',
  THANH_CO_HOI: 'QUALIFIED',
  KHONG_TRIEN_KHAI: 'LOST',
  KHONG_LIEN_HE_DUOC: 'LOST',
  LIEN_HE_SAU: 'NURTURE',
}

export const normalizeStage = value => {
  const normalized = String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_')
  return STAGE_ALIASES[normalized] || normalized
}

export const getGroups = aggregate => (
  Array.isArray(aggregate?.groups)
    ? aggregate.groups.map(item => ({
      ...item,
      count: Number(item?.count ?? item?.value ?? 0),
    }))
    : []
)

export const getAggregateValue = aggregate => Number(aggregate?.value ?? 0)

export const countStage = (groups, stage) => getGroups(groups)
  .filter(item => normalizeStage(item.groupValue) === stage)
  .reduce((total, item) => total + item.count, 0)

export const rawStageValues = (groups, stage) => getGroups(groups)
  .filter(item => normalizeStage(item.groupValue) === stage)
  .map(item => item.groupValue)

export const getReportRanges = days => {
  const currentEnd = dayjs().endOf('day')
  const currentStart = currentEnd.subtract(days - 1, 'day').startOf('day')
  const previousEnd = currentStart.subtract(1, 'millisecond')
  const previousStart = previousEnd.subtract(days - 1, 'day').startOf('day')
  const toIso = value => value.toISOString()

  return {
    today: { start: toIso(dayjs().startOf('day')), end: toIso(dayjs().endOf('day')) },
    current: { start: toIso(currentStart), end: toIso(currentEnd) },
    previous: { start: toIso(previousStart), end: toIso(previousEnd) },
  }
}

export const createReportFilters = (bizId, range) => [
  createLeadFilter('bizId', 'EQUALS', bizId),
  createLeadFilter('inTime', 'BETWEEN', range.start, range.end),
]

export const percent = (value, total) => (
  total > 0 ? (Number(value || 0) / Number(total)) * 100 : 0
)

export const percentChange = (current, previous) => {
  if (!previous) return current ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

export const formatNumber = value => new Intl.NumberFormat('vi-VN').format(Number(value || 0))

export const formatPercent = value => `${new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 1,
}).format(Number(value || 0))}%`

export const formatCompactMoney = value => {
  const amount = Number(value || 0)
  const absolute = Math.abs(amount)
  if (absolute >= 1_000_000_000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(amount / 1_000_000_000)}B`
  if (absolute >= 1_000_000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(amount / 1_000_000)}M`
  if (absolute >= 1_000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(amount / 1_000)}K`
  return formatNumber(amount)
}

export const getInitials = name => String(name || '?')
  .trim()
  .split(/\s+/)
  .slice(-2)
  .map(part => part.charAt(0).toUpperCase())
  .join('')

