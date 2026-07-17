import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Form, Select, message } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import {
  CustomButton,
  CustomButtonIcon,
  FormDatePicker,
  FormHidden,
  FormInputNumber,
  FormSelect,
} from '@flast-erp/core/components';
import { formatMoney } from '@flast-erp/core/utils';
import ProductionPage from './styles';
import { createSnowflakeId } from '@/utils/snowflake';

const formatOrderDate = (value) => {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('DD/MM/YYYY') : '-';
};

const getSkuSummary = (detail = {}) => (
  (detail.skuDetails ?? [])
    .flatMap(attribute => attribute.values ?? [])
    .map(value => value.text)
    .filter(Boolean)
    .join(', ')
);

const getDetailLabel = (detail = {}) => (
  [detail.code ?? `#${detail.id}`, getSkuSummary(detail)].filter(Boolean).join(' · ')
);

const ReadonlyField = ({ label, value, mono = false }) => (
  <div className="production-info-field">
    <div className="production-field-label">{label}</div>
    <div className={`production-readonly${mono ? ' mono' : ''}`}>
      <span className="production-readonly__value">{value || '-'}</span>
    </div>
  </div>
);

const CreateOrder = ({
  initialValues,
  mode = 'create',
  waitingOrders = [],
  waitingOrderLoading = false,
  onSearchWaitingOrders,
  onLoadMoreWaitingOrders,
  onNext,
  onCancel,
}) => {
  const readOnly = mode === 'view';
  const [form] = Form.useForm();
  const rowSequenceRef = useRef(0);
  const initializedEditRef = useRef(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productionRows, setProductionRows] = useState([]);
  const [productionOrderCode] = useState(() => (
    initialValues?.productionOrderCode || `LSX-${createSnowflakeId()}`
  ));
  const watchedProductDetails = Form.useWatch('productDetails', form) ?? {};

  const createProductionRow = useCallback((product = null) => {
    rowSequenceRef.current += 1;
    return {
      key: product?.id != null ? `detail-${product.id}` : `new-${rowSequenceRef.current}`,
      product,
    };
  }, []);

  useEffect(() => {
    if (!initialValues?.salesOrderId || initializedEditRef.current) return;
    const order = waitingOrders.find(item => String(item.id) === String(initialValues.salesOrderId))
      ?? initialValues?.order;
    if (!order) return;

    initializedEditRef.current = true;
    setSelectedOrder(order);
    setProductionRows((initialValues?.orderDetails ?? []).map(createProductionRow));
  }, [createProductionRow, initialValues?.salesOrderId, initialValues?.orderDetails, initialValues?.order, waitingOrders]);

  const selectedDetailIds = useMemo(() => new Set(
    productionRows.map(row => row.product?.id).filter(id => id != null).map(String),
  ), [productionRows]);

  const totalProductionQuantity = productionRows.reduce((total, row) => {
    if (!row.product?.id) return total;
    return total + Number(watchedProductDetails?.[String(row.product.id)]?.target ?? 0);
  }, 0);

  const handleOrderChange = (value) => {
    const order = waitingOrders.find(item => String(item.id) === String(value)) ?? null;
    setSelectedOrder(order);
    setProductionRows([]);
    form.setFieldsValue({ productDetails: undefined });
  };

  const addProductionRow = () => {
    if (!selectedOrder) {
      message.warning('Vui lòng chọn đơn hàng trước.');
      return;
    }
    if (selectedDetailIds.size >= (selectedOrder.details ?? []).length) {
      message.info('Tất cả mã đơn con đã được thêm.');
      return;
    }
    setProductionRows(current => [...current, createProductionRow()]);
  };

  const selectProductForRow = (rowKey, detailId) => {
    const product = (selectedOrder?.details ?? []).find(detail => String(detail.id) === String(detailId));
    if (!product) return;

    setProductionRows(current => current.map(row => (
      row.key === rowKey ? { ...row, product } : row
    )));
    const currentProductDetails = form.getFieldValue('productDetails') ?? {};
    if (!currentProductDetails[String(product.id)]) {
      form.setFieldValue(['productDetails', String(product.id)], {
        target: product.target,
        deadline: undefined,
      });
    }
  };

  const removeProductionRow = (rowKey) => {
    const removedRow = productionRows.find(row => row.key === rowKey);
    if (removedRow?.product?.id != null) {
      form.setFieldValue(['productDetails', String(removedRow.product.id)], undefined);
    }
    setProductionRows(current => current.filter(row => row.key !== rowKey));
  };

  const handleSubmit = (values) => {
    const selectedProducts = productionRows.map(row => row.product).filter(Boolean);
    if (selectedProducts.length === 0 || selectedProducts.length !== productionRows.length) {
      message.error('Vui lòng chọn đầy đủ mã đơn con cần sản xuất.');
      return;
    }

    const productDetails = Object.fromEntries(selectedProducts.map(product => [
      String(product.id),
      values.productDetails?.[String(product.id)] ?? {},
    ]));

    if (onNext) {
      onNext({
        ...initialValues,
        ...values,
        productionOrderCode,
        salesOrderCode: selectedOrder?.code,
        customerName: selectedOrder?.customerReceiverName,
        orderDetails: selectedProducts,
        productDetails,
      });
      return;
    }
    message.success('Đã tạo lệnh sản xuất');
  };

  const contact = [selectedOrder?.customerReceiverName, selectedOrder?.customerMobilePhone]
    .filter(Boolean)
    .join(' · ');

  return (
    <ProductionPage>
      <div className="production-card production-create-card">
        <header className="page-head production-create-head">
          <div className="production-create-crumb">
            <span>Kiểm soát sản xuất</span>
            <span>›</span>
            <span className="current">{mode === 'view' ? 'Chi tiết lệnh sản xuất' : mode === 'edit' ? 'Chỉnh sửa lệnh sản xuất' : 'Tạo lệnh sản xuất'}</span>
          </div>
          <h1>{mode === 'view' ? 'Chi tiết lệnh sản xuất' : mode === 'edit' ? 'Chỉnh sửa lệnh sản xuất' : 'Tạo lệnh sản xuất'}</h1>
          <div className="subtitle">
            Từ đơn TO · Bill of Materials · ISO 9001:2015 §8.5
          </div>
        </header>

        <Form
          form={form}
          disabled={readOnly}
          layout="vertical"
          initialValues={{ ...initialValues, productionOrderCode }}
          onFinish={handleSubmit}
        >
          <FormHidden name="productionOrderCode" />
          <div className="body production-create-body">
            <section className="section production-create-section">
              <div className="section-head">
                <span className="section-no">1</span>
                <h2>Đơn hàng khách</h2>
              </div>
              <div className="production-info-grid">
                <ReadonlyField label="Mã lệnh SX" value={productionOrderCode} mono />
                <div className="production-info-field">
                  <FormSelect
                    required
                    name="salesOrderId"
                    label="Đơn hàng TO"
                    placeholder="Chọn đơn hàng"
                    resourceData={waitingOrders}
                    valueProp="id"
                    titleProp="code"
                    loading={waitingOrderLoading}
                    showSearch
                    filterOption={false}
                    onSearch={onSearchWaitingOrders}
                    formatText={(code, item) => [code, item?.customerReceiverName].filter(Boolean).join(' · ')}
                    onChange={handleOrderChange}
                    onPopupScroll={(event) => {
                      const target = event.currentTarget;
                      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
                        onLoadMoreWaitingOrders?.();
                      }
                    }}
                  />
                </div>
                <ReadonlyField label="Khách hàng" value={selectedOrder?.customerReceiverName} />
                <ReadonlyField label="Người liên hệ" value={contact} />
                <ReadonlyField label="Ngày đặt hàng" value={formatOrderDate(selectedOrder?.createdAt)} mono />
                <ReadonlyField
                  label="Tổng giá trị đơn hàng"
                  value={selectedOrder ? formatMoney(selectedOrder.total ?? 0) : '-'}
                  mono
                />
              </div>
            </section>

            <section className="section production-create-section">
              <div className="section-head">
                <span className="section-no">2</span>
                <h2>Chọn mã đơn con cần sản xuất</h2>
              </div>
              <div className="production-child-hint">
                Thêm các mã đơn con thuộc đơn TO đã chọn. Với mỗi mã, nhập số lượng sản xuất và ngày dự kiến hoàn thành.
              </div>

              <div className="production-child-list">
                {productionRows.map((row, rowIndex) => {
                  const product = row.product;
                  const options = (selectedOrder?.details ?? [])
                    .filter(detail => String(detail.id) === String(product?.id) || !selectedDetailIds.has(String(detail.id)))
                    .map(detail => ({ value: detail.id, label: getDetailLabel(detail) }));

                  return (
                    <div className="production-child-card" key={row.key}>
                      <div className="production-child-card__top">
                        <Select
                          showSearch
                          optionFilterProp="label"
                          value={product?.id}
                          options={options}
                          placeholder="Chọn mã đơn con"
                          onChange={value => selectProductForRow(row.key, value)}
                          style={{ width: '100%' }}
                        />
                        {!readOnly && (
                          <CustomButtonIcon
                            title="Xóa mã đơn con"
                            icon={<DeleteOutlined />}
                            buttonProps={{ danger: true }}
                            handleClick={() => removeProductionRow(row.key)}
                          />
                        )}
                      </div>
                      {product && (
                        <div className="production-child-card__body">
                          <FormInputNumber
                            required
                            name={['productDetails', String(product.id), 'target']}
                            label="Số lượng sản xuất"
                            placeholder="Nhập số lượng sản xuất"
                            min={0.000001}
                            initialValue={product.target}
                            style={{ width: '100%' }}
                          />
                          <FormDatePicker
                            required
                            name={['productDetails', String(product.id), 'deadline']}
                            label="Ngày dự kiến hoàn thành"
                            placeholder="Chọn ngày hoàn thành"
                            format="DD/MM/YYYY"
                            disabledDate={current => (
                              current && current.startOf('day').isBefore(dayjs().startOf('day'))
                            )}
                            style={{ width: '100%' }}
                          />
                          {(product.skuDetails ?? []).map((attribute, attributeIndex) => (
                            <div className="production-child-attribute" key={`${product.id}-${attributeIndex}`}>
                              <span>{attribute.text}</span>
                              <strong>{(attribute.values ?? []).map(value => value.text).filter(Boolean).join(', ') || '-'}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                      {!product && <div className="production-child-empty">Chọn mã đơn con để nhập thông tin sản xuất.</div>}
                      <span className="production-child-index">#{rowIndex + 1}</span>
                    </div>
                  );
                })}
              </div>

              {!readOnly && (
                <CustomButton
                  title="Thêm mới"
                  icon={<PlusOutlined />}
                  variant="outlined"
                  color="primary"
                  htmlType="button"
                  inRigth={false}
                  disabled={!selectedOrder || selectedDetailIds.size >= (selectedOrder.details ?? []).length}
                  onClick={addProductionRow}
                />
              )}

              <div className="production-create-summary">
                <div className="production-create-metric">
                  <span>Mã đơn con đã thêm</span>
                  <strong>{productionRows.filter(row => row.product).length.toLocaleString('vi-VN')}</strong>
                </div>
                <div className="production-create-metric">
                  <span>Tổng SL sản xuất</span>
                  <strong>{totalProductionQuantity.toLocaleString('vi-VN')} sản phẩm</strong>
                </div>
              </div>
            </section>
          </div>

          <footer className="foot production-create-foot">
            <span className="foot-note">
              Chỉ các mã đơn con được chọn mới được gộp vào lệnh sản xuất này. BOM của sản phẩm phải ở trạng thái đang sử dụng.
            </span>
            <div className="actions">
              <CustomButton title={readOnly ? 'Đóng' : 'Hủy'} variant="outlined" color="default" inRigth={false} onClick={onCancel} />
              {!readOnly && (
                <CustomButton
                  title="Tiếp tục xác nhận vật tư"
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  inRigth={false}
                />
              )}
            </div>
          </footer>
        </Form>
      </div>
    </ProductionPage>
  );
};

export default CreateOrder;
