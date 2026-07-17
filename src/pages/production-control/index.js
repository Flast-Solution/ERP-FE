import React, { useCallback, useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { Helmet } from 'react-helmet'
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  Tooltip,
  message,
} from 'antd'
import {
  ClearOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { BreadcrumbCustom, CustomButton } from '@flast-erp/core/components'
import { RequestUtils } from '@flast-erp/core/utils'
import CreateOrder from './CreateOrder'
import BomConfirmation from './BomConfirmation'
import { ProductionOrderListShell } from './styles'

const formatListDate = (value) => {
  if (!value) return '-'
  if (typeof value?.format === 'function') return value.format('DD/MM/YYYY')
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('vi-VN')
}

const MANUFACTURE_STATUS_MAP = {
  0: 'new',
  1: 'running',
  2: 'completed',
}

const MANUFACTURE_SAVE_API = '/erp/manufacture/save'

const formatManufactureDate = (value) => {
  if (!value) return undefined
  if (typeof value?.format === 'function') return value.format('YYYY-MM-DD HH:mm:ss')
  return value
}

const buildManufacturePayload = ({ productionOrder = {}, materialConfirmation = {}, isEdit }) => {
  const productDetails = productionOrder.productDetails ?? {}
  const orderDetails = productionOrder.orderDetails ?? []
  const deadlines = Object.values(productDetails)
    .map(detail => detail?.deadline)
    .filter(Boolean)
  const latestDeadline = deadlines
    .map(deadline => ({ raw: deadline, time: new Date(formatManufactureDate(deadline)).getTime() }))
    .sort((left, right) => right.time - left.time)[0]?.raw

  const code = productionOrder.productionOrderCode ?? productionOrder.code
  const details = orderDetails.map((product, index) => {
      const detailKey = String(product.id ?? index)
      const detailValues = productDetails[detailKey] ?? {}
      const target = Number(detailValues.target ?? product.target ?? 0)
      const unitPrice = Number(product.unitPrice ?? product.price ?? 0)

      return {
        productId: product.productId,
        target,
        unitPrice,
        totalPrice: Number(detailValues.totalPrice ?? (target * unitPrice)),
      }
    })

  return {
    manufactureProduct: {
      ...(isEdit ? { id: productionOrder.id } : {}),
      code,
      orderCode: productionOrder.salesOrderCode ?? productionOrder.orderCode,
      typeOrder: productionOrder.typeOrder ?? 'PRODUCTION',
      dateStart: formatManufactureDate(productionOrder.dateStart) ?? null,
      dateEnd: formatManufactureDate(productionOrder.dateEnd ?? latestDeadline) ?? null,
      note: productionOrder.note ?? null,
      status: productionOrder.manufactureStatus
        ?? (typeof productionOrder.status === 'number' ? productionOrder.status : 0),
      priceStandard: productionOrder.priceStandard ?? null,
      priceReal: productionOrder.priceReal ?? null,
      material: productionOrder.material ?? null,
      details,
    },
    materialOutbounds: (materialConfirmation.allocations ?? []).map(allocation => ({
      warehouseId: allocation.warehouseId,
      manufactureCode: code,
      materialId: allocation.materialId,
      quantity: Number(allocation.quantity ?? 0),
      width: Number(allocation.width ?? 0),
      height: Number(allocation.height ?? 0),
    })),
  }
}

const mapManufactureOrder = (record) => {
  const order = record?.order
  const orderDetails = Array.isArray(order?.details) ? order.details : []
  const manufactureDetails = Array.isArray(record?.details) ? record.details : []
  const usedOrderDetailIds = new Set()
  const editingOrderDetails = manufactureDetails.map((detail, index) => {
    const orderDetail = orderDetails.find(item => (
      !usedOrderDetailIds.has(String(item.id))
      && String(item.productId) === String(detail.productId)
    ))
    if (orderDetail?.id != null) usedOrderDetailIds.add(String(orderDetail.id))

    const target = detail.target ?? 0
    const unitPrice = detail.unitPrice ?? orderDetail?.price ?? 0

    return {
      ...orderDetail,
      id: orderDetail?.id ?? `manufacture-${detail.id ?? index}`,
      manufactureDetailId: detail.id,
      productId: detail.productId,
      productName: orderDetail?.productName ?? `Sản phẩm #${detail.productId}`,
      skuId: detail.skuId ?? orderDetail?.skuId ?? null,
      skuDetails: detail.skuDetails ?? orderDetail?.skuDetails ?? [],
      target: Number(target),
      price: Number(unitPrice),
      total: Number(detail.totalPrice ?? orderDetail?.total ?? (Number(target) * Number(unitPrice))),
      bomProductId: detail.bomProductId,
      bomProduct: detail.bomProduct,
    }
  })
  const effectiveOrderDetails = manufactureDetails.length > 0 ? editingOrderDetails : orderDetails
  const editDeadline = record?.dateEnd && dayjs(record.dateEnd).isValid()
    ? dayjs(record.dateEnd)
    : undefined

  return {
    ...record,
    productionOrderCode: record?.code,
    salesOrderCode: record?.orderCode,
    salesOrderId: order?.id,
    customerName: order?.customerReceiverName,
    createdAt: record?.createdDate,
    dateStart: record?.dateStart && dayjs(record.dateStart).isValid() ? dayjs(record.dateStart) : undefined,
    dateEnd: editDeadline,
    orderDetails: effectiveOrderDetails,
    manufactureDetails,
    productDetails: Object.fromEntries(effectiveOrderDetails.map(detail => [
      String(detail?.id),
      {
        target: detail?.target ?? 0,
        deadline: editDeadline,
      },
    ])),
    manufactureStatus: record?.status,
    status: MANUFACTURE_STATUS_MAP[record?.status] ?? 'new',
  }
}

const getProductionQuantity = (record) => Object.values(record?.productDetails ?? {})
  .reduce((total, detail) => total + Number(detail?.target ?? 0), 0)

const getProductionDeadline = (record) => Object.values(record?.productDetails ?? {})
  .map(detail => detail?.deadline)
  .find(Boolean)

const getProductLabel = (record) => {
  const productNames = [...new Set((record?.orderDetails ?? [])
    .map(detail => detail?.productName)
    .filter(Boolean))]
  if (productNames.length === 0) return '-'
  return productNames.length === 1
    ? productNames[0]
    : `${productNames[0]} +${productNames.length - 1}`
}

const getProductionOrderColumns = ({ onView, onEdit }) => [
  {
    title: 'Mã lệnh SX',
    dataIndex: 'productionOrderCode',
    key: 'productionOrderCode',
    width: 155,
    render: (value, record) => (
      <>
        <span className="production-code">{value}</span>
        <span className="production-cell-secondary">{formatListDate(record.createdAt)}</span>
      </>
    ),
  },
  {
    title: 'Khách hàng · Đơn hàng',
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
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: value => (
      <span className={`production-status ${value || 'new'}`}>
        {value === 'running' ? 'Đang chạy' : value === 'completed' ? 'Hoàn thành' : 'Mới tạo'}
      </span>
    ),
  },
  {
    title: 'Thao tác',
    key: 'actions',
    width: 100,
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

const ProductionOrderList = () => {
  const [open, setOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('create')
  const [step, setStep] = useState(1)
  const [pendingOrder, setPendingOrder] = useState(null)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [productionPagination, setProductionPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [filters, setFilters] = useState({
    code: '',
    orderCode: '',
    status: undefined,
    dateRange: null,
  })
  const [waitingOrders, setWaitingOrders] = useState([])
  const [waitingOrderTotal, setWaitingOrderTotal] = useState(0)
  const [waitingOrderLoading, setWaitingOrderLoading] = useState(false)
  const waitingOrderLoadingRef = useRef(false)
  const waitingOrderRequestIdRef = useRef(0)
  const waitingOrderSearchRef = useRef('')
  const waitingOrderSearchTimerRef = useRef(null)
  const productionOrderRequestIdRef = useRef(0)

  const fetchProductionOrders = useCallback(async (searchFilters = {}, page = 1) => {
    const requestId = ++productionOrderRequestIdRef.current
    const params = new URLSearchParams({
      limit: '10',
      page: String(page),
    })

    const code = String(searchFilters.code ?? '').trim()
    const orderCode = String(searchFilters.orderCode ?? '').trim()
    if (code) params.set('code', code)
    if (orderCode) params.set('orderCode', orderCode)
    if (searchFilters.status !== undefined && searchFilters.status !== null) {
      params.set('status', String(searchFilters.status))
    }

    const [dateStart, dateEnd] = searchFilters.dateRange ?? []
    if (dateStart) params.set('dateStart', dateStart.startOf('day').format('YYYY-MM-DD HH:mm:ss'))
    if (dateEnd) params.set('dateEnd', dateEnd.endOf('day').format('YYYY-MM-DD HH:mm:ss'))

    setOrdersLoading(true)
    try {
      const response = await RequestUtils.Get(`/erp/manufacture/fetch?${params.toString()}`, {})
      if (requestId !== productionOrderRequestIdRef.current) return
      const embedded = response?.data?.embedded ?? []
      const pageData = response?.data?.page
      setOrders(embedded.map(mapManufactureOrder))
      setProductionPagination({
        current: page,
        pageSize: Number(pageData?.pageSize ?? 10),
        total: Number(pageData?.totalElements ?? pageData?.total ?? embedded.length),
      })
    } catch (error) {
      if (requestId !== productionOrderRequestIdRef.current) return
      setOrders([])
      message.error(error?.message || 'Không tải được danh sách lệnh sản xuất.')
    } finally {
      if (requestId === productionOrderRequestIdRef.current) {
        setOrdersLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchProductionOrders()
  }, [fetchProductionOrders])

  const updateFilter = (key, value) => {
    setFilters(current => ({ ...current, [key]: value }))
  }

  const clearFilters = () => {
    const emptyFilters = {
      code: '',
      orderCode: '',
      status: undefined,
      dateRange: null,
    }
    setFilters(emptyFilters)
    fetchProductionOrders(emptyFilters, 1)
  }

  const fetchWaitingOrders = async ({ page = 1, reset = false, force = false } = {}) => {
    if (waitingOrderLoadingRef.current && !force) return

    const requestId = ++waitingOrderRequestIdRef.current
    waitingOrderLoadingRef.current = true
    setWaitingOrderLoading(true)
    try {
      const response = await RequestUtils.Get(`/erp/order/fetch?limit=10&page=${page}&type=ORDER`, {
        ...(waitingOrderSearchRef.current ? { code: waitingOrderSearchRef.current } : {}),
      })
      const embedded = response?.data?.embedded ?? []
      const totalElements = Number(response?.data?.page?.totalElements ?? embedded.length)
      if (requestId !== waitingOrderRequestIdRef.current) return
      setWaitingOrders(current => reset ? embedded : [
        ...current,
        ...embedded.filter(item => !current.some(existing => String(existing.id) === String(item.id))),
      ])
      setWaitingOrderTotal(totalElements)
    } finally {
      if (requestId === waitingOrderRequestIdRef.current) {
        waitingOrderLoadingRef.current = false
        setWaitingOrderLoading(false)
      }
    }
  }

  const openFlow = () => {
    setDrawerMode('create')
    waitingOrderSearchRef.current = ''
    setWaitingOrders([])
    setWaitingOrderTotal(0)
    fetchWaitingOrders({ page: 1, reset: true, force: true }).catch(() => undefined)
    setPendingOrder(null)
    setStep(1)
    setOpen(true)
  }

  const openExistingOrder = (record, mode) => {
    setDrawerMode(mode)
    setPendingOrder(record)
    setStep(1)
    setWaitingOrders(record?.order ? [record.order] : [])
    setWaitingOrderTotal(record?.order ? 1 : 0)
    setOpen(true)

    if (mode === 'edit') {
      waitingOrderSearchRef.current = ''
      fetchWaitingOrders({ page: 1, reset: true, force: true }).catch(() => undefined)
    }
  }

  const searchWaitingOrders = (code) => {
    if (waitingOrderSearchTimerRef.current) {
      clearTimeout(waitingOrderSearchTimerRef.current)
    }
    waitingOrderSearchTimerRef.current = setTimeout(() => {
      waitingOrderSearchRef.current = String(code ?? '').trim()
      fetchWaitingOrders({ page: 1, reset: true, force: true }).catch(() => undefined)
    }, 300)
  }

  useEffect(() => () => {
    if (waitingOrderSearchTimerRef.current) {
      clearTimeout(waitingOrderSearchTimerRef.current)
    }
  }, [])

  const closeFlow = () => {
    setOpen(false)
    setDrawerMode('create')
    setStep(1)
    setPendingOrder(null)
  }

  const cancelOrder = () => {
    Modal.confirm({
      title: 'Hủy lệnh sản xuất?',
      content: 'Thông tin lệnh và xác nhận vật tư đang nhập sẽ bị hủy.',
      okText: 'Hủy lệnh',
      okButtonProps: { danger: true },
      cancelText: 'Tiếp tục xác nhận',
      onOk: closeFlow,
    })
  }

  const finishFlow = async ({ productionOrder, materialConfirmation }) => {
    const isEdit = drawerMode === 'edit'
    const payload = buildManufacturePayload({ productionOrder, materialConfirmation, isEdit })

    setSavingOrder(true)
    try {
      const response = await RequestUtils.Post(MANUFACTURE_SAVE_API, payload)
      const isSuccess = response?.errorCode === 200 || response?.success
      if (!isSuccess) {
        message.error(response?.message || (isEdit
          ? 'Cập nhật lệnh sản xuất thất bại.'
          : 'Tạo lệnh sản xuất thất bại.'))
        return
      }

      message.success(response?.message || (isEdit
        ? 'Đã cập nhật lệnh sản xuất.'
        : 'Đã tạo lệnh sản xuất.'))
      closeFlow()
      await fetchProductionOrders(filters, productionPagination.current)
    } catch (error) {
      message.error(error?.message || (isEdit
        ? 'Cập nhật lệnh sản xuất thất bại.'
        : 'Tạo lệnh sản xuất thất bại.'))
    } finally {
      setSavingOrder(false)
    }
  }

  const productionOrderColumns = getProductionOrderColumns({
    onView: record => openExistingOrder(record, 'view'),
    onEdit: record => openExistingOrder(record, 'edit'),
  })

  return (
    <>
      <Helmet><title>Lệnh sản xuất</title></Helmet>
      <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title: 'Lệnh sản xuất' }]} />
      <ProductionOrderListShell>
        <div className="production-list-filter-wrapper">
          <Row gutter={16} align="middle">
            <Col xxl={20} xl={20} lg={18} md={24} xs={24}>
              <Row gutter={[16, 10]}>
                <Col xl={6} md={12} xs={24}>
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Mã lệnh sản xuất"
                    value={filters.code}
                    onChange={event => updateFilter('code', event.target.value)}
                    onPressEnter={() => fetchProductionOrders(filters, 1)}
                    allowClear
                  />
                </Col>
                <Col xl={6} md={12} xs={24}>
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Mã đơn hàng"
                    value={filters.orderCode}
                    onChange={event => updateFilter('orderCode', event.target.value)}
                    onPressEnter={() => fetchProductionOrders(filters, 1)}
                    allowClear
                  />
                </Col>
                <Col xl={6} md={12} xs={24}>
                  <Select
                    value={filters.status}
                    onChange={value => updateFilter('status', value)}
                    placeholder="Trạng thái"
                    allowClear
                    options={[
                      { value: 0, label: 'Mới tạo' },
                      { value: 1, label: 'Đang chạy' },
                      { value: 2, label: 'Hoàn thành' },
                    ]}
                  />
                </Col>
                <Col xl={6} md={12} xs={24}>
                  <DatePicker.RangePicker
                    value={filters.dateRange}
                    onChange={value => updateFilter('dateRange', value)}
                    format="DD/MM/YYYY"
                    placeholder={['Từ ngày', 'Đến ngày']}
                    allowClear
                  />
                </Col>
              </Row>
            </Col>
            <Col xxl={4} xl={4} lg={6} md={24} xs={24} className="production-list-filter-actions">
              <CustomButton
                title="Lọc"
                type="primary"
                icon={<FilterOutlined />}
                inRigth={false}
                loading={ordersLoading}
                onClick={() => fetchProductionOrders(filters, 1)}
              />
              <CustomButton
                title="Xóa bộ lọc"
                variant="outlined"
                color="primary"
                icon={<ClearOutlined />}
                inRigth={false}
                disabled={ordersLoading}
                onClick={clearFilters}
              />
            </Col>
          </Row>
        </div>

        <div className="production-list-top-actions">
          <Pagination
            {...productionPagination}
            showSizeChanger={false}
            showTotal={(total, range) => `${range[0]}-${range[1]}/${total}`}
            onChange={page => fetchProductionOrders(filters, page)}
          />
          <CustomButton
            title="Tạo mới"
            type="primary"
            icon={<PlusOutlined />}
            inRigth={false}
            onClick={openFlow}
          />
        </div>

        <div className="production-list-table">
          <Table
            rowKey="id"
            columns={productionOrderColumns}
            dataSource={orders}
            loading={ordersLoading}
            pagination={false}
            bordered
            locale={{ emptyText: 'Chưa có lệnh sản xuất' }}
            scroll={{ x: 1250 }}
          />
        </div>
        <div className="production-list-pagination-bottom">
          <Pagination
            {...productionPagination}
            showSizeChanger={false}
            showTotal={(total, range) => `${range[0]}-${range[1]}/${total}`}
            onChange={page => fetchProductionOrders(filters, page)}
          />
        </div>
      </ProductionOrderListShell>
      <Drawer
        open={open}
        title={null}
        placement="right"
        width={step === 1 ? 920 : 'min(1200px, 96vw)'}
        destroyOnHidden
        onClose={step === 2 && drawerMode !== 'view' ? cancelOrder : closeFlow}
        styles={{
          header: { minHeight: 48, padding: '8px 16px' },
          body: { padding: 0, overflowY: 'auto' },
        }}
      >
        {step === 1 ? (
          <CreateOrder
            initialValues={pendingOrder}
            mode={drawerMode}
            waitingOrders={waitingOrders}
            waitingOrderLoading={waitingOrderLoading}
            onSearchWaitingOrders={searchWaitingOrders}
            onLoadMoreWaitingOrders={() => {
              if (waitingOrders.length < waitingOrderTotal) {
                fetchWaitingOrders({ page: Math.floor(waitingOrders.length / 10) }).catch(() => undefined)
              }
            }}
            onCancel={closeFlow}
            onNext={(values) => {
              setPendingOrder(values)
              setStep(2)
            }}
          />
        ) : (
          <BomConfirmation
            productionOrder={pendingOrder}
            mode={drawerMode}
            submitting={savingOrder}
            onBack={() => setStep(1)}
            onCancel={cancelOrder}
            onConfirm={finishFlow}
          />
        )}
      </Drawer>
    </>
  )
}

export default ProductionOrderList
