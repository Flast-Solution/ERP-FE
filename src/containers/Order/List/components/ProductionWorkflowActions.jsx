import React from 'react'
import { Button, Dropdown, Space } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import useWorkflowModal from '../hooks/useWorkflowModal'
import useWorkflowProgressDrawer from '../hooks/useWorkflowProgressDrawer'
import WorkflowAttachModal from './WorkflowAttachModal'
import WorkflowProgressDrawer from './WorkflowProgressDrawer'

const ProductionWorkflowActions = ({ order, detail, manufactureCodes, canAttach, canView, onRefresh }) => {
  const modal = useWorkflowModal({ onAttached: onRefresh })
  const drawer = useWorkflowProgressDrawer()
  const instances = detail.productionWorkflowInstances ?? []
  const target = { ...detail, id: detail.id ?? detail.detailId, workflowInstances: instances, workflowInstance: null }
  const attach = () => modal.openWorkflowModal(target, 'PRODUCTION', { flowType: 'PRODUCTION' })
  const view = () => drawer.openWorkflowProgressDrawer(order, target, {
    entityName: 'PRODUCTION', entityLabel: 'Đơn con', workflowInstances: instances, includeAllInstances: true,
  })
  return (
    <div onClick={event => event.stopPropagation()}>
        <Space size={4}>
          {instances.length > 0
            ? canView && <Button size="small" onClick={view}>Nhập LOT</Button>
            : canAttach && <Button size="small" onClick={attach}>Gắn workflow</Button>}
          {instances.length > 0 && canAttach && <Dropdown trigger={['click']} menu={{ items: [{ key: 'attach', label: 'Gắn thêm workflow', onClick: attach }] }}>
            <Button size="small" icon={<MoreOutlined />} aria-label="Thao tác workflow sản xuất" />
          </Dropdown>}
        </Space>
      <WorkflowAttachModal
        {...modal} open={modal.workflowModalOpen} onCancel={modal.closeWorkflowModal}
        onOk={modal.handleAttachWorkflow} confirmLoading={modal.workflowAttaching}
        entityLabel="Đơn con" contextDescription={`Lệnh sản xuất: ${manufactureCodes.join(', ')}. Workflow dùng chung cho đơn con.`}
      />
      <WorkflowProgressDrawer
        open={drawer.workflowProgressDrawerOpen} loading={drawer.workflowProgressDrawerLoading}
        order={drawer.workflowProgressOrder} orderDetail={drawer.workflowProgressOrderDetail}
        workflowInstances={drawer.workflowProgressInstances} entityType="PRODUCTION" entityLabel="Đơn con"
        onClose={() => { drawer.closeWorkflowProgressDrawer(); onRefresh?.() }}
      />
    </div>
  )
}

export default ProductionWorkflowActions
