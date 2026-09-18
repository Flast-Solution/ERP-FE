import React from 'react'
import { Divider, Tag, Tooltip, Typography } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { formatMoney, formatTime } from '@flast-erp/core/utils'
import { renderArrayColor } from '../../utils'
import { copyToClipboard } from '../utils/clipboard'
import OrderActions from '../components/OrderActions'
import { STATUS_LEAD } from '@/configs/constant'
import { parseOrderLine } from '../../orderLine'

const { Text } = Typography

const OpportunityOrderTooltip = ({ details }) => {
  const orderDetails = Array.isArray(details) ? details : []

  if (orderDetails.length === 0) {
    return <span>Chưa có thông tin SKU và thông tin bổ sung.</span>
  }

  return (
    <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
      {orderDetails.map((detail, detailIndex) => {
        const skuDetails = Array.isArray(detail?.skuDetails) ? detail.skuDetails : []
        const orderLineEntries = Object.entries(parseOrderLine(detail?.orderLine))

        return (
          <div key={detail?.id ?? detail?.code ?? detailIndex}>
            {detailIndex > 0 && <Divider style={{ margin: '10px 0' }} />}
            <Text strong style={{ color: 'inherit' }}>
              {detailIndex + 1}. {detail?.productName || detail?.code || 'Sản phẩm'}
            </Text>

            <div style={{ marginTop: 6 }}>
              <Text strong style={{ color: 'inherit' }}>SKU:</Text>
              {skuDetails.length > 0 ? skuDetails.map((sku, skuIndex) => (
                <div key={`${sku?.text || 'sku'}-${skuIndex}`} style={{ paddingLeft: 12 }}>
                  {sku?.text || 'Thuộc tính'}:{' '}
                  {(Array.isArray(sku?.values) ? sku.values : [])
                    .map(value => value?.text ?? value?.value ?? value?.id)
                    .filter(value => value !== undefined && value !== null && value !== '')
                    .join(', ') || '-'}
                </div>
              )) : <span style={{ marginLeft: 6 }}>Chưa có</span>}
            </div>

            <div style={{ marginTop: 6 }}>
              <Text strong style={{ color: 'inherit' }}>Thông tin bổ sung:</Text>
              {orderLineEntries.length > 0 ? orderLineEntries.map(([key, value]) => (
                <div key={key} style={{ paddingLeft: 12 }}>
                  {key}: {String(value ?? '-')}
                </div>
              )) : <span style={{ marginLeft: 6 }}>Chưa có</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const OrderCodeCell = ({
  text,
  record,
  index,
  copiedIndex,
  setCopiedIndex,
  showDetails,
}) => {
  const code = (
    <span
      onClick={() => copyToClipboard(text, setCopiedIndex, index)}
      style={{
        cursor: 'pointer',
        color: copiedIndex === index ? '#52c41a' : 'inherit',
        transition: 'color 0.3s ease',
      }}
    >
      <CopyOutlined style={{ marginRight: 8 }} />
      {text}
    </span>
  )

  return showDetails ? (
    <Tooltip
      placement="rightTop"
      mouseEnterDelay={0.2}
      styles={{ root: { maxWidth: 560 } }}
      title={<OpportunityOrderTooltip details={record?.details} />}
    >
      {code}
    </Tooltip>
  ) : code
}

const OPPORTUNITY_HIDDEN_COLUMN_KEYS = new Set([
  'opportunityAt',
  'customerAddress',
  'priceOff',
  'shippingCost',
  'paid',
  'remainingAmount',
])

const DEFAULT_OPPORTUNITY_STATUS = {
  [STATUS_LEAD.CREATE_DATA]: { name: 'Tạo mới' },
  [STATUS_LEAD.THANH_CO_HOI]: { name: 'Thành cơ hội', color: 'green' },
}

const createOrderColumns = ({
  isOpportunityList,
  showOrderDetailTooltip,
  opportunityStatusOptions,
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
  canUpdateOpportunity,
  canUpdateOrder,
  canViewQuotation,
  canAttachWorkflow,
  canViewWorkflow,
}) => ([
  {
    title: 'Kinh doanh',
    dataIndex: 'userCreateUsername',
    key: 'userCreateUsername',
    width: 120,
    ellipsis: true,
  },
  {
    title: 'Mã đơn',
    dataIndex: 'code',
    key: 'code',
    width: 200,
    ellipsis: true,
    render: (text, record, index) => (
      <OrderCodeCell
        text={text}
        record={record}
        index={index}
        copiedIndex={copiedIndex}
        setCopiedIndex={setCopiedIndex}
        showDetails={showOrderDetailTooltip}
      />
    ),
  },
  {
    title: 'Sản phẩm',
    dataIndex: 'products',
    key: 'products',
    width: 300,
    render: (products, record) => renderArrayColor(products, record.detailstatus),
  },
  {
    title: 'T.Thái',
    dataIndex: 'detailstatus',
    key: 'detailstatus',
    width: 150,
    ellipsis: true,
    render: (array, record) => {
      if (isOpportunityList) {
        const detailStatuses = Array.isArray(record?.details)
          ? record.details.map(detail => detail?.status)
          : []

        return detailStatuses.length > 0
          ? detailStatuses.map((status, index) => {
            const statusItem = DEFAULT_OPPORTUNITY_STATUS[Number(status)]
              ?? opportunityStatusOptions.find(item => String(item.id) === String(status))

            return (
              <div key={record.details[index]?.id ?? index}>
                {index + 1} -{' '}
                {statusItem
                  ? <Tag color={statusItem.color || undefined}>{statusItem.name}</Tag>
                  : '-'}
              </div>
            )
          })
          : '-'
      }

      return renderArrayColor(array, record.detailstatus)
    },
  },
  {
    title: 'T.G Chốt',
    dataIndex: 'opportunityAt',
    key: 'opportunityAt',
    width: 120,
    ellipsis: true,
    render: (time) => formatTime(time),
  },
  {
    title: isOpportunityList ? 'Khách hàng' : 'Họ tên',
    dataIndex: 'customerReceiverName',
    key: 'customerReceiverName',
    width: 130,
    ellipsis: true,
  },
  {
    title: 'Số điện thoại',
    dataIndex: 'customerMobilePhone',
    key: 'customerMobilePhone',
    width: 130,
    ellipsis: true,
  },
  {
    title: 'Tỉnh/T.P',
    dataIndex: 'customerAddress',
    key: 'customerAddress',
    width: 120,
    ellipsis: true,
    render: (address) => address || '(Chưa có)',
  },
  {
    title: 'Ngày đặt',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 130,
    ellipsis: true,
    render: (time) => formatTime(time),
  },
  {
    title: 'Tổng tiền',
    dataIndex: 'total',
    key: 'total',
    width: 130,
    ellipsis: true,
    render: (total) => formatMoney(total),
  },
  {
    title: 'Giảm giá',
    dataIndex: 'priceOff',
    key: 'priceOff',
    width: 130,
    ellipsis: true,
    render: (priceOff) => formatMoney(priceOff),
  },
  {
    title: 'Phí ship',
    dataIndex: 'shippingCost',
    key: 'shippingCost',
    width: 130,
    ellipsis: true,
    render: (shippingCost) => formatMoney(shippingCost),
  },
  {
    title: 'Thanh toán',
    dataIndex: 'paid',
    key: 'paid',
    width: 130,
    ellipsis: true,
    render: (paid) => formatMoney(paid),
  },
  {
    title: 'Còn lại',
    key: 'remainingAmount',
    width: 130,
    ellipsis: true,
    render: (record) => formatMoney(record.total - record.paid),
  },
  {
    title: 'Action',
    key: 'action',
    fixed: 'right',
    width: actionWidth,
    render: (_, record) => (
      <OrderActions
        record={record}
        isOpportunityList={isOpportunityList}
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
        canUpdateOpportunity={canUpdateOpportunity}
        canUpdateOrder={canUpdateOrder}
        canViewQuotation={canViewQuotation}
        canAttachWorkflow={canAttachWorkflow}
        canViewWorkflow={canViewWorkflow}
      />
    ),
  },
].filter(column => !(
  isOpportunityList && OPPORTUNITY_HIDDEN_COLUMN_KEYS.has(column.key)
)))

export default createOrderColumns
