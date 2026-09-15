import React from 'react'
import { Table } from 'antd'
import createLotColumns from '../columns/createLotColumns'

const OrderLotExpandable = ({
  expandedRowKeys,
  onExpand,
  lotsByOrderId,
  loadingLotsByOrderId,
  navigate,
  openWorkflowModal,
}) => ({
  expandedRowKeys,
  expandRowByClick: true,
  onExpand,
  expandedRowRender: (record) => {
    const orderId = record?.id
    const lots = lotsByOrderId[orderId] ?? []
    const loading = loadingLotsByOrderId[orderId]

    return (
      <div style={{ padding: '8px 16px 8px 48px', background: '#fafafa' }}>
        <Table
          rowKey={(item) => item?.id ?? item?.code ?? `${orderId}-${item?.name ?? item?.createdDate ?? item?.expectedDate ?? 'lot'}`}
          size="small"
          columns={createLotColumns({ order: record, navigate, openWorkflowModal })}
          dataSource={lots}
          loading={loading}
          pagination={false}
          locale={{ emptyText: loading ? 'Đang tải danh sách lô...' : 'Chưa có lô hàng' }}
          scroll={{ x: 1020 }}
        />
      </div>
    )
  },
})

export default OrderLotExpandable
