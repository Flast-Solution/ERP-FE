import React, { useState } from 'react';
import { BellOutlined } from '@ant-design/icons';
import { Card, Empty, Space, Tabs, Typography } from 'antd';
import { Helmet } from 'react-helmet';
import { BreadcrumbCustom } from '@flast-erp/core/components';

const { Title, Text } = Typography;

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div>
      <Helmet><title>Thông báo</title></Helmet>
      <BreadcrumbCustom data={[{ title: 'Trang chủ', path: '/' }, { title: 'Thông báo' }]} />

      <Card style={{ maxWidth: 960, margin: '0 auto', borderRadius: 10 }}>
        <Space align="start" size={12} style={{ marginBottom: 8 }}>
          <BellOutlined style={{ marginTop: 5, color: '#1c5fb0', fontSize: 22 }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Tất cả thông báo</Title>
            <Text type="secondary">Theo dõi các cập nhật và công việc cần xử lý trong hệ thống.</Text>
          </div>
        </Space>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: 'Tất cả' },
            { key: 'unread', label: 'Chưa đọc (0)' },
          ]}
        />

        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}
        />
      </Card>
    </div>
  );
};

export default NotificationsPage;
