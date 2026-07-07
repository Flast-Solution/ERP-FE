import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useEffectAsync } from '@flast-erp/core/hooks';
import { arrayNotEmpty } from '@flast-erp/core/utils';
import OrderPayment from '@/containers/Order/OrderPayment';
import OrderService from '@/services/OrderService';
import styled from 'styled-components';

const { Text, Title } = Typography;

const PageShell = styled.div`
  padding: 16px;
`;

const PageCard = styled(Card)`
  border-radius: 10px;

  .ant-card-head-title {
    font-weight: 700;
  }
`;

const StickyAside = styled.div`
  position: sticky;
  top: 96px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
`;

const ActionBar = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0 0;
  margin-top: 16px;
  background: #f5f6fa;
`;

const DEFAULT_LOT_VALUES = {
  lotType: 'PRODUCTION',
  priority: 'NORMAL',
};

const normalizeOrderDetail = (detail = {}, index) => ({
  ...detail,
  key: detail.orderDetailId ?? detail.id ?? detail.code ?? index,
  orderDetailId: detail.orderDetailId ?? detail.id,
  orderDetailCode: detail.orderDetailCode ?? detail.code,
  productCode: detail.productCode ?? detail.product?.code,
  productName: detail.productName ?? detail.product?.name ?? detail.name,
  quantity: Number(detail.quantity ?? 0),
  lotQuantity: Number(detail.quantity ?? 0),
});

const LotConfigFields = ({ field }) => (
  <Row gutter={16}>
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
      <Form.Item
        name={[field.name, 'lotCode']}
        label="Mã lô hàng"
      >
        <Input placeholder="Tự sinh nếu để trống" />
      </Form.Item>
    </Col>
    <Col xs={24} md={8}>
      <Form.Item
        name={[field.name, 'lotType']}
        label="Loại lô"
        rules={[{ required: true, message: 'Vui lòng chọn loại lô' }]}
      >
        <Select
          options={[
            { value: 'PRODUCTION', label: 'Sản xuất' },
            { value: 'QC', label: 'Kiểm tra chất lượng' },
            { value: 'PACKING', label: 'Đóng gói' },
          ]}
        />
      </Form.Item>
    </Col>
    <Col xs={24} md={8}>
      <Form.Item
        name={[field.name, 'plannedDate']}  
        label="Ngày dự kiến"
        rules={[{ required: true, message: 'Vui lòng chọn ngày dự kiến' }]}
      >
        <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
      </Form.Item>
    </Col>
    <Col xs={24} md={8}>
      <Form.Item name={[field.name, 'priority']} label="Độ ưu tiên">
        <Select
          options={[
            { value: 'LOW', label: 'Thấp' },
            { value: 'NORMAL', label: 'Bình thường' },
            { value: 'HIGH', label: 'Cao' },
          ]}
        />
      </Form.Item>
    </Col>
    <Col span={24}>
      <Form.Item name={[field.name, 'note']} label="Ghi chú">
        <Input.TextArea rows={3} placeholder="Nhập ghi chú cho lô hàng" />
      </Form.Item>
    </Col>
  </Row>
);

const ManufacturingLotCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const customerOrder = location.state?.customerOrder ?? {};
  const orderDetails = useMemo(() => (
    (location.state?.orderDetails ?? customerOrder?.details ?? []).map(normalizeOrderDetail)
  ), [customerOrder?.details, location.state?.orderDetails]);
  const [selectedRowKeys, setSelectedRowKeys] = useState(orderDetails.map(item => item.key));
  const [detailRows, setDetailRows] = useState(orderDetails);
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [loadingOrderInfo, setLoadingOrderInfo] = useState(false);

  const selectedRows = useMemo(
    () => detailRows.filter(item => selectedRowKeys.includes(item.key)),
    [detailRows, selectedRowKeys],
  );

  useEffectAsync(async () => {
    if (!customerOrder?.id) {
      setPaymentDetails([]);
      return;
    }

    setLoadingOrderInfo(true);
    try {
      const { data } = await OrderService.getOrderOnEdit(customerOrder.id);
      if (arrayNotEmpty(data)) {
        setPaymentDetails(data);
      }
    } finally {
      setLoadingOrderInfo(false);
    }
  }, [customerOrder?.id]);

  const updateLotQuantity = (key, lotQuantity) => {
    setDetailRows(rows => rows.map(row => (
      row.key === key ? { ...row, lotQuantity } : row
    )));
  };

  const buildLotDetails = () => selectedRows.map(row => ({
    orderDetailId: row.orderDetailId,
    orderDetailCode: row.orderDetailCode,
    productId: row.productId,
    productCode: row.productCode,
    productName: row.productName,
    skuId: row.skuId,
    quantity: row.lotQuantity,
  }));

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const lots = values.lots ?? [];

    if (!selectedRows.length) {
      message.warning('Vui lòng chọn ít nhất 1 sản phẩm để tạo lô hàng.');
      return;
    }

    if (!lots.length) {
      message.warning('Vui lòng thêm ít nhất 1 cấu hình lô hàng.');
      return;
    }

    const payload = {
      customerOrderId: customerOrder?.id,
      customerOrderCode: customerOrder?.code,
      lots: lots.map(lot => ({
        ...lot,
        details: buildLotDetails(),
      })),
    };

    message.success(`Đã chuẩn bị tạo ${payload.lots.length} lô hàng cho ${selectedRows.length} sản phẩm.`);
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.productName || '-'}</Text>
          <Text type="secondary">{record.productCode || record.orderDetailCode || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Mã chi tiết',
      dataIndex: 'orderDetailCode',
      width: 150,
      render: value => value || '-',
    },
    {
      title: 'SL đơn hàng',
      dataIndex: 'quantity',
      width: 130,
      align: 'right',
      render: value => value || 0,
    },
    {
      title: 'SL tạo lô',
      dataIndex: 'lotQuantity',
      width: 150,
      render: (value, record) => (
        <InputNumber
          min={0}
          max={record.quantity || undefined}
          value={value}
          style={{ width: '100%' }}
          onChange={nextValue => updateLotQuantity(record.key, nextValue)}
        />
      ),
    },
  ];

  return (
    <PageShell>
      <Helmet>
        <title>Tạo lô hàng</title>
      </Helmet>

      <BreadcrumbCustom
        data={[
          { title: 'Trang chủ' },
          { title: 'Đơn hàng đang sản xuất' },
          { title: 'Tạo lô hàng' },
        ]}
      />

      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/sale/order-production')}
        style={{ marginBottom: 16 }}
      >
        Quay lại
      </Button>

      <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Tạo lô hàng</Title>
        <Text type="secondary">
          Chọn sản phẩm trong đơn đang sản xuất và khai báo thông tin lô hàng.
        </Text>
      </Space>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          lots: [{ ...DEFAULT_LOT_VALUES }],
        }}
      >
        <Row gutter={16} align="top">
          <Col xs={24} lg={16}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <PageCard
                title="Sản phẩm tạo lô"
                extra={<Tag color="blue">{selectedRows.length} sản phẩm đã chọn</Tag>}
              >
                <Table
                  rowKey="key"
                  columns={columns}
                  dataSource={detailRows}
                  pagination={false}
                  locale={{ emptyText: 'Không có sản phẩm trong đơn hàng' }}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                    type: 'checkbox',
                  }}
                  scroll={{ x: 760 }}
                />
              </PageCard>

              <Form.List name="lots">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <PageCard
                        key={field.key}
                        title={fields.length > 1 ? `Cấu hình lô hàng ${index + 1}` : 'Cấu hình lô hàng'}
                        extra={fields.length > 1 ? (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          >
                            Xóa
                          </Button>
                        ) : null}
                      >
                        <LotConfigFields field={field} />
                      </PageCard>
                    ))}

                    <Button
                      type="dashed"
                      block
                      icon={<PlusOutlined />}
                      onClick={() => add({ ...DEFAULT_LOT_VALUES })}
                    >
                      Thêm lô hàng
                    </Button>
                  </>
                )}
              </Form.List>
            </Space>
          </Col>

          <Col xs={24} lg={8}>
            <StickyAside>
              <PageCard bodyStyle={{ padding: 0 }}>
                {loadingOrderInfo ? (
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <Spin />
                  </div>
                ) : customerOrder?.id || customerOrder?.code ? (
                  <OrderPayment
                    readOnly
                    data={{
                      details: paymentDetails,
                      customerOrder,
                      onSave: () => {},
                    }}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có dữ liệu đơn hàng"
                    style={{ padding: 24 }}
                  />
                )}
              </PageCard>
            </StickyAside>
          </Col>
        </Row>

        <ActionBar>
          <Button onClick={() => navigate('/sale/order-production')}>Huỷ</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit}>
            Tạo lô hàng
          </Button>
        </ActionBar>
      </Form>
    </PageShell>
  );
};

export default ManufacturingLotCreate;
