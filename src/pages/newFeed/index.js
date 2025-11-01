/**************************************************************************/
/*  index.js                                                           		*/
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

import { Button, Card, Col, Divider, Progress, Row, Select, Space, Typography } from 'antd';
import ChartActivityRevenue from './ChartActivityRevenue'
import ChartSale from './ChartSale';
import { Option } from 'antd/es/mentions';
import Title from 'antd/es/typography/Title';
import MiniLineChart from './MiniChart';
import {
  UserOutlined,
  ContactsOutlined,
  PlusOutlined,
  FileTextOutlined,
  DollarCircleOutlined,
  FileDoneOutlined,
  BookOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FunnelPlotOutlined,
  DashboardOutlined,
  AimOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const NewFeed = () => {

  const data = [
    {
      title: 'Khách hàng đã thêm',
      icon: <UserOutlined style={{ fontSize: 20 }} />,
      value: '2.906 Người',
      change: -5.4,
      chart: [10, 80, 120, 140, 130, 125, 110]
    },
    {
      title: 'SL người liên hệ',
      icon: <ContactsOutlined style={{ fontSize: 20 }} />,
      value: '0 Người',
      change: 0,
      chart: [0, 0, 80, 300, 600, 300, 80, 0, 0]
    },
    {
      title: 'Cơ hội đã thêm',
      icon: <PlusOutlined style={{ fontSize: 20 }} />,
      value: '5 Cái',
      change: 80,
      chart: [1, 2, 3, 3, 4, 5, 5]
    },
    {
      title: 'Hợp đồng đã tạo',
      icon: <FileTextOutlined style={{ fontSize: 20 }} />,
      value: '0 cái',
      change: 0,
      chart: [0, 0, 0, 0, 0, 0, 0],
    },
    {
      title: 'Số tiền hợp đồng',
      icon: <FileDoneOutlined style={{ fontSize: 20 }} />,
      value: '0 đ',
      change: 0,
      chart: [0, 0, 0, 0, 0, 0, 0],
    },
    {
      title: 'Số tiền cơ hội',
      icon: <DollarCircleOutlined style={{ fontSize: 20 }} />,
      value: '0 đ',
      change: 0,
      chart: [0, 0, 0, 0, 0, 0, 0],
    },
    {
      title: 'Số tiền công nợ',
      icon: <DollarCircleOutlined style={{ fontSize: 20 }} />,
      value: '0 đ',
      change: 0,
      chart: [0, 0, 0, 0, 0, 0, 0],
    },
    {
      title: 'Ghi chép theo điều',
      icon: <BookOutlined style={{ fontSize: 20 }} />,
      value: '4.724 Điều',
      change: -7.07,
      chart: [4000, 4900, 4800, 4700, 4650, 4600, 4550]
    },
  ];

  return <>
    <Row gutter={[16, 16]}>
      {data.map((item, index) => {
        const isPositive = item.change > 0;
        const isZero = item.change === 0;
        const changeColor = isZero ? 'gray' : isPositive ? 'red' : 'green';
        const ArrowIcon = isZero ? null : isPositive ? ArrowUpOutlined : ArrowDownOutlined;
        return (
          <Col key={index} xs={24} sm={12} md={8} lg={6}>
            <Card size="small" style={{ height: "100%" }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ marginRight: 8 }}>{item.icon}</div>
                <Text strong>{item.title}</Text>
              </div>
              <Title level={4} style={{ margin: 0 }}>{item.value}</Title>
              <Text type="secondary">So với tháng trước nữa</Text><br />
              {!isZero && (
                <span style={{ color: changeColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowIcon />
                  {Math.abs(item.change).toFixed(2)}%
                </span>
              )}
              {isZero && (
                <Text style={{ color: 'gray' }}>0%</Text>
              )}
              {/* Biểu đồ mô phỏng */}
              <MiniLineChart data={item.chart} />
            </Card>
          </Col>
        );
      })}
    </Row>
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col md={8} xs={24}>
        <div style={{ width: '100%', background: '#fff', padding: 15, height: 450 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AimOutlined style={{ fontSize: 18 }} />
            <h2 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 0, marginLeft: 10 }}>KPI doanh số và trạng thái hoàn thành</h2>
          </div>
          <ChartActivityRevenue activityRevenue={[]} />
        </div>
      </Col>
      <Col md={8} xs={24}>
        <div style={{ width: '100%', background: '#fff', padding: 15, height: 450 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FunnelPlotOutlined style={{ fontSize: 18, marginBottom: 10 }} />
            <h2 style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 10 }}>Phễu chuyển đổi cơ hội sang đơn hàng</h2>
          </div>
          <ChartSale activityRevenue={[]} />
        </div>
      </Col>
      <Col md={8} xs={24}>
        <Card
          style={{ height: '100%' }}
          title={
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <DashboardOutlined style={{ fontSize: 18 }} />
                <Text strong style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 10 }}>Tỷ lệ hoàn thành chỉ tiêu hiệu suất</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>Tôi và cấp dưới | Tháng trước</Text>
            </div>
          }
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Select defaultValue="Số tiền công nợ" style={{ width: 180 }}>
              <Option value="Số tiền công nợ">Số tiền công nợ</Option>
            </Select>
            <Button>Cài đặt mục tiêu</Button>
          </div>

          <div style={{ textAlign: 'left', marginBottom: 16 }}>
            <Title level={2} style={{ margin: 0 }}>20%</Title>
            <Text type="secondary">Tỷ lệ hoàn thành chỉ số</Text>
          </div>

          <Progress percent={20} showInfo={false} />
          <Divider style={{ margin: '16px 0' }} />
          <div>
            <Space style={{ display: 'flex', columnGap: 20, width: '100%' }}>
              <Text style={{ fontWeight: 'bold' }}>Số tiền thực tế</Text>
              <Text strong style={{ fontWeight: 'bold' }}>0 đ</Text>
            </Space>
            <Space style={{ display: 'flex', columnGap: 20, width: '100%', marginTop: 12 }}>
              <Text style={{ fontWeight: 'bold' }}>Doanh số mục tiêu</Text>
              <Text strong style={{ fontWeight: 'bold' }}>0 đ</Text>
            </Space>
          </div>
        </Card>
      </Col>
    </Row>
  </>
}

export default NewFeed
