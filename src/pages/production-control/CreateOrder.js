import React, { useEffect, useState } from 'react';
import { Form, message } from 'antd';
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import {
  CustomButton,
  CustomButtonIcon,
  FormDatePicker,
  FormInput,
  FormSelect,
} from '@flast-erp/core/components';
import ProductionPage from './styles';
import { createSnowflakeId } from '@/utils/snowflake';

const CreateOrder = ({
  initialValues,
  waitingOrders = [],
  waitingOrderLoading = false,
  onSearchWaitingOrders,
  onLoadMoreWaitingOrders,
  onNext,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productionOrderCode] = useState(() => (
    initialValues?.productionOrderCode || `LSX-${createSnowflakeId()}`
  ));
  const notify = (text) => message.success(text);

  useEffect(() => {
    if (!initialValues?.salesOrderId) return
    const order = waitingOrders.find(item => String(item.id) === String(initialValues.salesOrderId))
    if (order) {
      setSelectedOrder(initialValues?.orderDetails
        ? { ...order, details: initialValues.orderDetails }
        : order)
    }
  }, [initialValues?.salesOrderId, initialValues?.orderDetails, waitingOrders])
  const handleSubmit = (values) => {
    if (onNext) {
      onNext({
        ...values,
        salesOrderCode: selectedOrder?.code,
        orderDetails: selectedOrder?.details ?? [],
      })
      return
    }
    notify('Đã tạo lệnh sản xuất')
  }

  return <ProductionPage>
    <div className="production-card">
      <header className="page-head">
        <div className="head-row"><div><h1>Tạo lệnh sản xuất</h1><div className="subtitle">WF2 Sản xuất · ISO 9001:2015 §8.5</div></div></div>
      </header>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ ...initialValues, productionOrderCode }}
        onFinish={handleSubmit}
      >
      <div className="body">
        <section className="section">
          <div className="section-head"><span className="section-no">1</span><h2>Đơn hàng khách</h2></div>
          <div className="grid">
            <FormInput
              name="productionOrderCode"
              label="Mã lệnh SX"
              readOnly
            />
            <FormSelect
              required
              name="salesOrderId"
              label="Đơn hàng chờ sản xuất"
              placeholder="Chọn đơn hàng"
              resourceData={waitingOrders}
              valueProp="id"
              titleProp="code"
              loading={waitingOrderLoading}
              showSearch
              filterOption={false}
              onSearch={onSearchWaitingOrders}
              formatText={(code, item) => [code, item?.customerReceiverName].filter(Boolean).join(' · ')}
              onChange={(value) => {
                const selectedOrder = waitingOrders.find(item => String(item.id) === String(value))
                setSelectedOrder(selectedOrder ?? null)
                form.setFieldValue('customerName', selectedOrder?.customerReceiverName)
                form.setFieldValue('productDetails', undefined)
                form.setFieldValue('fabricType', selectedOrder?.manufactureProduct?.material)
              }}
              onPopupScroll={(event) => {
                const target = event.currentTarget
                if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
                  onLoadMoreWaitingOrders?.()
                }
              }}
            />
            <FormInput name="customerName" label="Khách hàng" disabled />
          </div>
        </section>
        <section className="section">
          <div className="section-head"><span className="section-no">2</span><h2>Chi tiết sản xuất</h2></div>
          {!selectedOrder?.details?.length ? (
            <div className="empty-products">Chọn đơn hàng để xem chi tiết sản phẩm.</div>
          ) : selectedOrder.details.map((product, productIndex) => (
            <div className="product-block" key={product.id ?? productIndex}>
              <div className="product-block__title">
                <div>
                  <span>{product.productName || product.name || `Sản phẩm ${productIndex + 1}`}</span>
                  {product.code && <span className="product-block__code">{product.code}</span>}
                </div>
                <CustomButtonIcon
                  title="Xóa sản phẩm"
                  icon={<DeleteOutlined />}
                  buttonProps={{ danger: true, size: 'small' }}
                  handleClick={() => setSelectedOrder(current => ({
                    ...current,
                    details: current.details.filter((_, index) => index !== productIndex),
                  }))}
                />
              </div>
              <div className="grid">
                <FormInput
                  required
                  name={['productDetails', String(product.id ?? productIndex), 'quantity']}
                  label="Số lượng sản xuất"
                  placeholder="Nhập số lượng sản xuất"
                  initialValue={product.quantity}
                />
                <FormDatePicker
                  required
                  name={['productDetails', String(product.id ?? productIndex), 'deadline']}
                  label="Deadline giao hàng"
                  placeholder="Chọn deadline giao hàng"
                  format="DD/MM/YYYY"
                />
                {(product.skuDetails ?? []).map((attribute, attributeIndex) => (
                  <FormInput
                    key={`${product.id ?? productIndex}-${attributeIndex}`}
                    name={['productDetails', String(product.id ?? productIndex), 'skuDetails', attributeIndex]}
                    label={attribute.text}
                    initialValue={(attribute.values ?? []).map(value => value.text).filter(Boolean).join(', ')}
                    readOnly
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
      <footer className="foot"><span className="foot-note">Bước 1/2 · Sau khi tiếp tục, bạn cần xác nhận BOM và phân bổ vật tư.</span><div className="actions"><CustomButton title="Hủy" variant="outlined" color="default" inRigth={false} onClick={onCancel} /><CustomButton title="Tiếp tục xác nhận vật tư" type="primary" htmlType="submit" icon={<SaveOutlined />} inRigth={false} /></div></footer>
      </Form>
    </div>
  </ProductionPage>;
};

export default CreateOrder;
