import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, message, Tag } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { RestList } from '@flast-erp/core/components'
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import Filter from './Filter'
import useGetMe from '@/hooks/useGetMe'

const API_PATH = 'workflow/process/filter'
const USER_LIST_API = '/auth/user-bussiness/list-user'

const FLOW_TYPE_LABELS = {
  ORDER: 'Đơn hàng',
  ADMINISTRATION: 'Hành Chính',
  LEAD: 'Lead',
  WAREHOUSE: 'Kho',
}

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getCreatorId = (item = {}) => item.createdBy ?? ''

const getUserDisplayName = (user = {}) => (
  user.fullName
  ?? user.name
  ?? user.ssoId
  ?? user.email
  ?? ''
)

/** GET /auth/user-bussiness/list-user → data = User[] */
const getListUsers = (response = {}) => {
  const users = response?.data
  return Array.isArray(users) ? users : []
}

let cachedUserMap = null
const fetchUserMap = async () => {
  if (cachedUserMap) {
    return cachedUserMap
  }

  try {
    const response = await RequestUtils.Get(USER_LIST_API, {})
    const users = getListUsers(response)
    cachedUserMap = users.reduce((map, user) => {
      const displayName = getUserDisplayName(user)
      if (user?.id != null && displayName) {
        map.set(String(user.id), displayName)
      }
      return map
    }, new Map())
  } catch (_) {
    cachedUserMap = new Map()
  }

  return cachedUserMap
}

/**
 * GET /workflow/process/filter
 * onData nhận sẵn data = { embedded: Process[], totalElements } (hoặc page.totalElements)
 */
const normalizeProcessListResponse = (data = {}) => {
  const embedded = Array.isArray(data?.embedded) ? data.embedded : []
  const total = data?.page?.totalElements ?? data?.totalElements ?? embedded.length
  return { embedded, total }
}

const replaceResponseItems = (_response, embedded, total) => ({
  embedded,
  page: { totalElements: total },
})

const withOffset = (queryParams = {}) => {
  const page = Number(queryParams.page ?? 1)
  const limit = Number(queryParams.limit ?? 10)
  const offset = queryParams.offset ?? ((page - 1) * limit)
  const rest = { ...queryParams }
  delete rest.limit
  delete rest.offset
  delete rest.page

  return {
    limit: String(limit),
    offset: String(offset),
    page: String(page),
    ...rest,
  }
}

const useWorkflowProcessListQuery = ({ queryParams, onData }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({ embedded: [], page: {} })
  const nextQueryParams = useMemo(() => withOffset(queryParams), [queryParams])

  useEffect(() => {
    let mounted = true
    const { apiPath, ...params } = nextQueryParams

    if (!apiPath) {
      return undefined
    }

    setLoading(true)
    RequestUtils.Get(`/${apiPath}`, params)
      .then(async (response) => {
        const ok = response?.success || response?.errorCode === SUCCESS_CODE || response?.errorCode == null
        if (!ok) {
          message.error(response?.message || 'Không tải được danh sách workflow.')
          return
        }
        const nextData = await onData(response?.data ?? response)
        if (mounted) {
          setData(nextData)
        }
      })
      .catch((error) => {
        if (mounted) {
          message.error(error?.message || 'Không tải được danh sách workflow.')
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [nextQueryParams, onData])

  return { data, loading }
}

export const normalizeWorkflowRow = (item = {}, index, userMap = new Map()) => {
  const creatorId = getCreatorId(item)
  const mappedCreatorName = creatorId !== '' && creatorId != null
    ? userMap.get(String(creatorId))
    : ''

  return {
    id: item.id ?? index,
    processKey: item.processKey ?? '',
    name: item.name ?? 'Chưa đặt tên',
    code: item.code ?? '',
    description: item.description ?? '',
    stepCount: item.stepSize ?? 0,
    transitionCount: 0,
    createdBy: mappedCreatorName || (creatorId !== '' ? String(creatorId) : ''),
    createdAt: formatDate(item.createdDate ?? ''),
    status: item.enabled === false || Number(item.status) === 0 ? 0 : 1,
    flowType: item.flowType ?? '',
    updatedAt: item.updatedDate ?? '',
    source: item,
  }
}

/** GET /workflow/process/find-id/{id} → data = { process, steps, transitions } */
export const ensureWorkflowPayload = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  if (raw.process || Array.isArray(raw.steps) || Array.isArray(raw.transitions)) {
    return raw
  }
  const data = raw.data
  if (data && (data.process || Array.isArray(data.steps) || Array.isArray(data.transitions))) {
    return data
  }
  return null
}

export const fetchWorkflowDetail = async (record) => {
  if (record?.source?.process && Array.isArray(record?.source?.steps)) {
    return record.source
  }

  const response = await RequestUtils.Get(`/workflow/process/find-id/${record.id}`, {})
  const payload = ensureWorkflowPayload(response)
  if (payload?.process) {
    return payload
  }

  throw new Error('Không tải được dữ liệu workflow.')
}

const WorkflowDesignerList = ({ onCreate, onEdit }) => {
  const { hasPermission } = useGetMe()
  const canCreate = hasPermission('workflow.process.create')
  const canUpdate = hasPermission('workflow.process.update')
  const [editingId, setEditingId] = useState(null)

  const handleEdit = useCallback(async (record) => {
    setEditingId(record.id)
    try {
      const detail = await fetchWorkflowDetail(record)
      onEdit(detail)
    } catch (error) {
      message.error(error?.message || 'Không tải được workflow để chỉnh sửa.')
    } finally {
      setEditingId(null)
    }
  }, [onEdit])

  const columns = useMemo(() => [
    {
      title: 'Tên nghiệp vụ',
      dataIndex: 'name',
      width: 240,
      ellipsis: true,
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 180,
      ellipsis: true,
      render: value => value ? <Tag>{value}</Tag> : null,
    },
    {
      title: 'Process key',
      dataIndex: 'processKey',
      width: 240,
      ellipsis: true,
      render: value => value ? <Tag color="blue">{value}</Tag> : null,
    },
    {
      title: 'Số bước',
      dataIndex: 'stepCount',
      width: 100,
      align: 'center',
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdBy',
      width: 160,
      ellipsis: true,
    },
    {
      title: 'Thời gian tạo',
      dataIndex: 'createdAt',
      width: 170,
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      render: value => Number(value) === 1
        ? <Tag color="green">Kích hoạt</Tag>
        : <Tag color="default">Tạm ngưng</Tag>,
    },
    {
      title: 'Loại nghiệp vụ',
      dataIndex: 'flowType',
      width: 150,
      render: value => value ? (FLOW_TYPE_LABELS[value] ?? value) : '',
    },
    canUpdate && {
      title: 'Action',
      key: 'actions',
      fixed: 'right',
      width: 130,
      align: 'center',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          loading={editingId === record.id}
          onClick={() => handleEdit(record)}
        >
          Chỉnh sửa
        </Button>
      ),
    },
  ].filter(Boolean), [canUpdate, editingId, handleEdit])

  const onData = useCallback(async (response) => {
    const userMap = await fetchUserMap()
    const { embedded, total } = normalizeProcessListResponse(response)
    const rows = embedded.map((item, index) => normalizeWorkflowRow(item, index, userMap))
    return replaceResponseItems(response, rows, total)
  }, [])

  const beforeSubmitFilter = useCallback((values = {}) => {
    const nextValues = { ...values }
    if (nextValues.page && nextValues.limit && nextValues.offset == null) {
      nextValues.offset = String((Number(nextValues.page) - 1) * Number(nextValues.limit))
    } else if (nextValues.offset != null) {
      nextValues.offset = String(nextValues.offset)
    }
    return nextValues
  }, [])

  return (
    <RestList
      rowKey="id"
      bordered
      xScroll={1320}
      initialFilter={{ limit: 10, offset: '0', page: 1 }}
      filter={<Filter />}
      hasCreate={canCreate}
      customClickCreate={onCreate}
      beforeSubmitFilter={beforeSubmitFilter}
      onData={onData}
      useGetAllQuery={useWorkflowProcessListQuery}
      apiPath={API_PATH}
      columns={columns}
    />
  )
}

export default WorkflowDesignerList
