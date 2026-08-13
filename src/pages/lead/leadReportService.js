import axios from 'axios'

const GRAPHQL_ENDPOINT = '/graphql'
const MAX_CONCURRENT_REQUESTS = 6

const ALLOWED_AGGREGATION_TYPES = new Set([
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'GROUP_BY',
])

const assertGraphQLName = value => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(String(value))) {
    throw new Error(`GraphQL field không hợp lệ: ${value}`)
  }
  return value
}

const createAggregateQuery = ({ field, type, groupByField }) => {
  const safeField = assertGraphQLName(field)
  const safeType = String(type).toUpperCase()
  if (!ALLOWED_AGGREGATION_TYPES.has(safeType)) {
    throw new Error(`Aggregation type không hợp lệ: ${type}`)
  }

  const groupArgument = safeType === 'GROUP_BY'
    ? `groupByField: "${assertGraphQLName(groupByField)}"`
    : ''
  const resultFields = safeType === 'GROUP_BY'
    ? 'field type groups { groupValue count }'
    : 'field type value'

  return `
    query LeadAggregate($filters: [LeadFilterInput!]) {
      aggregateLeads(
        field: "${safeField}"
        type: ${safeType}
        filters: $filters
        ${groupArgument}
      ) {
        ${resultFields}
      }
    }
  `
}

const aggregateLead = async ({ field, type, groupByField, filters }) => {
  const response = await axios.post(GRAPHQL_ENDPOINT, {
    query: createAggregateQuery({ field, type, groupByField }),
    variables: { filters },
  })

  const graphQLErrors = response?.data?.errors
  if (Array.isArray(graphQLErrors) && graphQLErrors.length) {
    throw new Error(graphQLErrors.map(item => item?.message).filter(Boolean).join('; '))
  }

  return response?.data?.data?.aggregateLeads ?? {}
}

const runWithConcurrency = async (tasks, concurrency = MAX_CONCURRENT_REQUESTS) => {
  const results = new Array(tasks.length)
  let cursor = 0

  const worker = async () => {
    while (cursor < tasks.length) {
      const index = cursor
      cursor += 1
      try {
        results[index] = { status: 'fulfilled', value: await tasks[index]() }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
  )
  return results
}

export const createLeadFilter = (field, operator, value, valueTo, values) => ({
  field,
  operator,
  ...(value != null ? { value: String(value) } : {}),
  ...(valueTo != null ? { valueTo: String(valueTo) } : {}),
  ...(Array.isArray(values) && values.length ? { values: values.map(String) } : {}),
})

const REPORT_METRICS = [
  { key: 'todayTotal', field: 'lead_id', type: 'COUNT', period: 'today' },
  { key: 'todayStatus', field: 'lead_id', type: 'GROUP_BY', groupByField: 'status', period: 'today' },
  { key: 'todayInterest', field: 'lead_id', type: 'GROUP_BY', groupByField: 'interestLevel', period: 'today' },
  { key: 'todayRevenue', field: 'cf_revenue_d', type: 'SUM', period: 'today' },
  { key: 'todayPipeline', field: 'cf_pipeline_value_d', type: 'SUM', period: 'today' },

  { key: 'currentTotal', field: 'lead_id', type: 'COUNT', period: 'current' },
  { key: 'currentStatus', field: 'lead_id', type: 'GROUP_BY', groupByField: 'status', period: 'current' },
  { key: 'currentRevenue', field: 'cf_revenue_d', type: 'SUM', period: 'current' },
  { key: 'currentAverageDeal', field: 'cf_revenue_d', type: 'AVG', period: 'current' },
  { key: 'sources', field: 'lead_id', type: 'GROUP_BY', groupByField: 'source', period: 'current' },
  { key: 'sales', field: 'lead_id', type: 'GROUP_BY', groupByField: 'saleId', period: 'current' },
  { key: 'lostReasons', field: 'lead_id', type: 'GROUP_BY', groupByField: 'cf_lost_reason_s', period: 'current' },

  { key: 'previousTotal', field: 'lead_id', type: 'COUNT', period: 'previous' },
  { key: 'previousStatus', field: 'lead_id', type: 'GROUP_BY', groupByField: 'status', period: 'previous' },
  { key: 'previousRevenue', field: 'cf_revenue_d', type: 'SUM', period: 'previous' },
  { key: 'previousAverageDeal', field: 'cf_revenue_d', type: 'AVG', period: 'previous' },
]

export const fetchLeadReport = async filtersByPeriod => {
  const settled = await runWithConcurrency(
    REPORT_METRICS.map(metric => () => aggregateLead({
      ...metric,
      filters: filtersByPeriod[metric.period],
    })),
  )

  const data = {}
  const errors = []
  settled.forEach((result, index) => {
    const metric = REPORT_METRICS[index]
    if (result.status === 'fulfilled') {
      data[metric.key] = result.value
      return
    }
    errors.push({
      metric: metric.key,
      message: result.reason?.message || `Không lấy được chỉ số ${metric.key}`,
    })
  })

  if (errors.length === REPORT_METRICS.length) {
    throw new Error(errors[0]?.message || 'Không tải được báo cáo Lead.')
  }

  return { data, errors }
}

const makeAlias = (prefix, index, metric) => `${prefix}_${index}_${metric}`

export const fetchLeadBreakdowns = async ({
  currentFilters,
  sourceGroups,
  saleGroups,
  qualifiedStatusValues,
  wonStatusValues,
}) => {
  const metrics = []
  const addMetric = ({ alias, field, type, filters }) => {
    metrics.push({ alias, field, type, filters })
  }

  sourceGroups.slice(0, 8).forEach((group, index) => {
    const sourceFilters = [
      ...currentFilters,
      createLeadFilter('source', 'EQUALS', group.groupValue),
    ]
    if (qualifiedStatusValues.length) {
      addMetric({
        alias: makeAlias('source', index, 'qualified'),
        field: 'lead_id',
        type: 'COUNT',
        filters: [...sourceFilters, createLeadFilter('status', 'IN', null, null, qualifiedStatusValues)],
      })
    }
    if (wonStatusValues.length) {
      addMetric({
        alias: makeAlias('source', index, 'won'),
        field: 'lead_id',
        type: 'COUNT',
        filters: [...sourceFilters, createLeadFilter('status', 'IN', null, null, wonStatusValues)],
      })
    }
    addMetric({
      alias: makeAlias('source', index, 'revenue'),
      field: 'cf_revenue_d',
      type: 'SUM',
      filters: sourceFilters,
    })
  })

  saleGroups.slice(0, 10).forEach((group, index) => {
    const saleFilters = [
      ...currentFilters,
      createLeadFilter('saleId', 'EQUALS', group.groupValue),
    ]
    if (wonStatusValues.length) {
      addMetric({
        alias: makeAlias('sale', index, 'won'),
        field: 'lead_id',
        type: 'COUNT',
        filters: [...saleFilters, createLeadFilter('status', 'IN', null, null, wonStatusValues)],
      })
    }
    addMetric({
      alias: makeAlias('sale', index, 'revenue'),
      field: 'cf_revenue_d',
      type: 'SUM',
      filters: saleFilters,
    })
  })

  const settled = await runWithConcurrency(
    metrics.map(metric => () => aggregateLead(metric)),
  )
  return settled.reduce((data, result, index) => {
    if (result.status === 'fulfilled') data[metrics[index].alias] = result.value
    return data
  }, {})
}

export const getBreakdownValue = (data, prefix, index, metric) => (
  Number(data?.[makeAlias(prefix, index, metric)]?.value ?? 0)
)
