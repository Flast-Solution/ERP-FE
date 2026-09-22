import React, { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Table,
} from 'antd'
import {
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { RequestUtils } from '@flast-erp/core/utils'
import FormFileUpload from '@/containers/PreviewModal/FormFileUpload'
import useDrawerLeaveGuard from '@/hooks/useDrawerLeaveGuard'
import './OrderInboundDrawer.less'

const USER_BUSINESS_API = '/auth/user-bussiness/list-user'
const WAREHOUSE_API = '/warehouse/fetch-stock'
const PROVIDER_API = '/provider/fetch'
const EVALUATION_LIST_API = 'evaluation/list'
const EVALUATION_SAVE_API = 'evaluation/save'
const EVALUATION_SAVE_LIST_API = '/evaluation/save-list'
const WAREHOUSE_CREATE_API = '/warehouse/created'
const WAREHOUSE_HISTORY_API = '/erp/warehouse/fetch-history'

const createReceiptCode = () => {
  const now = new Date()
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  return `GRN-${date}-${Date.now().toString(36).toUpperCase()}`
}

const getArrayData = response => {
  if (Array.isArray(response)) return response
  const data = response?.data?.data ?? response?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.embedded)) return data.embedded
  return []
}

const getDetailLabel = detail => {
  const code = detail?.code || detail?.key
  const productName = detail?.productName || detail?.product?.name
  return [code, productName].filter(Boolean).join(' - ') || `Đơn con #${detail?.id}`
}

const isInitialCriterion = value => value === true || value === 1 || value === 'true'

const getDefaultCriteria = evaluationList => evaluationList
  .filter(item => isInitialCriterion(item?.initial))
  .map(item => ({
    criterionId: item.evaluationCriteriaId,
    standard: item.standard ?? null,
    measuredValue: null,
    passed: false,
    initial: true,
  }))

const getInboundQuantitySummary = (detail, history = []) => {
  const orderedQuantity = Number(detail?.quantity)
  const safeOrderedQuantity = Number.isFinite(orderedQuantity) && orderedQuantity > 0
    ? orderedQuantity
    : 0
  const importedQuantity = history
    .filter(item => {
      const itemQuantity = Number(item?.quantity)
      return String(item?.orderDetailId) === String(detail?.id)
        && item?.stockId != null
        && Number.isFinite(itemQuantity)
        && itemQuantity > 0
    })
    .reduce((total, item) => total + Number(item.quantity), 0)

  return {
    orderedQuantity: safeOrderedQuantity,
    importedQuantity,
    remainingQuantity: Math.max(safeOrderedQuantity - importedQuantity, 0),
  }
}

const formatQuantity = value => Number(value ?? 0).toLocaleString('vi-VN')

const parseHistoryArray = value => {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const parseHistoryDate = value => {
  if (!value) return null
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : null
}

const HISTORY_COLUMNS = [
  {
    title: 'Thời gian',
    key: 'time',
    width: 160,
    render: (_, item) => item.inTime || item.createdDate || '—',
  },
  {
    title: 'Mã phiếu',
    dataIndex: 'receiptCode',
    key: 'receiptCode',
    width: 190,
    render: value => value || '—',
  },
  {
    title: 'Đơn con',
    dataIndex: 'orderDetailCode',
    key: 'orderDetailCode',
    width: 160,
    render: value => value || '—',
  },
  {
    title: 'Lô nội bộ',
    dataIndex: 'lotNo',
    key: 'lotNo',
    width: 120,
    render: value => value || '—',
  },
  {
    title: 'Kho nhận',
    key: 'warehouse',
    width: 180,
    render: (_, item) => item.stockName || (item.warehouseId ? `Kho #${item.warehouseId}` : '—'),
  },
  {
    title: 'Vị trí',
    dataIndex: 'binLocation',
    key: 'binLocation',
    width: 110,
    render: value => value || '—',
  },
  {
    title: 'Số lượng',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 100,
    align: 'right',
    render: value => value ?? '—',
  },
  {
    title: 'Ghi chú',
    dataIndex: 'inspectionNote',
    key: 'inspectionNote',
    width: 220,
    render: value => value || '—',
  },
]

const OrderInboundDrawer = ({ open, initialOrder, onClose }) => {
  const [form] = Form.useForm()
  const [businessUsers, setBusinessUsers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [providers, setProviders] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingWarehouses, setLoadingWarehouses] = useState(false)
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [evaluationCriteria, setEvaluationCriteria] = useState([])
  const [loadingEvaluations, setLoadingEvaluations] = useState(false)
  const [newEvaluationName, setNewEvaluationName] = useState('')
  const [savingEvaluation, setSavingEvaluation] = useState(false)
  const [savingDefaultCriteria, setSavingDefaultCriteria] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [warehouseHistory, setWarehouseHistory] = useState([])
  const [loadingWarehouseHistory, setLoadingWarehouseHistory] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState(null)
  const { closeAfterSubmit, markDirty, requestClose } = useDrawerLeaveGuard({
    open,
    onClose,
    resetKey: initialOrder?.id ?? 'order-inbound-ui',
  })

  const orderDetails = useMemo(
    () => (Array.isArray(initialOrder?.details) ? initialOrder.details : []),
    [initialOrder?.details]
  )
  const detailOptions = useMemo(() => orderDetails
    .filter(detail => detail?.id !== undefined && detail?.id !== null)
    .map(detail => ({ value: detail.id, label: getDetailLabel(detail) })), [orderDetails])
  const selectedDetailId = Form.useWatch('orderDetailId', form)
  const quantity = Form.useWatch('quantity', form)
  const selectedDetail = useMemo(() => orderDetails.find(
    detail => String(detail?.id) === String(selectedDetailId)
  ), [orderDetails, selectedDetailId])
  const quantitySummary = useMemo(
    () => getInboundQuantitySummary(selectedDetail, warehouseHistory),
    [selectedDetail, warehouseHistory]
  )
  const criteria = Form.useWatch('criteria', form) ?? []
  const passedCriteria = criteria.filter(item => item?.passed).length

  useEffect(() => {
    if (!open) return undefined

    let mounted = true
    setLoadingUsers(true)
    setLoadingWarehouses(true)
    setLoadingProviders(true)
    setLoadingEvaluations(true)

    RequestUtils.Get(USER_BUSINESS_API)
      .then(response => {
        if (mounted) setBusinessUsers(getArrayData(response))
      })
      .catch(() => {
        if (mounted) setBusinessUsers([])
      })
      .finally(() => {
        if (mounted) setLoadingUsers(false)
      })

    RequestUtils.Get(WAREHOUSE_API)
      .then(response => {
        if (mounted) setWarehouses(getArrayData(response))
      })
      .catch(() => {
        if (mounted) setWarehouses([])
      })
      .finally(() => {
        if (mounted) setLoadingWarehouses(false)
      })

    RequestUtils.Get(PROVIDER_API)
      .then(response => {
        if (mounted) setProviders(getArrayData(response))
      })
      .catch(() => {
        if (mounted) {
          setProviders([])
          message.error('Không tải được danh sách đơn vị giao')
        }
      })
      .finally(() => {
        if (mounted) setLoadingProviders(false)
      })

    RequestUtils.Get(`/${EVALUATION_LIST_API}`)
      .then(response => {
        console.log('[OrderInbound][evaluation/list response]', response)
        if (mounted) {
          const evaluationList = getArrayData(response)
          setEvaluationCriteria(evaluationList)
          form.setFieldValue('criteria', getDefaultCriteria(evaluationList))
        }
      })
      .catch(error => {
        console.log('[OrderInbound][evaluation/list error]', error)
        if (mounted) setEvaluationCriteria([])
      })
      .finally(() => {
        if (mounted) setLoadingEvaluations(false)
      })

    return () => {
      mounted = false
    }
  }, [form, open])

  useEffect(() => {
    const orderId = initialOrder?.id
    if (!open || orderId == null) return undefined

    let mounted = true
    setWarehouseHistory([])
    setLoadingWarehouseHistory(true)
    RequestUtils.Get(WAREHOUSE_HISTORY_API, {
      orderId,
      isFull: 'True',
    })
      .then(response => {
        if (mounted) setWarehouseHistory(getArrayData(response))
      })
      .catch(error => {
        if (mounted) {
          setWarehouseHistory([])
          message.error(error?.message || 'Không tải được lịch sử chuyển kho')
        }
      })
      .finally(() => {
        if (mounted) setLoadingWarehouseHistory(false)
      })

    return () => {
      mounted = false
    }
  }, [initialOrder?.id, open])

  useEffect(() => {
    if (!selectedDetail) {
      form.setFieldsValue({ item: undefined, quantity: undefined })
      return
    }
    if (loadingWarehouseHistory || selectedHistoryId != null) return

    form.setFieldsValue({
      item: selectedDetail.id,
      quantity: quantitySummary.remainingQuantity > 0
        ? quantitySummary.remainingQuantity
        : undefined,
    })
  }, [form, loadingWarehouseHistory, quantitySummary.remainingQuantity, selectedDetail, selectedHistoryId])

  const handleValuesChange = changedValues => {
    markDirty()

    if (Object.prototype.hasOwnProperty.call(changedValues, 'orderDetailId')) {
      setSelectedHistoryId(null)
      const detail = orderDetails.find(
        item => String(item?.id) === String(changedValues.orderDetailId)
      )
      form.setFieldsValue({
        item: detail?.id,
        quantity: undefined,
      })
    }
  }

  const handleHistoryRowClick = historyItem => {
    const orderDetailId = historyItem?.orderDetailId ?? null
    setSelectedHistoryId(historyItem?.id ?? null)
    form.setFieldsValue({
      receiptCode: historyItem?.receiptCode ?? '',
      providerId: historyItem?.providerId ?? undefined,
      receivedAt: parseHistoryDate(historyItem?.receivedAt ?? historyItem?.inTime),
      orderCode: historyItem?.orderCode ?? initialOrder?.code ?? '',
      orderDetailId,
      lotNo: historyItem?.lotNo ?? '',
      item: orderDetailId,
      quantity: historyItem?.quantity ?? undefined,
      criteria: parseHistoryArray(historyItem?.criteria).map(item => ({
        ...item,
        passed: Boolean(item?.passed),
        initial: Boolean(item?.initial),
      })),
      inspectionNote: historyItem?.inspectionNote ?? '',
      inspectorId: historyItem?.inspectorId ?? undefined,
      attachments: parseHistoryArray(historyItem?.attachments),
      warehouseId: historyItem?.warehouseId ?? historyItem?.stockId ?? undefined,
      binLocation: historyItem?.binLocation ?? '',
      stockStatus: historyItem?.status ?? undefined,
      effectiveDate: parseHistoryDate(historyItem?.effectiveDate),
    })
    form.scrollToField('receiptCode', { behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = async values => {
    setSubmitting(true)
    try {
      const historyResponse = await RequestUtils.Get(WAREHOUSE_HISTORY_API, {
        orderId: initialOrder?.id,
        isFull: 'True',
      })
      const historySuccess = historyResponse?.success === true
        || Number(historyResponse?.errorCode) === 200
      if (!historySuccess) {
        throw new Error(historyResponse?.message || 'Không kiểm tra được lịch sử nhập kho')
      }

      const latestHistory = getArrayData(historyResponse)
      const latestSummary = getInboundQuantitySummary(selectedDetail, latestHistory)
      const requestedQuantity = Number(values.quantity)
      setWarehouseHistory(latestHistory)

      if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
        form.setFields([{ name: 'quantity', errors: ['Số lượng nhập phải lớn hơn 0'] }])
        return
      }
      if (latestSummary.remainingQuantity <= 0) {
        form.setFields([{ name: 'quantity', errors: ['Đơn con này đã được nhập đủ số lượng'] }])
        message.warning('Đơn con này đã được nhập đủ số lượng')
        return
      }
      if (requestedQuantity > latestSummary.remainingQuantity) {
        const errorMessage = `Số lượng nhập không được vượt quá ${formatQuantity(latestSummary.remainingQuantity)}`
        form.setFields([{ name: 'quantity', errors: [errorMessage] }])
        message.warning(errorMessage)
        return
      }

      const infoReceip = {
        ...values,
        orderId: initialOrder?.id,
        orderDetailId: selectedDetail?.id ?? values.orderDetailId,
        orderDetailCode: selectedDetail?.code ?? selectedDetail?.key ?? null,
        productId: selectedDetail?.productId ?? null,
        skuId: selectedDetail?.skuId ?? null,
        receivedAt: values.receivedAt?.format?.('YYYY-MM-DD HH:mm:ss') ?? values.receivedAt ?? null,
        effectiveDate: values.effectiveDate?.startOf?.('day')?.format?.('YYYY-MM-DD HH:mm:ss')
          ?? values.effectiveDate
          ?? null,
        attachments: Array.isArray(values.attachments) ? values.attachments : [],
      }
      delete infoReceip.item

      const response = await RequestUtils.Post(WAREHOUSE_CREATE_API, {
        infoReceip,
      })
      const isSuccess = response?.success === true || Number(response?.errorCode) === 200
      if (!isSuccess) {
        message.error(response?.message || 'Nhập kho thất bại')
        return
      }

      message.success(response?.message || 'Nhập kho thành công')
      closeAfterSubmit()
    } catch (error) {
      message.error(error?.message || 'Nhập kho thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDefaultCriteriaChange = async (fieldIndex, checked) => {
    const currentCriteria = form.getFieldValue('criteria') ?? []
    const selectedCriterion = currentCriteria[fieldIndex]
    if (!selectedCriterion?.criterionId) return

    const nextCriteria = currentCriteria.map((item, index) => (
      index === fieldIndex ? { ...item, initial: checked } : item
    ))

    form.setFieldValue('criteria', nextCriteria)
    markDirty()

    const evaluationList = evaluationCriteria.map(item => (
      item.evaluationCriteriaId === selectedCriterion.criterionId
        ? {
            ...item,
            standard: selectedCriterion.standard ?? item.standard ?? null,
            initial: checked,
          }
        : { ...item, initial: Boolean(item.initial) }
    ))
    setEvaluationCriteria(evaluationList)

    setSavingDefaultCriteria(true)
    try {
      const response = await RequestUtils.Post(EVALUATION_SAVE_LIST_API, evaluationList)
      console.log('[OrderInbound][evaluation/save-list response]', response)
    } finally {
      setSavingDefaultCriteria(false)
    }
  }

  const handleSaveEvaluation = async () => {
    const name = newEvaluationName.trim()
    if (!name) return

    setSavingEvaluation(true)
    try {
      const response = await RequestUtils.Post(`/${EVALUATION_SAVE_API}`, { name })
      console.log('[OrderInbound][evaluation/save response]', response)
      setNewEvaluationName('')

      const listResponse = await RequestUtils.Get(`/${EVALUATION_LIST_API}`)
      console.log('[OrderInbound][evaluation/list response]', listResponse)
      setEvaluationCriteria(getArrayData(listResponse))
    } finally {
      setSavingEvaluation(false)
    }
  }

  return (
    <Drawer
      className="order-inbound-drawer"
      open={open}
      onClose={requestClose}
      width={750}
      destroyOnHidden
      title="Nhập nhanh · đơn nhập về"
      styles={{ body: { padding: 0 } }}
    >
      <Form
        form={form}
        className="order-inbound-form"
        layout="vertical"
        initialValues={{
          receiptCode: createReceiptCode(),
          orderCode: initialOrder?.code,
          providerId: initialOrder?.providerId ?? initialOrder?.provider?.id,
          criteria: [],
        }}
        onValuesChange={handleValuesChange}
        onFinish={handleSubmit}
      >
        <main className="order-inbound-body">
          <section className="order-inbound-section">
            <div className="order-inbound-section__head"><span>1</span><h2>Thông tin đơn nhập</h2></div>
            <Row gutter={[16, 0]}>
              <Col lg={8} md={12} xs={24}>
                <Form.Item name="receiptCode" label="Mã phiếu nhập">
                  <Input placeholder="Nhập mã phiếu nhập" />
                </Form.Item>
              </Col>
              <Col lg={8} md={12} xs={24}>
                <Form.Item name="providerId" label={<span>Đơn vị giao <b>*</b></span>}>
                  <Select
                    showSearch
                    allowClear
                    loading={loadingProviders}
                    optionFilterProp="label"
                    placeholder="Chọn đơn vị giao"
                    options={providers
                      .filter(provider => provider?.id !== undefined && provider?.id !== null)
                      .map(provider => ({
                        value: provider.id,
                        label: [provider.code, provider.name].filter(Boolean).join(' - ')
                          || `Nhà cung cấp #${provider.id}`,
                      }))}
                  />
                </Form.Item>
              </Col>
              <Col lg={8} md={12} xs={24}>
                <Form.Item name="receivedAt" label={<span>Ngày nhận <b>*</b></span>}>
                  <DatePicker showTime format="DD/MM/YYYY · HH:mm" placeholder="Chọn ngày nhận" />
                </Form.Item>
              </Col>
              <Col lg={8} md={12} xs={24}>
                <Form.Item name="orderCode" label={<span>Mã đơn TO <b>*</b></span>}>
                  <Input readOnly placeholder="Mã đơn hàng" />
                </Form.Item>
              </Col>
              <Col lg={8} md={12} xs={24}>
                <Form.Item
                  name="orderDetailId"
                  label={<span>Đơn con cần nhập <b>*</b></span>}
                  rules={[{ required: true, message: 'Vui lòng chọn đơn con cần nhập kho' }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn đơn con cần nhập kho"
                    options={detailOptions}
                  />
                </Form.Item>
              </Col>
              <Col lg={8} md={12} xs={24}>
                <Form.Item name="lotNo" label={<span>Lô nội bộ <b>*</b></span>}>
                  <Input placeholder="Nhập mã lô nội bộ" />
                </Form.Item>
              </Col>
              <Col lg={8} md={12} xs={24}>
                <Form.Item name="item" label={<span>Mặt hàng <b>*</b></span>}>
                  <Select
                    disabled={!selectedDetail}
                    placeholder="Sản phẩm / SKU của đơn con"
                    options={selectedDetail ? [{
                      value: selectedDetail.id,
                      label: getDetailLabel(selectedDetail),
                    }] : []}
                  />
                </Form.Item>
              </Col>
              <Col lg={8} md={12} xs={24}>
                <Form.Item
                  name="quantity"
                  label={<span>SL thực nhận <b>*</b></span>}
                  extra={selectedDetail && !loadingWarehouseHistory
                    ? `Đã nhập ${formatQuantity(quantitySummary.importedQuantity)} / ${formatQuantity(quantitySummary.orderedQuantity)} · Còn lại ${formatQuantity(quantitySummary.remainingQuantity)}`
                    : undefined}
                  rules={[{
                    validator: (_, value) => {
                      if (loadingWarehouseHistory) {
                        return Promise.reject(new Error('Đang kiểm tra lịch sử nhập kho'))
                      }
                      if (!selectedDetail) {
                        return Promise.reject(new Error('Vui lòng chọn đơn con cần nhập kho'))
                      }
                      const numericValue = Number(value)
                      if (value == null || value === '' || !Number.isFinite(numericValue) || numericValue <= 0) {
                        return Promise.reject(new Error('Số lượng nhập phải lớn hơn 0'))
                      }
                      if (quantitySummary.remainingQuantity <= 0) {
                        return Promise.reject(new Error('Đơn con này đã được nhập đủ số lượng'))
                      }
                      if (numericValue > quantitySummary.remainingQuantity) {
                        return Promise.reject(new Error(
                          `Số lượng nhập không được vượt quá ${formatQuantity(quantitySummary.remainingQuantity)}`
                        ))
                      }
                      return Promise.resolve()
                    },
                  }]}
                >
                  <InputNumber
                    min={0.000001}
                    max={selectedDetail ? quantitySummary.remainingQuantity : undefined}
                    disabled={!selectedDetail
                      || loadingWarehouseHistory
                      || quantitySummary.remainingQuantity <= 0}
                    placeholder="Nhập số lượng"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </section>

          <section className="order-inbound-section">
            <div className="order-inbound-section__head"><span>2</span><h2>Kiểm tra nhanh</h2></div>
            <Form.List name="criteria">
              {(fields, { add, remove }) => (
                <div className="order-inbound-check-table">
                  <div className="order-inbound-check-row order-inbound-check-row--head">
                    <span>STT</span><span>Chỉ tiêu</span><span>Tiêu chuẩn</span><span>Kết quả đo</span><span>Đạt</span><span>Chỉ tiêu mặc định</span><span />
                  </div>
                  {fields.map((field, index) => (
                    <div className="order-inbound-check-row" key={field.key}>
                      <span className="order-inbound-check-index">{String(index + 1).padStart(2, '0')}</span>
                      <Form.Item name={[field.name, 'criterionId']}>
                        <Select
                          showSearch
                          allowClear
                          loading={loadingEvaluations}
                          optionFilterProp="label"
                          placeholder="Chọn hoặc thêm chỉ tiêu"
                          options={evaluationCriteria.map(item => ({
                            value: item.evaluationCriteriaId,
                            label: item.name || `Chỉ tiêu #${item.evaluationCriteriaId}`,
                          }))}
                          onChange={value => {
                            const criterion = evaluationCriteria.find(
                              item => item.evaluationCriteriaId === value
                            )
                            form.setFieldValue(
                              ['criteria', field.name, 'standard'],
                              criterion?.standard ?? null
                            )
                            form.setFieldValue(
                              ['criteria', field.name, 'initial'],
                              Boolean(criterion?.initial)
                            )
                          }}
                          dropdownRender={menu => (
                            <>
                              {menu}
                              <div style={{ display: 'flex', gap: 8, padding: 8 }}>
                                <Input
                                  value={newEvaluationName}
                                  placeholder="Tên chỉ tiêu mới"
                                  onChange={event => setNewEvaluationName(event.target.value)}
                                  onKeyDown={event => event.stopPropagation()}
                                />
                                <Button
                                  type="primary"
                                  icon={<PlusOutlined />}
                                  loading={savingEvaluation}
                                  onClick={handleSaveEvaluation}
                                >
                                  Thêm
                                </Button>
                              </div>
                            </>
                          )}
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, 'standard']}><Input placeholder="Nhập tiêu chuẩn" /></Form.Item>
                      <Form.Item name={[field.name, 'measuredValue']}><Input placeholder="Nhập kết quả đo" /></Form.Item>
                      <Form.Item name={[field.name, 'passed']} valuePropName="checked"><Checkbox /></Form.Item>
                      <Checkbox
                        checked={Boolean(criteria[field.name]?.initial)}
                        disabled={savingDefaultCriteria || !criteria[field.name]?.criterionId}
                        aria-label="Chỉ tiêu mặc định"
                        onChange={event => handleDefaultCriteriaChange(field.name, event.target.checked)}
                      />
                      <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa chỉ tiêu" onClick={() => remove(field.name)} />
                    </div>
                  ))}
                  <Button className="order-inbound-add-row" type="text" icon={<PlusOutlined />} onClick={() => add({ passed: false, initial: false })}>
                    Thêm chỉ tiêu
                  </Button>
                </div>
              )}
            </Form.List>
            <div className="order-inbound-summary">
              <div><small>Chỉ tiêu đạt</small><strong>{passedCriteria} / {criteria.length}</strong></div>
              <div><small>Kết quả</small><span>{criteria.length === 0 ? '—' : passedCriteria === criteria.length ? 'Đạt' : 'Chưa đạt'}</span></div>
            </div>
          </section>

          <section className="order-inbound-section">
            <div className="order-inbound-section__head"><span>3</span><h2>Ghi chú kiểm tra</h2></div>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="inspectionNote" label="Ghi chú">
                  <Input.TextArea rows={4} placeholder="Nhập tình trạng kiện hàng và ghi chú kiểm tra" />
                </Form.Item>
              </Col>
              <Col md={12} xs={24}>
                <Form.Item name="inspectorId" label={<span>Người kiểm <b>*</b></span>}>
                  <Select
                    showSearch
                    allowClear
                    loading={loadingUsers}
                    optionFilterProp="label"
                    placeholder="Chọn người kiểm"
                    options={businessUsers.map(user => ({
                      value: user.id,
                      label: user.fullName || user.name || user.ssoId || `Tài khoản #${user.id}`,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col md={12} xs={24}>
                <FormFileUpload
                  name="attachments"
                  label="Ảnh kèm theo"
                  accept="image/*"
                  folder="warehouse/inbound"
                  image
                  maxSizeMB={8}
                />
              </Col>
            </Row>
          </section>

          <section className="order-inbound-section">
            <div className="order-inbound-section__head"><span>4</span><h2>Nhập kho</h2></div>
            <Row gutter={16}>
              <Col lg={8} md={12} xs={24}>
                <Form.Item name="warehouseId" label={<span>Kho nhận <b>*</b></span>}>
                  <Select
                    showSearch
                    allowClear
                    loading={loadingWarehouses}
                    optionFilterProp="label"
                    placeholder="Chọn kho nhận"
                    options={warehouses.map(warehouse => ({
                      value: warehouse.id,
                      label: warehouse.name || `Kho #${warehouse.id}`,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col lg={8} md={12} xs={24}>
                <Form.Item name="binLocation" label={<span>Vị trí lưu <b>*</b></span>}>
                  <Input placeholder="VD: A3-K01-T2" />
                </Form.Item>
              </Col>
              <Col lg={8} md={12} xs={24}>
                <Form.Item label="SL nhập kho">
                  <Input readOnly value={quantity} placeholder="Tự lấy từ SL thực nhận" />
                </Form.Item>
              </Col>
              <Col lg={8} md={12} xs={24}>
                <Form.Item name="stockStatus" label="Trạng thái tồn">
                  <Select placeholder="Chọn trạng thái tồn" options={[]} />
                </Form.Item>
              </Col>
              <Col lg={8} md={12} xs={24}>
                <Form.Item name="effectiveDate" label="Ngày hiệu lực">
                  <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày hiệu lực" />
                </Form.Item>
              </Col>
            </Row>
          </section>

          <section className="order-inbound-section">
            <div className="order-inbound-section__head"><span>5</span><h2>Lịch sử chuyển kho</h2></div>
            <Table
              className="order-inbound-history"
              rowKey={item => item.id ?? `${item.receiptCode}-${item.createdDate}`}
              size="small"
              loading={loadingWarehouseHistory}
              columns={HISTORY_COLUMNS}
              dataSource={warehouseHistory}
              pagination={false}
              scroll={{ x: 1240 }}
              locale={{ emptyText: 'Chưa có lịch sử chuyển kho' }}
              rowClassName={item => (
                String(item.id) === String(selectedHistoryId) ? 'is-selected' : ''
              )}
              onRow={item => ({
                onClick: () => handleHistoryRowClick(item),
              })}
            />
          </section>
        </main>

        <footer className="order-inbound-footer">
          <div>
            <Button onClick={requestClose}>Hủy</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={submitting}
              disabled={loadingWarehouseHistory
                || Boolean(selectedDetail && quantitySummary.remainingQuantity <= 0)}
            >
              Xác nhận & nhập kho
            </Button>
          </div>
        </footer>
      </Form>
    </Drawer>
  )
}

export default OrderInboundDrawer
