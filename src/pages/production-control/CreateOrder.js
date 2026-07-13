import React, { useEffect, useState } from 'react';
import { Form, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import {
  CustomButton,
  FormInput,
  FormSelect,
} from '@flast-erp/core/components';
import ProductionPage from './styles';

const CreateOrder = ({
  initialValues,
  waitingOrders = [],
  waitingOrderLoading = false,
  onLoadMoreWaitingOrders,
  onNext,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const notify = (text) => message.success(text);

  useEffect(() => {
    if (!initialValues?.salesOrderId) return
    const order = waitingOrders.find(item => String(item.id) === String(initialValues.salesOrderId))
    if (order) setSelectedOrder(order)
  }, [initialValues?.salesOrderId, waitingOrders])
  const handleSubmit = (values) => {
    if (onNext) {
      onNext(values)
      return
    }
    notify('Đã tạo lệnh sản xuất')
  }

  return <ProductionPage>
    <div className="production-card">
      <header className="page-head">
        <div className="head-row"><div><h1>Tạo lệnh sản xuất</h1><div className="subtitle">WF2 Sản xuất · ISO 9001:2015 §8.5</div></div></div>
      </header>
      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleSubmit}>
      <div className="body">
        <section className="section">
          <div className="section-head"><span className="section-no">1</span><h2>Đơn hàng khách</h2></div>
          <div className="grid">
            <FormInput name="productionOrderCode" label="Mã lệnh SX" placeholder="Nhập mã lệnh sản xuất" />
            <FormSelect
              required
              name="salesOrderId"
              label="Đơn hàng chờ sản xuất"
              placeholder="Chọn đơn hàng"
              resourceData={waitingOrders}
              valueProp="id"
              titleProp="code"
              loading={waitingOrderLoading}
              formatText={(code, item) => [code, item?.customerReceiverName].filter(Boolean).join(' · ')}
              onChange={(value) => {
                const selectedOrder = waitingOrders.find(item => String(item.id) === String(value))
                setSelectedOrder(selectedOrder ?? null)
                form.setFieldValue('customerName', selectedOrder?.customerReceiverName)
              }}
              onPopupScroll={(event) => {
                const target = event.currentTarget
                if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
                  onLoadMoreWaitingOrders?.()
                }
              }}
            />
            <FormInput name="customerName" label="Khách hàng" placeholder="Nhập khách hàng" />
            <FormInput name="fabricType" label="Loại vải" placeholder="Nhập loại vải" />
          </div>
        </section>
        <section className="section">
          <div className="section-head"><span className="section-no">2</span><h2>Chi tiết sản xuất</h2></div>
          {!selectedOrder?.details?.length ? (
            <div className="empty-products">Chọn đơn hàng để xem chi tiết sản phẩm.</div>
          ) : selectedOrder.details.map((product, productIndex) => (
            <div className="product-block" key={product.id ?? productIndex}>
              <div className="product-block__title">
                <span>{product.productName || product.name || `Sản phẩm ${productIndex + 1}`}</span>
                {product.code && <span className="product-block__code">{product.code}</span>}
              </div>
              <div className="grid">
                {(product.skuDetails ?? []).map((attribute, attributeIndex) => (
                  <FormInput
                    key={`${product.id ?? productIndex}-${attributeIndex}`}
                    name={['productDetails', productIndex, 'skuDetails', attributeIndex]}
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
