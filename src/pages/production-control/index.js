import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  Col,
  DatePicker,
  Drawer,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Table,
  message,
} from 'antd'
import {
  ClearOutlined,
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

const mapManufactureOrder = (record) => {
  const order = record?.order
  const orderDetails = Array.isArray(order?.details) ? order.details : []

  return {
    ...record,
    productionOrderCode: record?.code,
    salesOrderCode: record?.orderCode,
    salesOrderId: order?.id,
    customerName: order?.customerReceiverName,
    createdAt: record?.createdDate,
    orderDetails,
    productDetails: Object.fromEntries(orderDetails.map(detail => [
      String(detail?.id),
      {
        quantity: detail?.quantity ?? 0,
        deadline: record?.dateEnd,
      },
    ])),
    status: MANUFACTURE_STATUS_MAP[record?.status] ?? 'new',
  }
}

const getProductionQuantity = (record) => Object.values(record?.productDetails ?? {})
  .reduce((total, detail) => total + Number(detail?.quantity ?? 0), 0)

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

const productionOrderColumns = [
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
    title: 'BOM',
    dataIndex: 'bomVersion',
    key: 'bomVersion',
    width: 130,
    render: value => value ? <span className="production-bom-code">{value}</span> : '-',
  },
  {
    title: 'SL',
    key: 'quantity',
    width: 90,
    align: 'right',
    render: (_, record) => getProductionQuantity(record).toLocaleString('vi-VN'),
  },
  {
    title: 'Ưu tiên',
    dataIndex: 'priority',
    key: 'priority',
    width: 95,
    render: value => value ? (
      <span className={`production-priority ${value}`}>
        {value === 'high' ? 'Cao' : value === 'low' ? 'Thấp' : 'T.Bình'}
      </span>
    ) : '-',
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
]

const ProductionOrderList = () => {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [pendingOrder, setPendingOrder] = useState(null)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
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
    waitingOrderSearchRef.current = ''
    setWaitingOrders([])
    setWaitingOrderTotal(0)
    fetchWaitingOrders({ page: 1, reset: true, force: true }).catch(() => undefined)
    setPendingOrder(null)
    setStep(1)
    setOpen(true)
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

  const finishFlow = ({ productionOrder, materialConfirmation }) => {
    setOrders(current => [
      {
        ...productionOrder,
        id: Date.now(),
        createdAt: Date.now(),
        bomVersion: materialConfirmation?.version,
        priority: 'normal',
        status: 'running',
      },
      ...current,
    ])
    message.success('Đã tạo lệnh sản xuất và xác nhận vật tư.')
    closeFlow()
  }

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
            scroll={{ x: 1150 }}
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
        onClose={step === 2 ? cancelOrder : closeFlow}
        styles={{
          header: { minHeight: 48, padding: '8px 16px' },
          body: { padding: 0, overflowY: 'auto' },
        }}
      >
        {step === 1 ? (
          <CreateOrder
            initialValues={pendingOrder}
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
