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

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Divider, Progress, Row, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { useStore } from '@flast-erp/core/components';
import { RequestUtils } from '@flast-erp/core/utils';
import ChartActivityRevenue from './ChartActivityRevenue'
import ChartSale from './ChartSale';
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

const NEWFEED_REPORT_API = '/erp/report/newfeed-data';

const parseReportNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseGrowthRate = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace('%', ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getReportMetric = (reportRows, reportType) => {
  const rows = reportRows.filter(row => row?.reportType === reportType);
  const currentMonth = rows.find(row => (
    row?.timePeriod === 'monthly' && row?.periodType === 'current_month'
  ));
  const weekly = rows
    .filter(row => row?.timePeriod === 'weekly')
    .sort((first, second) => Number(first?.periodType) - Number(second?.periodType));

  return {
    total: parseReportNumber(currentMonth?.totalCount),
    change: parseGrowthRate(currentMonth?.growthRate),
    chart: weekly.length
      ? weekly.map(row => parseReportNumber(row?.totalCount))
      : [0, 0, 0, 0, 0],
  };
};

const NewFeed = () => {

  const { user } = useStore();
  const [reportRows, setReportRows] = useState([]);

  useEffect(() => {
    if (!user?.id) return undefined;

    let mounted = true;
    const loadNewFeedReport = async () => {
      try {
        const response = await RequestUtils.Post(NEWFEED_REPORT_API, {
          formDate: dayjs().startOf('month').format('YYYY-MM-DD HH:mm:ss'),
          toDate: dayjs().endOf('month').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          userId: user.id,
        });
        const rows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];
        if (mounted) setReportRows(rows);
      } catch (error) {
        if (mounted) setReportRows([]);
      }
    };

    loadNewFeedReport();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const customerNew = useMemo(
    () => getReportMetric(reportRows, 'customer_new'),
    [reportRows],
  );
  const contactCount = useMemo(
    () => getReportMetric(reportRows, 'data_table'),
    [reportRows],
  );
  const opportunityCount = useMemo(
    () => getReportMetric(reportRows, 'cohoi'),
    [reportRows],
  );
  const orderCount = useMemo(
    () => getReportMetric(reportRows, 'order'),
    [reportRows],
  );
  const orderTotal = useMemo(
    () => getReportMetric(reportRows, 'order_total'),
    [reportRows],
  );
  const opportunityTotal = useMemo(
    () => getReportMetric(reportRows, 'cohoi_total'),
    [reportRows],
  );

  const data = [
    {
      title: 'Khách hàng đã thêm',
      icon: <UserOutlined style={{ fontSize: 20 }} />,
      value: `${customerNew.total.toLocaleString('vi-VN')} Người`,
      change: customerNew.change,
      chart: customerNew.chart,
    },
    {
      title: 'SL người liên hệ',
      icon: <ContactsOutlined style={{ fontSize: 20 }} />,
      value: `${contactCount.total.toLocaleString('vi-VN')} Người`,
      change: contactCount.change,
      chart: contactCount.chart,
    },
    {
      title: 'Cơ hội đã thêm',
      icon: <PlusOutlined style={{ fontSize: 20 }} />,
      value: `${opportunityCount.total.toLocaleString('vi-VN')} Cái`,
      change: opportunityCount.change,
      chart: opportunityCount.chart,
    },
    {
      title: 'Hợp đồng đã tạo',
      icon: <FileTextOutlined style={{ fontSize: 20 }} />,
      value: `${orderCount.total.toLocaleString('vi-VN')} Cái`,
      change: orderCount.change,
      chart: orderCount.chart,
    },
    {
      title: 'Số tiền hợp đồng',
      icon: <FileDoneOutlined style={{ fontSize: 20 }} />,
      value: `${orderTotal.total.toLocaleString('vi-VN')} đ`,
      change: orderTotal.change,
      chart: orderTotal.chart,
    },
    {
      title: 'Số tiền cơ hội',
      icon: <DollarCircleOutlined style={{ fontSize: 20 }} />,
      value: `${opportunityTotal.total.toLocaleString('vi-VN')} đ`,
      change: opportunityTotal.change,
      chart: opportunityTotal.chart,
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
              <Text type="secondary">So với tháng trước</Text><br />
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
            <Select
              defaultValue="Số tiền công nợ"
              style={{ width: 180 }}
              options={[{ label: 'Số tiền công nợ', value: 'Số tiền công nợ' }]}
            />
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
