import React, { useState } from 'react';
import { BellOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Card, Empty, List, Space, Tabs, Typography } from 'antd';
import moment from 'moment';
import { Helmet } from 'react-helmet';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useNotifications } from '@/contexts/NotificationContext';

const { Title, Text } = Typography;

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { notifications, markRead } = useNotifications();
  const unreadCount = notifications.filter(item => !item.read).length;
  const visibleNotifications = activeTab === 'unread'
    ? notifications.filter(item => !item.read)
    : notifications;

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
            { key: 'unread', label: `Chưa đọc (${unreadCount})` },
          ]}
        />

        {visibleNotifications.length ? (
          <List
            dataSource={visibleNotifications}
            renderItem={item => (
              <List.Item
                key={item.id}
                onClick={() => markRead(item)}
                style={{
                  padding: '16px 12px',
                  borderRadius: 8,
                  background: item.read ? '#fff' : '#f7faff',
                  cursor: 'pointer',
                }}
              >
                <List.Item.Meta
                  avatar={<InfoCircleOutlined style={{ color: '#1c5fb0', fontSize: 24 }} />}
                  title={item.title}
                  description={(
                    <Space direction="vertical" size={3}>
                      {item.description ? <Text>{item.description}</Text> : null}
                      <Text type="secondary">{moment(item.createdAt).fromNow()}</Text>
                    </Space>
                  )}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}
          />
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;
