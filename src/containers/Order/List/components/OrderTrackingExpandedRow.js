import ProductAttributesTooltip from './ProductAttributesTooltip'
import OrderDetailLots from './OrderDetailLots'
import ProductionWorkflowActions from './ProductionWorkflowActions'
import { matchesProductionDetail } from '../utils/productionDetailMatch'
import React, { useState } from 'react'
import { Table, Tag, Tooltip, Typography } from 'antd'
import { formatTime } from '@flast-erp/core/utils';
import { formatCurrency as formatMoney } from '../../../../utils/formatCurrency';
import {
  formatQuantity,
  getManufactureProducts,
  getOrderDetails,
  getShippingHistory,
  getSkuText,
  getOrderLineText,
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

const OrderTrackingExpandedRow = ({ record, shippingStatusById, isOpportunityList = false, productionOverview = false, trackingOverview = false, canAttachProductionWorkflow = false, canViewProductionWorkflow = false, onProductionWorkflowRefresh }) => {
  const [activeDetailRowKey, setActiveDetailRowKey] = useState()
  const [expandedLotRowKey, setExpandedLotRowKey] = useState(null)
  const details = getOrderDetails(record)
  const showVndSalePrice = isOpportunityList || productionOverview || trackingOverview
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
    const detailManufactureProducts = manufactureDetails.filter(item => (
      matchesProductionDetail(item.manufactureDetail, detail, details)
    ))
    const detailReceipts = receipts.filter(item => belongsToDetail(item, detail))
    const detailShipping = shipping.filter(item => belongsToDetail(item, detail))
    const rowCount = isOpportunityList ? 1 : Math.max(
      1,
      detailManufactureProducts.length,
      detailReceipts.length,
      productionOverview ? 0 : detailShipping.length
    )

    return Array.from({ length: rowCount }, (_, rowIndex) => ({
      ...detail,
      _rowKey: `${detailGroupKey}-${rowIndex}`,
      _detailGroupKey: detailGroupKey,
      _detailCode: getDetailCode(detail),
      _detailRowSpan: rowIndex === 0 ? rowCount : 0,
      _manufactureProduct: detailManufactureProducts[rowIndex],
      _productionIndex: rowIndex + 1,
      _receipt: detailReceipts[rowIndex],
      _shippingItem: detailShipping[rowIndex],
    }))
  })

  const columns = [
    {
      title: 'Đơn con',
      key: 'detail',
      children: [
        {
          title: 'Mã đơn con',
          dataIndex: '_detailCode',
          width: 155,
          onCell: detail => ({ rowSpan: expandedLotRowKey == null ? detail?._detailRowSpan : 1 }),
          render: value => <Text strong>{value || '—'}</Text>,
        },
        ...(productionOverview ? [{
          title: 'Mã lệnh sản xuất',
          key: 'productionCode',
          dataIndex: '_manufactureProduct',
          width: 185,
          render: item => item?.manufactureProduct?.code || '—',
        }] : []),
        {
          title: 'Sản phẩm / SKU',
          key: 'product',
          width: 220,
          ellipsis: true,
          onCell: detail => ({ rowSpan: expandedLotRowKey == null ? detail?._detailRowSpan : 1 }),
          render: (_, detail) => {
            const product = [detail?.productName, detail?.productCode].filter(Boolean).join(' - ') || '—'
            const sku = getSkuText(detail)
            const orderLine = getOrderLineText(detail)
            return (
              <Tooltip
                styles={{ root: { maxWidth: 480 } }}
                title={<><strong>{product}</strong><ProductAttributesTooltip detail={detail} /></>}
              >
                <div>
                  <div>{product}</div>
                  {sku && <Text type="secondary">{sku}</Text>}
                  {orderLine && <div style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{orderLine}</div>}
                </div>
              </Tooltip>
            )
          },
        },
        {
          title: 'Ngày tạo',
          dataIndex: 'createdAt',
          width: 125,
          onCell: detail => ({ rowSpan: expandedLotRowKey == null ? detail?._detailRowSpan : 1 }),
          render: value => formatTime(value || record?.createdAt) || '—',
        },
        {
          title: 'Số lượng',
          dataIndex: 'quantity',
          width: 105,
          align: 'right',
          onCell: detail => ({ rowSpan: expandedLotRowKey == null ? detail?._detailRowSpan : 1 }),
          render: (value, detail) => formatQuantity(value, detail?.unit),
        },
        {
          title: 'Giá bán',
          dataIndex: showVndSalePrice ? 'priceV' : 'price',
          width: 130,
          align: 'right',
          onCell: detail => ({ rowSpan: expandedLotRowKey == null ? detail?._detailRowSpan : 1 }),
          render: (value, detail) => {
            if (isOpportunityList || trackingOverview || productionOverview) {
              const currency = String(detail?.currency || record?.currency || record?.order?.currency || 'VND').trim().toUpperCase()
              const price = currency === 'USD' ? detail.price : detail.priceV
              return price == null ? '—' : formatMoney(price, currency)
            }
            return formatMoney(value, showVndSalePrice ? 'VND' : (detail?.currency || record?.currency))
          },
        },
        {
          title: 'Deadline',
          dataIndex: 'dayQuote',
          width: 125,
          onCell: detail => ({ rowSpan: expandedLotRowKey == null ? detail?._detailRowSpan : 1 }),
          render: value => formatTime(value) || '—',
        },
      ],
    },
    {
      title: 'Lệnh sản xuất',
      key: 'production',
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
        ...[
          { title: 'SL đã sản xuất', key: 'producedQuantity' },
          { title: 'SL sản xuất còn lại', key: 'remainingProductionQuantity' },
        ].map(metric => ({
          title: metric.title, key: metric.key, width: 140, align: 'right',
          onCell: detail => ({ rowSpan: expandedLotRowKey == null ? detail?._detailRowSpan : 1 }),
          render: (_, detail) => {
            const value = detail?._productionMetrics?.[metric.key]
            return value == null ? <Tooltip title={detail?._productionMetrics?.error || 'Chưa tải được dữ liệu sản xuất'}>—</Tooltip>
              : formatQuantity(value, detail.unit)
          },
        })),
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
          render: (item, detail) => item ? detail._productionIndex : '',
        },
      ],
    },
    {
      title: 'Nhập kho',
      key: 'inbound',
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
      key: 'outbound',
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
    ...(productionOverview ? [{
      title: 'Action', key: 'productionActions',
      children: [{
        title: null, key: 'productionWorkflow', width: 260,
        onCell: detail => ({ rowSpan: expandedLotRowKey == null ? detail._detailRowSpan : 1 }),
        render: (_, detail) => {
          if (!detail._detailRowSpan) return null
          const commands = manufactureDetails.filter(item => matchesProductionDetail(item.manufactureDetail, detail, details))
          if (!commands.length || getDetailId(detail) == null) return '—'
          const codes = [...new Set(commands.map(item => item.manufactureProduct?.code).filter(Boolean))]
          return <ProductionWorkflowActions order={record} detail={detail} manufactureCodes={codes}
            canAttach={canAttachProductionWorkflow} canView={canViewProductionWorkflow}
            onRefresh={onProductionWorkflowRefresh} />
        },

      }],
    }] : []),
  ].filter((group, index) => (
    (!isOpportunityList || index === 0)
    && (!productionOverview || group.key !== 'outbound')
  ))

  return (
    <div className="order-tracking-master">
      <Table
        size="small"
        bordered
        pagination={false}
        rowKey="_rowKey"
        columns={columns.map(group => ({
          ...group,
          onHeaderCell: () => ({ className: `order-tracking-header--${group.key}` }),
          children: group.children.map(column => ({
            ...column,
            onHeaderCell: () => ({ className: `order-tracking-header--${group.key}` }),
          })),
        }))}
        dataSource={rows}
        expandable={isOpportunityList ? undefined : {
          showExpandColumn: false,
          expandedRowKeys: expandedLotRowKey == null ? [] : [expandedLotRowKey],
          rowExpandable: detail => detail._detailRowSpan > 0 && getDetailId(detail) != null,
          expandedRowRender: detail => <OrderDetailLots detailId={getDetailId(detail)} lots={detail._productionLots} />,
        }}
        locale={{ emptyText: 'Đơn hàng chưa có đơn con' }}
        scroll={{ x: columns.flatMap(group => group.children).reduce((total, column) => total + (column.width || 100), 0) }}
        rowClassName={detail => (
          detail?._detailGroupKey === activeDetailRowKey
            ? 'order-tracking-detail-row order-tracking-detail-row--active'
            : 'order-tracking-detail-row'
        )}
        onRow={detail => {
          const canExpand = !isOpportunityList && getDetailId(detail) != null
          const lotRowKey = `${detail._detailGroupKey}-0`
          const toggle = () => {
            setActiveDetailRowKey(detail._detailGroupKey)
            if (canExpand) setExpandedLotRowKey(current => current === lotRowKey ? null : lotRowKey)
          }
          return {
            onClick: toggle,
            style: canExpand ? { cursor: 'pointer' } : undefined,
            tabIndex: canExpand ? 0 : undefined,
            'aria-expanded': canExpand ? expandedLotRowKey === lotRowKey : undefined,
            onKeyDown: canExpand ? event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                toggle()
              }
            } : undefined,
          }
        }}
      />
    </div>
  )
}

export default OrderTrackingExpandedRow
