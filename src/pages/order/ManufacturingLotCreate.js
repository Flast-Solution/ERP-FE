import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { formatMoney } from '@flast-erp/core/utils';
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

const ActionBar = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0 0;
  background: #f5f6fa;
`;

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

const getCustomerName = (order = {}) => (
  order.customerReceiverName
  ?? order.customerName
  ?? order.customer?.name
  ?? '-'
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

  const selectedRows = useMemo(
    () => detailRows.filter(item => selectedRowKeys.includes(item.key)),
    [detailRows, selectedRowKeys],
  );

  const updateLotQuantity = (key, lotQuantity) => {
    setDetailRows(rows => rows.map(row => (
      row.key === key ? { ...row, lotQuantity } : row
    )));
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (!selectedRows.length) {
      message.warning('Vui lòng chọn ít nhất 1 sản phẩm để tạo lô hàng.');
      return;
    }

    const payload = {
      ...values,
      customerOrderId: customerOrder?.id,
      customerOrderCode: customerOrder?.code,
      details: selectedRows.map(row => ({
        orderDetailId: row.orderDetailId,
        orderDetailCode: row.orderDetailCode,
        productId: row.productId,
        productCode: row.productCode,
        productName: row.productName,
        skuId: row.skuId,
        quantity: row.lotQuantity,
      })),
    };

    message.success(`Đã chuẩn bị tạo lô hàng cho ${payload.details.length} sản phẩm.`);
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

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <PageCard>
          <Space direction="vertical" size={4}>
            <Title level={3} style={{ margin: 0 }}>Tạo lô hàng</Title>
            <Text type="secondary">
              Chọn sản phẩm trong đơn đang sản xuất và khai báo thông tin lô hàng.
            </Text>
          </Space>
        </PageCard>

        <PageCard title="Thông tin đơn hàng">
          {customerOrder?.id || customerOrder?.code ? (
            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, md: 2 }}
              items={[
                { key: 'code', label: 'Mã đơn', children: customerOrder?.code ?? '-' },
                { key: 'customer', label: 'Khách hàng', children: getCustomerName(customerOrder) },
                { key: 'phone', label: 'Số điện thoại', children: customerOrder?.customerMobilePhone ?? customerOrder?.phone ?? '-' },
                { key: 'total', label: 'Tổng tiền', children: formatMoney(customerOrder?.total ?? 0) },
              ]}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu đơn hàng" />
          )}
        </PageCard>

        <PageCard title="Cấu hình lô hàng">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              lotType: 'PRODUCTION',
              priority: 'NORMAL',
            }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="lotName"
                  label="Tên lô hàng"
                  rules={[{ required: true, message: 'Vui lòng nhập tên lô hàng' }]}
                >
                  <Input placeholder="Nhập tên lô hàng" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="lotCode"
                  label="Mã lô hàng"
                >
                  <Input placeholder="Tự sinh nếu để trống" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="lotType"
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
                  name="plannedDate"
                  label="Ngày dự kiến"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày dự kiến' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="priority" label="Độ ưu tiên">
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
                <Form.Item name="note" label="Ghi chú">
                  <Input.TextArea rows={3} placeholder="Nhập ghi chú cho lô hàng" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </PageCard>

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

        <ActionBar>
          <Button onClick={() => navigate('/sale/order-production')}>Huỷ</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit}>
            Tạo lô hàng
          </Button>
        </ActionBar>
      </Space>
    </PageShell>
  );
};

export default ManufacturingLotCreate;
