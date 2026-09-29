import React, { useCallback, useMemo } from 'react'
import { Button, Dropdown, Select, Space, Table, Tooltip } from 'antd'
import { EditOutlined, EyeOutlined, ApartmentOutlined } from '@ant-design/icons'
import {
  formatListDate,
  getBomVersions,
  getProductLabel,
  getProductionDeadline,
  getProductionQuantity,
} from '../utils'

import { useWorkflowDrawer } from '@/contexts/WorkflowDrawerContext'
import { ORDER_WORKFLOW_ENTITY_TYPE } from '@/containers/Order/List/constants'

const getProductionOrderColumns = ({
  onView,
  onEdit,
  onStatusChange,
  onWorkflow,
  statusOptions,
  updatingStatusId,
}) => [
  {
    title: 'Mã lệnh SX',
    dataIndex: 'productionOrderCode',
    key: 'productionOrderCode',
    width: 250,
    render: (value, record) => (
      <>
        <span className="production-code">{value}</span>
        <span className="production-cell-secondary">{formatListDate(record.createdAt)}</span>
      </>
    ),
  },
  {
    title: 'K.hàng · Đ.hàng',
    key: 'customerOrder',
    width: 185,
    render: (_, record) => (
      <>
        <span>{record.customerName || '-'}</span>
        <span className="production-cell-secondary">{record.salesOrderCode || `#${record.salesOrderId}`}</span>
      </>
    ),
  },
  {
    title: 'Sản phẩm',
    key: 'products',
    width: 265,
    render: (_, record) => getProductLabel(record),
  },
  {
    title: 'BOM',
    key: 'bomVersions',
    width: 145,
    render: (_, record) => {
      const versions = getBomVersions(record)
      return versions.length > 0 ? (
        <div className="production-bom-list">
          {versions.map(version => (
            <span className="production-bom-code" key={version}>{version}</span>
          ))}
        </div>
      ) : '-'
    },
  },
  {
    title: 'SL',
    key: 'quantity',
    width: 90,
    align: 'right',
    render: (_, record) => getProductionQuantity(record).toLocaleString('vi-VN'),
  },
  {
    title: 'Deadline',
    key: 'deadline',
    width: 110,
    render: (_, record) => formatListDate(getProductionDeadline(record)),
  },
  {
    title: 'Người t.lệnh',
    dataIndex: 'createdByName',
    key: 'createdBy',
    width: 155,
    render: (value, record) => value ?? (record.createdBy != null ? `#${record.createdBy}` : '-'),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    width: 175,
    render: (_, record) => (
      <div onClick={event => event.stopPropagation()}>
        <Select
          value={record.manufactureStatus}
          options={statusOptions}
          loading={String(updatingStatusId) === String(record.id)}
          disabled={updatingStatusId != null}
          onChange={nextStatus => onStatusChange(record, nextStatus)}
          optionRender={option => (
            <span style={{ color: option.data?.color || undefined }}>
              {option.label}
            </span>
          )}
          style={{ width: '100%' }}
          aria-label={`Thay đổi trạng thái lệnh ${record.productionOrderCode}`}
        />
      </div>
    ),
  },
  {
    title: 'Thao tác',
    key: 'actions',
    width: 145,
    align: 'center',
    fixed: 'right',
    render: (_, record) => (
      <Space size={4}>
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            icon={<EyeOutlined />}
            aria-label="Xem chi tiết"
            onClick={(event) => {
              event.stopPropagation()
              onView(record)
            }}
          />
        </Tooltip>
        <Dropdown
          trigger={['click']}
          menu={{
            items: (record.orderDetails ?? []).map(detail => ({
              key: String(detail.id),
              label: detail.code || detail.productName || `Đơn con #${detail.id}`,
              disabled: !(detail.orderDetailId ?? (!String(detail.id).startsWith('manufacture-') && detail.id)),
              onClick: ({ domEvent }) => {
                domEvent.stopPropagation()
                onWorkflow(record, detail)
              },
            })),
          }}
          disabled={!(record.orderDetails ?? []).length}
        >
          <Tooltip title="Xem tiến trình workflow theo đơn con">
            <Button
              type="text"
              icon={<ApartmentOutlined />}
              aria-label="Xem tiến trình workflow"
              style={{ color: record.orderDetails?.some(detail => detail.workflowInstances?.length) ? '#52c41a' : undefined }}
              onClick={event => event.stopPropagation()}
            />
          </Tooltip>
        </Dropdown>
        <Tooltip title="Chỉnh sửa">
          <Button
            type="text"
            icon={<EditOutlined />}
            aria-label="Chỉnh sửa"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(record)
            }}
          />
        </Tooltip>
      </Space>
    ),
  },
]

const ProductionOrderTable = ({
  orders = [],
  loading = false,
  onView,
  onEdit,
  onStatusChange,
  statusOptions = [],
  updatingStatusId,
}) => {
  const { openWorkflowDrawer } = useWorkflowDrawer()
  const onWorkflow = useCallback((record, detail) => {
    openWorkflowDrawer(record.order ?? record, { ...detail, id: detail.orderDetailId ?? detail.id }, {
      entityName: ORDER_WORKFLOW_ENTITY_TYPE,
      entityType: ORDER_WORKFLOW_ENTITY_TYPE,
      entityLabel: 'Đơn con',
      workflowInstances: detail.workflowInstances ?? [],
      includeAllInstances: true,
    })
  }, [openWorkflowDrawer])
  const columns = useMemo(
    () => getProductionOrderColumns({
      onView,
      onEdit,
      onStatusChange,
      onWorkflow,
      statusOptions,
      updatingStatusId,
    }),
    [onView, onEdit, onStatusChange, onWorkflow, statusOptions, updatingStatusId],
  )

  return (
    <div className="production-list-table">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={false}
        bordered
        locale={{ emptyText: 'Chưa có lệnh sản xuất' }}
        scroll={{ x: 1450 }}
      />
    </div>
  )
}

export default ProductionOrderTable
