import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, message, Tag } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { RestList } from '@flast-erp/core/components'
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import Filter from './Filter'

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

const getCreatorName = (item = {}, process = {}) => {
  const creator = process.createdByUser
    ?? process.created_by_user
    ?? process.creator
    ?? item.createdByUser
    ?? item.created_by_user
    ?? item.creator

  if (creator && typeof creator === 'object') {
    return creator.fullName
      ?? creator.full_name
      ?? creator.name
      ?? creator.username
      ?? creator.email
      ?? ''
  }

  return process.createdName
    ?? process.created_name
    ?? process.createdByName
    ?? process.created_by_name
    ?? process.createdBy
    ?? process.created_by
    ?? item.createdName
    ?? item.created_name
    ?? item.createdByName
    ?? item.created_by_name
    ?? item.createdBy
    ?? item.created_by
    ?? ''
}

const getCreatorId = (item = {}, process = {}) => (
  process.createdById
  ?? process.created_by_id
  ?? process.createdBy
  ?? process.created_by
  ?? item.createdById
  ?? item.created_by_id
  ?? item.createdBy
  ?? item.created_by
  ?? ''
)

const getUserDisplayName = (user = {}) => (
  user.fullName
  ?? user.full_name
  ?? user.name
  ?? user.username
  ?? user.email
  ?? user.phone
  ?? ''
)

const getUserIds = (user = {}) => [
  user.id,
  user.userId,
  user.user_id,
  user.accountId,
  user.account_id,
  user.employeeId,
  user.employee_id,
].filter(value => value != null && value !== '').map(value => String(value))

let cachedUserMap = null
const fetchUserMap = async () => {
  if (cachedUserMap) {
    return cachedUserMap
  }

  try {
    const response = await RequestUtils.Get(USER_LIST_API, {})
    const users = getResponseItems(response)
    cachedUserMap = users.reduce((map, user) => {
      const displayName = getUserDisplayName(user)
      getUserIds(user).forEach((id) => {
        if (displayName) {
          map.set(id, displayName)
        }
      })
      return map
    }, new Map())
  } catch (_) {
    cachedUserMap = new Map()
  }

  return cachedUserMap
}

const getResponseItems = (response) => {
  const data = response?.data ?? response
  const candidates = [
    data?.items,
    data?.rows,
    data?.content,
    data?.records,
    data?.data,
    data?.embedded,
    data,
  ]

  return candidates.find(Array.isArray) ?? []
}

const replaceResponseItems = (response, embedded) => {
  if (Array.isArray(response?.embedded)) {
    return { ...response, embedded }
  }
  if (Array.isArray(response?.data?.embedded)) {
    return {
      ...response,
      data: {
        ...response.data,
        embedded,
      },
    }
  }
  return {
    embedded,
    page: response?.page ?? response?.data?.page,
  }
}

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

export const normalizeWorkflowRow = (item, index, userMap = new Map()) => {
  const process = item?.process ?? item
  const creatorId = getCreatorId(item, process)
  const mappedCreatorName = creatorId != null && creatorId !== ''
    ? userMap.get(String(creatorId))
    : ''

  return {
    id: process?.id ?? item?.id ?? item?.processId ?? item?.process_id ?? item?.processKey ?? item?.process_key ?? index,
    processKey: process?.processKey ?? process?.process_key ?? item?.processKey ?? item?.process_key ?? '',
    name: process?.name ?? item?.name ?? item?.processName ?? 'Chưa đặt tên',
    code: process?.code ?? item?.code ?? '',
    description: process?.description ?? item?.description ?? '',
    stepCount: process?.stepSize ?? item?.stepSize ?? item?.step_size ?? item?.stepCount ?? item?.steps_count ?? item?.steps?.length ?? 0,
    transitionCount: item?.transitionCount ?? item?.transitions_count ?? item?.transitions?.length ?? 0,
    createdBy: mappedCreatorName || getCreatorName(item, process),
    createdAt: formatDate(process?.createdDate ?? process?.created_date ?? item?.createdDate ?? item?.created_date ?? ''),
    status: Number(process?.status ?? item?.status ?? 1) === 1 ? 1 : 0,
    flowType: process?.flowType ?? item?.flowType ?? '',
    updatedAt: item?.updatedAt ?? item?.updated_at ?? item?.modifiedAt ?? item?.modified_at ?? '',
    source: item,
  }
}

export const ensureWorkflowPayload = (raw) => {
  const payload = raw?.data ?? raw
  if (payload?.process || payload?.steps || payload?.transitions) {
    return payload
  }
  if (payload?.item) {
    return payload.item
  }
  if (payload?.record) {
    return payload.record
  }
  return raw
}

export const fetchWorkflowDetail = async (record) => {
  if (record?.source?.process || record?.source?.steps || record?.source?.transitions) {
    return record.source
  }

  const response = await RequestUtils.Get(`/workflow/process/find-id/${record.id}`, {})
  const payload = ensureWorkflowPayload(response)
  if (payload?.process || payload?.steps || payload?.transitions) {
    return payload
  }

  throw new Error('Không tải được dữ liệu workflow.')
}

const WorkflowDesignerList = ({ onCreate, onEdit }) => {
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
      width: 90,
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
    {
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
  ], [editingId, handleEdit])

  const onData = useCallback(async (response) => {
    const userMap = await fetchUserMap()
    const embedded = getResponseItems(response).map((item, index) => normalizeWorkflowRow(item, index, userMap))
    return replaceResponseItems(response, embedded)
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
      hasCreate
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
