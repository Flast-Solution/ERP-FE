import React from 'react'
import { Input, Modal, Table, Tag } from 'antd'
import { LOT_WORKFLOW_ENTITY_TYPE } from '../constants'

const WorkflowAttachModal = ({
  open,
  onCancel,
  onOk,
  confirmLoading,
  selectedWorkflowId,
  setSelectedWorkflowId,
  workflowKeyword,
  setWorkflowKeyword,
  filteredWorkflows,
  workflowLoading,
  selectedOrder,
  selectedWorkflowEntityType,
}) => {
  const workflowTargetTypeLabel = selectedWorkflowEntityType === LOT_WORKFLOW_ENTITY_TYPE ? 'lô' : 'đơn'
  const workflowTargetCode = selectedOrder?.code || selectedOrder?.name

  return (
    <Modal
      title={`Gắn workflow${workflowTargetCode ? ` cho ${workflowTargetTypeLabel} ${workflowTargetCode}` : ''}`}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="Gắn workflow"
      cancelText="Đóng"
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: !selectedWorkflowId }}
      width={760}
      destroyOnHidden
    >
      <Input.Search
        allowClear
        placeholder="Tìm workflow theo tên hoặc mã..."
        value={workflowKeyword}
        onChange={event => setWorkflowKeyword(event.target.value)}
        style={{ marginBottom: 12 }}
      />
      <Table
        rowKey="id"
        size="small"
        loading={workflowLoading}
        dataSource={filteredWorkflows}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        rowSelection={{
          type: 'radio',
          selectedRowKeys: selectedWorkflowId ? [selectedWorkflowId] : [],
          onChange: ([key]) => setSelectedWorkflowId(key),
        }}
        onRow={(record) => ({
          onClick: () => setSelectedWorkflowId(record.id),
          style: { cursor: 'pointer' },
        })}
        columns={[
          {
            title: 'Tên workflow',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (name) => name || '(Chưa đặt tên)',
          },
          {
            title: 'Mã',
            dataIndex: 'processKey',
            key: 'processKey',
            width: 220,
            ellipsis: true,
            render: (value) => value || '-',
          },
          {
            title: 'Trạng thái',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 120,
            render: (enabled) => (
              <Tag color={enabled === false ? 'default' : 'green'}>
                {enabled === false ? 'Tắt' : 'Kích hoạt'}
              </Tag>
            ),
          },
        ]}
      />
    </Modal>
  )
}

export default WorkflowAttachModal
