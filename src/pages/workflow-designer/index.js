import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Layout, Input, Typography, Button, Modal, message, Table, Space, Tag } from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { FlowCanvas, StepPanel, DetailPanel } from '@/containers/WorkflowDesigner'
import {
  useEdges,
  useLoadFlow,
  useNodes,
  useProcess,
  useResetFlow,
  useSetStepTypes,
  useSetProcess,
} from '@/hooks/useWorkflowStore'
import {
  DesignerLayout,
  LeftSider,
  RightSider,
} from '@/containers/WorkflowDesigner/styles'
import { useCollapseSidebar } from '@flast-erp/core/hooks'
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import { flowToJson, jsonToFlow } from '@/utils/workflowSerializer'
import { validateFlow } from '@/utils/workflowValidators'
import { createUuidV7 } from '@/utils/uuid'

const { Content } = Layout
const { Title, Text } = Typography
const PAGE_SIZE = 10
const LIST_API = '/workflow/process/filter'
const PROCESS_TYPE_FIND_API = '/workflow/process/process-type-find'

const ListPage = styled.div`
  height: calc(100vh - 170px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
  background: #f5f5f5;
`

const ListHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 0;
  flex-shrink: 0;
`

const ListTitle = styled(Title)`
  && {
    margin: 0;
    font-size: 22px;
  }
`

const ListSubtitle = styled(Text)`
  display: block;
  margin-top: 4px;
  color: #71717a;
`

const ListToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  flex-shrink: 0;
`

const ListSearch = styled(Input)`
  max-width: 360px;
`

const TableWrap = styled.div`
  flex: 1;
  min-height: 0;
  padding: 0 20px 20px;

  .ant-table-wrapper,
  .ant-spin-nested-loading,
  .ant-spin-container {
    height: 100%;
  }
`

const DesignerTopBar = styled.div`
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
`

const hexToAlpha = (hex, alpha) => {
  if (!hex || !hex.startsWith('#')) return hex || '#1677ff'
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const getResponseDataArray = (response) => {
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

const normalizeProcessType = (item, index) => {
  const color = item?.colorCode ?? item?.color_code ?? item?.color ?? '#1677ff'
  const id = item?.id ?? item?.key ?? `process_type_${index + 1}`
  const key = item?.code ?? item?.processTypeCode ?? item?.process_type_code ?? item?.type ?? item?.key ?? id
  return {
    id,
    key: String(key).toLowerCase(),
    label: item?.name ?? item?.label ?? `Loại bước ${index + 1}`,
    color,
    bgColor: hexToAlpha(color, 0.12),
    borderColor: hexToAlpha(color, 0.4),
    order: item?.orderProcessType ?? item?.order_process_type ?? item?.order ?? index + 1,
    status: item?.status ?? 1,
  }
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

const getResponseTotal = (response, fallback) => {
  const data = response?.data ?? response
  return data?.total
    ?? data?.totalElements
    ?? data?.total_count
    ?? data?.count
    ?? response?.total
    ?? fallback
}

const normalizeWorkflowRow = (item, index) => {
  const process = item?.process ?? item
  return {
    id: process?.id ?? item?.id ?? item?.processId ?? item?.process_id ?? item?.processKey ?? item?.process_key ?? index,
    processKey: process?.processKey ?? process?.process_key ?? item?.processKey ?? item?.process_key ?? '',
    name: process?.name ?? item?.name ?? item?.processName ?? 'Chưa đặt tên',
    code: process?.code ?? item?.code ?? '',
    description: process?.description ?? item?.description ?? '',
    stepCount: item?.stepCount ?? item?.steps_count ?? item?.steps?.length ?? 0,
    transitionCount: item?.transitionCount ?? item?.transitions_count ?? item?.transitions?.length ?? 0,
    updatedAt: item?.updatedAt ?? item?.updated_at ?? item?.modifiedAt ?? item?.modified_at ?? '',
    source: item,
  }
}

const ensureWorkflowPayload = (raw) => {
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

const fetchWorkflowDetail = async (record) => {
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
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [searchText, setSearchText] = useState('')

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const filter = {
        offset: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      }
      if (searchText) {
        filter.name = searchText
      }

      const query = new URLSearchParams()
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.set(key, String(value))
        }
      })

      const response = await RequestUtils.Get(`${LIST_API}?${query.toString()}`, {})
      const items = getResponseItems(response)
      const nextRows = items.map(normalizeWorkflowRow)
      setRows(nextRows)
      setTotal(getResponseTotal(response, nextRows.length))
    } catch (error) {
      message.error('Không tải được danh sách nghiệp vụ.')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, searchText])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

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
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 180,
      render: value => value ? <Tag>{value}</Tag> : null,
    },
    {
      title: 'Process key',
      dataIndex: 'processKey',
      width: 240,
      render: value => value ? <Tag color="blue">{value}</Tag> : null,
    },
    {
      title: 'Số bước',
      dataIndex: 'stepCount',
      width: 90,
      align: 'center',
    },
    {
      title: 'Chuyển trạng thái',
      dataIndex: 'transitionCount',
      width: 140,
      align: 'center',
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 170,
    },
    {
      title: '',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Button
          icon={<EditOutlined />}
          loading={editingId === record.id}
          onClick={() => handleEdit(record)}
        >
          Chỉnh sửa
        </Button>
      ),
    },
  ], [editingId, handleEdit])

  return (
    <ListPage>
      <ListHeader>
        <div>
          <ListTitle level={2}>Workflow nghiệp vụ</ListTitle>
          <ListSubtitle>Danh sách các luồng xử lý nghiệp vụ đã tạo.</ListSubtitle>
        </div>

        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Thêm mới
        </Button>
      </ListHeader>

      <ListToolbar>
        <ListSearch
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          onPressEnter={() => {
            setSearchText(keyword.trim())
            setPage(1)
          }}
          prefix={<SearchOutlined />}
          placeholder="Tìm theo tên nghiệp vụ..."
          allowClear
          onClear={() => {
            setKeyword('')
            setSearchText('')
            setPage(1)
          }}
        />
        <Button icon={<ReloadOutlined />} onClick={fetchRows}>
          Tải lại
        </Button>
      </ListToolbar>

      <TableWrap>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            showSizeChanger: false,
            onChange: setPage,
          }}
          scroll={{ x: 1180, y: 'calc(100vh - 360px)' }}
        />
      </TableWrap>
    </ListPage>
  )
}

const WorkflowDesignerEditor = ({ onBack }) => {
  const process = useProcess()
  const nodes = useNodes()
  const edges = useEdges()
  const setProcess = useSetProcess()
  const [submitting, setSubmitting] = useState(false)

  const buildSavePayload = useCallback(() => {
    const isNewProcess = !process.id && !process.processKey
    const processForSave = isNewProcess
      ? { ...process, processKey: createUuidV7() }
      : process

    return {
      isNewProcess,
      processForSave,
      payload: flowToJson({ nodes, edges, process: processForSave }),
    }
  }, [nodes, edges, process])

  const submitFlow = useCallback(async () => {
    setSubmitting(true)
    try {
      const { isNewProcess, processForSave, payload } = buildSavePayload()
      const response = await RequestUtils.Post('/workflow/process/create', payload)
      const isSuccess = response?.success || response?.errorCode === SUCCESS_CODE

      if (!isSuccess) {
        message.error(response?.message || 'Không thể lưu flow')
        return
      }

      if (isNewProcess) {
        setProcess({ processKey: processForSave.processKey })
      }

      message.success(response?.message || 'Đã lưu flow lên server')
    } catch (error) {
      message.error('Không thể lưu flow')
    } finally {
      setSubmitting(false)
    }
  }, [buildSavePayload, setProcess])

  const handleSubmitFlow = useCallback(() => {
    const { payload } = buildSavePayload()
    console.log('[WorkflowDesigner] save body before validation', payload)
    console.log('[WorkflowDesigner] body step type check', {
      steps: payload.steps.map((step) => ({
        id: step.id,
        code: step.code,
        label: step.label,
        type: step.type,
      })),
      startSteps: payload.steps.filter((step) => step.type === 'start'),
      endSteps: payload.steps.filter((step) => step.type === 'end'),
    })

    const { valid, errors, warnings } = validateFlow(nodes, edges)

    if (!valid) {
      errors.forEach((error) => message.warning(error))
      return
    }

    if (warnings.length > 0) {
      Modal.confirm({
        title: 'Flow có cảnh báo',
        content: (
          <div>
            {warnings.map((warning) => (
              <div key={warning} style={{ marginBottom: 6 }}>{warning}</div>
            ))}
          </div>
        ),
        okText: 'Vẫn lưu',
        cancelText: 'Kiểm tra lại',
        onOk: submitFlow,
      })
      return
    }

    submitFlow()
  }, [buildSavePayload, nodes, edges, submitFlow])

  return (
    <DesignerLayout>
      <LeftSider width={240} theme="light">
        <StepPanel />
      </LeftSider>

      <Content style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DesignerTopBar>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            Quay lại danh sách
          </Button>
          <Input
            value={process.name}
            onChange={(e) => setProcess({ name: e.target.value })}
            onBlur={(e) =>
              setProcess({
                name: e.target.value,
                code: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
              })
            }
            style={{ maxWidth: 260, fontWeight: 500 }}
            placeholder="Tạo luồng xử lý nghiệp vụ"
          />
          <Text style={{ fontSize: 11, color: '#bfbfbf', fontFamily: 'monospace' }}>
            [{process.code}]
          </Text>
          <Space style={{ marginLeft: 'auto' }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={submitting}
              onClick={handleSubmitFlow}
            >
              Lưu flow
            </Button>
          </Space>
        </DesignerTopBar>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <FlowCanvas />
        </div>
      </Content>

      <RightSider width={340} theme="light">
        <DetailPanel />
      </RightSider>
    </DesignerLayout>
  )
}

const WorkflowDesignerPage = () => {
  const { toggleCollapse } = useCollapseSidebar()
  const resetFlow = useResetFlow()
  const loadFlow = useLoadFlow()
  const setStepTypes = useSetStepTypes()
  const [searchParams, setSearchParams] = useSearchParams()
  const [listVersion, setListVersion] = useState(0)
  const view = searchParams.get('mode') === 'designer' ? 'designer' : 'list'

  useEffect(() => {
    toggleCollapse()
    /* eslint-disable-next-line */
  }, [])

  const fetchProcessTypes = useCallback(async () => {
    try {
      const response = await RequestUtils.Get(PROCESS_TYPE_FIND_API, {})
      const processTypes = getResponseDataArray(response)
        .map(normalizeProcessType)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

      setStepTypes(processTypes)
    } catch (error) {
      setStepTypes([])
      message.warning('Không tải được cấu hình loại bước.')
    }
  }, [setStepTypes])

  useEffect(() => {
    if (view === 'designer') {
      fetchProcessTypes()
    }
  }, [fetchProcessTypes, view])

  const handleCreate = useCallback(() => {
    resetFlow()
    setSearchParams({ mode: 'designer', action: 'create' })
  }, [resetFlow, setSearchParams])

  const handleEdit = useCallback((detail) => {
    try {
      loadFlow(jsonToFlow(ensureWorkflowPayload(detail)))
      setSearchParams({ mode: 'designer', action: 'edit' })
    } catch (error) {
      message.error(error?.message || 'Dữ liệu workflow không hợp lệ.')
    }
  }, [loadFlow, setSearchParams])

  const handleBack = useCallback(() => {
    setListVersion(version => version + 1)
    setSearchParams({})
  }, [setSearchParams])

  if (view === 'designer') {
    return <WorkflowDesignerEditor onBack={handleBack} />
  }

  return (
    <WorkflowDesignerList
      key={listVersion}
      onCreate={handleCreate}
      onEdit={handleEdit}
    />
  )
}

export default WorkflowDesignerPage
