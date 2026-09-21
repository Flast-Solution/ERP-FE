import React, { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from 'antd'
import {
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { FormSelectAPI } from '@flast-erp/core/components'
import { RequestUtils } from '@flast-erp/core/utils'
import FormFileUpload from '@/containers/PreviewModal/FormFileUpload'
import useDrawerLeaveGuard from '@/hooks/useDrawerLeaveGuard'
import './OrderInboundDrawer.less'

const USER_BUSINESS_API = '/auth/user-bussiness/list-user'
const WAREHOUSE_API = '/warehouse/fetch-stock'
const EVALUATION_LIST_API = 'evaluation/list'
const EVALUATION_SAVE_API = 'evaluation/save'
const EVALUATION_SAVE_LIST_API = '/evaluation/save-list'

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

const OrderInboundDrawer = ({ open, initialOrder, onClose }) => {
  const [form] = Form.useForm()
  const [businessUsers, setBusinessUsers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingWarehouses, setLoadingWarehouses] = useState(false)
  const [savingDefaultCriteria, setSavingDefaultCriteria] = useState(false)
  const { markDirty, requestClose } = useDrawerLeaveGuard({
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
  const quantityReceived = Form.useWatch('quantityReceived', form)
  const selectedDetail = useMemo(() => orderDetails.find(
    detail => String(detail?.id) === String(selectedDetailId)
  ), [orderDetails, selectedDetailId])
  const criteria = Form.useWatch('criteria', form) ?? []
  const passedCriteria = criteria.filter(item => item?.passed).length

  useEffect(() => {
    if (!open) return undefined

    let mounted = true
    setLoadingUsers(true)
    setLoadingWarehouses(true)

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

    RequestUtils.Get(`/${EVALUATION_LIST_API}`)
      .then(response => {
        console.log('[OrderInbound][evaluation/list response]', response)
      })
      .catch(error => {
        console.log('[OrderInbound][evaluation/list error]', error)
      })

    return () => {
      mounted = false
    }
  }, [open])

  const handleValuesChange = changedValues => {
    markDirty()

    if (Object.prototype.hasOwnProperty.call(changedValues, 'orderDetailId')) {
      const detail = orderDetails.find(
        item => String(item?.id) === String(changedValues.orderDetailId)
      )
      form.setFieldsValue({
        item: detail?.id,
        quantityReceived: detail?.quantity ?? undefined,
      })
    }
  }

  const handleSubmit = values => {
    const payload = {
      ...values,
      orderId: initialOrder?.id,
      orderDetailId: selectedDetail?.id ?? values.orderDetailId,
      orderDetailCode: selectedDetail?.code ?? selectedDetail?.key ?? null,
      productId: selectedDetail?.productId ?? null,
      skuId: selectedDetail?.skuId ?? null,
      receivedAt: values.receivedAt?.format?.('YYYY-MM-DD HH:mm:ss') ?? values.receivedAt ?? null,
      effectiveDate: values.effectiveDate?.format?.('YYYY-MM-DD') ?? values.effectiveDate ?? null,
      attachments: Array.isArray(values.attachments) ? values.attachments : [],
    }
    delete payload.item

    console.log('[OrderInbound][submit payload]', payload)
  }

  const handleSaveDefaultCriteria = async () => {
    const evaluationList = form.getFieldValue('criteria') ?? []

    setSavingDefaultCriteria(true)
    try {
      const response = await RequestUtils.Post(EVALUATION_SAVE_LIST_API, evaluationList)
      console.log('[OrderInbound][evaluation/save-list response]', response)
    } finally {
      setSavingDefaultCriteria(false)
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
                <Form.Item name="fromUnit" label={<span>Đơn vị giao <b>*</b></span>}>
                  <Input placeholder="Nhập đơn vị giao" />
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
                <Form.Item name="orderDetailId" label={<span>Đơn con cần nhập <b>*</b></span>}>
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
                <Form.Item name="quantityReceived" label={<span>SL thực nhận <b>*</b></span>}>
                  <InputNumber placeholder="Nhập số lượng" style={{ width: '100%' }} />
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
                    <span>STT</span><span>Chỉ tiêu</span><span>Tiêu chuẩn</span><span>Kết quả đo</span><span>Đạt</span><span />
                  </div>
                  {fields.map((field, index) => (
                    <div className="order-inbound-check-row" key={field.key}>
                      <span className="order-inbound-check-index">{String(index + 1).padStart(2, '0')}</span>
                      <FormSelectAPI
                        showSearch
                        allowClear
                        name={[field.name, 'criterionId']}
                        apiPath={EVALUATION_LIST_API}
                        apiAddNewItem={EVALUATION_SAVE_API}
                        isFetchOnMount={false}
                        onData={data => {
                          console.log('[OrderInbound][evaluation/list response data]', data)
                          return []
                        }}
                        valueProp="id"
                        titleProp="name"
                        searchKey="name"
                        placeholder="Chọn hoặc thêm chỉ tiêu"
                      />
                      <Form.Item name={[field.name, 'standard']}><Input placeholder="Nhập tiêu chuẩn" /></Form.Item>
                      <Form.Item name={[field.name, 'measuredValue']}><Input placeholder="Nhập kết quả đo" /></Form.Item>
                      <Form.Item name={[field.name, 'passed']} valuePropName="checked"><Checkbox /></Form.Item>
                      <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa chỉ tiêu" onClick={() => remove(field.name)} />
                    </div>
                  ))}
                  <div>
                    <Button className="order-inbound-add-row" type="text" icon={<PlusOutlined />} onClick={() => add({ passed: false })}>
                      Thêm chỉ tiêu
                    </Button>
                    <Button
                      type="text"
                      icon={<SaveOutlined />}
                      loading={savingDefaultCriteria}
                      onClick={handleSaveDefaultCriteria}
                    >
                      Lưu chỉ tiêu mặc định
                    </Button>
                  </div>
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
                  <Input readOnly value={quantityReceived} placeholder="Tự lấy từ SL thực nhận" />
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
        </main>

        <footer className="order-inbound-footer">
          <div>
            <Button onClick={requestClose}>Hủy</Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit">Xác nhận & nhập kho</Button>
          </div>
        </footer>
      </Form>
    </Drawer>
  )
}

export default OrderInboundDrawer
