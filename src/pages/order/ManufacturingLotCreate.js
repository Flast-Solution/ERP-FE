import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet'
import { useLocation, useNavigate } from 'react-router-dom'
import { Col, Form, message, Row, Typography } from 'antd'
import { BreadcrumbCustom } from '@flast-erp/core/components'
import { arrayNotEmpty, RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'

import { CREATE_WAREHOUSE_PARCEL_API, DEFAULT_LOT_VALUES } from './manufacturingLot/constants'
import {
  buildInitialLotValues,
  buildLotPayload,
  normalizeOrderDetails,
} from './manufacturingLot/helpers'
import { useManufacturingLotData } from './manufacturingLot/hooks/useManufacturingLotData'
import { useLotQuantityValidation } from './manufacturingLot/hooks/useLotQuantityValidation'
import ExistingLotsSection from './manufacturingLot/components/ExistingLotsSection'
import LotConfigurationForm from './manufacturingLot/components/LotConfigurationForm'
import OrderSummaryPanel from './manufacturingLot/components/OrderSummaryPanel'
import {
  FormPanel,
  HeaderBlock,
  MainLayout,
  PageShell,
} from './manufacturingLot/styles'

const { Text, Title } = Typography

const ManufacturingLotCreate = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()

  const customerOrder = useMemo(
    () => location.state?.customerOrder ?? {},
    [location.state?.customerOrder],
  )
  const initialEditingLot = location.state?.editingLot ?? null

  const [activeLot, setActiveLot] = useState(initialEditingLot)
  const [submitting, setSubmitting] = useState(false)

  const orderDetails = useMemo(
    () => normalizeOrderDetails(location.state?.orderDetails ?? customerOrder?.details),
    [customerOrder?.details, location.state?.orderDetails],
  )

  const data = useManufacturingLotData(customerOrder?.id)
  const { getSelectedDetail, validateLotQuantity } = useLotQuantityValidation({
    form,
    orderDetails,
    createdLots: data.createdLots,
  })

  const isEditing = Boolean(activeLot?.id)

  const displayDetails = arrayNotEmpty(data.paymentDetails)
    ? data.paymentDetails
    : orderDetails

  const productOptions = useMemo(() => (
    orderDetails.map(detail => ({
      label: `${detail.productName || 'Sản phẩm'}${detail.orderDetailCode ? ` - ${detail.orderDetailCode}` : ''}`,
      value: detail.key,
    }))
  ), [orderDetails])

  const workflowOptions = useMemo(() => (
    data.workflows.map(workflow => ({
      value: workflow.id,
      label: `${workflow.name || '(Chưa đặt tên)'}${workflow.processKey ? ` - ${workflow.processKey}` : ''}`,
    }))
  ), [data.workflows])

  useEffect(() => {
    setActiveLot((previous) => {
      if (!previous?.id) return previous
      return data.createdLots.find(lot => String(lot?.id) === String(previous.id)) ?? previous
    })
  }, [data.createdLots])

  useEffect(() => {
    if (!activeLot?.id) return

    form.setFieldsValue({
      lots: [buildInitialLotValues(activeLot, orderDetails)],
    })
    form.validateFields([['lots', 0, 'quantity']]).catch(() => undefined)
  }, [activeLot, form, orderDetails])

  const handleSelectCreatedLot = useCallback((lot) => {
    setActiveLot(lot)
  }, [])

  const handleCreateNewLot = useCallback(() => {
    setActiveLot(null)
    form.setFieldsValue({
      lots: [{ ...DEFAULT_LOT_VALUES }],
    })
  }, [form])

  const handleSubmit = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch (error) {
      if (error?.errorFields?.length) {
        message.warning('Vui lòng kiểm tra lại thông tin lô hàng.')
        return
      }
      message.error('Không kiểm tra được dữ liệu lô hàng.')
      return
    }

    const lots = values.lots ?? []

    if (!customerOrder?.id) {
      message.warning('Không tìm thấy ID đơn hàng để tạo lô hàng.')
      return
    }

    if (!lots.length) {
      message.warning('Vui lòng thêm ít nhất 1 lô hàng.')
      return
    }

    const payload = lots.map(lot => buildLotPayload({
      lot,
      customerOrder,
      selectedDetail: getSelectedDetail(lot.orderDetailKey),
    }))

    setSubmitting(true)
    try {
      const response = await RequestUtils.Post(CREATE_WAREHOUSE_PARCEL_API, payload)
      if (response?.errorCode === SUCCESS_CODE || response?.success) {
        message.success(
          response?.message
          || (isEditing ? 'Đã cập nhật lô hàng.' : `Đã tạo ${payload.length} lô hàng.`),
        )
        navigate('/sale/order-production')
        return
      }
      message.error(response?.message || (isEditing ? 'Cập nhật lô hàng thất bại.' : 'Tạo lô hàng thất bại.'))
    } catch (error) {
      message.error(isEditing ? 'Cập nhật lô hàng thất bại.' : 'Tạo lô hàng thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell>
      <Helmet>
        <title>{isEditing ? 'Chỉnh sửa lô hàng' : 'Tạo lô hàng'}</title>
      </Helmet>

      <HeaderBlock>
        <BreadcrumbCustom
          data={[
            { title: 'Trang chủ' },
            { title: 'Quản lý lô hàng' },
            { title: isEditing ? 'Chỉnh sửa lô hàng' : 'Tạo lô hàng' },
          ]}
        />
        <Title level={2}>{isEditing ? 'Chỉnh sửa lô hàng' : 'Tạo lô hàng'}</Title>
        <Text>Chọn sản phẩm trong đơn đang sản xuất và khai báo thông tin lô hàng.</Text>
      </HeaderBlock>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          lots: [buildInitialLotValues(initialEditingLot, orderDetails)],
        }}
      >
        <MainLayout>
          <Row gutter={[32, 24]} align="top">
            <Col xs={24} lg={16}>
              <FormPanel>
                <ExistingLotsSection
                  lots={data.createdLots}
                  activeLotId={activeLot?.id}
                  allowCreateNew={isEditing}
                  onSelect={handleSelectCreatedLot}
                  onCreateNew={handleCreateNewLot}
                />
                <LotConfigurationForm
                  form={form}
                  productOptions={productOptions}
                  workflowOptions={workflowOptions}
                  providerOptions={data.providerOptions}
                  loadingProviders={data.loadingProviders}
                  workflowLoading={data.workflowLoading}
                  isEditing={isEditing}
                  validateLotQuantity={validateLotQuantity}
                />
              </FormPanel>
            </Col>

            <Col xs={24} lg={8}>
              <OrderSummaryPanel
                order={customerOrder}
                details={displayDetails}
                loading={data.loadingOrderInfo}
                submitting={submitting}
                isEditing={isEditing}
                onSubmit={handleSubmit}
                onBack={() => navigate('/sale/order-production')}
              />
            </Col>
          </Row>
        </MainLayout>
      </Form>
    </PageShell>
  )
}

export default ManufacturingLotCreate
