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
  entityLabel = 'Mã',
  entityType = 'order',
  formOnly = false,
  leadMode = false,
}) => {
  const items = workflowInstances.map((instance, index) => {
    const processId = getWorkflowInstanceProcessId(instance)
    const workflowName = instance?.process?.name ?? `Workflow #${processId ?? index + 1}`

    return {
      key: String(instance?.id ?? `${processId}-${index}`),
      label: workflowName,
      children: (
        <WorkflowInstanceContent
          order={order}
          orderDetail={orderDetail}
          workflowInstance={instance}
          entityType={entityType}
          entityLabel={entityLabel}
          formOnly={formOnly}
          leadMode={leadMode}
        />
      ),
    }
  })

  return (
    <Drawer
      className={`workflow-detail-drawer${leadMode ? ' workflow-detail-drawer--lead' : ''}`}
      open={open}
      onClose={onClose}
      width="min(750px, calc(100vw - 16px))"
      destroyOnHidden
      title={formOnly ? undefined : (
        <div>
          <Text className="workflow-detail-drawer__eyebrow">TIẾN TRÌNH WORKFLOW</Text>
          <Title level={4}>
            {entityLabel} {orderDetail?.code
              ?? order?.code
              ?? orderDetail?.customerName
              ?? order?.customerName
              ?? orderDetail?.name
              ?? order?.name
              ?? (orderDetail?.id ? `#${orderDetail.id}` : '')}
          </Title>
        </div>
      )}
    >
      <style>{workflowProgressPageStyles}</style>
      <Spin spinning={loading}>
        {!loading && items.length === 0 ? (
          <Empty description={`${entityLabel} này chưa có workflow`} />
        ) : formOnly || (leadMode && items.length === 1) ? (
          items[0]?.children ?? null
        ) : (
          <Tabs
            items={items}
            destroyOnHidden
            className="workflow-detail-drawer__tabs"
            tabBarGutter={20}
          />
        )}
      </Spin>
    </Drawer>
  )
}

export default WorkflowProgressDrawer
