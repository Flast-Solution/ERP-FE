import React from 'react'
import { Layout, Input, Typography } from 'antd'
import { FlowCanvas, StepPanel, DetailPanel } from '@/containers/WorkflowDesigner'
import {
  useProcess,
  useSetProcess,
} from '@/hooks/useWorkflowStore'
import {
  DesignerLayout,
  LeftSider,
  RightSider,
} from '@/containers/WorkflowDesigner/styles'

const { Content } = Layout
const { Text } = Typography

const WorkflowDesignerPage = () => {
  const process = useProcess()
  const setProcess = useSetProcess()

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
          <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>
            Process name:
          </Text>
          <Input
            value={process.name}
            onChange={(e) => setProcess({ name: e.target.value })}
            onBlur={(e) =>
              setProcess({
                name: e.target.value,
                code: e.target.value
                  .toLowerCase()
                  .replace(/\s+/g, '_')
                  .replace(/[^a-z0-9_]/g, ''),
              })
            }
            size="small"
            style={{ maxWidth: 260, fontWeight: 500 }}
            placeholder="Tên process"
          />
          <Text style={{ fontSize: 11, color: '#bfbfbf', fontFamily: 'monospace' }}>
            [{process.code}]
          </Text>
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