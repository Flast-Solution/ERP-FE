import React from 'react'
import { Progress, Space, Tag, Tooltip, Typography } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { formatMoney, formatTime } from '@flast-erp/core/utils'
import OrderActions from '../components/OrderActions'
import { copyToClipboard } from '../utils/clipboard'
import {
  formatQuantity,
  getLatestShipping,
  getOrderDetails,
  getOrderTrackingMetrics,
  getOrderUnit,
  getProductSummary,
  getSkuText,
} from '../utils/orderTracking'

const { Text } = Typography

const renderMetric = (value, unit, tone) => (
  <Text strong style={tone ? { color: tone } : undefined}>
    {formatQuantity(value, unit)}
  </Text>
)

const ProductTooltip = ({ record }) => (
  <div style={{ maxWidth: 520 }}>
    {getOrderDetails(record).map((detail, index) => (
      <div key={detail?.id ?? index} style={{ marginBottom: index === 0 ? 0 : 10 }}>
        <Text strong style={{ color: 'inherit' }}>
          {index + 1}. {[detail?.productName, detail?.productCode].filter(Boolean).join(' - ') || 'Sản phẩm'}
        </Text>
        <div>Đơn con: {detail?.code || '—'}</div>
        <div>SKU: {getSkuText(detail) || '—'}</div>
        <div>Số lượng: {formatQuantity(detail?.quantity, detail?.unit)}</div>
      </div>
    ))}
  </div>
)

const createOrderTrackingColumns = ({
  shippingStatusById,
  copiedIndex,
  setCopiedIndex,
  actionWidth,
  hideQuoteButton,
  disableWorkflowAttach,
  showWorkflowProgressAction,
  extraActions,
  onClickViewDetail,
  openQuotationViewer,
  openWorkflowModal,
  openWorkflowProgressDrawer,
  navigate,
  canViewDetail,
  canUpdateOrder,
  canViewQuotation,
  canAttachWorkflow,
  canViewWorkflow,
  canCreateReceipt,
  openOrderInboundDrawer,
}) => [
  {
    title: 'Khách hàng',
    key: 'customer',
    fixed: 'left',
    width: 180,
    ellipsis: true,
    render: (_, record) => {
      const name = record?.enterpriseName || record?.customerReceiverName || '—'
      return (
        <Tooltip title={name}>
          <div>
            <Text strong>{name}</Text>
            <div><Text type="secondary">{record?.customerMobilePhone || 'Chưa có SĐT'}</Text></div>
          </div>
        </Tooltip>
      )
    },
  },
  {
    title: 'Mã đơn',
    dataIndex: 'code',
    key: 'code',
    fixed: 'left',
    width: 165,
    ellipsis: true,
    render: (code, record, index) => (
      <Tooltip title="Bấm để sao chép mã đơn">
        <span
          onClick={() => copyToClipboard(code, setCopiedIndex, index)}
          style={{
            cursor: 'pointer',
            color: copiedIndex === index ? '#52c41a' : undefined,
          }}
        >
          <CopyOutlined style={{ marginRight: 6 }} />
          {code || '—'}
        </span>
      </Tooltip>
    ),
  },
  {
    title: 'Sản phẩm / SKU',
    key: 'product',
    width: 230,
    ellipsis: true,
    render: (_, record) => (
      <Tooltip placement="rightTop" title={<ProductTooltip record={record} />}>
        <span>{getProductSummary(record)}</span>
      </Tooltip>
    ),
  },
  {
    title: 'Đơn hàng',
    children: [
      {
        title: 'SL đặt',
        key: 'orderedQuantity',
        width: 110,
        align: 'right',
        render: (_, record) => {
          const metrics = getOrderTrackingMetrics(record)
          return renderMetric(metrics.orderedQuantity, getOrderUnit(record))
        },
      },
      {
        title: 'Ngày đặt',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 120,
        render: value => formatTime(value) || '—',
      },
      {
        title: 'Kinh doanh',
        dataIndex: 'userCreateUsername',
        key: 'userCreateUsername',
        width: 125,
        ellipsis: true,
      },
    ],
  },
  {
    title: 'Kho',
    children: [
      {
        title: 'Đã nhập',
        key: 'receivedQuantity',
        width: 110,
        align: 'right',
        render: (_, record) => {
          const metrics = getOrderTrackingMetrics(record)
          return renderMetric(metrics.receivedQuantity, getOrderUnit(record))
        },
      },
      {
        title: 'Tồn hiện tại',
        key: 'onHandQuantity',
        width: 120,
        align: 'right',
        render: (_, record) => {
          const metrics = getOrderTrackingMetrics(record)
          return renderMetric(metrics.onHandQuantity, getOrderUnit(record), '#07875f')
        },
      },
      {
        title: 'Phiếu nhập',
        key: 'receiptCount',
        width: 90,
        align: 'center',
        render: (_, record) => {
          const count = getOrderTrackingMetrics(record).receiptCount
          return <Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>
        },
      },
    ],
  },
  {
    title: 'Xuất kho & giao hàng',
    children: [
      {
        title: 'Đã xuất',
        key: 'outboundQuantity',
        width: 110,
        align: 'right',
        render: (_, record) => {
          const metrics = getOrderTrackingMetrics(record)
          return renderMetric(metrics.outboundQuantity, getOrderUnit(record), '#1677ff')
        },
      },
      {
        title: 'Chưa xuất',
        key: 'remainingOutboundQuantity',
        width: 110,
        align: 'right',
        render: (_, record) => {
          const metrics = getOrderTrackingMetrics(record)
          return renderMetric(
            metrics.remainingOutboundQuantity,
            getOrderUnit(record),
            metrics.remainingOutboundQuantity > 0 ? '#d46b08' : undefined
          )
        },
      },
      {
        title: 'Dư / thiếu',
        key: 'outboundVariance',
        width: 115,
        align: 'center',
        render: (_, record) => {
          const { outboundVariance } = getOrderTrackingMetrics(record)
          if (outboundVariance === 0) return <Tag color="success">Đủ</Tag>
          return (
            <Tag color={outboundVariance > 0 ? 'purple' : 'warning'}>
              {outboundVariance > 0 ? 'Dư' : 'Thiếu'}{' '}
              {formatQuantity(Math.abs(outboundVariance), getOrderUnit(record))}
            </Tag>
          )
        },
      },
      {
        title: 'Tiến độ',
        key: 'outboundProgress',
        width: 150,
        render: (_, record) => (
          <Progress
            percent={getOrderTrackingMetrics(record).progress}
            size="small"
            status={getOrderTrackingMetrics(record).progress >= 100 ? 'success' : 'active'}
          />
        ),
      },
      {
        title: 'Trạng thái giao',
        key: 'shippingStatus',
        width: 150,
        ellipsis: true,
        render: (_, record) => {
          const latest = getLatestShipping(record)
          if (!latest) return <Tag>Chưa tạo phiếu</Tag>
          const status = shippingStatusById[String(latest?.status)]
          return <Tag color={status?.color || 'processing'}>{status?.name || `Trạng thái ${latest?.status}`}</Tag>
        },
      },
      {
        title: 'Dự kiến giao',
        key: 'scheduledAt',
        width: 125,
        render: (_, record) => formatTime(getLatestShipping(record)?.delivery?.scheduledAt) || '—',
      },
    ],
  },
  {
    title: 'Tài chính',
    children: [
      {
        title: 'Tổng tiền',
        dataIndex: 'total',
        key: 'total',
        width: 135,
        align: 'right',
        render: value => formatMoney(value),
      },
      {
        title: 'Đã thanh toán',
        dataIndex: 'paid',
        key: 'paid',
        width: 135,
        align: 'right',
        render: value => formatMoney(value),
      },
      {
        title: 'Còn lại',
        key: 'remainingAmount',
        width: 135,
        align: 'right',
        render: (_, record) => (
          <Text type={Number(record?.total ?? 0) - Number(record?.paid ?? 0) > 0 ? 'danger' : undefined}>
            {formatMoney(Number(record?.total ?? 0) - Number(record?.paid ?? 0))}
          </Text>
        ),
      },
    ],
  },
  {
    title: 'Action',
    key: 'action',
    fixed: 'right',
    width: actionWidth,
    render: (_, record) => (
      <Space size={4}>
        <OrderActions
          record={record}
          isOpportunityList={false}
          hideQuoteButton={hideQuoteButton}
          disableWorkflowAttach={disableWorkflowAttach}
          showWorkflowProgressAction={showWorkflowProgressAction}
          extraActions={extraActions}
          onClickViewDetail={onClickViewDetail}
          openQuotationViewer={openQuotationViewer}
          openWorkflowModal={openWorkflowModal}
          openWorkflowProgressDrawer={openWorkflowProgressDrawer}
          navigate={navigate}
          canViewDetail={canViewDetail}
          canUpdateOpportunity={false}
          canUpdateOrder={canUpdateOrder}
          canViewQuotation={canViewQuotation}
          canAttachWorkflow={canAttachWorkflow}
          canViewWorkflow={canViewWorkflow}
          canCreateReceipt={canCreateReceipt}
          openOrderInboundDrawer={openOrderInboundDrawer}
        />
      </Space>
    ),
  },
]

export default createOrderTrackingColumns
