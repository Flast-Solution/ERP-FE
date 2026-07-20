import React, { useCallback, useEffect, useState } from 'react';
import {
  BankOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { RequestUtils, formatMoney, formatTime } from '@flast-erp/core/utils';
import { SUCCESS_CODE } from '@/configs';

const { Title, Text } = Typography;

const resolveEnterprise = (response) => {
  const payload = response?.data;
  return payload?.enterprise ?? null;
};

const EnterpriseProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationEnterprise = location.state?.enterprise ?? null;
  const [enterprise, setEnterprise] = useState(navigationEnterprise);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({});
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const enterpriseResponse = await RequestUtils.Get('/erp/customer/info-enterprise', { id });

      if (Number(enterpriseResponse?.errorCode) === SUCCESS_CODE) {
        const detail = resolveEnterprise(enterpriseResponse);
        if (detail) {
          setEnterprise(detail);
          setOrders(Array.isArray(enterpriseResponse?.data?.orders) ? enterpriseResponse.data.orders : []);
          setSummary(enterpriseResponse?.data?.summary ?? {});
          setOpportunities(Array.isArray(enterpriseResponse?.data?.opportunities)
            ? enterpriseResponse.data.opportunities
            : []);
        } else {
          setErrorMessage(`Không có dữ liệu doanh nghiệp #${id}.`);
        }
      } else {
        setErrorMessage(enterpriseResponse?.message || 'Không tải được hồ sơ doanh nghiệp.');
      }
    } catch (error) {
      if (!navigationEnterprise) {
        setErrorMessage(error?.message || 'Không tải được hồ sơ doanh nghiệp.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigationEnterprise]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const orderColumns = [
    { title: 'Mã đơn', dataIndex: 'code', width: 150, ellipsis: true },
    { title: 'Kinh doanh', dataIndex: 'userCreateUsername', width: 150, ellipsis: true, render: value => value || '-' },
    { title: 'Ngày đặt', dataIndex: 'createdAt', width: 130, render: value => formatTime(value) },
    { title: 'Tổng tiền', dataIndex: 'total', width: 140, align: 'right', render: value => formatMoney(value) },
    { title: 'Đã thanh toán', dataIndex: 'paid', width: 140, align: 'right', render: value => formatMoney(value) },
    {
      title: 'Còn lại',
      key: 'remaining',
      width: 140,
      align: 'right',
      render: (_, record) => formatMoney(Number(record?.total ?? 0) - Number(record?.paid ?? 0)),
    },
  ];

  if (loading && !enterprise) {
    return <div style={{ minHeight: 480, display: 'grid', placeItems: 'center' }}><Spin tip="Đang tải hồ sơ doanh nghiệp" /></div>;
  }

  if (!enterprise) {
    return <Alert type="error" showIcon message="Không tìm thấy doanh nghiệp" description={errorMessage || `Không có dữ liệu doanh nghiệp #${id}.`} />;
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Helmet><title>{enterprise.companyName || 'Chi tiết doanh nghiệp'}</title></Helmet>
      <BreadcrumbCustom data={[
        { title: 'Trang chủ' },
        { title: 'Khách doanh nghiệp', path: '/customer/enterprise' },
        { title: enterprise.companyName || `Doanh nghiệp #${id}` },
      ]} />

      <Card style={{ marginBottom: 16, borderRadius: 10 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Space align="start" size={16}>
              <div style={{ width: 54, height: 54, display: 'grid', placeItems: 'center', borderRadius: 12, background: '#e6f4ff', color: '#1677ff', fontSize: 26 }}>
                <BankOutlined />
              </div>
              <div>
                <Title level={3} style={{ margin: 0 }}>{enterprise.companyName || '(Chưa có tên doanh nghiệp)'}</Title>
                <Space wrap style={{ marginTop: 8 }}>
                  <Tag color="blue">MST: {enterprise.taxCode || 'Chưa cập nhật'}</Tag>
                  <Tag icon={<ShoppingCartOutlined />} color="green">{enterprise.numOfOrder ?? orders.length} đơn hàng</Tag>
                </Space>
                <Space wrap split={<span style={{ color: '#d9d9d9' }}>|</span>} style={{ marginTop: 10, color: '#6b7280' }}>
                  <span><PhoneOutlined /> {enterprise.mobilePhone || 'Chưa có số điện thoại'}</span>
                  <span><MailOutlined /> {enterprise.email || 'Chưa có email'}</span>
                </Space>
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => navigate(RequestUtils.generateUrlGetParams('/sale/order', { enterpriseId: enterprise.id }))}>
              Xem đơn hàng
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Doanh số & cơ hội" style={{ marginBottom: 16, borderRadius: 10 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} md={8}><Statistic title="Tổng doanh số" value={summary?.total ?? 0} formatter={value => formatMoney(Number(value))} /></Col>
              <Col xs={12} md={8}><Statistic title="Trung bình/đơn" value={summary?.avg ?? 0} formatter={value => formatMoney(Number(value))} /></Col>
              <Col xs={12} md={8}><Statistic title="CLV ước tính" value={summary?.clv ?? 0} formatter={value => formatMoney(Number(value))} /></Col>
              <Col xs={12} md={8}><Statistic title="Lead" value={summary?.leads ?? 0} /></Col>
              <Col xs={12} md={8}><Statistic title="Cơ hội" value={summary?.opportunities ?? 0} /></Col>
              <Col xs={12} md={8}><Statistic title="Đơn hàng" value={summary?.orders ?? 0} /></Col>
            </Row>
          </Card>

          <Card title="Cơ hội gần đây" style={{ marginBottom: 16, borderRadius: 10 }}>
            {opportunities.length ? (
              <Table
                rowKey="id"
                size="small"
                scroll={{ x: 850 }}
                columns={orderColumns}
                dataSource={opportunities}
                pagination={opportunities.length > 5 ? { pageSize: 5 } : false}
              />
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Doanh nghiệp chưa có cơ hội" />}
          </Card>

          <Card
            title="Đơn hàng gần đây"
            extra={<Button type="link" onClick={() => navigate(RequestUtils.generateUrlGetParams('/sale/order', { enterpriseId: enterprise.id }))}>Xem tất cả</Button>}
            style={{ borderRadius: 10 }}
          >
            {orders.length ? (
              <Table rowKey="id" size="small" scroll={{ x: 850 }} columns={orderColumns} dataSource={orders} pagination={orders.length > 5 ? { pageSize: 5 } : false} />
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Doanh nghiệp chưa có đơn hàng" />}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title={<Space><BankOutlined />Thông tin công ty</Space>} style={{ marginBottom: 16, borderRadius: 10 }}>
            <Descriptions column={1} size="small" colon={false} items={[
              { key: 'taxCode', label: 'Mã số thuế', children: enterprise.taxCode || '-' },
              { key: 'director', label: 'Giám đốc', children: enterprise.director || '-' },
              { key: 'address', label: 'Địa chỉ', children: enterprise.address || '-' },
              { key: 'totalFee', label: 'Tổng phí', children: enterprise.totalFee == null ? '-' : formatMoney(enterprise.totalFee) },
              { key: 'description', label: 'Mô tả', children: enterprise.description || '-' },
              { key: 'contracts', label: 'Hợp đồng', children: enterprise.contracts?.length ? `${enterprise.contracts.length} tệp` : 'Chưa có' },
              { key: 'createdAt', label: 'Ngày tạo', children: formatTime(enterprise.inTime) },
            ]} />
          </Card>

          <Card title={<Space><TeamOutlined />Thông tin liên hệ</Space>} style={{ marginBottom: 16, borderRadius: 10 }}>
            <Descriptions column={1} size="small" colon={false} items={[
              { key: 'contactName', label: 'Người liên hệ', children: enterprise.contactName || '-' },
              { key: 'mobilePhone', label: 'Điện thoại', children: enterprise.mobilePhone || '-' },
              { key: 'email', label: 'Email', children: enterprise.email || '-' },
            ]} />
            <div style={{ marginTop: 12 }}><Text type="secondary">Thông tin được sử dụng khi lập đơn hàng và chứng từ cho doanh nghiệp.</Text></div>
          </Card>

          <Card title={<Space><InfoCircleOutlined />Thông tin bổ sung</Space>} style={{ borderRadius: 10 }}>
            {Array.isArray(enterprise.additionalInfo) && enterprise.additionalInfo.length ? (
              <Descriptions
                column={1}
                size="small"
                colon={false}
                items={enterprise.additionalInfo.map((item, index) => ({
                  key: `${item?.label || 'additional-info'}-${index}`,
                  label: item?.label || 'Thông tin',
                  children: item?.value === undefined || item?.value === null || item?.value === '' ? '-' : item.value,
                }))}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông tin bổ sung" />
            )}
          </Card>
        </Col>
      </Row>

    </div>
  );
};

export default EnterpriseProfile;
