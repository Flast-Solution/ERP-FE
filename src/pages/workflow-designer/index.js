import React, { useEffect } from 'react'
import { Layout, Input, Typography } from 'antd'
import { FlowCanvas, StepPanel, DetailPanel } from '@/containers/WorkflowDesigner'
import { useProcess, useSetProcess } from '@/hooks/useWorkflowStore'
import {
  DesignerLayout,
  LeftSider,
  RightSider,
} from '@/containers/WorkflowDesigner/styles'
import { useCollapseSidebar } from '@flast-erp/core/hooks';

const { Content } = Layout
const { Text } = Typography

const WorkflowDesignerPage = () => {

  const process = useProcess()
  const setProcess = useSetProcess()
  const { toggleCollapse } = useCollapseSidebar();
  
  useEffect(() => {
    toggleCollapse();
    /* eslint-disable-next-line */
  }, []);

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