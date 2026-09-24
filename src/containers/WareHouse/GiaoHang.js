import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Row,
  Table,
  Tag,
  Upload
} from 'antd';
import { ArrowRightOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { RequestUtils } from '@flast-erp/core/utils';
import { FormSelectAPI } from '@flast-erp/core/components';
import { SUCCESS_CODE } from '@/configs';
import {
  extractUploadItems,
  normalizeUploadFileName,
  resolveUploadFilename,
  toUploadFile
} from '@/containers/PreviewModal/uploadUtils';
import './GiaoHang.less';

const DOCUMENT_OPTIONS = [
  { label: 'Phiếu xuất kho', value: 'warehouseSlip' },
  { label: 'Biên bản giao nhận', value: 'handoverReport' },
  { label: 'COA', value: 'coa' },
  { label: 'Hoá đơn VAT', value: 'vatInvoice' }
];
const EMPTY_RECORD = {};

/** API fetch-history: criteria/attachments là JSON string */
const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isQcPassed = (criteria) => {
  const items = parseJsonArray(criteria);
  return items.length > 0 && items.every(item => item.passed === true);
};

/** Map 1 record embedded từ GET /erp/warehouse/fetch-history */
const mapHistoryLot = (item) => ({
  id: item.id,
  inTime: item.inTime,
  warehouserProductId: item.warehouserProductId,
  receiptCode: item.receiptCode,
  lotNo: item.lotNo,
  binLocation: item.binLocation,
  stockId: item.stockId,
  stockName: item.stockName,
  // total = tồn còn lại; quantity = SL nhập ban đầu
  quantity: Number(item.total),
  orderId: item.orderId,
  orderCode: item.orderCode,
  orderDetailId: item.orderDetailId,
  orderDetailCode: item.orderDetailCode,
  productId: item.productId,
  skuId: item.skuId,
  qcPassed: isQcPassed(item.criteria),
});

const createDeliveryCode = () => {
  const now = dayjs();
  return `GDN-${now.format('YYYYMMDD')}-${now.valueOf().toString(36).slice(-5).toUpperCase()}`;
};

const formatQuantity = (value, unit) => {
  const quantity = Number(value ?? 0);
  return `${Number.isFinite(quantity) ? quantity.toLocaleString('vi-VN') : 0}${unit ? ` ${unit}` : ''}`;
};

const emptyToNull = (value) => (value === undefined || value === '' ? null : value);

const toDayjs = value => (value && dayjs(value).isValid() ? dayjs(value) : undefined);

const DeliverySection = ({ number, title, children }) => (
  <section className="warehouse-delivery__section">
    <div className="warehouse-delivery__section-head">
      <span>{number}</span>
      <h3>{title}</h3>
    </div>
    {children}
  </section>
);

const ReadonlyField = ({ label, value, mono = false }) => (
  <div className="warehouse-delivery__readonly">
    <label>{label}</label>
    <div className={mono ? 'warehouse-delivery__mono' : undefined}>{value || '—'}</div>
  </div>
);

const OutboundDocumentsUpload = () => {
  const form = Form.useFormInstance();
  const attachments = Form.useWatch('attachments', form) ?? [];
  const [uploading, setUploading] = useState(false);
  const fileList = attachments.map(toUploadFile).filter(Boolean);

  const uploadBatch = async files => {
    const selectedFiles = Array.from(files).filter(Boolean);
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append(
        'files',
        file,
        normalizeUploadFileName(file?.name) || file?.name
      );
    });
    formData.append('folder', 'warehouse/outbound');

    setUploading(true);
    try {
      const response = await axios.post('/erp/folder/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploaded = extractUploadItems(response.data);
      if (uploaded.length === 0) throw new Error('API upload không trả về tệp');
      form.setFieldValue('attachments', [...attachments, ...uploaded]);
      message.success(`Đã tải lên ${uploaded.length} tệp`);
    } catch (error) {
      message.error(error?.message || 'Upload chứng từ thất bại');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form.Item label="Tải giấy tờ">
      <Upload.Dragger
        multiple
        fileList={fileList}
        disabled={uploading}
        beforeUpload={(file, selectedFiles) => {
          if (file === selectedFiles[0]) uploadBatch(selectedFiles);
          return Upload.LIST_IGNORE;
        }}
        onRemove={file => {
          const removed = resolveUploadFilename(file);
          form.setFieldValue(
            'attachments',
            attachments.filter(item => resolveUploadFilename(item) !== removed)
          );
        }}
      >
        <p className="ant-upload-drag-icon"><UploadOutlined /></p>
        <p className="ant-upload-text">
          {uploading ? 'Đang tải chứng từ...' : 'Kéo file vào đây hoặc bấm để chọn'}
        </p>
        <p className="ant-upload-hint">Có thể chọn và tải nhiều file trong một lần</p>
      </Upload.Dragger>
      <Form.Item name="attachments" hidden><input type="hidden" /></Form.Item>
    </Form.Item>
  );
};

const GiaoHangForm = ({ data = {}, closeModal }) => {
  const [form] = Form.useForm();
  const submitTypeRef = useRef('confirm');
  const hasSubmittedDataRef = useRef(false);
  const draftIdRef = useRef(null);
  const itemInStock = data.itemInStock ?? EMPTY_RECORD;
  const [historyItems, setHistoryItems] = useState(
    Array.isArray(data.inStocks) ? data.inStocks : []
  );
  const product = itemInStock.product ?? EMPTY_RECORD;
  const unit = product.unit ?? '';
  const initialDeliveryCode = useMemo(createDeliveryCode, []);
  const [deliveryCode, setDeliveryCode] = useState(initialDeliveryCode);
  const [deliveryMode, setDeliveryMode] = useState('self');
  const [selectedLotKeys, setSelectedLotKeys] = useState([]);
  const [lotQuantities, setLotQuantities] = useState({});
  const [lotValidationError, setLotValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Meta đơn lấy từ history (fetch-history / receiptDetail), không fallback itemInStock
  const orderMeta = historyItems[0] ?? data.receiptDetail ?? null;
  const orderId = orderMeta?.orderId;
  const orderCode = orderMeta?.orderCode;
  const productId = orderMeta?.productId;

  useEffect(() => {
    if (!orderId) return undefined;

    let mounted = true;
    RequestUtils.Get('/erp/order/view-on-edit', { orderId })
      .then(response => {
        if (!mounted || hasSubmittedDataRef.current) return;
        const orderData = response?.data ?? EMPTY_RECORD;
        const order = orderData.order ?? EMPTY_RECORD;
        form.setFieldsValue({
          address: order.customerAddress,
          recipientName: order.customerReceiverName,
          recipientPhone: order.customerMobilePhone,
          ...(order.transportTypeId != null ? { carrier: order.transportTypeId } : {})
        });
      })
      .catch(error => {
        if (!mounted) return;
        message.error(error?.message ?? 'Không tải được thông tin người nhận');
      });

    return () => {
      mounted = false;
    };
  }, [form, orderId]);

  useEffect(() => {
    if (!orderCode || !productId) return undefined;

    let mounted = true;
    RequestUtils.Get('/shipping/find-submit', { orderCode, productId })
      .then(response => {
        if (!mounted) return;
        const submittedData = response?.data;
        if (!submittedData || typeof submittedData !== 'object' || Array.isArray(submittedData)) {
          return;
        }

        const delivery = submittedData.delivery ?? EMPTY_RECORD;
        const lots = Array.isArray(submittedData.lots) ? submittedData.lots : [];
        const mode = delivery.mode ?? 'self';

        hasSubmittedDataRef.current = true;
        draftIdRef.current = submittedData.submitType === 'draft'
          ? submittedData.id ?? null
          : null;
        setDeliveryCode(submittedData.deliveryCode || initialDeliveryCode);
        setDeliveryMode(mode);
        setSelectedLotKeys(lots.map(lot => lot.historyId).filter(id => id != null));
        setLotQuantities(lots.reduce((quantities, lot) => {
          if (lot.historyId != null) quantities[lot.historyId] = Number(lot.quantity ?? 0);
          return quantities;
        }, {}));
        form.setFieldsValue({
          outboundType: submittedData.outboundType,
          outboundDate: toDayjs(submittedData.outboundDate),
          deliveryMode: mode,
          selfMethod: delivery.method,
          carrier: delivery.carrier,
          service: delivery.service,
          trackingCode: delivery.trackingCode,
          address: delivery.address,
          recipientName: delivery.recipientName,
          recipientPhone: delivery.recipientPhone,
          scheduledAt: toDayjs(delivery.scheduledAt),
          vehiclePlate: delivery.vehiclePlate,
          driverName: delivery.driverName,
          weight: delivery.weight,
          packages: delivery.packages,
          freightPayer: delivery.freightPayer,
          expectedShippingCost: delivery.expectedShippingCost,
          note: delivery.note,
          requiredDocuments: Array.isArray(submittedData.requiredDocuments)
            ? submittedData.requiredDocuments
            : [],
          attachments: Array.isArray(submittedData.attachments)
            ? submittedData.attachments
            : []
        });
      })
      .catch(error => {
        if (!mounted) return;
        message.error(error?.message ?? 'Không tải được dữ liệu lệnh xuất đã lưu');
      });

    return () => {
      mounted = false;
    };
  }, [form, initialDeliveryCode, orderCode, productId]);

  useEffect(() => {
    if (Array.isArray(data.inStocks) && data.inStocks.length > 0) {
      setHistoryItems(data.inStocks);
      return undefined;
    }
    if (!itemInStock.id) return undefined;

    let mounted = true;
    const params = itemInStock.orderId
      ? { orderId: itemInStock.orderId, isFull: 'True' }
      : { warehouseId: itemInStock.id, isFull: 'True' };

    RequestUtils.Get('/erp/warehouse/fetch-history', params)
      .then(response => {
        if (!mounted) return;
        const items = Array.isArray(response?.data?.embedded)
          ? response.data.embedded
          : [];
        setHistoryItems(items.filter(
          item => String(item.warehouserProductId) === String(itemInStock.id)
        ));
      })
      .catch(error => {
        if (!mounted) return;
        setHistoryItems([]);
        message.error(error?.message ?? 'Không tải được danh sách lô nhập');
      });

    return () => {
      mounted = false;
    };
  }, [data.inStocks, itemInStock]);

  const productLabel = [product.code, product.name].filter(Boolean).join(' · ');
  const orderLabel = [orderMeta?.orderCode, orderMeta?.orderDetailCode]
    .filter(Boolean)
    .join(' · ');

  const lotRows = useMemo(() => {
    const sourceItems = historyItems.length > 0
      ? historyItems
      : (data.receiptDetail ? [data.receiptDetail] : []);

    return sourceItems
      .filter(item => item?.id != null && Number(item.total) > 0)
      .map(mapHistoryLot)
      .sort((first, second) => {
        const firstTime = dayjs(first.inTime);
        const secondTime = dayjs(second.inTime);
        if (!firstTime.isValid()) return 1;
        if (!secondTime.isValid()) return -1;
        return firstTime.valueOf() - secondTime.valueOf();
      });
  }, [historyItems, data.receiptDetail]);

  // itemInStock.total = tồn còn của SKU trong kho
  const availableQuantity = Number(itemInStock.total);
  const requiredQuantity = Number.isFinite(availableQuantity) && availableQuantity > 0
    ? availableQuantity
    : lotRows.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const firstLot = lotRows[0];
    if (firstLot?.id == null) return;

    setSelectedLotKeys(current => {
      const validKeys = current.filter(key => lotRows.some(item => item.id === key));
      return validKeys.length > 0 ? validKeys : [firstLot.id];
    });
    setLotQuantities(current => (current[firstLot.id] !== undefined
      ? current
      : { ...current, [firstLot.id]: firstLot.quantity }));
  }, [lotRows]);

  const selectedQuantity = selectedLotKeys.reduce(
    (total, key) => total + Number(lotQuantities[key] ?? 0),
    0
  );

  const toggleLot = row => {
    setLotValidationError('');
    setSelectedLotKeys(current => {
      if (current.includes(row.id)) {
        setLotQuantities(values => ({ ...values, [row.id]: 0 }));
        return current.filter(key => key !== row.id);
      }
      setLotQuantities(values => ({
        ...values,
        [row.id]: values[row.id] ?? row.quantity
      }));
      return [...current, row.id];
    });
  };

  const columns = [
    {
      title: 'Chọn',
      width: 64,
      align: 'center',
      render: (_, row) => (
        <Checkbox checked={selectedLotKeys.includes(row.id)} onChange={() => toggleLot(row)} />
      )
    },
    {
      title: 'Lô · phiếu nhập',
      width: 200,
      render: (_, row) => (
        <div className="warehouse-delivery__lot">
          <strong>{row.lotNo ?? '—'}</strong>
          <span>{row.receiptCode ?? '—'}</span>
        </div>
      )
    },
    {
      title: 'Ngày nhập',
      dataIndex: 'inTime',
      width: 150,
      render: value => (dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—')
    },
    { title: 'Vị trí', dataIndex: 'binLocation', width: 150, render: value => value ?? '—' },
    {
      title: 'Tồn',
      dataIndex: 'quantity',
      width: 130,
      align: 'right',
      render: value => formatQuantity(value, unit)
    },
    {
      title: 'SL xuất',
      width: 130,
      render: (_, row) => (
        <InputNumber
          min={0}
          max={row.quantity}
          value={lotQuantities[row.id] ?? 0}
          disabled={!selectedLotKeys.includes(row.id)}
          onChange={value => {
            setLotValidationError('');
            setLotQuantities(current => ({ ...current, [row.id]: value ?? 0 }));
          }}
        />
      )
    },
    {
      title: 'QC',
      width: 120,
      render: (_, row) => (row.qcPassed
        ? <Tag color="success">Đạt</Tag>
        : <Tag color="warning">Chưa đạt</Tag>)
    }
  ];

  const onFinish = async values => {
    if (selectedLotKeys.length === 0 || selectedQuantity <= 0) {
      setLotValidationError('Vui lòng chọn lô và nhập số lượng xuất lớn hơn 0');
      return;
    }
    setLotValidationError('');

    const selectedLots = lotRows.filter(row => selectedLotKeys.includes(row.id));
    const primaryLot = selectedLots[0];
    const lots = selectedLots.map(row => ({
      historyId: row.id,
      warehouserProductId: row.warehouserProductId,
      receiptCode: emptyToNull(row.receiptCode),
      lotNo: emptyToNull(row.lotNo),
      stockId: emptyToNull(row.stockId),
      stockName: emptyToNull(row.stockName),
      binLocation: emptyToNull(row.binLocation),
      availableQuantity: row.quantity,
      quantity: Number(lotQuantities[row.id] ?? 0)
    }));

    const payload = {
      ...(submitTypeRef.current === 'confirm' && draftIdRef.current != null
        ? { id: draftIdRef.current }
        : {}),
      submitType: submitTypeRef.current,
      deliveryCode,
      outboundType: values.outboundType,
      outboundDate: values.outboundDate?.format('YYYY-MM-DD HH:mm:ss') ?? null,
      orderId: primaryLot.orderId,
      orderCode: primaryLot.orderCode,
      orderDetailId: primaryLot.orderDetailId,
      productId: primaryLot.productId,
      skuId: primaryLot.skuId,
      lots,
      delivery: {
        mode: values.deliveryMode,
        method: values.selfMethod ?? null,
        carrier: values.carrier ?? null,
        service: values.service ?? null,
        trackingCode: values.trackingCode ?? null,
        address: values.address,
        recipientName: values.recipientName,
        recipientPhone: values.recipientPhone,
        scheduledAt: values.scheduledAt?.format('YYYY-MM-DD HH:mm:ss') ?? null,
        vehiclePlate: values.vehiclePlate ?? null,
        driverName: values.driverName ?? null,
        weight: values.weight ?? null,
        packages: values.packages ?? null,
        freightPayer: values.freightPayer ?? null,
        expectedShippingCost: values.expectedShippingCost ?? null,
        note: values.note ?? null
      },
      requiredDocuments: values.requiredDocuments ?? [],
      attachments: values.attachments ?? []
    };

    setSubmitting(true);
    try {
      const response = await RequestUtils.Post('/warehouse/delivery', payload);
      if (response?.errorCode !== SUCCESS_CODE) {
        message.error(response?.message ?? 'Không thể tạo lệnh xuất kho');
        return;
      }
      message.success(response.message);
      closeModal?.();
    } catch (error) {
      message.error(error?.response?.data?.message ?? error?.message ?? 'Không thể tạo lệnh xuất kho');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      className="warehouse-delivery"
      form={form}
      layout="vertical"
      initialValues={{
        outboundDate: dayjs(),
        deliveryMode: 'self',
        selfMethod: 'company_vehicle',
        freightPayer: 'sender',
        requiredDocuments: [],
        attachments: []
      }}
      onFinish={onFinish}
    >
      <DeliverySection number="1" title="Thông tin lệnh xuất">
        <Row gutter={[16, 4]}>
          <Col md={8} xs={24}>
            <ReadonlyField label="Mã phiếu xuất" value={deliveryCode} mono />
          </Col>
          <Col md={8} xs={24}>
            <Form.Item
              label="Loại xuất"
              name="outboundType"
              rules={[{ required: true, message: 'Vui lòng nhập loại xuất' }]}
            >
              <Input placeholder="Nhập loại xuất" />
            </Form.Item>
          </Col>
          <Col md={8} xs={24}>
            <Form.Item
              label="Ngày xuất"
              name="outboundDate"
              rules={[{ required: true, message: 'Vui lòng chọn ngày xuất' }]}
            >
              <DatePicker placeholder="Chọn ngày xuất" showTime format="DD/MM/YYYY · HH:mm" className="warehouse-delivery__control" />
            </Form.Item>
          </Col>
          <Col md={8} xs={24}>
            <ReadonlyField label="Đơn hàng / lệnh" value={orderLabel} mono />
          </Col>
          <Col md={8} xs={24}>
            <ReadonlyField label="Mặt hàng" value={productLabel} />
          </Col>
          <Col md={8} xs={24}>
            <ReadonlyField label="SL yêu cầu" value={formatQuantity(requiredQuantity, unit)} mono />
          </Col>
        </Row>
      </DeliverySection>

      <DeliverySection number="2" title="Chọn lô xuất (FIFO)">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={lotRows}
          pagination={false}
          bordered
          scroll={{ x: 720 }}
          onRow={row => ({ onClick: event => {
            if (!event.target.closest('.ant-input-number, .ant-checkbox-wrapper')) toggleLot(row);
          } })}
        />
        {lotValidationError && (
          <div style={{ marginTop: 6, color: '#ff4d4f', fontSize: 14 }}>
            {lotValidationError}
          </div>
        )}
        <div className="warehouse-delivery__summary">
          <div><span>Yêu cầu</span><strong>{formatQuantity(requiredQuantity, unit)}</strong></div>
          <div><span>Đã chọn</span><strong className="warehouse-delivery__highlight">{formatQuantity(selectedQuantity, unit)}</strong></div>
          <div><span>Tồn còn lại</span><strong>{formatQuantity(Math.max(requiredQuantity - selectedQuantity, 0), unit)}</strong></div>
          <div><span>Đối chiếu</span><Tag color={selectedQuantity > 0 && selectedQuantity <= requiredQuantity ? 'success' : 'warning'}>{selectedQuantity > 0 && selectedQuantity <= requiredQuantity ? 'Đủ điều kiện' : 'Chưa chọn lô'}</Tag></div>
        </div>
      </DeliverySection>

      <DeliverySection number="3" title="Thông tin giao hàng">
        <Form.Item name="deliveryMode" className="warehouse-delivery__mode">
          <Radio.Group onChange={event => setDeliveryMode(event.target.value)}>
            <Radio.Button value="self">Tự giao</Radio.Button>
            <Radio.Button value="carrier">Đơn vị vận chuyển</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {deliveryMode === 'self' ? (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Hình thức"
                name="selfMethod"
                rules={[{ required: true, message: 'Vui lòng chọn hình thức giao hàng' }]}
              >
                <Radio.Group>
                  <Radio value="company_vehicle">Xe công ty</Radio>
                  <Radio value="customer_pickup">Khách tự lấy</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col md={12} xs={24}>
              <Form.Item label="Biển số xe" name="vehiclePlate"><Input /></Form.Item>
            </Col>
            <Col md={12} xs={24}>
              <Form.Item label="Tài xế" name="driverName"><Input /></Form.Item>
            </Col>
          </Row>
        ) : (
          <Row gutter={16}>
            <Col md={12} xs={24}>
              <FormSelectAPI
                required
                showSearch
                apiPath="transporter/fetch"
                apiAddNewItem="transporter/save"
                label="Đơn vị vận chuyển"
                name="carrier"
                messageRequire="Vui lòng chọn đơn vị vận chuyển"
                valueProp="id"
                titleProp="name"
                searchKey="name"
                placeholder="Chọn đơn vị vận chuyển"
              />
            </Col>
            <Col md={12} xs={24}>
              <Form.Item
                label="Dịch vụ"
                name="service"
                rules={[{ required: true, message: 'Vui lòng nhập dịch vụ vận chuyển' }]}
              >
                <Input placeholder="Nhập dịch vụ vận chuyển" />
              </Form.Item>
            </Col>
            <Col md={12} xs={24}>
              <Form.Item label="Mã vận đơn" name="trackingCode"><Input /></Form.Item>
            </Col>
            <Col md={6} xs={12}>
              <Form.Item label="Khối lượng" name="weight"><InputNumber min={0} addonAfter="kg" className="warehouse-delivery__control" /></Form.Item>
            </Col>
            <Col md={6} xs={12}>
              <Form.Item label="Số kiện" name="packages"><InputNumber min={0} className="warehouse-delivery__control" /></Form.Item>
            </Col>
            <Col md={12} xs={24}>
              <Form.Item
                label="Người trả cước"
                name="freightPayer"
                rules={[{ required: true, message: 'Vui lòng chọn người trả cước' }]}
              >
                <Radio.Group><Radio value="sender">Bên gửi</Radio><Radio value="receiver">Bên nhận</Radio></Radio.Group>
              </Form.Item>
            </Col>
            <Col md={12} xs={24}>
              <Form.Item label="Cước dự kiến" name="expectedShippingCost"><InputNumber min={0} addonAfter="₫" className="warehouse-delivery__control" /></Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Địa chỉ nhận"
              name="address"
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ nhận' }]}
            >
              <Input placeholder="Nhập địa chỉ nhận" />
            </Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item
              label="Người nhận"
              name="recipientName"
              rules={[{ required: true, message: 'Vui lòng nhập người nhận' }]}
            >
              <Input placeholder="Nhập tên người nhận" />
            </Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item
              label="Số điện thoại"
              name="recipientPhone"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại người nhận' }]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item
              label={deliveryMode === 'self' ? 'Dự kiến giao' : 'Hẹn lấy hàng'}
              name="scheduledAt"
              rules={[{
                required: true,
                message: deliveryMode === 'self'
                  ? 'Vui lòng chọn thời gian dự kiến giao'
                  : 'Vui lòng chọn thời gian hẹn lấy hàng'
              }]}
            >
              <DatePicker
                placeholder={deliveryMode === 'self' ? 'Chọn thời gian giao' : 'Chọn thời gian lấy hàng'}
                showTime
                format="DD/MM/YYYY · HH:mm"
                className="warehouse-delivery__control"
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Ghi chú giao hàng" name="note"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </DeliverySection>

      <DeliverySection number="4" title="Chứng từ kèm theo">
        <Form.Item
          name="requiredDocuments"
          className="warehouse-delivery__documents"
        >
          <Checkbox.Group options={DOCUMENT_OPTIONS} />
        </Form.Item>
        <OutboundDocumentsUpload />
      </DeliverySection>

      <footer className="warehouse-delivery__footer">
        <div>
          <Button
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={submitting && submitTypeRef.current === 'draft'}
            disabled={submitting}
            onClick={() => { submitTypeRef.current = 'draft'; }}
          >
            Lưu nháp
          </Button>
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            htmlType="submit"
            loading={submitting && submitTypeRef.current === 'confirm'}
            disabled={submitting}
            onClick={() => { submitTypeRef.current = 'confirm'; }}
          >
            Xác nhận xuất &amp; giao
          </Button>
        </div>
      </footer>
    </Form>
  );
};

export default GiaoHangForm;
