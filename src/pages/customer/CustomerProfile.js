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
  Statistic,
  Row,
  Col,
  Divider,
  Checkbox,
  message
} from 'antd';

import { DollarCircleOutlined, MailOutlined, FileDoneOutlined } from "@ant-design/icons";
import { useEffectAsync } from '@erp/shared/dist/hooks/MyHooks';
import RequestUtils from '@erp/shared/dist/utils/RequestUtils';
import { SUCCESS_CODE } from 'configs';
import { arrayNotEmpty, formatMoney, formatTime } from '@erp/shared/dist/utils/dataUtils';
import { InAppEvent } from '@erp/shared/dist/utils/FuseUtils';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import OrderService from 'services/OrderService';
import { renderArrayColor } from 'containers/Order/utils';
import CareNoteList from 'containers/Customer/CareNoteList';

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

const upsellSuggestions = ['Gói Nâng cao', 'Bảo trì', 'Tư vấn triển khai'];
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
                <Statistic title="Tổng doanh số" value={data?.summary?.total ?? 0} prefix="₫" />
              </Col>
              <Col span={8}>
                <Statistic title="Đơn hàng trung bình" value={Math.ceil(data?.summary?.avg ?? 0)} prefix="₫" />
              </Col>
              <Col span={8}>
                <Statistic title="CLV ước tính" value={Math.ceil(data?.summary?.clv ?? 0)} prefix="₫" />
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
                ✅ Đã chốt ({data?.summary?.orders ?? 0}). Tổng giá trị đơn: {formatMoney(data?.summary?.total ?? 0)}
              </Text>
            </div>
          </Card>
          <CareNoteList customerId={id} />
          <Card title="Sản phẩm & Dịch vụ" style={{ marginBottom: 16 }}>
            <Table
              scroll={{ x: 'max-content' }}
              rowKey={"id"}
              dataSource={data?.orders ?? []}
              pagination={(data?.orders ?? []).length > 5 ? true : false}
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
                  title: 'Mã đơn',
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
                  title: 'Giảm giá',
                  dataIndex: 'priceOff',
                  key: 'priceOff',
                  width: 130,
                  ellipsis: true,
                  render: (priceOff) => formatMoney(priceOff)
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
                  title: 'Thanh toán',
                  dataIndex: 'paid',
                  key: 'paid',
                  width: 130,
                  ellipsis: true,
                  render: (paid) => formatMoney(paid)
                },
                {
                  title: 'Còn lại',
                  key: 'remain',
                  width: 130,
                  ellipsis: true,
                  render: ({total, paid}) => formatMoney(total - paid)
                },
                {
                  fixed: 'right',
                  title: 'Trạng thái',
                  dataIndex: 'detailstatus',
                  width: 150,
                  ellipsis: true,
                  render: (detailstatus) => renderArrayColor(detailstatus, detailstatus)
                }
              ]}
            />
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