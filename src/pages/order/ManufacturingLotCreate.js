import React, { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Spin,
  Typography,
} from 'antd';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useEffectAsync } from '@flast-erp/core/hooks';
import { RequestUtils, arrayNotEmpty, formatMoney, formatTime } from '@flast-erp/core/utils';
import { SUCCESS_CODE } from '@/configs';
import OrderService from '@/services/OrderService';
import styled from 'styled-components';

const { Text, Title } = Typography;

const CREATE_WAREHOUSE_PARCEL_API = '/qms/warehouse-paracel/create';
const PROVIDER_FETCH_API = '/provider/fetch';
const ORDER_LOTS_FIND_API = '/qms/warehouse-paracel/find-entity';
const WORKFLOW_FILTER_API = '/workflow/process/filter?limit=50&offset=0';

const DEFAULT_LOT_VALUES = {
  lotType: 'PRODUCTION',
  priority: 'HIGH',
};

const PageShell = styled.div`
  min-height: calc(100vh - 80px);
  padding: 16px 24px 0;
  background: #fff;

  @media (max-width: 767px) {
    padding: 12px;
  }
`;

const HeaderBlock = styled.div`
  margin-bottom: 28px;

  .ant-typography {
    margin-bottom: 0;
  }

  h2.ant-typography {
    margin-top: 12px;
    font-size: 28px;
    line-height: 1.2;
  }

  @media (max-width: 767px) {
    margin-bottom: 20px;

    h2.ant-typography {
      font-size: 24px;
    }
  }
`;

const MainLayout = styled.div`
  border-top: 1px solid #e5e7eb;

  @media (max-width: 991px) {
    border-top: 0;
  }
`;

const FormPanel = styled.div`
  min-height: calc(100vh - 210px);
  padding: 32px 32px 32px 0;
  border-right: 1px solid #e5e7eb;

  .ant-form-item-label > label {
    font-weight: 600;
    color: #111827;
  }

  .ant-input,
  .ant-input-number,
  .ant-picker,
  .ant-select-selector {
    min-height: 40px;
    border-color: #9ca3af !important;
    border-radius: 3px !important;
    background: #fff !important;
  }

  .ant-input-number,
  .ant-picker {
    width: 100%;
  }

  textarea.ant-input {
    min-height: 96px;
  }

  @media (max-width: 991px) {
    min-height: auto;
    padding: 0 0 24px;
    border-right: 0;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 26px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const ExistingLotsPanel = styled.div`
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ExistingLotsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  span {
    font-size: 13px;
    color: #6b7280;
  }
`;

const ExistingLotList = styled.div`
  display: grid;
  gap: 10px;
`;

const ExistingLotItem = styled.button`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${({ $active }) => ($active ? '#0b63ce' : '#d1d5db')};
  border-radius: 4px;
  background: ${({ $active }) => ($active ? '#eff6ff' : '#fff')};
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: #0b63ce;
    background: #eff6ff;
  }

  .lot-main {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    font-weight: 700;
    color: #111827;
  }

  .lot-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
    font-size: 12px;
    color: #6b7280;
  }
`;

const ExistingLotsEmpty = styled.div`
  padding: 16px;
  border: 1px dashed #d1d5db;
  border-radius: 4px;
  color: #6b7280;
  font-size: 13px;
`;

const LotBlock = styled.div`
  & + & {
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px dashed #d1d5db;
  }
`;

const LotBlockHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .lot-title {
    font-weight: 700;
    color: #111827;
  }

  .ant-btn {
    height: 32px;
    padding: 0 10px;
    border-radius: 4px;
  }
`;

const AddLotButton = styled(Button)`
  min-width: 180px;
  height: 44px;
  margin-top: 8px;
  border-radius: 4px;
  background: #0b63ce;
  box-shadow: 0 4px 10px rgba(11, 99, 206, 0.25);
  font-weight: 600;
`;

const SummaryPanel = styled.aside`
  position: sticky;
  top: 88px;
  padding: 32px 0 32px 32px;

  @media (max-width: 991px) {
    position: static;
    padding: 24px 0 32px;
    border-top: 1px solid #e5e7eb;
  }
`;

const SummaryTitle = styled.div`
  margin-bottom: 28px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const OrderLineHeader = styled.div`
  display: grid;
  grid-template-columns: 32px 1fr 56px 96px;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #111827;
`;

const OrderLine = styled.div`
  display: grid;
  grid-template-columns: 32px 1fr 56px 96px;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  color: #111827;

  .line-name {
    font-weight: 600;
  }

  .line-desc {
    margin-top: 8px;
    font-size: 11px;
    line-height: 1.5;
    color: #1f2937;
    text-transform: uppercase;
  }

  .line-qty,
  .line-money {
    text-align: right;
  }

  .line-money {
    font-weight: 700;
  }
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  color: #111827;

  strong {
    font-weight: 700;
  }

  &.total {
    margin-top: 16px;
    font-size: 16px;
    font-weight: 700;

    strong {
      color: #0b63ce;
    }
  }

  &.remaining {
    align-items: center;
    margin-top: 8px;
    padding: 8px;
    border: 1px solid #e5e7eb;
    font-weight: 700;

    strong {
      color: #0b63ce;
      font-size: 16px;
    }
  }
`;

const CompleteButton = styled(Button)`
  width: 100%;
  height: 44px;
  margin-top: 20px;
  border-radius: 4px;
  background: #0b63ce;
  box-shadow: 0 4px 10px rgba(11, 99, 206, 0.25);
  font-weight: 700;
`;

const normalizeOrderDetail = (detail = {}, index) => ({
  ...detail,
  key: detail.orderDetailId ?? detail.id ?? detail.code ?? index,
  orderDetailId: detail.orderDetailId ?? detail.id,
  orderDetailCode: detail.orderDetailCode ?? detail.code,
  productCode: detail.productCode ?? detail.product?.code,
  productName: detail.productName ?? detail.product?.name ?? detail.name,
  quantity: Number(detail.quantity ?? 0),
});

const getDetailTotal = (detail = {}) => Number(
  detail.totalPrice
  ?? detail.total
  ?? ((Number(detail.price ?? 0) * Number(detail.quantity ?? 0)) - Number(detail.discountAmount ?? 0))
  ?? 0,
);

const getOrderSubtotal = (order = {}, details = []) => Number(
  order.subtotal
  ?? order.total
  ?? details.reduce((sum, detail) => sum + getDetailTotal(detail), 0),
);

const buildDetailDescription = (detail = {}) => {
  const skuDetails = detail.mSkuDetails ?? detail.skuDetails ?? [];
  if (!Array.isArray(skuDetails) || skuDetails.length === 0) {
    return detail.description || '';
  }

  return skuDetails
    .map(item => `${item.name || item.title || ''}: ${item.value || item.text || ''}`.trim())
    .filter(Boolean)
    .join(' ');
};

const normalizeCompareText = value => String(value ?? '').trim().toLowerCase();

const getLotDetailRef = (lot = {}) => (
  lot.orderDetailId
  ?? lot.order_detail_id
  ?? lot.orderDetailCode
  ?? lot.order_detail_code
  ?? lot.orderDetailKey
  ?? lot.order_detail_key
);

const lotMatchesOrderDetail = (lot = {}, detail = {}) => {
  const lotRef = getLotDetailRef(lot);
  const detailRefs = [
    detail.key,
    detail.orderDetailId,
    detail.orderDetailCode,
  ].map(value => String(value ?? '')).filter(Boolean);

  if (lotRef && detailRefs.includes(String(lotRef))) {
    return true;
  }

  const lotCode = normalizeCompareText(lot.code);
  const detailCode = normalizeCompareText(detail.orderDetailCode);
  if (lotCode && detailCode && (lotCode === detailCode || lotCode.startsWith(detailCode))) {
    return true;
  }

  const lotName = normalizeCompareText(lot.name);
  const productName = normalizeCompareText(detail.productName);
  return Boolean(lotName && productName && lotName === productName);
};

const buildInitialLotValues = (lot, orderDetails = []) => {
  if (!lot?.id && !lot?.code && !lot?.name) {
    return { ...DEFAULT_LOT_VALUES };
  }

  const lotDetailRef = getLotDetailRef(lot);
  const matchedDetail = orderDetails.find(detail => lotMatchesOrderDetail(lot, detail));

  return {
    id: lot.id,
    lotName: lot.name,
    lotCode: lot.code,
    orderDetailKey: matchedDetail?.key ?? lotDetailRef,
    quantity: lot.total,
    prviderId: lot.prviderId ?? lot.providerId,
    workflowProcessId: lot.workflowProcessId ?? lot.processId ?? lot.workflowId ?? lot.process?.id ?? lot.workflowProcess?.id,
    plannedDate: lot.expectedDate ? moment(lot.expectedDate) : undefined,
    lotType: lot.type || DEFAULT_LOT_VALUES.lotType,
    priority: lot.priorityLevel || DEFAULT_LOT_VALUES.priority,
    note: lot.description,
  };
};

const resolveProviderList = (response) => {
  const payload = response?.data ?? response;
  const candidates = [
    payload?.embedded,
    payload?.data?.embedded,
    payload?.data?.content,
    payload?.data?.items,
    payload?.content,
    payload?.items,
    payload?.data,
    payload,
  ];

  return candidates.find(Array.isArray) ?? [];
};

const resolveOrderLots = (response) => {
  const payload = response?.data ?? response;
  const candidates = [
    payload?.data,
    payload?.data?.embedded,
    payload?.data?.content,
    payload?.data?.items,
    payload?.embedded,
    payload?.content,
    payload?.items,
    payload,
  ];

  const arrayData = candidates.find(Array.isArray);
  if (arrayData) return arrayData;

  const objectData = candidates.find(item => item && typeof item === 'object');
  if (objectData?.id || objectData?.code || objectData?.entityId) {
    return [objectData];
  }

  return [];
};

const resolveWorkflowList = (response) => {
  const payload = response?.data ?? response;
  const candidates = [
    payload?.embedded,
    payload?.data?.embedded,
    payload?.data?.content,
    payload?.content,
    payload?.items,
    payload?.data,
    payload,
  ];

  return candidates.find(Array.isArray) ?? [];
};

const ManufacturingLotCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const customerOrder = useMemo(
    () => location.state?.customerOrder ?? {},
    [location.state?.customerOrder],
  );
  const editingLot = location.state?.editingLot ?? null;
  const isEditing = Boolean(editingLot?.id);
  const orderDetails = useMemo(() => (
    (location.state?.orderDetails ?? customerOrder?.details ?? []).map(normalizeOrderDetail)
  ), [customerOrder?.details, location.state?.orderDetails]);
  const initialLotValues = useMemo(
    () => buildInitialLotValues(editingLot, orderDetails),
    [editingLot, orderDetails],
  );
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [loadingOrderInfo, setLoadingOrderInfo] = useState(false);
  const [providerOptions, setProviderOptions] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [createdLots, setCreatedLots] = useState([]);
  const [activeLot, setActiveLot] = useState(editingLot);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const isEditingActiveLot = Boolean(activeLot?.id);

  useEffectAsync(async () => {
    if (!customerOrder?.id) {
      setPaymentDetails([]);
      return;
    }

    setLoadingOrderInfo(true);
    try {
      const { data } = await OrderService.getOrderOnEdit(customerOrder.id);
      if (arrayNotEmpty(data)) {
        setPaymentDetails(data.map(normalizeOrderDetail));
      }
    } finally {
      setLoadingOrderInfo(false);
    }
  }, [customerOrder?.id]);

  useEffectAsync(async () => {
    setLoadingProviders(true);
    try {
      const response = await RequestUtils.Get(PROVIDER_FETCH_API, { limit: 100, offset: 0 });
      setProviderOptions(resolveProviderList(response)
        .map(provider => ({
          label: provider?.name || provider?.code || `Nhà cung cấp #${provider?.id}`,
          value: provider?.id,
        }))
        .filter(option => option.value !== undefined && option.value !== null));
    } catch (error) {
      message.error('Không tải được danh sách nhà cung cấp.');
      setProviderOptions([]);
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  useEffectAsync(async () => {
    setWorkflowLoading(true);
    try {
      const response = await RequestUtils.Get(WORKFLOW_FILTER_API, {});
      setWorkflows(resolveWorkflowList(response));
    } catch (error) {
      message.error('Không tải được danh sách workflow.');
      setWorkflows([]);
    } finally {
      setWorkflowLoading(false);
    }
  }, []);

  useEffectAsync(async () => {
    if (!customerOrder?.id) {
      setCreatedLots([]);
      return;
    }

    try {
      const response = await RequestUtils.Get(ORDER_LOTS_FIND_API, {
        entity: 'ORDER',
        entityId: customerOrder.id,
      });
      const lots = resolveOrderLots(response);
      const nextLots = lots;
      setCreatedLots(nextLots);
      setActiveLot(prev => {
        if (!prev?.id) return prev;
        return nextLots.find(lot => String(lot?.id) === String(prev.id)) ?? prev;
      });
    } catch (error) {
      setCreatedLots([]);
    }
  }, [customerOrder?.id]);

  const displayDetails = arrayNotEmpty(paymentDetails) ? paymentDetails : orderDetails;
  const productOptions = orderDetails.map(detail => ({
    label: `${detail.productName || 'Sản phẩm'}${detail.orderDetailCode ? ` - ${detail.orderDetailCode}` : ''}`,
    value: detail.key,
  }));
  const workflowOptions = workflows.map(workflow => ({
    value: workflow.id,
    label: `${workflow.name || '(Chưa đặt tên)'}${workflow.processKey ? ` - ${workflow.processKey}` : ''}`,
  }));

  const getSelectedDetail = useCallback((detailKey) => (
    orderDetails.find(detail => String(detail.key) === String(detailKey))
  ), [orderDetails]);

  const getCreatedQuantityByDetail = useCallback((detail, currentLotId) => {
    if (!detail) return 0;

    return createdLots.reduce((sum, lot) => {
      if (currentLotId && String(lot?.id) === String(currentLotId)) {
        return sum;
      }

      if (!lotMatchesOrderDetail(lot, detail)) {
        return sum;
      }

      return sum + Number(lot?.total ?? lot?.quantity ?? 0);
    }, 0);
  }, [createdLots]);

  const getDraftQuantityByDetail = useCallback((detailKey) => {
    const lots = form.getFieldValue('lots') ?? [];
    return lots.reduce((sum, lot) => (
      String(lot?.orderDetailKey ?? '') === String(detailKey ?? '')
        ? sum + Number(lot?.quantity ?? 0)
        : sum
    ), 0);
  }, [form]);

  const validateLotQuantity = useCallback((fieldName) => async (_, value) => {
    const lots = form.getFieldValue('lots') ?? [];
    const lot = lots[fieldName] ?? {};
    const detail = getSelectedDetail(lot.orderDetailKey);

    if (!detail) {
      return Promise.resolve();
    }

    const quantity = Number(value ?? 0);
    const detailQuantity = Number(detail.quantity ?? 0);
    if (quantity > detailQuantity) {
      return Promise.reject(new Error(`Số lượng trong lô không được lớn hơn ${detailQuantity}.`));
    }

    const createdQuantity = getCreatedQuantityByDetail(detail, lot.id);
    const draftQuantity = getDraftQuantityByDetail(lot.orderDetailKey);
    const totalQuantity = createdQuantity + draftQuantity;

    if (totalQuantity > detailQuantity) {
      const remainingQuantity = Math.max(detailQuantity - createdQuantity, 0);
      return Promise.reject(new Error(`Sản phẩm này còn lại ${remainingQuantity}. Tổng số lượng tạo lô không được lớn hơn ${detailQuantity}.`));
    }

    return Promise.resolve();
  }, [form, getCreatedQuantityByDetail, getDraftQuantityByDetail, getSelectedDetail]);

  const subtotal = getOrderSubtotal(customerOrder, displayDetails);
  const vatPercent = Number(customerOrder?.vat ?? 0);
  const shippingCost = Number(customerOrder?.shippingCost ?? 0);
  const priceOff = Number(customerOrder?.priceOff ?? 0);
  const paid = Number(customerOrder?.paid ?? 0);
  const vatMoney = subtotal * (vatPercent / 100);
  const grandTotal = subtotal + vatMoney + shippingCost;
  const remaining = grandTotal - paid - priceOff;

  const handleSelectCreatedLot = useCallback((lot) => {
    setActiveLot(lot);
    form.setFieldsValue({
      lots: [buildInitialLotValues(lot, orderDetails)],
    });
    form.validateFields([['lots', 0, 'quantity']]).catch(() => undefined);
  }, [form, orderDetails]);

  const handleCreateNewLot = useCallback(() => {
    setActiveLot(null);
    form.setFieldsValue({
      lots: [{ ...DEFAULT_LOT_VALUES }],
    });
  }, [form]);

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (error) {
      if (error?.errorFields?.length) {
        message.warning('Vui lòng kiểm tra lại thông tin lô hàng.');
        return;
      }
      message.error('Không kiểm tra được dữ liệu lô hàng.');
      return;
    }

    const lots = values.lots ?? [];

    if (!customerOrder?.id) {
      message.warning('Không tìm thấy ID đơn hàng để tạo lô hàng.');
      return;
    }

    if (!lots.length) {
      message.warning('Vui lòng thêm ít nhất 1 lô hàng.');
      return;
    }

    const payload = lots.map(lot => {
      const selectedDetail = getSelectedDetail(lot.orderDetailKey);
      const item = {
        name: lot.lotName,
        code: lot.lotCode || null,
        entity: 'ORDER',
        entityId: customerOrder.id,
        orderDetailId: selectedDetail?.orderDetailId ?? null,
        orderDetailCode: selectedDetail?.orderDetailCode ?? null,
        type: lot.lotType || DEFAULT_LOT_VALUES.lotType,
        total: Number(lot.quantity ?? 0),
        prviderId: lot.prviderId ?? null,
        processId: lot.workflowProcessId ?? null,
        workflowProcessId: lot.workflowProcessId ?? null,
        expectedDate: lot.plannedDate ? moment(lot.plannedDate).format('YYYY-MM-DD HH:mm:ss') : null,
        priorityLevel: lot.priority || DEFAULT_LOT_VALUES.priority,
      };

      if (lot.id) {
        item.id = lot.id;
      }

      return item;
    });

    try {
      const response = await RequestUtils.Post(CREATE_WAREHOUSE_PARCEL_API, payload);
      if (response?.errorCode === SUCCESS_CODE || response?.success) {
        message.success(response?.message || (isEditingActiveLot ? 'Đã cập nhật lô hàng.' : `Đã tạo ${payload.length} lô hàng.`));
        navigate('/sale/order-production');
        return;
      }
      message.error(response?.message || (isEditingActiveLot ? 'Cập nhật lô hàng thất bại.' : 'Tạo lô hàng thất bại.'));
    } catch (error) {
      message.error(isEditingActiveLot ? 'Cập nhật lô hàng thất bại.' : 'Tạo lô hàng thất bại.');
    }
  };

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
        initialValues={{ lots: [initialLotValues] }}
      >
        <MainLayout>
          <Row gutter={[32, 24]} align="top">
            <Col xs={24} lg={16}>
              <FormPanel>
                <ExistingLotsPanel>
                  <ExistingLotsHeader>
                    <div>
                      <h3>Danh sách lô hàng đã tạo</h3>
                      <span>Click vào lô hàng để chỉnh sửa thông tin bên dưới.</span>
                    </div>
                    {isEditingActiveLot ? (
                      <Button size="small" onClick={handleCreateNewLot}>
                        Tạo lô mới
                      </Button>
                    ) : null}
                  </ExistingLotsHeader>

                  {createdLots.length > 0 ? (
                    <ExistingLotList>
                      {createdLots.map((lot, index) => (
                        <ExistingLotItem
                          key={lot?.id ?? lot?.code ?? index}
                          type="button"
                          $active={String(activeLot?.id ?? '') === String(lot?.id ?? '')}
                          onClick={() => handleSelectCreatedLot(lot)}
                        >
                          <div className="lot-main">
                            <span>{lot?.name || `Lô hàng ${index + 1}`}</span>
                            <span>{lot?.code || '-'}</span>
                          </div>
                          <div className="lot-meta">
                            <span>Số lượng: {lot?.total ?? lot?.quantity ?? 0}</span>
                            <span>Loại: {lot?.type || '-'}</span>
                            <span>Ưu tiên: {lot?.priorityLevel || '-'}</span>
                            <span>Ngày dự kiến: {formatTime(lot?.expectedDate) || '-'}</span>
                          </div>
                        </ExistingLotItem>
                      ))}
                    </ExistingLotList>
                  ) : (
                    <ExistingLotsEmpty>Chưa có lô hàng nào được tạo cho đơn này.</ExistingLotsEmpty>
                  )}
                </ExistingLotsPanel>

                <SectionTitle>Cấu hình lô hàng</SectionTitle>
                <Form.List name="lots">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, index) => (
                        <LotBlock key={field.key}>
                          <Form.Item name={[field.name, 'id']} hidden>
                            <Input />
                          </Form.Item>
                          {fields.length > 1 ? (
                            <LotBlockHeader>
                              <span className="lot-title">Lô hàng {index + 1}</span>
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => remove(field.name)}
                              >
                                Xoá
                              </Button>
                            </LotBlockHeader>
                          ) : null}
                          <Row gutter={24}>
                            <Col xs={24} md={12}>
                              <Form.Item
                                name={[field.name, 'lotName']}
                                label="Tên lô hàng"
                                rules={[{ required: true, message: 'Vui lòng nhập tên lô hàng' }]}
                              >
                                <Input placeholder="Nhập tên lô hàng" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item name={[field.name, 'lotCode']} label="Mã lô hàng">
                                <Input placeholder="Tự sinh nếu để trống" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                name={[field.name, 'orderDetailKey']}
                                label="Chọn sản phẩm (Mã đơn con)"
                                rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
                              >
                                <Select
                                  placeholder="Chọn sản phẩm..."
                                  options={productOptions}
                                  showSearch
                                  optionFilterProp="label"
                                  onChange={() => {
                                    form.validateFields([['lots', field.name, 'quantity']]).catch(() => undefined);
                                  }}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                name={[field.name, 'quantity']}
                                label="Số lượng"
                                rules={[
                                  { required: true, message: 'Vui lòng nhập số lượng' },
                                  { validator: validateLotQuantity(field.name) },
                                ]}
                              >
                                <InputNumber min={1} placeholder="Nhập số lượng" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                name={[field.name, 'workflowProcessId']}
                                label="Workflow"
                                rules={[{ required: true, message: 'Vui lòng chọn workflow' }]}
                              >
                                <Select
                                  allowClear
                                  showSearch
                                  loading={workflowLoading}
                                  placeholder="Chọn workflow"
                                  options={workflowOptions}
                                  optionFilterProp="label"
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                name={[field.name, 'plannedDate']}
                                label="Ngày nhập lô"
                                rules={[{ required: true, message: 'Vui lòng chọn ngày nhập lô' }]}
                              >
                                <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item name={[field.name, 'prviderId']} label="Nhà cung cấp">
                                <Select
                                  allowClear
                                  showSearch
                                  loading={loadingProviders}
                                  placeholder="Chọn nhà cung cấp"
                                  options={providerOptions}
                                  optionFilterProp="label"
                                />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item name={[field.name, 'note']} label="Ghi chú">
                                <Input.TextArea rows={4} placeholder="Nhập ghi chú cho lô hàng" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </LotBlock>
                      ))}

                      <AddLotButton
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add({ ...DEFAULT_LOT_VALUES })}
                        disabled={isEditingActiveLot}
                      >
                        Thêm lô hàng
                      </AddLotButton>
                    </>
                  )}
                </Form.List>
              </FormPanel>
            </Col>

            <Col xs={24} lg={8}>
              <SummaryPanel>
                <SummaryTitle>
                  Thông tin đơn hàng #{customerOrder?.code || ''}
                </SummaryTitle>

                {loadingOrderInfo ? (
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <Spin />
                  </div>
                ) : (
                  <>
                    <OrderLineHeader>
                      <span>STT</span>
                      <span>Nội dung</span>
                      <span style={{ textAlign: 'right' }}>SL</span>
                      <span style={{ textAlign: 'right' }}>Thành tiền</span>
                    </OrderLineHeader>

                    {displayDetails.map((detail, index) => (
                      <OrderLine key={detail.key ?? index}>
                        <span>{index + 1}</span>
                        <div>
                          <div className="line-name">{detail.productName || '-'}</div>
                          {buildDetailDescription(detail) ? (
                            <div className="line-desc">{buildDetailDescription(detail)}</div>
                          ) : null}
                        </div>
                        <div className="line-qty">{detail.quantity || 0}</div>
                        <div className="line-money">{formatMoney(getDetailTotal(detail))}</div>
                      </OrderLine>
                    ))}

                    <Divider />

                    <SummaryRow>
                      <span>Chọn VAT</span>
                      <strong>VAT {vatPercent}%</strong>
                    </SummaryRow>
                    <SummaryRow>
                      <span>Phí vận chuyển</span>
                      <strong>{formatMoney(shippingCost)}</strong>
                    </SummaryRow>
                    <SummaryRow>
                      <span>Tổng đơn</span>
                      <strong>{formatMoney(subtotal)}</strong>
                    </SummaryRow>
                    <SummaryRow>
                      <span>VAT</span>
                      <strong>{formatMoney(vatMoney)}</strong>
                    </SummaryRow>
                    <SummaryRow className="total">
                      <span>Tổng chi phí</span>
                      <strong>{formatMoney(grandTotal)}</strong>
                    </SummaryRow>

                    <Divider />

                    <SummaryRow>
                      <span>Chiết khấu</span>
                      <strong>{formatMoney(priceOff)}</strong>
                    </SummaryRow>
                    <SummaryRow>
                      <span>Đã thanh toán</span>
                      <strong>{formatMoney(paid)}</strong>
                    </SummaryRow>
                    <SummaryRow className="remaining">
                      <span>Còn lại</span>
                      <strong>{formatMoney(remaining)}</strong>
                    </SummaryRow>

                    <CompleteButton
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={handleSubmit}
                    >
                      {isEditingActiveLot ? 'Cập nhật' : 'Hoàn thành'}
                    </CompleteButton>
                  </>
                )}

                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/sale/order-production')}
                  style={{ marginTop: 12, width: '100%' }}
                >
                  Quay lại
                </Button>
              </SummaryPanel>
            </Col>
          </Row>
        </MainLayout>
      </Form>
    </PageShell>
  );
};

export default ManufacturingLotCreate;
