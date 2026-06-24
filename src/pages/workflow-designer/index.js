import React, { useCallback, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Breadcrumb, Layout, Input, Typography, Button, Modal, message, Space } from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { FlowCanvas, StepPanel, DetailPanel } from '@/containers/WorkflowDesigner'
import WorkflowDesignerList, { ensureWorkflowPayload } from '@/containers/WorkflowDesigner/List'
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
import { flowToJson, jsonToFlow } from '@/utils/workflowSerializer'
import { normalizeWorkflowStepType, validateFlow } from '@/utils/workflowValidators'
import { createUuidV7 } from '@/utils/uuid'

const { Content } = Layout
const { Text } = Typography
const PROCESS_TYPE_FIND_API = '/workflow/process/process-type-find'

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

const WorkflowDesignerEditor = ({ onBack }) => {
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
    const { payload } = buildSavePayload()
    console.log('[WorkflowDesigner] save body before validation', payload)
    console.log('[WorkflowDesigner] body step type check', {
      steps: payload.steps.map((step) => ({
        id: step.id,
        code: step.stepCode,
        label: step.label,
        type: step.type,
      })),
      startSteps: payload.steps.filter((step) => String(step.type).toLowerCase() === 'start'),
      endSteps: payload.steps.filter((step) => String(step.type).toLowerCase() === 'end'),
    })
    console.log('[WorkflowDesigner] nodes before validation', {
      nodes: nodes.map((node) => ({
        id: node.id,
        persistedId: node.data?.persistedId,
        code: node.data?.code,
        stepCode: node.data?.stepCode,
        label: node.data?.label,
        name: node.data?.name,
        type: node.data?.type,
        normalizedType: normalizeWorkflowStepType(node.data?.type, stepTypes, node),
        dataKeys: Object.keys(node.data ?? {}),
      })),
      stepTypes: stepTypes.map((stepType) => ({
        id: stepType.id,
        key: stepType.key,
        label: stepType.label,
        normalizedType: normalizeWorkflowStepType(stepType.key ?? stepType.id, stepTypes),
      })),
      startNodes: nodes.filter((node) => normalizeWorkflowStepType(node.data?.type, stepTypes, node) === 'start'),
      endNodes: nodes.filter((node) => normalizeWorkflowStepType(node.data?.type, stepTypes, node) === 'end'),
    })

    const { valid, errors, warnings } = validateFlow(nodes, edges, stepTypes)
    console.log('[WorkflowDesigner] validation result', { valid, errors, warnings })

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
  }, [buildSavePayload, nodes, edges, stepTypes, submitFlow])

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

      <RightSider width={416} theme="light">
        <DetailPanel />
      </RightSider>
    </DesignerLayout>
  )
}

const WorkflowDesignerPage = () => {
  const resetFlow = useResetFlow()
  const loadFlow = useLoadFlow()
  const setStepTypes = useSetStepTypes()
  const [searchParams, setSearchParams] = useSearchParams()
  const [listVersion, setListVersion] = useState(0)
  const view = searchParams.get('mode') === 'designer' ? 'designer' : 'list'

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
