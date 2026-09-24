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
  Select,
  Table,
  Tag,
  Upload
} from 'antd';
import { ArrowRightOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
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

const parseArray = value => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const createDeliveryCode = () => {
  const now = dayjs();
  return `GDN-${now.format('YYYYMMDD')}-${now.valueOf().toString(36).slice(-5).toUpperCase()}`;
};

const formatQuantity = (value, unit) => {
  const quantity = Number(value ?? 0);
  return `${Number.isFinite(quantity) ? quantity.toLocaleString('vi-VN') : 0}${unit ? ` ${unit}` : ''}`;
};

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

const GiaoHangForm = ({ data = {} }) => {
  const [form] = Form.useForm();
  const submitTypeRef = useRef('confirm');
  const itemInStock = data?.itemInStock ?? EMPTY_RECORD;
  const receiptDetail = data?.receiptDetail ?? EMPTY_RECORD;
  const product = itemInStock?.product ?? EMPTY_RECORD;
  const unit = product?.unit ?? '';
  const deliveryCode = useMemo(createDeliveryCode, []);
  const criteria = useMemo(() => parseArray(receiptDetail?.criteria), [receiptDetail?.criteria]);
  const qcPassed = criteria.length > 0 && criteria.every(item => item?.passed === true);
  const [deliveryMode, setDeliveryMode] = useState('self');
  const [selectedLotKeys, setSelectedLotKeys] = useState([]);
  const [lotQuantities, setLotQuantities] = useState({});

  const productLabel = [product?.code, product?.name].filter(Boolean).join(' · ');
  const orderLabel = [receiptDetail?.orderCode, receiptDetail?.orderDetailCode]
    .filter(Boolean)
    .join(' · ');
  const availableQuantity = Number(itemInStock?.quantity ?? receiptDetail?.quantity ?? 0);
  const lotRows = useMemo(() => [{
    id: receiptDetail?.id ?? itemInStock?.id,
    warehouserProductId: itemInStock?.id ?? receiptDetail?.warehouserProductId,
    receiptCode: receiptDetail?.receiptCode,
    lotNo: receiptDetail?.lotNo,
    binLocation: receiptDetail?.binLocation,
    stockId: itemInStock?.stockId ?? receiptDetail?.stockId,
    stockName: itemInStock?.stockName ?? receiptDetail?.stockName,
    quantity: availableQuantity,
    qcPassed
  }], [availableQuantity, itemInStock, qcPassed, receiptDetail]);

  useEffect(() => {
    const firstLot = lotRows[0];
    if (firstLot?.id === undefined || firstLot?.id === null) return;

    setSelectedLotKeys(current => current.length > 0 ? current : [firstLot.id]);
    setLotQuantities(current => current[firstLot.id] !== undefined
      ? current
      : { ...current, [firstLot.id]: firstLot.quantity });
  }, [lotRows]);

  const selectedQuantity = selectedLotKeys.reduce(
    (total, key) => total + Number(lotQuantities[key] ?? 0),
    0
  );

  const toggleLot = row => {
    setSelectedLotKeys(current => {
      if (current.includes(row.id)) {
        setLotQuantities(values => ({ ...values, [row.id]: 0 }));
        return current.filter(key => key !== row.id);
      }
      setLotQuantities(values => ({
        ...values,
        [row.id]: values[row.id] || row.quantity
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
      render: (_, row) => (
        <div className="warehouse-delivery__lot">
          <strong>{row.lotNo || '—'}</strong>
          <span>{row.receiptCode || '—'}</span>
        </div>
      )
    },
    { title: 'Vị trí', dataIndex: 'binLocation', render: value => value || '—' },
    {
      title: 'Tồn',
      dataIndex: 'quantity',
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
          onChange={value => setLotQuantities(current => ({ ...current, [row.id]: value ?? 0 }))}
        />
      )
    },
    {
      title: 'QC',
      width: 120,
      render: (_, row) => row.qcPassed
        ? <Tag color="success">Đạt</Tag>
        : <Tag color="warning">Chưa đạt</Tag>
    }
  ];

  const onFinish = values => {
    if (selectedLotKeys.length === 0 || selectedQuantity <= 0) {
      message.error('Vui lòng chọn lô và nhập số lượng xuất');
      return;
    }

    const lots = lotRows
      .filter(row => selectedLotKeys.includes(row.id))
      .map(row => ({
        historyId: row.id,
        warehouserProductId: row.warehouserProductId,
        receiptCode: row.receiptCode ?? null,
        lotNo: row.lotNo ?? null,
        stockId: row.stockId ?? null,
        stockName: row.stockName ?? null,
        binLocation: row.binLocation ?? null,
        availableQuantity: row.quantity,
        quantity: Number(lotQuantities[row.id] ?? 0)
      }));
    const payload = {
      submitType: submitTypeRef.current,
      deliveryCode,
      outboundType: values.outboundType,
      outboundDate: values.outboundDate?.format('YYYY-MM-DD HH:mm:ss') ?? null,
      orderId: itemInStock?.orderId ?? receiptDetail?.orderId ?? null,
      orderCode: receiptDetail?.orderCode ?? null,
      orderDetailId: receiptDetail?.orderDetailId ?? null,
      productId: itemInStock?.productId ?? product?.id ?? null,
      skuId: itemInStock?.skuId ?? data?.skuId ?? null,
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

    console.log('[WarehouseDelivery][submit payload]', payload);
    message.success('Đã log payload lệnh xuất kho trong Console');
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
            <Form.Item label="Loại xuất" name="outboundType" rules={[{ required: true }]}>
              <Input placeholder="Nhập loại xuất" />
            </Form.Item>
          </Col>
          <Col md={8} xs={24}>
            <Form.Item label="Ngày xuất" name="outboundDate" rules={[{ required: true }]}>
              <DatePicker showTime format="DD/MM/YYYY · HH:mm" className="warehouse-delivery__control" />
            </Form.Item>
          </Col>
          <Col md={8} xs={24}>
            <ReadonlyField label="Đơn hàng / lệnh" value={orderLabel} mono />
          </Col>
          <Col md={8} xs={24}>
            <ReadonlyField label="Mặt hàng" value={productLabel} />
          </Col>
          <Col md={8} xs={24}>
            <ReadonlyField label="SL yêu cầu" value={formatQuantity(availableQuantity, unit)} mono />
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
        <div className="warehouse-delivery__summary">
          <div><span>Yêu cầu</span><strong>{formatQuantity(availableQuantity, unit)}</strong></div>
          <div><span>Đã chọn</span><strong className="warehouse-delivery__highlight">{formatQuantity(selectedQuantity, unit)}</strong></div>
          <div><span>Tồn còn lại</span><strong>{formatQuantity(Math.max(availableQuantity - selectedQuantity, 0), unit)}</strong></div>
          <div><span>Đối chiếu</span><Tag color={selectedQuantity > 0 && selectedQuantity <= availableQuantity ? 'success' : 'warning'}>{selectedQuantity > 0 && selectedQuantity <= availableQuantity ? 'Đủ điều kiện' : 'Chưa chọn lô'}</Tag></div>
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
              <Form.Item label="Hình thức" name="selfMethod" rules={[{ required: true }]}>
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
              <Form.Item label="Đơn vị vận chuyển" name="carrier" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'viettel_post', label: 'Viettel Post' },
                  { value: 'ghn', label: 'Giao Hàng Nhanh' },
                  { value: 'minh_phat', label: 'Nhà xe Minh Phát' }
                ]} />
              </Form.Item>
            </Col>
            <Col md={12} xs={24}>
              <Form.Item label="Dịch vụ" name="service" rules={[{ required: true }]}><Input /></Form.Item>
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
              <Form.Item label="Người trả cước" name="freightPayer" rules={[{ required: true }]}>
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
            <Form.Item label="Địa chỉ nhận" name="address" rules={[{ required: true }]}><Input /></Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item label="Người nhận" name="recipientName" rules={[{ required: true }]}><Input /></Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item label="Số điện thoại" name="recipientPhone" rules={[{ required: true }]}><Input /></Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item label={deliveryMode === 'self' ? 'Dự kiến giao' : 'Hẹn lấy hàng'} name="scheduledAt" rules={[{ required: true }]}>
              <DatePicker showTime format="DD/MM/YYYY · HH:mm" className="warehouse-delivery__control" />
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
            onClick={() => { submitTypeRef.current = 'draft'; }}
          >
            Lưu nháp
          </Button>
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            htmlType="submit"
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
