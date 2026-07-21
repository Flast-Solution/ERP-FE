import React from 'react'
import { Tag } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { formatMoney, formatTime } from '@flast-erp/core/utils'
import { renderArrayColor } from '../../utils'
import { copyToClipboard } from '../utils/clipboard'
import { getWorkflowCurrentStepLabel } from '../utils/workflowMappers'
import OrderActions from '../components/OrderActions'

const createOrderColumns = ({
  isOrderList,
  copiedIndex,
  setCopiedIndex,
  actionWidth,
  hideQuoteButton,
  disableWorkflowAttach,
  extraActions,
  onClickViewDetail,
  openQuotationViewer,
  openWorkflowModal,
  navigate,
}) => [
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
    width: 150,
    ellipsis: true,
    render: (text, record, index) => (
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
    ),
  },
  {
    title: 'Sản phẩm',
    dataIndex: 'products',
    key: 'products',
    width: 150,
    ellipsis: true,
    render: (products, record) => renderArrayColor(products, record.detailstatus),
  },
  {
    title: 'T.Thái',
    dataIndex: 'detailstatus',
    key: 'detailstatus',
    width: 150,
    ellipsis: true,
    render: (array, record) => {
      if (!isOrderList) {
        return renderArrayColor(array, record.detailstatus)
      }

      if (!record?.workflowInstance) {
        return <Tag>Chưa gắn workflow</Tag>
      }

      const currentStepLabel = getWorkflowCurrentStepLabel(record)
      if (currentStepLabel) {
        return <Tag color="blue">{currentStepLabel}</Tag>
      }

      return <Tag color="orange">Chưa xác định bước</Tag>
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
    title: 'Họ tên',
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
        hideQuoteButton={hideQuoteButton}
        disableWorkflowAttach={disableWorkflowAttach}
        extraActions={extraActions}
        onClickViewDetail={onClickViewDetail}
        openQuotationViewer={openQuotationViewer}
        openWorkflowModal={openWorkflowModal}
        navigate={navigate}
      />
    ),
  },
]

export default createOrderColumns
