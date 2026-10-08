import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  Col,
  Form,
  message,
  Row,
  Table,
  Tag,
  Tooltip
} from 'antd';
import { PrinterOutlined, SaveOutlined, FileOutlined } from '@ant-design/icons';
import { FormSelectAPI } from '@flast-erp/core/components';
import { RequestUtils, f5List } from '@flast-erp/core/utils';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import useGetMe from '@/hooks/useGetMe';
import '@/containers/WareHouse/GiaoHang.less';
import UploadedFilePreview from "@erp/shared-ui/components/UploadedFilePreview/index";
import { toUploadFile } from '../PreviewModal/uploadUtils';

const DOCUMENT_OPTIONS = [
  { label: 'Phiếu xuất kho', value: 'warehouseSlip' },
  { label: 'Biên bản giao nhận', value: 'handoverReport' },
  { label: 'COA', value: 'coa' },
  { label: 'Hoá đơn VAT', value: 'vatInvoice' }
];

const DELIVERY_MODE_LABELS = {
  self: 'Tự giao',
  carrier: 'Đơn vị vận chuyển'
};

const DELIVERY_METHOD_LABELS = {
  company_vehicle: 'Xe công ty',
  customer_pickup: 'Khách tự lấy'
};

const FREIGHT_PAYER_LABELS = {
  sender: 'Bên gửi',
  receiver: 'Bên nhận'
};

const formatDateTime = value => (
  value && dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY · HH:mm') : '—'
);

const formatQuantity = value => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toLocaleString('vi-VN') : '0';
};

const formatCurrency = value => {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toLocaleString('vi-VN')} ₫` : '—';
};

const parseAttachments = value => {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const Section = ({ number, title, children }) => (
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

const DeliveryPager = ({ data = {} }) => {
  const { hasPermission } = useGetMe();
  const canUpdate = hasPermission('shipping.delivery.update');
  const canPrint = hasPermission('shipping.delivery.print');
  const contentRef = useRef();
  const [form] = Form.useForm();
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const delivery = data?.delivery ?? {};
  const lots = Array.isArray(data?.lots) ? data.lots : [];
  const requiredDocuments = Array.isArray(data?.requiredDocuments) ? data.requiredDocuments : [];
  const attachments = parseAttachments(data?.attachments).map(toUploadFile).filter(Boolean);
  const printReceipt = useReactToPrint({
    contentRef,
    documentTitle: `phieu-xuat-kho-${data?.deliveryCode ?? data?.id ?? ''}`
  });

  useEffect(() => {
    const domContent = document.getElementById('drawer-content');
    if (!domContent) return undefined;
    domContent.style.padding = '0px 24px';
    return () => {
      domContent.style.padding = '16px 24px';
    };
  }, []);

  useEffect(() => {
    form.setFieldValue('status', data?.status);
  }, [data?.status, form]);

  const productLabel = [
    data?.productId ? `SP #${data.productId}` : null,
    data?.skuId ? `SKU #${data.skuId}` : null
  ].filter(Boolean).join(' · ') || '—';
  const orderDetailLabel = data?.detailCode || data?.orderDetailId || '—';
  const totalQuantity = lots.reduce(
    (total, lot) => total + Number(lot?.quantity ?? 0),
    0
  );

  const columns = [
    {
      title: 'STT',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Lô · phiếu nhập',
      width: 210,
      render: (_, lot) => (
        <div className="warehouse-delivery__lot">
          <strong>{lot?.lotNo || '—'}</strong>
          <span>{lot?.receiptCode || '—'}</span>
        </div>
      )
    },
    {
      title: 'Kho hàng',
      dataIndex: 'stockName',
      width: 160,
      render: value => value || '—'
    },
    {
      title: 'Vị trí',
      dataIndex: 'binLocation',
      width: 120,
      render: value => value || '—'
    },
    {
      title: 'Tồn trước xuất',
      dataIndex: 'availableQuantity',
      width: 130,
      align: 'right',
      render: formatQuantity
    },
    {
      title: 'SL xuất',
      dataIndex: 'quantity',
      width: 110,
      align: 'right',
      render: formatQuantity
    }
  ];

  const onFinish = async ({ status }) => {
    if (!canUpdate || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const response = await RequestUtils.Post('/warehouse/delivery', { ...data, status });
      if (!(response?.success === true || Number(response?.errorCode) === 200)) {
        message.error(response?.message || 'Không cập nhật được phiếu giao hàng');
        return;
      }
      message.success(response?.message || 'Đã cập nhật trạng thái giao hàng');
      f5List('shipping/fetch');
    } catch (error) {
      message.error(error?.message || 'Không cập nhật được phiếu giao hàng');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <>
      <div className="warehouse-delivery warehouse-delivery--compact" ref={contentRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 4px' }}>
          <div>
            <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 600 }}>CHI TIẾT PHIẾU XUẤT KHO</div>
            <div style={{ color: '#111827', fontSize: 26, fontWeight: 700 }}>{data?.deliveryCode || `#${data?.id ?? ''}`}</div>
          </div>
          <Tag color={data?.submitType === 'confirm' ? 'success' : 'default'}>
            {data?.submitType === 'confirm' ? 'Đã xác nhận' : 'Bản nháp'}
          </Tag>
        </div>

        <Section number="1" title="Thông tin lệnh xuất">
          <Row gutter={[24, 0]}>
            <Col md={8} xs={24}><ReadonlyField label="Mã phiếu xuất" value={data?.deliveryCode} mono /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Loại xuất" value={data?.outboundType} /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Ngày xuất" value={formatDateTime(data?.outboundDate)} mono /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Mã đơn" value={data?.orderCode} mono /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Mã đơn con" value={orderDetailLabel} mono /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Sản phẩm / SKU" value={productLabel} mono /></Col>
          </Row>
        </Section>

        <Section number="2" title="Chi tiết lô xuất">
          <Table
            rowKey={(lot, index) => lot?.historyId ?? index}
            columns={columns}
            dataSource={lots}
            pagination={false}
            bordered
            scroll={{ x: 890 }}
          />
          <div className="warehouse-delivery__summary" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div><span>Số lô xuất</span><strong>{lots.length}</strong></div>
            <div><span>Tổng số lượng xuất</span><strong className="warehouse-delivery__highlight">{formatQuantity(totalQuantity)}</strong></div>
          </div>
        </Section>

        <Section number="3" title="Thông tin giao hàng">
          <Row gutter={[24, 0]}>
            <Col md={8} xs={24}><ReadonlyField label="Hình thức giao" value={DELIVERY_MODE_LABELS[delivery?.mode] || delivery?.mode} /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Phương thức" value={DELIVERY_METHOD_LABELS[delivery?.method] || delivery?.method} /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Dự kiến giao" value={formatDateTime(delivery?.scheduledAt)} mono /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Người nhận" value={delivery?.recipientName} /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Số điện thoại" value={delivery?.recipientPhone} mono /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Đơn vị vận chuyển" value={delivery?.carrier} /></Col>
            <Col span={24}><ReadonlyField label="Địa chỉ nhận" value={delivery?.address} /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Biển số xe" value={delivery?.vehiclePlate} mono /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Tài xế" value={delivery?.driverName} /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Mã vận đơn" value={delivery?.trackingCode} mono /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Dịch vụ" value={delivery?.service} /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Khối lượng" value={delivery?.weight != null ? `${formatQuantity(delivery.weight)} kg` : '—'} /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Số kiện" value={delivery?.packages != null ? formatQuantity(delivery.packages) : '—'} /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Người trả cước" value={FREIGHT_PAYER_LABELS[delivery?.freightPayer] || delivery?.freightPayer} /></Col>
            <Col md={8} xs={24}><ReadonlyField label="Cước dự kiến" value={formatCurrency(delivery?.expectedShippingCost)} /></Col>
            <Col span={24}><ReadonlyField label="Ghi chú giao hàng" value={delivery?.note} /></Col>
          </Row>
        </Section>

        <Section number="4" title="Chứng từ kèm theo">
          <div className="warehouse-delivery__documents">
            <Checkbox.Group options={DOCUMENT_OPTIONS} value={requiredDocuments} disabled />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {attachments.length > 0 ? attachments.map(file => (
              <Tooltip key={file.uid} title={`Xem ${file.name}`}>
                <Button icon={<FileOutlined />} onClick={() => setPreviewFile(file)}
                  style={{ maxWidth: '100%', height: 'auto', whiteSpace: 'normal', overflowWrap: 'anywhere', textAlign: 'left' }}>
                  {file.name}
                </Button>
              </Tooltip>
            )) : <span style={{ color: '#6b7280' }}>Không có tệp đính kèm</span>}
          </div>
        </Section>
      </div>

      <UploadedFilePreview file={previewFile} onClose={() => setPreviewFile(null)} />

      <Form form={form} layout="vertical" onFinish={onFinish} disabled={saving}>
        <footer className="warehouse-delivery__footer">
          <span>Phiếu xuất kho được hiển thị ở chế độ xem chi tiết.</span>
          <div>
            {canUpdate && (
              <FormSelectAPI
                required
                apiPath="shipping/fetch-status"
                name="status"
                placeholder="Chọn trạng thái"
                formItemProps={{ style: { width: 220, marginBottom: 0 } }}
              />
            )}
            {canUpdate && <Button htmlType="submit" loading={saving} icon={<SaveOutlined />}>Cập nhật</Button>}
            {canPrint && <Button type="primary" icon={<PrinterOutlined />} onClick={printReceipt}>In phiếu</Button>}
          </div>
        </footer>
      </Form>
    </>
  );
};

export default DeliveryPager;
