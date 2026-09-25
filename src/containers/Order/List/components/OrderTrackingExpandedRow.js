import React, { useState } from 'react'
import { Table, Tag, Tooltip, Typography } from 'antd'
import { formatMoney, formatTime } from '@flast-erp/core/utils'
import {
  formatQuantity,
  getManufactureProducts,
  getOrderDetails,
  getShippingHistory,
  getSkuText,
  getWarehouseHistory,
} from '../utils/orderTracking'

const { Text } = Typography

const asNumber = value => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const sumBy = (items, selector) => items.reduce(
  (total, item) => total + asNumber(selector(item)),
  0
)

const getDetailId = detail => detail?.id ?? detail?.detailId
const getDetailCode = detail => detail?.code ?? detail?.detailCode

const belongsToDetail = (item, detail) => {
  const detailId = getDetailId(detail)
  const detailCode = getDetailCode(detail)
  const itemDetailId = item?.orderDetailId ?? item?.detailId
  const itemDetailCode = item?.orderDetailCode ?? item?.detailCode

  if (detailId != null && itemDetailId != null) {
    return String(detailId) === String(itemDetailId)
  }
  if (detailCode && itemDetailCode) {
    return String(detailCode) === String(itemDetailCode)
  }
  return item?.entity === 'ORDER_DETAIL'
    && detailId != null
    && String(item?.entityId) === String(detailId)
}

const OrderTrackingExpandedRow = ({ record, shippingStatusById }) => {
  const [activeDetailRowKey, setActiveDetailRowKey] = useState()
  const details = getOrderDetails(record)
  const manufactureDetails = getManufactureProducts(record).flatMap(manufactureProduct => {
    const items = Array.isArray(manufactureProduct?.details) ? manufactureProduct.details : []
    return items.map(manufactureDetail => ({
      manufactureProduct,
      manufactureDetail,
    }))
  })
  const receipts = getWarehouseHistory(record)
  const shipping = getShippingHistory(record)

  const rows = details.flatMap((detail, detailIndex) => {
    const detailGroupKey = getDetailId(detail) ?? getDetailCode(detail) ?? detailIndex
    const detailManufactureProducts = manufactureDetails.filter(item => {
      const manufactureDetail = item?.manufactureDetail ?? {}
      if (String(manufactureDetail?.productId) !== String(detail?.productId)) return false
      return manufactureDetail?.skuId == null
        || detail?.skuId == null
        || String(manufactureDetail.skuId) === String(detail.skuId)
    })
    const detailReceipts = receipts.filter(item => belongsToDetail(item, detail))
    const detailShipping = shipping.filter(item => belongsToDetail(item, detail))
    const rowCount = Math.max(
      1,
      detailManufactureProducts.length,
      detailReceipts.length,
      detailShipping.length
    )

    return Array.from({ length: rowCount }, (_, rowIndex) => ({
      ...detail,
      _rowKey: `${detailGroupKey}-${rowIndex}`,
      _detailGroupKey: detailGroupKey,
      _detailCode: getDetailCode(detail),
      _detailRowSpan: rowIndex === 0 ? rowCount : 0,
      _manufactureProduct: detailManufactureProducts[rowIndex],
      _receipt: detailReceipts[rowIndex],
      _shippingItem: detailShipping[rowIndex],
    }))
  })

  const columns = [
    {
      title: 'Đơn con',
      children: [
        {
          title: 'Mã đơn con',
          dataIndex: '_detailCode',
          width: 155,
          onCell: detail => ({ rowSpan: detail?._detailRowSpan }),
          render: value => <Text strong>{value || '—'}</Text>,
        },
        {
          title: 'Sản phẩm / SKU',
          key: 'product',
          width: 220,
          ellipsis: true,
          onCell: detail => ({ rowSpan: detail?._detailRowSpan }),
          render: (_, detail) => {
            const product = [detail?.productName, detail?.productCode].filter(Boolean).join(' - ') || '—'
            const sku = getSkuText(detail)
            return (
              <Tooltip title={<><div>{product}</div>{sku && <div>SKU: {sku}</div>}</>}>
                <div>
                  <div>{product}</div>
                  {sku && <Text type="secondary">{sku}</Text>}
                </div>
              </Tooltip>
            )
          },
        },
        {
          title: 'Ngày tạo',
          dataIndex: 'createdAt',
          width: 125,
          onCell: detail => ({ rowSpan: detail?._detailRowSpan }),
          render: value => formatTime(value || record?.createdAt) || '—',
        },
        {
          title: 'Số lượng',
          dataIndex: 'quantity',
          width: 105,
          align: 'right',
          onCell: detail => ({ rowSpan: detail?._detailRowSpan }),
          render: (value, detail) => formatQuantity(value, detail?.unit),
        },
        {
          title: 'Giá bán',
          dataIndex: 'price',
          width: 130,
          align: 'right',
          onCell: detail => ({ rowSpan: detail?._detailRowSpan }),
          render: value => formatMoney(value),
        },
        {
          title: 'Deadline',
          dataIndex: 'dayQuote',
          width: 125,
          onCell: detail => ({ rowSpan: detail?._detailRowSpan }),
          render: value => formatTime(value) || '—',
        },
      ],
    },
    {
      title: 'Lệnh sản xuất',
      children: [
        {
          title: 'Lệnh sản xuất',
          dataIndex: '_manufactureProduct',
          width: 185,
          render: item => item?.manufactureProduct?.code || '',
        },
        {
          title: 'Số lượng',
          dataIndex: '_manufactureProduct',
          width: 105,
          align: 'right',
          render: (item, detail) => item
            ? formatQuantity(item?.manufactureDetail?.target, detail?.unit)
            : '',
        },
        {
          title: 'Deadline',
          dataIndex: '_manufactureProduct',
          width: 125,
          render: item => item ? (formatTime(item?.manufactureProduct?.dateEnd) || '') : '',
        },
        {
          title: 'Ưu tiên',
          dataIndex: '_manufactureProduct',
          width: 90,
          align: 'center',
          render: () => '',
        },
      ],
    },
    {
      title: 'Nhập kho',
      children: [
        {
          title: 'Phiếu nhập',
          dataIndex: '_receipt',
          width: 190,
          render: item => item?.receiptCode || '',
        },
        {
          title: 'Số lượng',
          dataIndex: '_receipt',
          width: 105,
          align: 'right',
          render: (item, detail) => item ? formatQuantity(item?.quantity, detail?.unit) : '',
        },
        {
          title: 'Kho nhận',
          dataIndex: '_receipt',
          width: 150,
          render: item => item?.stockName || '',
        },
        {
          title: 'Ngày nhận',
          dataIndex: '_receipt',
          width: 125,
          render: item => item ? (formatTime(item?.receivedAt) || '') : '',
        },
      ],
    },
    {
      title: 'Xuất kho giao hàng',
      children: [
        {
          title: 'Phiếu xuất',
          dataIndex: '_shippingItem',
          width: 190,
          render: item => item?.deliveryCode || '',
        },
        {
          title: 'Số lượng',
          dataIndex: '_shippingItem',
          width: 105,
          align: 'right',
          render: (item, detail) => item
            ? formatQuantity(
              sumBy(Array.isArray(item?.lots) ? item.lots : [], lot => lot?.quantity),
              detail?.unit
            )
            : '',
        },
        {
          title: 'Trạng thái',
          dataIndex: '_shippingItem',
          width: 135,
          render: item => {
            if (!item) return ''
            const status = shippingStatusById?.[String(item?.status)]
            return <Tag color={status?.color || 'processing'}>{status?.name || `Trạng thái ${item?.status}`}</Tag>
          },
        },
        {
          title: 'Dự kiến giao',
          dataIndex: '_shippingItem',
          width: 125,
          render: item => item ? (formatTime(item?.delivery?.scheduledAt) || '') : '',
        },
      ],
    },
  ]

  return (
    <div className="order-tracking-master">
      <Table
        size="small"
        bordered
        pagination={false}
        rowKey="_rowKey"
        columns={columns}
        dataSource={rows}
        locale={{ emptyText: 'Đơn hàng chưa có đơn con' }}
        scroll={{ x: 2160 }}
        rowClassName={detail => (
          detail?._detailGroupKey === activeDetailRowKey
            ? 'order-tracking-detail-row order-tracking-detail-row--active'
            : 'order-tracking-detail-row'
        )}
        onRow={detail => ({
          onClick: () => setActiveDetailRowKey(detail?._detailGroupKey),
        })}
      />
    </div>
  )
}

export default OrderTrackingExpandedRow
