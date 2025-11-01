/**************************************************************************/
/*  CustomerProfile.js                                                    */
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

import React, { useState } from 'react';
import {
  Card,
  Typography,
  Tag,
  Table,
  Button,
  List,
  Avatar,
  Statistic,
  Row,
  Col,
  Divider,
  Checkbox,
  message
} from 'antd';

import { DollarCircleOutlined, MailOutlined, FileDoneOutlined } from "@ant-design/icons";
import { useEffectAsync } from 'hooks/MyHooks';
import RequestUtils from 'utils/RequestUtils';
import { SUCCESS_CODE } from 'configs';
import { arrayNotEmpty, formatMoney, formatTime } from 'utils/dataUtils';
import { InAppEvent } from 'utils/FuseUtils';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import OrderService from 'services/OrderService';
import { renderArrayColor } from 'containers/Order/utils';

const { Title, Text, Paragraph } = Typography;
const customer = {
  name: 'Công ty Cổ Phần Flast Solution',
  contactName: 'Nguyễn Văn A',
  position: 'Giám đốc Kinh doanh',
  email: 'flast.vn@gmail.vn',
  phone: '090x.xxx.xxx',
  address: '35 Lê Văn Lương',
  industry: 'Công nghệ',
  createdAt: '15/03/2025',
  owner: 'Lê H',
  priority: 'Cao',
  leadScore: 85
};

const wonDeals = [
  { amount: '150 triệu ₫', date: '03/2025' },
  { amount: '100 triệu ₫', date: '12/2024' },
];

const interactions = [
  { content: 'Gửi báo giá CRM', date: '28/03', opened: true },
  { content: 'Cuộc gọi 15 phút – Thảo luận tính năng', date: '25/03' },
  { content: 'Truy cập trang gói cao cấp (2 lần)', date: '20/03' },
  { content: 'Tham gia webinar "Tối ưu vận hành"', date: '18/03' },
];

const products = [
  { name: 'CRM Gói Cơ bản', status: 'Đang sử dụng', expiry: 'Còn 3 tháng' },
  { name: 'Hỗ trợ kỹ thuật tiêu chuẩn', status: 'Đang sử dụng' },
];

const upsellSuggestions = ['Gói Nâng cao', 'Bảo trì', 'Tư vấn triển khai'];

const stats = {
  totalSales: '480 triệu ₫',
  avgOrder: '120 triệu ₫',
  clv: '1.2 tỷ ₫',
};

const alerts = [
  'Đơn hàng gần đây nhất: 20/05/2025',
  'Chưa tương tác >14 ngày'
];

const CustomerProfile = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const [ data, setData ] = useState({});
  const [ iCustomer, setCustomer ] = useState({});

  useEffectAsync(async () => {
    let { data, errorCode } = await RequestUtils.Get('/customer/report-by-id/' + id);
    if (errorCode !== SUCCESS_CODE) {
      return;
    }
    let { iCustomer, ...rest } = data;
    if(arrayNotEmpty(rest?.opportunities)) {
      const { embedded } = await OrderService.viewInTable({ embedded: rest.opportunities, page: {}});
      rest.opportunities = embedded
    }
    if(arrayNotEmpty(rest?.orders)) {
      const { embedded } = await OrderService.viewInTable({ embedded: rest.orders, page: {}});
      rest.orders = embedded;
    }
    setData(rest);
    setCustomer(iCustomer);
  }, [id]);

  console.log(data);
  const onEditCustomer = () => InAppEvent.openDrawer("#customer.edit", {
    title: 'Cập nhật thông tin khách hàng #' + iCustomer.id,
    iCustomer,
    onSave: (newCustomer) => setCustomer(newCustomer)
  });

  const onCreateOpportunity = () => {
    if( (data?.lead?.id || '') === '') {
      message.error("Khách hàng chưa tạo lead !");
      return;
    }
    let uri = RequestUtils.generateUrlGetParams("/sale/ban-hang", {dataId: data.lead.id});
    navigate(uri);
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: '24px', borderRadius: '8px' }}>
        <Row justify="space-between" align="top" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={3} style={{ marginBottom: 15 }}>
              {iCustomer?.name}
            </Title>
            <p style={{ margin: '10px 0px' }}>
              <Text strong>
                Kinh doanh phụ trách ({data.saleName})
              </Text>
            </p>
            <p style={{ margin: '10px 0px' }}>
              <Text type="secondary" style={{ display: 'flex', gap: 8 }}>
                {iCustomer?.email &&
                  <span>✉️ {iCustomer?.email} |</span>
                }
                <span> 📞 {iCustomer?.mobile} | </span>
                <span> 📍 {iCustomer?.address || '(Chưa có địa chỉ)'} </span>
              </Text>
            </p>
            <div style={{ marginTop: '8px' }}>
              <Tag color="red">Điểm chạm (3)</Tag>
              <Tag color="orange">Ưu tiên: {customer.priority}</Tag>
              <Tag>Điểm đánh giá từ CSKH: {customer.leadScore}/100</Tag>
            </div>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Button onClick={onEditCustomer} style={{ marginRight: 8 }}>
              Sửa
            </Button>
            <Button disabled type="dashed" style={{ marginRight: 8 }}>
              Gửi email
            </Button>
            <Button disabled type="default" style={{ marginRight: 8 }}>
              Gọi qua CallCenter
            </Button>
            <br />
            <Button type="default" style={{ marginTop: 8 }} onClick={onCreateOpportunity}>
              Tạo cơ hội
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Doanh số & Cơ hội" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Tổng doanh số" value={stats.totalSales} prefix="₫" />
              </Col>
              <Col span={8}>
                <Statistic title="Đơn hàng trung bình" value={stats.avgOrder} prefix="₫" />
              </Col>
              <Col span={8}>
                <Statistic title="CLV ước tính" value={stats.clv} prefix="₫" />
              </Col>
            </Row>

            <Divider />
            <Table
              rowKey={"id"}
              dataSource={data?.opportunities ?? []}
              pagination={(data?.opportunities ?? []).length > 5 ? true : false}
              size="small"
              columns={[
                {
                  title: 'Kinh doanh',
                  dataIndex: 'userCreateUsername',
                  key: 'userCreateUsername',
                  width: 120,
                  ellipsis: true
                },
                {
                  title: 'Mã cơ hội',
                  dataIndex: 'code',
                  key: 'code',
                  width: 150,
                  ellipsis: true
                },
                {
                  title: 'Sản phẩm',
                  dataIndex: 'products',
                  width: 150,
                  ellipsis: true,
                  render: (products, record) => renderArrayColor(products, record.detailstatus)
                },
                {
                  title: 'Ngày đặt',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  width: 130,
                  ellipsis: true,
                  render: (time) => formatTime(time)
                },
                {
                  title: 'Tổng tiền',
                  dataIndex: 'total',
                  key: 'total',
                  width: 130,
                  ellipsis: true,
                  render: (total) => formatMoney(total)
                },
                {
                  title: 'Giảm giá',
                  dataIndex: 'priceOff',
                  key: 'priceOff',
                  width: 130,
                  ellipsis: true,
                  render: (priceOff) => formatMoney(priceOff)
                }
              ]}
            />
            <div style={{ marginTop: 12 }}>
              <Text type="success">
                ✅ Đã chốt ({wonDeals.length}):{' '}
                {wonDeals.map((d, i) => (
                  <span key={i}>
                    {d.amount} ({d.date}){' '}
                  </span>
                ))}
              </Text>
            </div>
          </Card>

          <Card title="Tương tác & Hành vi" style={{ marginBottom: 16 }}>
            <List
              dataSource={interactions}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>💬</Avatar>}
                    title={
                      <Text>
                        {item.content}{' '}
                        {item.opened && <Tag color="blue" style={{ marginLeft: 8 }}>Đã mở</Tag>}
                      </Text>
                    }
                    description={<Text type="secondary">{item.date}</Text>}
                  />
                </List.Item>
              )}
            />
            <Text strong>Sản phẩm / Dịch vụ (3), CSKH (5)</Text>
          </Card>

          <Card title="Sản phẩm & Dịch vụ" style={{ marginBottom: 16 }}>
            <Title level={5}>Đang sử dụng</Title>
            {products.map((p, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <Text strong>{p.name}</Text> – <Tag color="green">{p.status}</Tag>{' '}
                {p.expiry && <Text type="secondary">({p.expiry})</Text>}
              </div>
            ))}
          </Card>
        </Col>

        {/* Cột phải */}
        <Col xs={24} lg={8}>
          <Card title="Ghi chú & Nhiệm vụ" style={{ marginBottom: 16 }}>
            <Title level={5}>Ghi chú</Title>
            <Paragraph style={{ fontSize: 13, color: '#595959', fontStyle: 'italic' }}>
              Quan tâm sản phẩm {data?.lead?.productName} ngày {formatTime(data?.lead?.inTime)}
            </Paragraph>

            <Divider />
            <Title level={5}>Nhiệm vụ</Title>
            <List
              dataSource={data?.activities}
              renderItem={(task) => (
                <List.Item>
                  <Checkbox checked={task.completed}>{task.name}</Checkbox>{' '}
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    ({formatTime(task.dueDate)})
                  </Text>
                </List.Item>
              )}
            />
          </Card>

          <Card title="Thống kê nhanh" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 8]} style={{ textAlign: 'center' }}>
              <Col span={8}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>{data?.summary?.leads}</div>
                <Tag icon={<MailOutlined />} color="blue" style={{ marginTop: 6 }}>
                  Lead
                </Tag>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>{data?.summary?.opportunities}</div>
                <Tag icon={<FileDoneOutlined />} color="green" style={{ marginTop: 6 }}>
                  Cơ hội
                </Tag>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>{data?.summary?.orders}</div>
                <Tag icon={<DollarCircleOutlined />} color="orange" style={{ marginTop: 6 }}>
                  Đơn hàng
                </Tag>
              </Col>
            </Row>

            <Divider />
            <Title level={5}>Tương tác gần nhất</Title>
            {alerts.map((alert, i) => (
              <div key={i} style={{ color: 'orange', marginBottom: 8 }}>
                ⚠️ {alert}
              </div>
            ))}
            <Divider />
            <div>
              {data?.tag?.map((tag, i) => (
                <Tag key={i} color="#108ee9" style={{ marginRight: 8, marginBottom: 8 }}>
                  {tag}
                </Tag>
              ))}
            </div>

            <Divider />
            <Title level={5}>Gợi ý Upsell</Title>
            {upsellSuggestions.map((s, i) => (
              <Tag key={i} color="#ccc" style={{ marginRight: 8, marginBottom: 8 }}>
                {s}
              </Tag>
            ))}
            <div style={{ marginTop: 8, color: 'orange' }}>
              ⚠️ Dữ liệu chưa đủ để Gợi ý sản phẩm Upsell
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
};

export default CustomerProfile;