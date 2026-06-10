import React, { useCallback, useEffect, useState } from 'react'
import { Layout, Input, Typography, Button, Modal, message } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { FlowCanvas, StepPanel, DetailPanel } from '@/containers/WorkflowDesigner'
import { useEdges, useNodes, useProcess, useSetProcess } from '@/hooks/useWorkflowStore'
import {
  DesignerLayout,
  LeftSider,
  RightSider,
} from '@/containers/WorkflowDesigner/styles'
import { useCollapseSidebar } from '@flast-erp/core/hooks';
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import { flowToJson } from '@/utils/workflowSerializer'
import { validateFlow } from '@/utils/workflowValidators'
import { createUuidV7 } from '@/utils/uuid'

const { Content } = Layout
const { Text } = Typography

const WorkflowDesignerPage = () => {

  const process = useProcess()
  const nodes = useNodes()
  const edges = useEdges()
  const setProcess = useSetProcess()
  const { toggleCollapse } = useCollapseSidebar();
  const [submitting, setSubmitting] = useState(false)
  
  useEffect(() => {
    toggleCollapse();
    /* eslint-disable-next-line */
  }, []);

  const submitFlow = useCallback(async () => {
    setSubmitting(true)
    try {
      const isNewProcess = !process.id && !process.processKey
      const processForSave = isNewProcess
        ? { ...process, processKey: createUuidV7() }
        : process
      const payload = flowToJson({ nodes, edges, process: processForSave })
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
  }, [nodes, edges, process, setProcess])

  const handleSubmitFlow = useCallback(() => {
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
  }, [nodes, edges, submitFlow])

  return (
    <DesignerLayout>

      {/* ── Sidebar trái: palette + step list ── */}
      <LeftSider width={240} theme="light">
        <StepPanel />
      </LeftSider>

      {/* ── Canvas chính ── */}
      <Content style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Process name bar */}
        <div
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}
        >
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
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitting}
            onClick={handleSubmitFlow}
            style={{ marginLeft: 'auto' }}
          >
            Lưu flow
          </Button>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <FlowCanvas />
        </div>
      </Content>

      {/* ── Sidebar phải: detail form ── */}
      <RightSider width={340} theme="light">
        <DetailPanel />
      </RightSider>

    </DesignerLayout>
  )
}

export default WorkflowDesignerPage
