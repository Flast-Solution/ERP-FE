/**************************************************************************/
/*  ModalNhapKho.js                                                       */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Button, Col, Empty, Form, message, Row, Table, Tag } from 'antd';
import { ExportOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useReactToPrint } from 'react-to-print';
import {
  FormContextCustom,
  FormSelectInfiniteProduct,
  BtnSubmit,
  FormInput,
  FormSelect,
	FormInputNumber,
	FormSelectInfiniteProvider,
  FormInfiniteStock,
  FormHidden
} from "@flast-erp/core/components";

import InStockTable from '@/containers/WareHouse/InStockTable'
import { ShowSkuDetail } from '@/containers/Product/SkuView';
import { isEmpty } from 'lodash';
import { InAppEvent, RequestUtils, createMSkuDetails } from '@flast-erp/core/utils';
import { useEffectAsync } from '@flast-erp/core/hooks';
import { HASH_MODAL } from '@/configs';
import useGetMe from '@/hooks/useGetMe';
import './ModalNhapKho.less';

const displayValue = value => (
  value === undefined || value === null || value === '' ? '—' : value
);

const formatDateTime = value => {
  if (!value) return '—';
  const date = dayjs(value);
  return date.isValid() ? date.format('DD/MM/YYYY · HH:mm') : value;
};

const formatQuantity = (value, unit) => {
  if (value === undefined || value === null || value === '') return '—';
  const number = Number(value);
  const formatted = Number.isFinite(number) ? number.toLocaleString('vi-VN') : value;
  return [formatted, unit].filter(Boolean).join(' ');
};

const formatCurrency = (value, currency) => {
  if (value === undefined || value === null || value === '') return '—';
  return Number(value).toLocaleString(currency === 'USD' ? 'en-US' : 'vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
    maximumFractionDigits: currency === 'USD' ? 2 : 0
  });
};

const parseCriteria = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseSkuInfo = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getArrayData = response => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.embedded)) return response.data.embedded;
  return [];
};

const DetailItem = ({ label, value, mono = false, wide = false }) => (
  <div className={`warehouse-receipt-detail__item${wide ? ' warehouse-receipt-detail__item--wide' : ''}`}>
    <span>{label}</span>
    <strong className={mono ? 'warehouse-receipt-detail__mono' : undefined}>
      {displayValue(value)}
    </strong>
  </div>
);

const SectionHeader = ({ number, title, extra }) => (
  <div className="warehouse-receipt-detail__section-head">
    <span className="warehouse-receipt-detail__section-number">{number}</span>
    <h3>{title}</h3>
    {extra}
  </div>
);

const getFormValues = (model = {}) => ({
  id: model?.id ?? null,
  productId: model?.productId ?? model?.product?.id ?? null,
  skuId: model?.skuId ?? model?.sku?.id ?? model?.skuDetailCode ?? null,
  quantity: model?.quantity ?? null,
  providerId: model?.providerId ?? model?.provider?.id ?? null,
  providerOrderCode: model?.providerOrderCode ?? null,
  stockId: model?.stockId ?? model?.warehouseId ?? model?.stock?.id ?? null
});

const ModalNhapKho = ({
  product,
  onSave,
  data,
  closeModal
}) => {

  const [ form ] = Form.useForm();
  const printRef = useRef(null);
  const { hasPermission } = useGetMe();
  const canCreateDelivery = hasPermission('inventory.delivery.create');
  const [ inStocks, setInStocks ] = useState([]);
  const [ selectedInStockId, setSelectedInStockId ] = useState(null);
  const [ evaluationCriteria, setEvaluationCriteria ] = useState([]);
  const [ businessUsers, setBusinessUsers ] = useState([]);
  const [ skus, setSkus ] = useState([]);
  const [ record, setRecord ] = useState({});
  const model = useMemo(() => data?.model ?? data?.record ?? {}, [data]);
  const mode = data?.mode ?? 'create';
  const readOnly = mode === 'view';
  const isEdit = mode === 'edit' || Boolean(model?.id);
  const [ mProduct, setProduct ] = useState(product || data?.product || model?.product || {});
  const [ sku, setSkuDetail ] = useState();
  const handleSave = onSave || data?.onSave;
  const evaluationNameById = useMemo(() => new Map(
    evaluationCriteria.map(item => [String(item.evaluationCriteriaId), item.name])
  ), [evaluationCriteria]);
  const userNameById = useMemo(() => new Map(
    businessUsers.map(user => [String(user.id), user.fullName])
  ), [businessUsers]);
  const printReceipt = useReactToPrint({
    contentRef: printRef,
    documentTitle: `phieu-nhap-kho-${model?.id ?? ''}`
  });

  useEffect(() => {
    const values = getFormValues(model);
    form.setFieldsValue(values);
    setRecord(model);
  }, [form, model]);

  useEffectAsync(async () => {
    const productId = model?.productId ?? model?.product?.id ?? product?.id;
    if (!productId) {
      return;
    }

    let selectedProduct = product || model?.product;
    if (!Array.isArray(selectedProduct?.skus) || selectedProduct.skus.length === 0) {
      const response = await RequestUtils.Get('/product/find-by-id', { id: productId });
      if (response?.errorCode === 200) {
        selectedProduct = response.data;
      }
    }

    if (!selectedProduct) {
      return;
    }

    const selectedSkuId = model?.skuId ?? model?.sku?.id ?? model?.skuDetailCode;
    const productSkus = Array.isArray(selectedProduct?.skus) ? selectedProduct.skus : [];
    setProduct(selectedProduct);
    setSkus(productSkus);
    setSkuDetail(productSkus.find(item => String(item?.id) === String(selectedSkuId)));
  }, [model, product]);

  useEffectAsync(async () => {
    if (!model?.id) {
      setInStocks([]);
      setSelectedInStockId(null);
      return;
    }

    const historyParams = model?.orderId
      ? { orderId: model.orderId, isFull: 'True' }
      : { warehouseId: model.id, isFull: 'True' };
    const response = await RequestUtils.Get('/erp/warehouse/fetch-history', historyParams);
    const historyItems = Array.isArray(response?.data?.embedded)
      ? response.data.embedded
      : [];

    const relevantHistory = historyItems
      .filter(item => String(item?.warehouserProductId) === String(model.id))
      .map(item => {
        const skuDetails = parseSkuInfo(item?.skuInfo);
        return {
          ...item,
          skuDetails,
          skuName: skuDetails
            .flatMap(detail => detail?.values ?? [])
            .map(value => value?.text)
            .filter(Boolean)
            .join(' - ')
        };
      });

    setInStocks(relevantHistory);
    setSelectedInStockId(relevantHistory[0]?.id ?? null);
  }, [model]);

  useEffect(() => {
    if (!readOnly) return undefined;

    let mounted = true;
    Promise.all([
      RequestUtils.Get('/evaluation/list').catch(() => []),
      RequestUtils.Get('/auth/user-bussiness/list-user').catch(() => [])
    ])
      .then(([evaluationResponse, userResponse]) => {
        if (!mounted) return;
        setEvaluationCriteria(getArrayData(evaluationResponse));
        setBusinessUsers(getArrayData(userResponse));
      })
      .catch(() => {
        if (!mounted) return;
        setEvaluationCriteria([]);
        setBusinessUsers([]);
      });

    return () => {
      mounted = false;
    };
  }, [readOnly]);

  const onFinish = useCallback(async (values) => {
    const mSkuDetails = sku
      ? createMSkuDetails(sku?.skuDetails ?? [])
      : (model?.mSkuDetails ?? model?.skuDetails ?? []);
    const { skuId } = values;

    const skuName = mProduct?.skus?.find(item => String(item?.id) === String(skuId))?.name
      || model?.skuName
      || '';
    const submitModel = {
      ...values,
      ...(isEdit ? { id: model.id } : {}),
      skuName
    };
    const endpoint = isEdit ? '/warehouse/updated' : '/warehouse/created';

    const { message: msg, data: responseData, errorCode } = await RequestUtils.Post(
      endpoint,
      { model: submitModel, mSkuDetails }
    );
    if (errorCode !== 200) {
      message.error(msg);
      return;
    }
    message.success(msg);
    handleSave?.({ data: responseData, errorCode });
    closeModal?.();
  }, [closeModal, handleSave, isEdit, model, sku, mProduct]);

  const onChangeGetSelectedItem = (value, nProduct) => {
    setSkus(nProduct?.skus || []);
    setProduct(nProduct);
    form.resetFields(['skuId']);
  };

  const onChangeGetSelectedSku = (value, item) => {
    setSkuDetail(item);
  };

  const memoSkuDetail = React.useMemo(() => {
    if(isEmpty(sku)) {
      return <span />;
    }
    const mSkuDetails = createMSkuDetails(sku.skuDetails ?? []);
    return <ShowSkuDetail skuDetails={mSkuDetails} />
  }, [sku]);

  const updateRecord = useCallback((values) => {
    setRecord(pre => ({ ...pre, ...values }));
  }, []);

  if (readOnly) {
    const receiptDetail = inStocks.find(item => item.id === selectedInStockId)
      ?? inStocks[0]
      ?? null;
    const unit = model?.product?.unit;
    const currency = model?.product?.currency;
    const productLabel = [model?.product?.code, model?.product?.name]
      .filter(Boolean)
      .join(' · ');
    const criteria = parseCriteria(receiptDetail?.criteria);
    const attachments = parseCriteria(receiptDetail?.attachments);
    const passedCriteria = criteria.filter(item => item?.passed === true).length;
    const criteriaColumns = [
      {
        title: 'STT',
        width: 60,
        render: (_, item, index) => String(index + 1).padStart(2, '0')
      },
      {
        title: 'Chỉ tiêu',
        dataIndex: 'criterionId',
        render: criterionId => displayValue(evaluationNameById.get(String(criterionId)))
      },
      {
        title: 'Tiêu chuẩn',
        dataIndex: 'standard',
        render: displayValue
      },
      {
        title: 'Kết quả',
        dataIndex: 'measuredValue',
        render: displayValue
      },
      {
        title: 'Đánh giá',
        dataIndex: 'passed',
        width: 110,
        align: 'center',
        render: passed => (
          <Tag color={passed === true ? 'success' : 'error'}>
            {passed === true ? 'Đạt' : 'Chưa đạt'}
          </Tag>
        )
      }
    ];
    const openCreateDelivery = () => {
      closeModal?.();
      setTimeout(() => InAppEvent.emit(HASH_MODAL, {
        hash: '#warehouse.delivery',
        title: 'Tạo lệnh xuất kho',
        data: {
          itemInStock: model,
          receiptDetail,
          inStocks,
          skuId: model?.skuId
        }
      }), 0);
    };

    return (
      <div className="warehouse-receipt-detail" ref={printRef}>
        <section className="warehouse-receipt-detail__section">
          <SectionHeader number="1" title="Thông tin đơn nhập" />
          <div className="warehouse-receipt-detail__grid">
            <DetailItem label="Đơn vị giao" value={model?.providerName} />
            <DetailItem label="Ngày nhận" value={formatDateTime(receiptDetail?.receivedAt)} mono />
            <DetailItem label="Mặt hàng" value={productLabel} />
            <DetailItem label="Mã phiếu" value={receiptDetail?.receiptCode} mono />
            <DetailItem label="Mã đơn" value={receiptDetail?.orderCode} mono />
            <DetailItem label="Đơn con" value={receiptDetail?.orderDetailCode} mono />
            <DetailItem label="Lô nội bộ" value={receiptDetail?.lotNo} mono />
            <DetailItem label="SL thực nhận" value={formatQuantity(receiptDetail?.quantity, unit)} mono />
            <DetailItem
              label="Người kiểm"
              value={userNameById.get(String(receiptDetail?.inspectorId))}
            />
          </div>
        </section>

        <section className="warehouse-receipt-detail__section">
          <SectionHeader
            number="2"
            title="Kết quả kiểm tra nhanh"
            extra={criteria.length > 0 ? (
              <Tag className="warehouse-receipt-detail__result" color={passedCriteria === criteria.length ? 'success' : 'error'}>
                Đạt {passedCriteria} / {criteria.length}
              </Tag>
            ) : null}
          />
          {criteria.length > 0 ? (
            <Table
              rowKey={(item, index) => item?.criterionId ?? index}
              columns={criteriaColumns}
              dataSource={criteria}
              pagination={false}
              bordered
              size="small"
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có kết quả kiểm tra nhanh"
            />
          )}
          {receiptDetail?.inspectionNote ? (
            <div className="warehouse-receipt-detail__note">{receiptDetail.inspectionNote}</div>
          ) : null}
          {attachments.length > 0 ? (
            <div className="warehouse-receipt-detail__attachments">
              {attachments.map(file => (
                <span key={file}>{String(file).split('/').pop()}</span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="warehouse-receipt-detail__section">
          <SectionHeader number="3" title="Tồn kho hiện tại" />
          <div className="warehouse-receipt-detail__grid">
            <DetailItem label="Kho nhận" value={receiptDetail?.stockName} />
            <DetailItem label="Vị trí lưu" value={receiptDetail?.binLocation} mono />
            <DetailItem label="Ngày hiệu lực" value={formatDateTime(receiptDetail?.effectiveDate)} mono />
          </div>
          <div className="warehouse-receipt-detail__metrics">
            <div>
              <span>Đã nhập</span>
              <strong>{formatQuantity(model?.total, unit)}</strong>
            </div>
            <div>
              <span>Tồn hiện tại</span>
              <strong className="warehouse-receipt-detail__metric-highlight">
                {formatQuantity(model?.quantity, unit)}
              </strong>
            </div>
            <div>
              <span>Phí nhập kho</span>
              <strong>{formatCurrency(model?.fee, currency)}</strong>
            </div>
          </div>
        </section>

        <section className="warehouse-receipt-detail__section">
          <SectionHeader number="4" title="Lịch sử nhập kho" />
          <InStockTable
            data={inStocks}
            showWhenEmpty
            selectedRowKey={selectedInStockId}
            onChangeSelected={item => setSelectedInStockId(item.id)}
          />
        </section>

        <div className="warehouse-receipt-detail__footer">
          <div className="warehouse-receipt-detail__actions">
            <Button icon={<PrinterOutlined />} onClick={printReceipt}>In phiếu</Button>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              disabled={!canCreateDelivery}
              onClick={openCreateDelivery}
            >
              Tạo lệnh xuất kho
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} disabled={readOnly}>
      <FormContextCustom.Provider value={{ form, record, updateRecord }}>
        <Row gutter={16}>
          <Col span={24}>
            <FormHidden name="id" />
          </Col>
          <Col md={12} xs={24}>
            <FormSelectInfiniteProduct
              label='Chọn sản phẩm'
              placeholder='Chọn sản phẩm'
              name='productId'
              required
              onChangeGetSelectedItem={onChangeGetSelectedItem}
            />
          </Col>
          <Col md={12} xs={24}>
            <FormSelect
              label='SKU'
              name='skuId'
              valueProp='id'
              titleProp='name'
              placeholder='Nhập tên SKU'
              required
              resourceData={skus}
              onChangeGetSelectedItem={onChangeGetSelectedSku}
            />
          </Col>
          <Col span={24} style={{marginBottom: 20}}>
            {memoSkuDetail}
          </Col>
          <Col md={12} xs={24}>
            <FormInputNumber
              label='Số lượng'
              name='quantity'
              required
              placeholder={'Nhập số lượng'}
              style={{ width: '100%' }}
              min={1}
              messageRequire='Số lượng không được để trống'
            />
          </Col>
          <Col md={12} xs={24}>
            <FormSelectInfiniteProvider
              label='Nhà cung cấp'
              name='providerId'
              placeholder='Chọn nhà cung cấp'
              required
              messageRequire='Nhà cung cấp không được để trống'
            />
          </Col>
          <Col md={12} xs={24}>
            <FormInput
              label='Mã đơn NCC'
              name='providerOrderCode'
              placeholder='Nhập mã đơn nhà cung cấp'
            />
          </Col>
          <Col md={12} xs={24}>
            <FormInfiniteStock
              label='Kho hàng'
              name='stockId'
              placeholder='Chọn kho hàng'
              required
              messageRequire='Kho hàng không được để trống'
            />
          </Col>
          {/* Chỉ giữ danh sách SKU khi xem/chỉnh sửa phiếu nhập kho. */}
          {isEdit && (
            <Col span={24}>
              <InStockTable
                data={inStocks}
                showWhenEmpty
                onChangeSelected={(item) => item}
              />
            </Col>
          )}
          <Col span={24}>
            <BtnSubmit marginTop={10} text={isEdit ? 'Cập nhật' : 'Hoàn thành'} />
          </Col>
        </Row>
      </FormContextCustom.Provider>
    </Form>
  )
};

export default ModalNhapKho;
