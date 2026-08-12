import React, { useMemo } from 'react'
import { Button, Empty, Tabs, Tag, Typography } from 'antd'
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  InboxOutlined,
} from '@ant-design/icons'

const { Text } = Typography

const getWorkflowName = (instance, index) => (
  instance?.process?.name ?? `Workflow ${index + 1}`
)

const WorkflowContextSection = ({
  order,
  selectedLot,
  workflowInstances,
  selectedInstanceId,
  loading,
  onSelectOrder,
  onSelectWorkflow,
}) => {
  const tabItems = useMemo(() => (
    workflowInstances.map((instance, index) => {
      const instanceId = instance.id
      return {
        key: String(instanceId),
        label: getWorkflowName(instance, index),
      }
    })
  ), [workflowInstances])

  return (
    <div className="workflow-progress-section workflow-context-section">
      <div className="workflow-context-head">
        <div>
          <div className="workflow-progress-section-title">
            <ApartmentOutlined className="workflow-progress-section-icon" />
            <span>Workflow đang xem</span>
          </div>
          <div className="workflow-context-scope">
            {selectedLot ? (
              <>
                <Tag color="purple" icon={<InboxOutlined />}>Lô hàng</Tag>
                <Text strong>{selectedLot?.code || selectedLot?.name || `#${selectedLot?.id}`}</Text>
              </>
            ) : (
              <>
                <Tag color="blue" icon={<ApartmentOutlined />}>Đơn hàng</Tag>
                <Text strong>{order?.code || `#${order?.id ?? ''}`}</Text>
              </>
            )}
          </div>
        </div>

        {selectedLot ? (
          <Button icon={<ArrowLeftOutlined />} onClick={onSelectOrder}>
            Workflow đơn hàng
          </Button>
        ) : null}
      </div>

      {tabItems.length > 0 ? (
        <Tabs
          className="workflow-instance-tabs"
          activeKey={selectedInstanceId ? String(selectedInstanceId) : undefined}
          items={tabItems}
          onChange={onSelectWorkflow}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={loading
            ? 'Đang tải workflow...'
            : `Chưa có workflow gắn với ${selectedLot ? 'lô hàng' : 'đơn hàng'} này`}
        />
      )}
    </div>
  )
}

export default WorkflowContextSection
