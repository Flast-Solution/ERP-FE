import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Breadcrumb, Layout, Input, Button, Modal, message, Select, Space, Spin } from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { FlowCanvas, StepPanel, DetailPanel } from '@/containers/WorkflowDesigner'
import WorkflowDesignerList, {
  ensureWorkflowPayload,
  fetchWorkflowDetail,
} from '@/containers/WorkflowDesigner/List'
import {
  useEdges,
  useLoadFlow,
  useNodes,
  useProcess,
  useResetFlow,
  useStepTypes,
  useSetStepTypes,
  useSetProcess,
} from '@/hooks/useWorkflowStore'
import {
  DesignerLayout,
  LeftSider,
  RightSider,
} from '@/containers/WorkflowDesigner/styles'
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import { enrichWorkflowForms, flowToJson, jsonToFlow } from '@/utils/workflowSerializer'
import { normalizeWorkflowStepType, validateFlow } from '@/utils/workflowValidators'
import { createUuidV7 } from '@/utils/uuid'

const { Content } = Layout
const PROCESS_TYPE_FIND_API = '/workflow/process/process-type-find'
const BUSINESS_TYPE_OPTIONS = [
  { label: 'Đơn hàng', value: 'ORDER' },
  { label: 'Hành Chính', value: 'ADMINISTRATION' },
  { label: 'Lead', value: 'LEAD' },
  { label: 'Kho', value: 'WAREHOUSE' },
]

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
  const rawKey = item?.code ?? item?.processTypeCode ?? item?.process_type_code ?? item?.type ?? item?.key ?? id
  const label = item?.name ?? item?.label ?? `Loại bước ${index + 1}`
  const semanticType = normalizeWorkflowStepType(rawKey, [], {
    data: {
      label,
      name: label,
      typeLabel: label,
    },
  })
  const canonicalTypes = ['start', 'end', 'approval', 'revision', 'condition', 'process']
  const uniqueKey = String(rawKey).trim() || String(id)
  return {
    id,
    key: uniqueKey,
    semanticType: canonicalTypes.includes(semanticType) ? semanticType : 'process',
    rawKey: String(rawKey),
    label,
    color,
    bgColor: hexToAlpha(color, 0.12),
    borderColor: hexToAlpha(color, 0.4),
    order: item?.orderProcessType ?? item?.order_process_type ?? item?.order ?? index + 1,
    status: item?.status ?? 1,
  }
}

const WorkflowDesignerEditor = ({ onBack, onReloadStepTypes }) => {
  const process = useProcess()
  const nodes = useNodes()
  const edges = useEdges()
  const stepTypes = useStepTypes()
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
      payload: flowToJson({ nodes, edges, process: processForSave, stepTypes }),
    }
  }, [nodes, edges, process, stepTypes])

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
    const { valid, errors, warnings } = validateFlow(nodes, edges, stepTypes)

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
  }, [nodes, edges, stepTypes, submitFlow])

  return (
    <DesignerLayout>
      <LeftSider width={240} theme="light">
        <StepPanel onReloadStepTypes={onReloadStepTypes} />
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
          <Select
            allowClear
            value={process.flowType ?? undefined}
            options={BUSINESS_TYPE_OPTIONS}
            onChange={(value) => setProcess({ flowType: value })}
            placeholder="Loại nghiệp vụ"
            style={{ width: 180 }}
          />
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

      <RightSider width={416} theme="light">
        <DetailPanel />
      </RightSider>
    </DesignerLayout>
  )
}

const getWorkflowIdFromPayload = (detail) => {
  const payload = ensureWorkflowPayload(detail)
  return payload?.process?.id ?? detail?.id ?? null
}

const WorkflowDesignerPage = () => {
  const resetFlow = useResetFlow()
  const loadFlow = useLoadFlow()
  const setStepTypes = useSetStepTypes()
  const [searchParams, setSearchParams] = useSearchParams()
  const [listVersion, setListVersion] = useState(0)
  const [loadingWorkflow, setLoadingWorkflow] = useState(false)
  const hydratedWorkflowIdRef = useRef(null)
  const hydrateRequestRef = useRef(0)
  const view = searchParams.get('mode') === 'designer' ? 'designer' : 'list'
  const action = searchParams.get('action')
  const workflowId = searchParams.get('id')

  const fetchProcessTypes = useCallback(async () => {
    try {
      const response = await RequestUtils.Get(PROCESS_TYPE_FIND_API, {})
      const seen = new Set()
      const processTypes = getResponseDataArray(response)
        .map(normalizeProcessType)
        .filter((item) => {
          const dedupeKey = String(item.id ?? item.key)
          if (seen.has(dedupeKey)) return false
          seen.add(dedupeKey)
          return true
        })
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

  const loadWorkflowDetail = useCallback(async (detail) => {
    const flow = jsonToFlow(ensureWorkflowPayload(detail))
    const enrichedFlow = await enrichWorkflowForms(flow)
    loadFlow(enrichedFlow)
    return enrichedFlow
  }, [loadFlow])

  useEffect(() => {
    if (view !== 'designer' || action !== 'edit' || !workflowId) {
      hydratedWorkflowIdRef.current = null
      return undefined
    }

    if (hydratedWorkflowIdRef.current === workflowId) {
      return undefined
    }

    let mounted = true
    const requestId = ++hydrateRequestRef.current

    const hydrateFromUrl = async () => {
      setLoadingWorkflow(true)
      try {
        const detail = await fetchWorkflowDetail({ id: workflowId })
        if (!mounted || requestId !== hydrateRequestRef.current) return
        await loadWorkflowDetail(detail)
        if (!mounted || requestId !== hydrateRequestRef.current) return
        hydratedWorkflowIdRef.current = workflowId
      } catch (error) {
        if (mounted && requestId === hydrateRequestRef.current) {
          message.error(error?.message || 'Không tải được workflow để chỉnh sửa.')
          setSearchParams({})
        }
      } finally {
        if (mounted && requestId === hydrateRequestRef.current) {
          setLoadingWorkflow(false)
        }
      }
    }

    hydrateFromUrl()

    return () => {
      mounted = false
    }
  }, [view, action, workflowId, loadWorkflowDetail, setSearchParams])

  const handleCreate = useCallback(() => {
    hydratedWorkflowIdRef.current = null
    resetFlow()
    setSearchParams({ mode: 'designer', action: 'create' })
  }, [resetFlow, setSearchParams])

  const handleEdit = useCallback(async (detail) => {
    try {
      await loadWorkflowDetail(detail)
      const id = getWorkflowIdFromPayload(detail)
      if (id != null && id !== '') {
        hydratedWorkflowIdRef.current = String(id)
      }
      setSearchParams({
        mode: 'designer',
        action: 'edit',
        ...(id != null && id !== '' ? { id: String(id) } : {}),
      })
    } catch (error) {
      message.error(error?.message || 'Dữ liệu workflow không hợp lệ.')
    }
  }, [loadWorkflowDetail, setSearchParams])

  const handleBack = useCallback(() => {
    hydratedWorkflowIdRef.current = null
    setListVersion(version => version + 1)
    setSearchParams({})
  }, [setSearchParams])

  if (view === 'designer') {
    if (loadingWorkflow) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
          <Spin size="large" tip="Đang tải workflow..." />
        </div>
      )
    }

    return <WorkflowDesignerEditor onBack={handleBack} onReloadStepTypes={fetchProcessTypes} />
  }

  return (
    <>
      <Helmet>
        <title>Workflow nghiệp vụ</title>
      </Helmet>
      <Breadcrumb
        style={{ marginBottom: 20, fontWeight: 600 }}
        separator=">"
        items={[{ title: 'Trang chủ' }, { title: 'Workflow nghiệp vụ' }]}
      />
      <WorkflowDesignerList
        key={listVersion}
        onCreate={handleCreate}
        onEdit={handleEdit}
      />
    </>
  )
}

export default WorkflowDesignerPage
