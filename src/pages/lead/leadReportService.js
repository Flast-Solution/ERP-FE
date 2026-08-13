import axios from 'axios'

const LEAD_AGGREGATE_ENDPOINT = 'erp/lead-report/aggregate'
const LEAD_FACET_ENDPOINT = 'erp/lead-report/search-facet'
const MAX_CONCURRENT_REQUESTS = 6

const ALLOWED_AGGREGATION_TYPES = new Set([
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'GROUP_BY',
])

const createAggregatePayload = ({ field, type, groupByField, filters = [] }) => {
  const safeType = String(type).toUpperCase()
  if (!ALLOWED_AGGREGATION_TYPES.has(safeType)) {
    throw new Error(`Aggregation type không hợp lệ: ${type}`)
  }

  return {
    filters,
    field,
    type: safeType,
    ...(safeType === 'GROUP_BY' ? { groupByField } : {}),
  }
}

const aggregateLead = async ({ field, type, groupByField, filters }) => {
  const response = await axios.post(
    LEAD_AGGREGATE_ENDPOINT,
    createAggregatePayload({ field, type, groupByField, filters }),
  )

  const responseBody = response?.data
  if (responseBody?.success === false) {
    throw new Error(responseBody?.message || 'Không lấy được dữ liệu báo cáo Lead.')
  }

  return responseBody && typeof responseBody === 'object' ? responseBody : {}
}

const fetchLeadFacets = async ({ filters, facetFields }) => {
  const response = await axios.post(LEAD_FACET_ENDPOINT, {
    filters,
    facetFields,
    page: 0,
    limit: 0,
  })
  return response?.data && typeof response.data === 'object' ? response.data : {}
}

const getFacet = (response, field) => {
  const facet = Array.isArray(response?.facets)
    ? response.facets.find(item => item?.field === field)
    : null

  return {
    field,
    type: 'GROUP_BY',
    groups: Array.isArray(facet?.values)
      ? facet.values.map(item => ({
        groupValue: item?.value,
        count: Number(item?.count ?? 0),
      }))
      : [],
  }
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

export const createLeadFilter = (field, operator, value, valueTo, values, fieldType) => ({
  field,
  operator,
  ...(value != null ? { value: String(value) } : {}),
  ...(valueTo != null ? { valueTo: String(valueTo) } : {}),
  ...(Array.isArray(values) && values.length ? { values: values.map(String) } : {}),
  ...(fieldType ? { fieldType } : {}),
})

const REPORT_METRICS = [
  // Block "Hôm nay".
  { key: 'todayTotal', field: 'lead_id', type: 'COUNT', period: 'today' },
  { key: 'todayRevenue', field: 'cf_revenue_d', type: 'SUM', period: 'today' },
  { key: 'todayPipeline', field: 'cf_pipeline_value_d', type: 'SUM', period: 'today' },

  // Block "So với kỳ trước" và funnel của kỳ đang chọn.
  { key: 'currentTotal', field: 'lead_id', type: 'COUNT', period: 'current' },
  { key: 'currentRevenue', field: 'cf_revenue_d', type: 'SUM', period: 'current' },
  { key: 'currentAverageDeal', field: 'cf_revenue_d', type: 'AVG', period: 'current' },

  // Kỳ liền trước có cùng số ngày để tính mức tăng/giảm.
  { key: 'previousTotal', field: 'lead_id', type: 'COUNT', period: 'previous' },
  { key: 'previousRevenue', field: 'cf_revenue_d', type: 'SUM', period: 'previous' },
  { key: 'previousAverageDeal', field: 'cf_revenue_d', type: 'AVG', period: 'previous' },
]

const REPORT_FACETS = [
  {
    period: 'today',
    fields: {
      status: 'todayStatus',
      interestLevel: 'todayInterest',
    },
  },
  {
    period: 'current',
    fields: {
      status: 'currentStatus',
      source: 'sources',
      saleId: 'sales',
      cf_lost_reason_s: 'lostReasons',
    },
  },
  {
    period: 'previous',
    fields: { status: 'previousStatus' },
  },
]

export const fetchLeadReport = async filtersByPeriod => {
  const tasks = [
    ...REPORT_METRICS.map(metric => ({
      kind: 'aggregate',
      metric,
      run: () => aggregateLead({
        ...metric,
        filters: filtersByPeriod[metric.period],
      }),
    })),
    ...REPORT_FACETS.map(facet => ({
      kind: 'facet',
      facet,
      run: () => fetchLeadFacets({
        filters: filtersByPeriod[facet.period],
        facetFields: Object.keys(facet.fields),
      }),
    })),
  ]

  const settled = await runWithConcurrency(
    tasks.map(task => task.run),
  )

  const data = {}
  const errors = []
  settled.forEach((result, index) => {
    const task = tasks[index]
    if (result.status === 'fulfilled') {
      if (task.kind === 'aggregate') {
        data[task.metric.key] = result.value
      } else {
        Object.entries(task.facet.fields).forEach(([field, key]) => {
          data[key] = getFacet(result.value, field)
        })
      }
      return
    }
    const failedKeys = task.kind === 'aggregate'
      ? [task.metric.key]
      : Object.values(task.facet.fields)
    failedKeys.forEach(metric => errors.push({
      metric,
      message: result.reason?.message || `Không lấy được chỉ số ${metric}`,
    }))
  })

  if (!Object.keys(data).length) {
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
  const facetTasks = []
  const addMetric = ({ alias, field, type, filters }) => {
    metrics.push({ alias, field, type, filters })
  }

  sourceGroups.slice(0, 8).forEach((group, index) => {
    const sourceFilters = [
      ...currentFilters,
      createLeadFilter('source', 'EQUALS', group.groupValue),
    ]
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
    addMetric({
      alias: makeAlias('sale', index, 'revenue'),
      field: 'cf_revenue_d',
      type: 'SUM',
      filters: saleFilters,
    })
  })

  if (qualifiedStatusValues.length) {
    facetTasks.push({
      prefix: 'source',
      metric: 'qualified',
      groupField: 'source',
      groups: sourceGroups.slice(0, 8),
      filters: [
        ...currentFilters,
        createLeadFilter('status', 'IN', null, null, qualifiedStatusValues),
      ],
    })
  }
  if (wonStatusValues.length) {
    facetTasks.push(
      {
        prefix: 'source',
        metric: 'won',
        groupField: 'source',
        groups: sourceGroups.slice(0, 8),
        filters: [
          ...currentFilters,
          createLeadFilter('status', 'IN', null, null, wonStatusValues),
        ],
      },
      {
        prefix: 'sale',
        metric: 'won',
        groupField: 'saleId',
        groups: saleGroups.slice(0, 10),
        filters: [
          ...currentFilters,
          createLeadFilter('status', 'IN', null, null, wonStatusValues),
        ],
      },
    )
  }

  const tasks = [
    ...metrics.map(metric => ({
      kind: 'aggregate',
      metric,
      run: () => aggregateLead(metric),
    })),
    ...facetTasks.map(facet => ({
      kind: 'facet',
      facet,
      run: () => fetchLeadFacets({
        filters: facet.filters,
        facetFields: [facet.groupField],
      }),
    })),
  ]
  const settled = await runWithConcurrency(tasks.map(task => task.run))

  return settled.reduce((data, result, index) => {
    if (result.status !== 'fulfilled') return data
    const task = tasks[index]
    if (task.kind === 'aggregate') {
      data[task.metric.alias] = result.value
      return data
    }

    const counts = getFacet(result.value, task.facet.groupField).groups.reduce((map, item) => {
      map[String(item.groupValue)] = item.count
      return map
    }, {})
    task.facet.groups.forEach((group, groupIndex) => {
      data[makeAlias(task.facet.prefix, groupIndex, task.facet.metric)] = {
        value: counts[String(group.groupValue)] ?? 0,
      }
    })
    return data
  }, {})
}

export const getBreakdownValue = (data, prefix, index, metric) => (
  Number(data?.[makeAlias(prefix, index, metric)]?.value ?? 0)
)
