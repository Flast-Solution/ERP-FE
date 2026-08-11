import React from 'react'
import { Empty, Modal, Select, Spin, Tag, Typography } from 'antd'
import { LOT_WORKFLOW_ENTITY_TYPE } from '../constants'
import './WorkflowAttachModal.less'

const { Text, Title } = Typography

const WorkflowAttachModal = ({
  open,
  onCancel,
  onOk,
  confirmLoading,
  workflowTargets,
  selectedWorkflowIdsByTarget,
  initialWorkflowIdsByTarget,
  setWorkflowIdsForTarget,
  workflows,
  workflowLoading,
  selectedOrder,
  selectedWorkflowEntityType,
  canSubmit,
  entityLabel,
}) => {
  const isLotTarget = selectedWorkflowEntityType === LOT_WORKFLOW_ENTITY_TYPE
  const orderCode = selectedOrder?.code || selectedOrder?.name
  const resolvedEntityLabel = entityLabel || (isLotTarget ? 'Lô' : 'Đơn')
  const workflowOptions = workflows.map(workflow => ({
    value: workflow.id,
    label: workflow.name || workflow.processKey || `Workflow #${workflow.id}`,
    disabled: workflow.enabled === false,
    searchText: [
      workflow.name,
      workflow.processKey,
      workflow.code,
    ].filter(Boolean).join(' ').toLowerCase(),
  }))

  return (
    <Modal
      className="workflow-attach-modal"
      title={(
        <div className="workflow-attach-modal__heading">
          <Text className="workflow-attach-modal__eyebrow">THÊM WORKFLOW</Text>
          <Title level={4}>
            {resolvedEntityLabel} {orderCode || ''}
          </Title>
        </div>
      )}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="Lưu workflow"
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: !canSubmit }}
      width={820}
      destroyOnHidden
    >
      <Spin spinning={workflowLoading}>
        <div className="workflow-attach-modal__content">
          {workflowTargets.length === 0 ? (
            <Empty description={`${resolvedEntityLabel} chưa có đối tượng để gắn workflow`} />
          ) : workflowTargets.map((target, index) => {
            const targetKey = String(target.id)
            const targetCode = target.code || `${orderCode || 'Đơn'} - ${index + 1}`
            const productName = target.productName || target.name
            const persistedWorkflowIds = new Set(
              (initialWorkflowIdsByTarget[targetKey] ?? []).map(String)
            )

            return (
              <section className="workflow-attach-modal__order" key={targetKey}>
                <div className="workflow-attach-modal__order-title">
                  <Text strong>Mã&nbsp; {targetCode}</Text>
                  {productName ? <Text type="secondary">· {productName}</Text> : null}
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  value={selectedWorkflowIdsByTarget[targetKey] ?? []}
                  onChange={values => setWorkflowIdsForTarget(targetKey, values)}
                  options={workflowOptions}
                  placeholder="Tìm workflow..."
                  optionFilterProp="searchText"
                  filterOption={(input, option) => (
                    String(option?.searchText ?? '').includes(input.trim().toLowerCase())
                  )}
                  tagRender={({ label, value, closable, onClose }) => {
                    const isPersisted = persistedWorkflowIds.has(String(value))
                    return (
                      <Tag
                        className="workflow-attach-modal__tag"
                        closable={!isPersisted && closable}
                        onClose={isPersisted ? undefined : onClose}
                      >
                        {label}
                      </Tag>
                    )
                  }}
                  maxTagCount="responsive"
                  notFoundContent={workflowLoading ? <Spin size="small" /> : 'Không tìm thấy workflow'}
                  className="workflow-attach-modal__select"
                />
              </section>
            )
          })}
        </div>
      </Spin>
    </Modal>
  )
}

export default WorkflowAttachModal
