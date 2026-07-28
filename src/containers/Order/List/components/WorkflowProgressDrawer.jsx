import React from 'react'
import { Drawer, Empty, Spin, Tabs, Typography } from 'antd'

import { workflowProgressPageStyles } from '@/pages/order/progress/styles'
import { getWorkflowInstanceProcessId } from '../utils/workflowMappers'
import WorkflowInstanceContent from './WorkflowInstanceContent'
import './WorkflowProgressDrawer.less'

const { Text, Title } = Typography

const WorkflowProgressDrawer = ({
  open,
  loading,
  order,
  orderDetail,
  workflowInstances,
  onClose,
}) => {
  const items = workflowInstances.map((instance, index) => {
    const processId = getWorkflowInstanceProcessId(instance)
    const workflowName = instance?.workflowProcess?.name
      ?? instance?.process?.name
      ?? `Workflow #${processId ?? index + 1}`

    return {
      key: String(instance?.id ?? `${processId}-${index}`),
      label: workflowName,
      children: (
        <WorkflowInstanceContent
          order={order}
          orderDetail={orderDetail}
          workflowInstance={instance}
        />
      ),
    }
  })

  return (
    <Drawer
      className="workflow-detail-drawer"
      open={open}
      onClose={onClose}
      width="min(1440px, 98vw)"
      destroyOnHidden
      title={(
        <div>
          <Text className="workflow-detail-drawer__eyebrow">TIẾN TRÌNH WORKFLOW</Text>
          <Title level={4}>
            Mã {orderDetail?.code ?? order?.code ?? ''}
          </Title>
        </div>
      )}
    >
      <style>{workflowProgressPageStyles}</style>
      <Spin spinning={loading}>
        {!loading && items.length === 0 ? (
          <Empty description="Mã đơn này chưa có workflow" />
        ) : (
          <Tabs
            items={items}
            destroyOnHidden
            className="workflow-detail-drawer__tabs"
          />
        )}
      </Spin>
    </Drawer>
  )
}

export default WorkflowProgressDrawer
